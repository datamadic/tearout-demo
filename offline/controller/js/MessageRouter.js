
var MessageRouter;

(function () {

    MessageRouter = {
        initialize: function () {

            var notifications = {};
            var notificationTokenToAppMap = {};

            function closeNotifications(uuid, name) {
                if(notifications[uuid] && notifications[uuid][name]) {
                    var notificationIds = Object.keys(notifications[uuid][name]);
                    notificationIds.forEach(function(id){
                        closeNotification(uuid, name, id);
                    });
                }
            }

            function closeNotification(uuid, name, id) {
                var notification = notifications[uuid][name][id];
                if (notification)  {
                    notification.close();
                }
            }

            var pendingNotifications = {};
            function trackPendingNotification(uuid, name, id, sessionId) {
                pendingNotifications[uuid] = pendingNotifications[uuid] || {};
                pendingNotifications[uuid][name] = pendingNotifications[uuid][name] || {};
                pendingNotifications[uuid][name][id] = {
                    canceled: false,
                    sessionId: sessionId
                };
            }

            function cancelPendingNotifications(uuid, name) {
                pendingNotifications[uuid] = pendingNotifications[uuid] || {};
                pendingNotifications[uuid][name] = pendingNotifications[uuid][name] || {};

                var notificationIds = Object.keys(pendingNotifications[uuid][name]);
                notificationIds.forEach(function(key){
                    if(ns.removePendingNotification(pendingNotifications[uuid][name][key].sessionId)) {
                        delete pendingNotifications[uuid][name][key];
                    } else {
                        pendingNotifications[uuid][name][key].canceled = true;
                    }
                });
            }

            function isCanceled(uuid, name, id, sessionId) {
                return pendingNotifications[uuid] &&
                       pendingNotifications[uuid][name] &&
                       pendingNotifications[uuid][name][id] &&
                       ((pendingNotifications[uuid][name][id].canceled &&
                         pendingNotifications[uuid][name][id].sessionId == sessionId) ||
                       pendingNotifications[uuid][name][id].sessionId != sessionId);
            }

            function removeAsPending(uuid, name, id, sessionId){
                if(pendingNotifications[uuid] &&
                   pendingNotifications[uuid][name] &&
                   pendingNotifications[uuid][name][id] &&
                   pendingNotifications[uuid][name][id].sessionId == sessionId) {
                    delete pendingNotifications[uuid][name][id];
                }
            }

            window.processActionFromNotification = function (message) {
                var uuid = message.sourceUuid;
                var name = message.sourceName;
                var action = message.action;
                var payload = message.payload || {};
                var notificationId = payload.notificationId;
                var msg;
                var notification, origin;
                var sessionId = fin.desktop.getUuid();

                console.log(action);

                if (payload.token && uuid == "desktopcontroller" && name.indexOf("notification") != -1 && name != "systemnotification") {
                    var item = notificationTokenToAppMap[payload.token];
                    if(item) {
                        uuid = item.uuid;
                        name = item.name;
                        notificationId = item.notificationId;
                    }
                }

                if (action == "create-notification") {
                    trackPendingNotification(uuid, name, notificationId, sessionId);

                    origin = getOrigin(payload.url);
                    msg = payload.message;
                    var received_timeout = payload["timeout"];
                    ns.push({
                        url: payload.url,
                        timeout: (received_timeout? received_timeout : "default"),
                        sessionId: sessionId,
                        onReady: function () {
                            var wnd = notification.wnd.getNativeWindow();
                            window.not_wnd = wnd;
                            console.log("Sending not_id " + notificationId + " message: " + msg + " to " + notification.wnd.name);
                            var token = fin.desktop.getUuid();
                            notificationTokenToAppMap[token] = {
                                uuid: uuid,
                                name: name,
                                notificationId: notificationId
                            };
                            fin.desktop._sendActionToNotification(notification.wnd.name, "initialize-notification", {
                                token: token,
                                message: msg
                            });
                        },
                        onShow: function () {
                            fin.desktop._dispatchNotificationEvent(uuid, name, "show", {
                                notificationId: notificationId
                            });
                        },
                        onError: function (reason) {
                            console.error("ERROR creating notification");

                            fin.desktop._dispatchNotificationEvent(uuid, name, "error", {
                                notificationId: notificationId,
                                reason: reason
                            });

                            delete notifications[uuid][name][notificationId];
                            delete notificationTokenToAppMap[payload.token];
                        },
                        onClose: function () {

                            fin.desktop._dispatchNotificationEvent(uuid, name, "close", {
                                notificationId: notificationId
                            });

                            delete notifications[uuid][name][notificationId];
                            delete notificationTokenToAppMap[payload.token];
                        },
                        onDismiss: function () {

                            fin.desktop._dispatchNotificationEvent(uuid, name, "dismiss", {
                                notificationId: notificationId
                            });

                            delete notifications[uuid][name][notificationId];
                            delete notificationTokenToAppMap[payload.token];
                        },
                        onClick: function () {

                            fin.desktop._dispatchNotificationEvent(uuid, name, "click", {
                                notificationId: notificationId
                            });

                        }
                    }, function (n) {
                        notification = n;
                        notifications[uuid] = notifications[uuid] || {};
                        notifications[uuid][name] = notifications[uuid][name] || {};
                        notifications[uuid][name][notificationId] = notification;

                        if(isCanceled(uuid, name, notificationId, sessionId)) {
                            closeNotification(uuid, name, notificationId);
                        }

                        removeAsPending(uuid, name, notificationId, sessionId);
                    });

                // 'kill-notifications' is triggered to remove any pending or visible notifications
                // created by a window/application that closed
                } else if (action == 'kill-notifications') {
                    cancelPendingNotifications(uuid, name);
                    closeNotifications(uuid, name);
                } else if (action == "close-notification") {
                    closeNotification(uuid, name, notificationId);
                } else if (action == "send-notification-message") {
                    notification = notifications[uuid][name][notificationId];
                    if (notification) {
                        msg = payload.message;

                        fin.desktop._sendActionToNotification(notification.wnd.name, "message", {
                            message: msg
                        });
                    }
                } else if (action == "send-application-message") {
                    notification = notifications[uuid][name][notificationId];
                    if (notification) {
                        msg = payload.message;

                        fin.desktop._dispatchNotificationEvent(uuid, name, "message", {
                            message: msg,
                            notificationId: notificationId
                        });

                    }
                } else if (action == "click-notification") {
                    notification = notifications[uuid][name][notificationId];
                    if (notification) {
                        /*fin.desktop.InterApplicationBus.send(uuid, "process-notification-event", {
                         type: "click",
                         payload: {
                         notificationId: notificationId
                         },
                         directedTo: "creator"
                         }); */
                    }
                } else if (action == "update-mouse-position") {
                    //ns.setMouseOver((payload.isMouseOver? true : false));

                    if (notifications[uuid]) {
                        notification = notifications[uuid][name][notificationId];
                        if (notification) {
                            notification.setMouseOver((payload.isMouseOver? true : false));
                        }
                    }
                } else if (action == "fire-drag-event") {
                    if (notifications[uuid]) {
                        notification = notifications[uuid][name][notificationId];
                        if (notification) {
                            notification.dispatchDragEvent(payload.action, payload.payload);
                        }
                    }
                }

            };


        }
    };


    function getOrigin(href) {
        var e = document.createElement('a');
        e.href = href;
        return e.origin;
    }

})();