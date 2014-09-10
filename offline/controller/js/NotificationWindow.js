NotificationWindow = function(notificationIndex, options, callback) {
    this.windowReady = false;
    this.nIndex = notificationIndex;
    this.callback = callback;

    if (options) {
        this.top = options.top;
        this.left = options.left;
    }

    this.wnd = new fin.desktop.Window({
        name: "notification" + notificationIndex,
        /*url: "notification.html",*/
        defaultWidth: NOTIFICATION_WIDTH,
        defaultHeight: NOTIFICATION_HEIGHT,
        defaultTop: 100,
        defaultLeft: 100,
        autoShow: false,
        showTaskbarIcon: false,
        frame: false,
        resize: false,
        state: "normal",
        draggable: false,
        contextMenu: false,
        alwaysOnTop: true,
        cornerRounding: {width: 6, height: 6}
    }, function(){
        this.windowReady = true;
        this.subscribed_drag_events = false;
        this.deltaQueue = [];

    }.call(this));
};

NotificationWindow.prototype = {
    expire: function() {
        if(this.windowReady) {
            var of_nw = this.wnd;
            of_nw.options = {};
            of_nw.canRemoveFromStack = true;
            of_nw.is_animating = true;
            this.setMouseOver(false);
            of_nw.reason = "expired";
            of_nw.animate({opacity:{opacity: 0.0, duration: 500}}, undefined, function(evt){of_nw.is_animating = false;});
        }
    },
    setMouseOver: function(over) {
        if(this.windowReady) {
            var of_nw = this.wnd;
            of_nw.mouse_over = over;
        }
    },
    getRemoveFromStack: function(){
        return (this.windowReady? this.wnd.canRemoveFromStack : false);
    },
    getAnimating: function(){
        return (this.windowReady? this.wnd.is_animating : false);
    },
    getMouseOver: function() {
        return (this.windowReady? this.wnd.mouse_over : false);
    },
    isMouseOver: function() {
        return (this.windowReady? this.wnd.mouse_over : false);
    },
    getExitReason: function() {
        return (this.windowReady? this.wnd.reason : "none");
    },
    close: function() {
        var nw = this;
        var me = nw.wnd;
        me.canRemoveFromStack = true;
        console.log(me.name + " - Closing");
        me.is_animating = true;
        nw.setMouseOver(false);
        me.reason = "closed";
        me.options = {};
        me.animate({
            opacity: {
                opacity: 0.0,
                duration: 800
            }
        },
        undefined,
        function(){
            me.is_animating = false;
            nw.setMouseOver(false);
        });
    },
    show: function(){
        var nativeWnd = this.wnd.getNativeWindow();

        this.wnd.show();
    },
    showAt: function(left, top, callback) {
        var nativeWnd = this.wnd.getNativeWindow();

        this.wnd.showAt(left, top, false, callback);
    },
    click: function(screenX, screenY) {
        var me = this.wnd;
        var clickCallback = (me.options? me.options.onClick : undefined);
        if (clickCallback && typeof clickCallback == "function") clickCallback();
    },
    appendPositionDelta: function(delta) {
        if(this.windowReady) {
            this.deltaQueue.push(delta);
        }
    },
    updatePendingDeltas: function() {
        if(this.windowReady) {
            var me = this.wnd;
            var deltaQueue = this.deltaQueue;
            if(!me.is_animating && deltaQueue.length) {
                me.is_animating = true;
                var totalDelta = {left: 0, top: 0};

                var deltaQueueLength = this.deltaQueue.length;
                var element = null;
                for(var index = 0; index < deltaQueueLength; ++index) {

                    element = this.deltaQueue[index];
                    totalDelta.left += element.left;
                    totalDelta.top += element.top;
                }

                this.deltaQueue = [];

                me.getBounds(function(event){
                    var bounds = event;

                    me.animate({
                        position:{
                            left: bounds.left + totalDelta.left,
                            top: bounds.top + totalDelta.top,
                            duration:500
                        }
                    }, {interrupt: false}, function(){
                        me.is_animating = false;
                    });
                });
            }
        }
    },
    dispatchDragEvent: function (event, msg) {
        var x = msg.x;
        var y = msg.y;
        var screenX = msg.screenX;
        var screenY = msg.screenY;
        var me = this;

        if (event == "dragstart") {
            (function (x, y, screenX, screenY) {
                me.callbacks.onDragStart(x,y,screenX, screenY);
            })(x,y, screenX, screenY);
        } else if (event == "drag") {
            (function (x, y, screenX, screenY) {
                me.callbacks.onDrag(x,y,screenX, screenY);
            })(x,y, screenX, screenY);
        } else if (event == "dragend") {
            (function (x, y, screenX, screenY) {
                me.callbacks.onDragEnd(x,y,screenX, screenY);
            })(x,y, screenX, screenY);
        } else if (event == "clicked") {
            (function (x, y, screenX, screenY) {
                me.callbacks.onClick(x,y,screenX, screenY);
            })(x,y, screenX, screenY);
        }
    },
    setOptions: function(options) {
        var nw = this;
        nw.deltaQueue = [];

        var me = nw.wnd;

        if (this.windowReady) {
            me.mouse_over = false;
            me.canRemoveFromStack = false;
            me.is_animating = false;
            me.reason = "none";
            me.options = options;

            var wnd_native = me.getNativeWindow();
            var THRESH = 20;
            var offscreenRight = options.left + NOTIFICATION_WIDTH + 10;
            var targetList = options.targetList;


            //this.top = options.top || 0;
            //this.left = options.left || 0;


            //me.showAt(options.left, options.top);

            console.log("window show");
            console.log(wnd_native);

            var start_drag_x = options.left;
            var start_drag_y = options.top;
            var is_animating = false;
            var should_animate_to_target = false;
            var should_animate_dismiss = false;

            registerProxyDragHandler(me, {
                onDragStart: function (x, y, screenX, screenY) {
                    console.log("start");
                    should_animate_to_target = false;
                    should_animate_dismiss = false;

                    if(me.is_animating || me.stack_animating) {
                        return;
                    }

                    start_drag_x = screenX;
                    start_drag_y = screenY;

                },
                onDrag: function (x, y, screenX, screenY) {
                    console.log("move");

                    if(me.is_animating || me.stack_animating) {
                        return;
                    }

                    // Snapped, resting
                    if(Math.abs(start_drag_x - x) <= THRESH) {
                        me.moveTo(start_drag_x, screenY);
                        should_animate_to_target = false;

                        if(should_animate_dismiss) {
                            should_animate_dismiss = false;
                            me.updateOptions({opacity: 1.0});
                        }
                    } else if(x > start_drag_x) {
                        me.moveTo(x, screenY);
                        if(!should_animate_dismiss) {
                            should_animate_dismiss = true;
                            me.updateOptions({opacity: 0.65});
                        }
                    }

                },
                onDragEnd: function (x, y, screenX, screenY) {
                    console.log("end");

                    if(me.is_animating || me.stack_animating) {
                        return;
                    }

                    if(should_animate_dismiss) {
                        me.canRemoveFromStack = true;
                        animateDismiss(screenX, screenY);

                    }
                },
                onClick: function(x, y, screenX, screenY) {
                    nw.click(screenX, screenY);
                }
            }, {
                thresh: THRESH
            }, this.origin);


            function registerProxyDragHandler(wnd, callbacks, options, origin) {
                nw.callbacks = callbacks;
                fin.desktop._sendActionToNotification(me.name, "register-drag-handler", {
                    options: options
                });


                if(!nw.subscribed_drag_events) {
                    nw.subscribed_drag_events = true;
                }
            }


            function animateDismiss(screenX, screenY) {
                if(me.is_animating) {
                    return;
                }

                me.options = {};
                me.reason = "dismissed";
                nw.setMouseOver(false);
                me.is_animating = true;
                var offscreenRight = screenX + NOTIFICATION_WIDTH + 10;

                me.animate({
                    position:{
                        top: screenY,
                        left: offscreenRight,
                        duration: 1000
                    },
                    opacity: {
                        opacity: 0.0,
                        duration: 800
                    }
                }, undefined, function(evt){
                    console.log(evt);
                    console.log("animation finished");

                    if(!evt || evt.success) {
                        me.hide();
                        me.is_animating = false;
                        nw.setMouseOver(false);
                    }
                });
            }

        }
    }
};