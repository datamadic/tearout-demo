NotificationStack = function(options) {
    ////console.log("NotificationStack");
    ////console.log(options);

    if(!options) {
        options = {};
    }

    var me = this;

    this.currentApplication = fin.desktop.Application.getCurrent();

    // The maximum number of notification windows that can be present in the stack at any time.
    this.maxCount = (options.max? options.max : 5);

    // The notification pool responsible for creating and giving available windows for use
    this.notificationPool = new NotificationPool(Math.min(this.maxCount * 2, 22));

    // A collection of all the notification windows currently managed by the stack.
    this.notificationWindows = {};

    // The position of the stack in virtual screen coordinates
    this.pos = {left: options.left, top: options.top};

    this.delta_pos = {left: 0, top: 0};

    // Configures the vertical direction for the stack
    this.vDirection = (options.vDirection == "up"? -1.0 : 1.0);

    // A collection of windows that are removed from the stack but still aniamting (so can not be given back to the notification pool).
    this.recycleQueue = [];

    // Top/Bottom margin spacing between each notification window (itemSpacing/2 is equal to the top and bottom margin of each notification window).
    this.itemSpacing = (options.itemSpacing? options.itemSpacing : 10);

    this.ttl = (options.ttl? options.ttl : 3500);

    this.pingTimeOut = (options.pingTimeOut? options.pingTimeOut : 6000);

    var interval = (options.interval? options.interval : 50);

    me.queueCounterWnd = new QueuedNotificationDisplay();

    this.updatePosition = function(update_pos) {
        console.log("passed");
        console.log(update_pos);
        console.log("old");
        console.log(me.pos);

        // The maximum number of notification windows that can be present in the stack at any time.
        this.maxCount = (update_pos.max? update_pos.max : this.maxCount);

        var new_pos = update_pos || me.pos;

        var delta = {
            left: new_pos.left - me.pos.left,
            top: new_pos.top - me.pos.top
        };

        me.delta_pos = delta;

        me.pos = new_pos;

        var notificationWindows = this.notificationWindows;
        for (var key in notificationWindows) {
            notificationWindows[key].appendPositionDelta(delta);
        }

        // Update the queue display if showing.
        me.queueCounterWnd.animateTo(new_pos.left, new_pos.top - 5);

        console.log("used");
        console.log(me.pos);
    };

    this.updatePosition(this.pos);

    // Sorts by creation time then by the order they were pushed
    // Defaults to ascending order.
    var notificationWindowCreationSort = function(left, right){
        var left_created = (left.created? left.created : left.pushTime);
        var left_frame_index = left.framePushCount;

        var right_created = (right.created? right.created : right.pushTime);
        var right_frame_index = right.framePushCount;

        // If creation is the same compare index
        if(left_created == right_created) {
            return (left_frame_index < right_frame_index) ? -1 : (right_frame_index < left_frame_index) ? 1 : 0;
            // Otherwise use created
        } else{
            return (left_created < right_created) ? -1 : 1;
        }
    };

    this.windowCreationRedirectQueue = [];
    this.addAndRedirectWindow = function (nw, configuration){
        var of_nw = nw.wnd;
        of_nw.redirect_complete = false;
        of_nw.redirect_timeout = false;
        of_nw.redirect_start = (new Date().getTime());
        console.log("redirecting window to url " + configuration.url);
        of_nw.redirect(configuration.url);
        this.windowCreationRedirectQueue.push({w: nw, config: configuration});
    };

    this.pingRedirectQueue = function() {
        ////console.warn("processing redirection queue")
        var windowCreationRedirectQueue = this.windowCreationRedirectQueue;
        var currentApplication = this.currentApplication;
        var completedLength = windowCreationRedirectQueue.length;


        // Sort the collection so all non-completed notifications are at the front.
        windowCreationRedirectQueue.sort(function(l, r){
            var left_redirect = l.w.wnd.redirect_complete;
            var right_redirect = r.w.wnd.redirect_complete;

            // Ensure creation order
            if(left_redirect == right_redirect) {
                return notificationWindowCreationSort(l.w, r.w);
            } else {
                return (left_redirect && !right_redirect) ? 1 : -1;
            }
        });

        var pingTimeOut = this.pingTimeOut;

        // Ping windows
        for(var i = 0; i < completedLength; ++i) {
            var shouldBreak = (function () {
                var element =  windowCreationRedirectQueue[i];
                var config = element.config;
                var nw = element.w;
                var of_nw = nw.wnd;

                // Time stamp to safeguard against callbacks occuring after a window has been re-used
                var ping_time = (new Date().getTime());

                var timed_out = (new Date().getTime()) - of_nw.redirect_start >= pingTimeOut;

                if(!of_nw.redirect_complete) {
                    ////console.warn(of_nw.name + " - redirect: " + of_nw.redirect_complete);
                    if(!timed_out) {
                        console.warn("pinging " + of_nw.name);
                        currentApplication.pingChildWindow(of_nw.name, function(evt) {
                            var pingedBefore = evt; // if true ignore the ping })

                            console.log("ping received pingedBefore:" + pingedBefore);

                            if(!pingedBefore) {
                                // Ignore callback if this is from an old instance of the recycled notification window or the redirect has been handled
                                // Checking (!of_nw.redirect_complete) ensures timed out notifications do not call onReady()
                                if(ping_time >= of_nw.redirect_start && !of_nw.redirect_complete) {
                                    ////console.warn(of_nw.name + " ping finished");
                                    config.onReady();
                                    of_nw.redirect_complete = true;
                                }
                            }
                        });
                    } else {
                        of_nw.redirect_timeout = true;
                        of_nw.redirect_complete = true;
                        config.onError("ping timed out for " + of_nw.name + ". Recycling");
                    }
                    return false;
                } else {
                    return true;
                }
            })();

            if (shouldBreak) {
                break;
            }

        }
    };

    var pendingWindowCount_ = 0;
    function getPendingWindowCount() {
        return pendingWindowCount_;
    }

    function incrementPendingWindowCount() {
        return ++pendingWindowCount_;
    }

    function decrementPendingWindowCount() {
        return --pendingWindowCount_;
    }

    this.processRedirectionQueue = function(callback) {
        ////console.log("processing redirection queue")
        var windowCreationRedirectQueue = this.windowCreationRedirectQueue;
        var currentApplication = this.currentApplication;

        // Sort the collection so all completed notifications are at the front.
        windowCreationRedirectQueue.sort(function(l, r){
            var left_redirect = l.w.wnd.redirect_complete;
            var right_redirect = r.w.wnd.redirect_complete;

            // Ensure creation order
            if(left_redirect == right_redirect) {
                return notificationWindowCreationSort(l.w, r.w);
            } else {
                return (left_redirect && !right_redirect) ? -1 : 1;
            }
        });

        var completedLength = windowCreationRedirectQueue.length;
        var amountCompleted = 0;
        var completedWindows = [];

        var pool = this.notificationPool;

        // Iterate through the collection removing all completed notifications.
        // Breaks out of the loop once the first non completed is found.
        for(var i = 0; i < completedLength; ++i) {
            var element = windowCreationRedirectQueue[i];
            var of_nw = element.w.wnd;

            if(of_nw.redirect_complete) {
                ////console.log("handling redirect completion of \"" + element.w.wnd.name + "\"");
                ++amountCompleted;

                // Valid and complete
                if(!of_nw.redirect_timeout) {
                    completedWindows.push(element);

                    // Counted towards total of maxCount to restrict processing notification requests
                    incrementPendingWindowCount();
                    // Timed out
                } else {
                    pool.returnNotification(element.w.nIndex);
                }

            } else {
                break;
            }
        }

        // Remove all completed notifications
        windowCreationRedirectQueue.splice(0, amountCompleted);

        if(completedWindows.length) {

            // Ensure to process these windows in creation order
            /*completedWindows.sort(function(l, r) {
             return notificationWindowCreationSort(l.w, r.w);
             });*/

            // Track for use by the stack.
            addNotificationsToStack(completedWindows, callback);
        } else
        {
            callback();
        }

    };

    this.deferRecycleWindow = function(wnd) {
        this.recycleQueue.push(wnd);
    };

    // Releases windows back to the notification pool when they are no longer aniamting.
    this.processDeferredRecycleQueue = function() {
        // A collection of windows that are removed from the stack but still aniamting (so can not be given back to the notification pool).
        var recycleQueue = this.recycleQueue;

        // The notification pool responsible for creating and giving available windows for use
        var pool = this.notificationPool;

        // process recycle queue
        ////console.log("before: ");
        ////console.log(recycleQueue);

        var recycleLength = recycleQueue.length;
        var amountRecycled = 0;

        // Sort the collection so all non-animating windows are at the front.
        recycleQueue.sort(function(l, r){return l.getAnimating() > r.getAnimating();});

        // Iterate through the collection removing all non-animating windows.
        // Breaks out of the loop once the first animating window is found.
        for(var i = 0; i < recycleLength; ++i) {
            var element = recycleQueue[i];

            if(!element.getAnimating()) {
                console.warn("Finished removal animation (user/expired). Recycling " + element.wnd.name);
                element.onStackRecycle(element.getExitReason());
                pool.returnNotification(element.nIndex);
                ++amountRecycled;
            } else {
                break;
            }
        }

        // Remove all non-animating windows
        recycleQueue.splice(0, amountRecycled);

        ////console.log("after: ");
        ////console.log(recycleQueue);
    };

    this.getPositionSortedWindowCleaningObject = function (notification_windows) {
        var cleanQueue = {};
        var cleanQueueSort = [];

        // Prepare notifications in correct order
        for (var key in notification_windows) {
            var nw = notification_windows[key];
            var openfin_wnd = nw.wnd;
            var native_openfin_wnd = openfin_wnd.getNativeWindow();
            cleanQueue[openfin_wnd.name] = nw;
            cleanQueueSort.push(openfin_wnd);
        }

        var directionAdjustment = this.vDirection;

        // Sort windows by their position
        cleanQueueSort.sort(function(a,b){
            var n_a = cleanQueue[a.name];
            var n_b = cleanQueue[b.name];

            // make descending instead of ascending
            return -1 * notificationWindowCreationSort(n_a, n_b);
        });

        return {hash: cleanQueue, sortedArray: cleanQueueSort};
    };

    var repositionQueue = [];
    this.addWindowRepositionInfo = function (repositionInfo) {
        repositionQueue.push(repositionInfo);
    };

    // Repositions windows to fill the gaps left by removed notification windows.
    this.repositionWindows = function(callback) {
        var totalToProcess = repositionQueue.length;
        var processedCount = 0;
        repositionQueue.forEach(function (element, index){
            var reposition_wnd = element.w;
            var reposition_of_wnd = reposition_wnd.wnd;
            var reposition_of_wnd_native = reposition_of_wnd.getNativeWindow();

            if(element.changeY != 0) {
                ////console.error("repositionWindows(): Triggering reposition to fill gaps animation");

                reposition_of_wnd.getBounds(function (event) {
                    var bounds = event;

                    reposition_of_wnd.animate({
                        position: {
                            left: bounds.left,
                            top: bounds.top - element.changeY,
                            duration: 500
                        }
                    }, {interrupt: false}, function(evt){
                        ++processedCount;

                        if(processedCount == totalToProcess) {
                            ////console.warn("Animations ended. Invoking callback");
                            callback();
                        }
                    });
                });
            }
        });

        // Clear the array (No other references are held of this object)
        repositionQueue = [];

        // Invoke the callback immediately if no animations were triggered
        if(totalToProcess == 0) {
            ////console.warn("No animations triggered. Invoking callback");
            callback();
        }

    };

    this.removeNotificationWindow = function (nw) {
        ////console.log("deleting");
        var notification_to_delete = this.notificationWindows[nw.wnd.name];
        delete this.notificationWindows[nw.wnd.name];
        // defer to release back to the pool when finished animating;
        this.deferRecycleWindow(notification_to_delete);
    };

    // Removes expired or user removed notifications from the stack.
    this.removeInvalidNotifications = function(notification_windows, ignore_expirations) {
        var me = this;

        // Retrieve the sorted lookup information for processing window notifications in position order.
        var sorted_window_cleaning = this.getPositionSortedWindowCleaningObject(notification_windows);
        var cleanQueue = sorted_window_cleaning.hash;
        var cleanQueueSort = sorted_window_cleaning.sortedArray;

        // Tracks how many notifications have been removed for repositioning windows the correct number of slots.
        var removalCount = 0;

        // Were any animated removals
        var repositionQueue = [];
        var deleteQueue = [];

        // remove notification windows and prepare remaining windows for re-positioning.
        cleanQueueSort.forEach(function (element, index){
            var sorted_notification = cleanQueue[element.name];
            var clean_of_nw = sorted_notification.wnd;
            var clean_native_of_nw = clean_of_nw.getNativeWindow();
            var ttl = sorted_notification.timeout;

            sorted_notification.updatePendingDeltas();

            if(ttl != "never") {
                if(!ttl || typeof ttl != "number") {
                    ttl = me.ttl;
                }

                var expired = (new Date().getTime()) - sorted_notification.expiration_start >= ttl;

                if(ignore_expirations) {
                    expired = false;
                    // If ignoring expirations either keeps the current time to live or a percentage of the max ttl.
                    sorted_notification.expiration_start = (new Date().getTime()) - (ttl - Math.max(ttl - ((new Date().getTime()) - sorted_notification.expiration_start), (ttl * 0.33)));
                }

                // If this window has timed out prepare for removal and fade
                if(expired) {
                    sorted_notification.expire();
                }
            }

            if(sorted_notification.getRemoveFromStack()) {
                ++removalCount;
                var notification_to_delete = notification_windows[clean_of_nw.name];
                deleteQueue.push(notification_to_delete);
            } else if(removalCount > 0) {
                me.addWindowRepositionInfo({w: sorted_notification, changeY: ((NOTIFICATION_HEIGHT + me.itemSpacing) * removalCount * me.vDirection)});
            }
        });

        deleteQueue.forEach(function (element, index){
            me.removeNotificationWindow(element);
        });
    };

    // The position of the stack in virtual screen coordinates
    //var pos = this.pos;

    // The notification pool responsible for creating and giving available windows for use
    var pool = this.notificationPool;

    // A collection of windows that are removed from the stack but still aniamting (so can not be given back to the notification pool).
    var recycleQueue = this.recycleQueue;

    // The maximum number of notification windows that can be present in the stack at any time.
    var maxCount = this.maxCount;

    // Top/Bottom margin spacing between each notification window (itemSpacing/2 is equal to the top and bottom margin of each notification window).
    var itemSpacing = this.itemSpacing;

    // A collection of all the notification windows currently managed by the stack.
    var notificationWindows = this.notificationWindows;

    // Configures the vertical direction for the stack
    var vDirection = this.vDirection;

    function addNotificationsToStack(completedNotifications, callback) {
        if(!callback) {
            callback = function(){}
        }

        var completedCount = completedNotifications.length;

        if(!completedCount) {
            return;
        }

        var handled = 0;

        completedNotifications.forEach(function(element, index){
            var notification = element.w;

            if(notification) {
                var of_nw = notification.wnd;
                var native_of_nw = of_nw.getNativeWindow();
                var notificationOptions = element.config.options;
                // Set starting position and initial configuration
                notificationOptions.top = me.pos.top - ((NOTIFICATION_HEIGHT * vDirection) * (index + 1));
                notificationOptions.left = me.pos.left;
                notification.setOptions(notificationOptions);

                // Invoke callback before this window is displayed.
                element.config.onShow();

                // Start as transparent and set move to initial position.
                of_nw.showAt(me.pos.left, me.pos.top - (((NOTIFICATION_HEIGHT + itemSpacing) * vDirection) * (index + 1)), false, function() {
                    ++handled;
                    console.log("shown window " + of_nw.name + " and is [" + handled + "out of " + completedCount + "]");

                    // Time stamp for later expiration check
                    notification.created = (new Date().getTime());
                    notification.expiration_start = (new Date().getTime());

                    //Ensures it'll display
                    of_nw.bringToFront();

                    // Add this notification to the main collection
                    console.log("Adding window named: " + of_nw.name);
                    notificationWindows[of_nw.name] = notification;
                    // Counted towards total of maxCount to restrict processing notification requests
                    decrementPendingWindowCount();

                    if(handled == completedCount) {
                        moveWindowsForNewNotifications(completedCount, callback);
                    }
                });
            }
        });

        function moveWindowsForNewNotifications(nCount, finishedCallback) {
            console.log("Adjusting for new notifications [" + nCount + "]");

            var sortedByCreation = [];

            for (var key in notificationWindows) {
                sortedByCreation.push(notificationWindows[key]);
            }


            sortedByCreation.sort(notificationWindowCreationSort);

            var totalAnimations = sortedByCreation.length;
            var animationCount = 0;

            // Animate all the notifications. This brings the newest one on screen.
            sortedByCreation.forEach(function(element, index){
                var of_notification = element.wnd;
                var native_notification = of_notification.getNativeWindow();

                console.log("handling " + of_notification.name + " with pos " + (me.pos.top + (((NOTIFICATION_HEIGHT + itemSpacing) * vDirection) * (totalAnimations - index))));

                //of_notification.stack_animating = true;
                ////console.error("addNotificationToStack(): Triggering new notification added move animation");
                of_notification.animate({
                    position: {
                        left: me.pos.left,
                        top: me.pos.top + (((NOTIFICATION_HEIGHT + itemSpacing) * vDirection) * (totalAnimations - index)),
                        duration: 500},
                    opacity: {
                        opacity: 1.0,
                        duration: 500}
                }, undefined, function(evt){
                    ////console.log("end animate");

                    ++animationCount;
                    console.log("animated window " + of_notification.name + " and is [" + animationCount + "out of " + totalAnimations + "]");

                    if(animationCount == totalAnimations) {
                        finishedCallback();
                    }
                });
            });
        }
    }

    this.getNotificationCount = function() {
        return Object.keys(this.notificationWindows).length + this.windowCreationRedirectQueue.length + getPendingWindowCount();
    };


    this.notifyQueuedNotifications = function() {
        var requestQueue = this.notificationRequestQueue;
        var nRequests = requestQueue.length;
        var sortedRequests = [];

        requestQueue.forEach(function(element, index){
            sortedRequests.push(element);
        });

        // Sort so non queued windows are at the front.
        sortedRequests.sort(function(left, right){ return left.wasQueued > right.wasQueued; });

        for(var i = 0; i < nRequests; ++i) {
            var currentRequest = sortedRequests[i];

            if(!currentRequest.wasQueued) {
                currentRequest.notificationOptions.onQueue();
                currentRequest.wasQueued = true;
            }
            else {
                break;
            }
        }
    };

    this.notificationRequestQueue = [];
    this.processNotificationRequests = function() {
        var me = this;
        var nWindows = me.getNotificationCount();


        if(nWindows >= maxCount) {
            me.notifyQueuedNotifications();
            me.updateQueueCounter();
            return;
        }

        var requestQueue = me.notificationRequestQueue;
        var nAvailableNotificationSlots = me.maxCount - nWindows;
        var nRequested = requestQueue.length;
        var nAdded = 0;

        for(var i = 0; i < nRequested && i < nAvailableNotificationSlots; ++i) {
            var shouldBreak = (function () {
                ////console.warn("requesting #" + i + " out of available " + nAvailableNotificationSlots);
                var notification = pool.getNotification();

                // If a window was retrieved from the pool
                if(notification) {
                    ++nAdded;
                    ////console.log("Retrieved notification");
                    ////console.log(notification);
                    ////console.log(notification.wnd);

                    var requestConfig = requestQueue[i];

                    notification.framePushCount = requestConfig.framePushCount;
                    delete notification.created;
                    notification.pushTime = requestConfig.pushTime;
                    notification.timeout = requestConfig.timeout;
                    notification.wnd.updateOptions({opacity:0.0});
                    notification.onStackRecycle = function(reason) {
                        if(reason == "dismissed") {
                            requestConfig.notificationOptions.onDismiss();
                        } else {
                            requestConfig.notificationOptions.onClose();
                        }
                    };

                    me.addAndRedirectWindow(notification, requestConfig.notificationOptions);
                    requestConfig.hasWindowCallback(notification);
                    return false;
                }
                else {
                    me.notifyQueuedNotifications();
                    return true;
                }
            })();

            if (shouldBreak) break;
        }

        // Remove added notifications from the requestQueue
        requestQueue.splice(0, nAdded);
        me.updateQueueCounter();
    };

    // Remove a notification from the pending queue.
    // Lookup is done by sessionId supplied to push() by the MessageRouter
    this.removePendingNotification = function(sessionId) {
        var matchIndex = -1;
        var requestQueue = me.notificationRequestQueue;

        for(var index = 0; index < requestQueue.length; ++index) {
            // found match
            if(requestQueue[index].sessionId == sessionId) {
                matchIndex = index;
                break;
            }
        }

        var foundMatch = matchIndex != -1;

        if(foundMatch) {
            requestQueue[matchIndex].notificationOptions.onError('The creating window has been reloaded or closed');
            requestQueue.splice(matchIndex, 1);
            me.updateQueueCounter();
        }

        return foundMatch;
    }

    this.updateQueueCounter = function() {
        var me = this;
        var queueWndShowing = me.queueCounterWnd.isShowing();
        var requestQueueLength = this.notificationRequestQueue.length;

        // If the queue counter window should show and/or update
        if(requestQueueLength > 0) {
            var queueWnd = me.queueCounterWnd;

            // show it and set count to requestQueueLength
            if(!queueWndShowing)
            {
                var stackPos = me.pos;

                //(NOTIFICATION_HEIGHT + itemSpacing)
                //me.updatePosition({left: stackPos.left, top: stackPos.top - NOTIFICATION_HEIGHT});
                // Update the queue display if showing.
                queueWnd.animateTo(stackPos.left, stackPos.top);
                queueWnd.show({count: requestQueueLength});


                // just set count to requestQueueLength
            }
            // If the queue counter window should no longer be displayed
        } else if(requestQueueLength == 0 && queueWndShowing) {
            var queueWnd = me.queueCounterWnd;
            var stackPos = me.pos;
            queueWnd.hide();
            //me.updatePosition({left: stackPos.left, top: stackPos.top + NOTIFICATION_HEIGHT});
        }
    }

    this.push = function(options, hasWindowCallback) {
        var nOptions = options;
        this.notificationRequestQueue.push({
            notificationOptions: {
                url: (nOptions && nOptions.url? nOptions.url : "notification.html"),
                onReady: function(){
                    console.warn("onReady()");
                    if (nOptions && nOptions.onReady && typeof nOptions.onReady == "function") nOptions.onReady();
                },
                onError: function(reason){
                    console.error("onError(): " + reason);
                    if (nOptions && nOptions.onError && typeof nOptions.onError == "function") nOptions.onError(reason);
                },
                onShow: function() {
                    console.warn("invoking onShow()");
                    if (nOptions && nOptions.onShow && typeof nOptions.onShow == "function") nOptions.onShow();
                },
                onClose: function() {
                    console.warn("invoking onClose()");
                    if (nOptions && nOptions.onClose && typeof nOptions.onClose == "function") nOptions.onClose();
                },
                onQueue: function() {
                    console.warn("invoking onQueue()");
                    if (nOptions && nOptions.onQueue && typeof nOptions.onQueue == "function") nOptions.onQueue();
                },
                onDismiss: function() {
                    console.warn("invoking onDismiss()");
                    if (nOptions && nOptions.onDismiss && typeof nOptions.onDismiss == "function") nOptions.onDismiss();
                },
                onClick: function() {
                    console.warn("invoking onClick()");
                    if (nOptions && nOptions.onClick && typeof nOptions.onClick == "function") nOptions.onClick();
                },
                options: (nOptions? nOptions : {})
            },
            hasWindowCallback: (hasWindowCallback? hasWindowCallback : function(){}),
            wasQueued: false,
            pushTime: (new Date().getTime()),
            framePushCount: framePushRequestCounter,
            timeout: (nOptions && nOptions.timeout? nOptions.timeout : "default"),
            sessionId: nOptions.sessionId
        });

        // Increment for
        ++framePushRequestCounter;
    };

    var mouse_is_over = false;
    this.setMouseOver = function(mouse_over) {
        mouse_is_over = mouse_over;
    };

    function isMouseOver(notificationWindows) {
        var mouseOver = false;
        var allWindows = notificationWindows;
        for (var key in allWindows) {
            var wnd = allWindows[key];
            if(wnd) {
                mouseOver |= wnd.getMouseOver();
            }

            if(mouseOver) {
                break;
            }
        }

        return mouseOver;
    }

    var handling_mouse = false;
    var mouse_over_override = false;
    function isMouseOverHack(notificationWindows) {
        if(!handling_mouse) {
            handling_mouse = true;
            fin.desktop.System.getMousePosition(function(mouse) {
                var mx = mouse.left;
                var my = mouse.top;

                fin.desktop.System.getAllWindows(function(allWindows) {
                    var resultCount = allWindows.length;
                    var appUuid = fin.desktop.Application.getCurrent().uuid;
                    var match = undefined;
                    for(var i = 0; i < resultCount && !match; ++i) {
                        if(allWindows[i].uuid == appUuid) {
                            match = allWindows[i].childWindows;
                        }
                    }

                    if(match) {
                        var mouseOver = false;
                        var childCount = match.length;
                        var curChild;
                        for(var ci = 0; ci < childCount && !mouseOver; ++ci) {
                            curChild = match[ci];
                            if(curChild && curChild.name.indexOf("notification") != -1) {
                                var x_overlap = mx >= curChild.left && mx <= curChild.right;
                                var y_overlap = my >= curChild.top && my <= curChild.bottom;
                                mouseOver = x_overlap && y_overlap;
                            }
                        }
                    }
                    mouse_over_override = mouseOver;
                    handling_mouse = false;
                }, function(){
                    handling_mouse = false;
                });
            }, function() {
                handling_mouse = false;
            });
        }
        return mouse_over_override;
    }


    var last_mouse_over = (new Date().getTime());
    var handling_run = false;
    //var last_was_in = false;
    var framePushRequestCounter = 0;
    function run() {
        // Reset to 0 on every iteration in order to ensure initial sorting is coherent for loss of precision in the creation time.
        framePushRequestCounter = 0;

        //fin.desktop.System.getMousePosition(function (event) {
        //var mouse_position = event;

        var mouse_in_stack_bounds = isMouseOver(me.notificationWindows);

        // Update last time the mouse was over
        if(mouse_in_stack_bounds) {
            last_mouse_over = (new Date().getTime());
        } else {
            // Delay when is not over so notifications do not transition in from closing or dismissing.
            mouse_in_stack_bounds = !((new Date().getTime() - last_mouse_over) >= 500);
        }


        // ========================================================================
        // Main logic
        // ========================================================================

        // Release non-animating windows back to the notification pool.
        ////console.log("processDeferredRecycleQueue()");
        me.processDeferredRecycleQueue();

        // Removes expired or user removed notifications from the stack.
        ////console.log("removeInvalidNotifications()");
        me.removeInvalidNotifications(me.notificationWindows, mouse_in_stack_bounds);

        // Update the queue display counter
        var queueCounterWnd  = me.queueCounterWnd;
        if(queueCounterWnd && typeof queueCounterWnd.setQueueCount == 'function') {
            queueCounterWnd.setQueueCount(me.notificationRequestQueue.length);
        }

        if(!mouse_in_stack_bounds) {
            // Retrieve windows from the pool for waiting notifications
            me.processNotificationRequests();
        }
        // Ping notificatons that are waiting for redirection completion.
        me.pingRedirectQueue();

        if(!handling_run) {
            handling_run = true;
        }
        else {
            return;
        }

        // Repositions windows to fill the gaps left by removed notification windows.
        me.repositionWindows(function() {
            if(!mouse_in_stack_bounds) {
                // Handle window redirections
                me.processRedirectionQueue(function(){
                    handling_run = false;
                });
            }
            else {
                handling_run = false;
            }
        });
        // ========================================================================
        //});
    }

    var runInterval;
    function registerRunLoop(runInterval) {
        runInterval = setInterval(function() {
            var error = undefined;

            try {
                run();
            } catch(e) {
                error = e;
            } finally {
                if(error) {
                    clearInterval(runInterval);
                    registerRunLoop(runInterval);
                    throw error;
                }

            }

        }, interval);
    }

    // Start the run loop
    registerRunLoop(runInterval);

    /*var runInterval = setInterval(function() {
     var error = undefined;
     try {
     run();
     } catch(e) {
     error = e;
     } finally {
     if(error) {
     clearInterval(runInterval);
     runInterval =
     }
     }
     }, interval); */
}