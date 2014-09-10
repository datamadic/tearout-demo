NotificationListener = function(notificationController){
    this.nc = notificationController;
}

NotificationListener.prototype.onAlertTriggerEvent = function(oTrigger){
    //log the event
    console.info("ALERT-TRIGGER: ", oTrigger);

    if (oTrigger.AlertOperation === 'TRIGGERED'){
        this.nc.createNotification({
            headline: oTrigger.AlertInstrument,
            subheadline: oTrigger.AlertName,
            appName: "Caplin Trader",
            date: "04/07/2013 09:25:20",
            notificationType: "Price Alert",
            top: this.nc.monitorAvailableRect.top + 10,
            left: this.nc.monitorAvailableRect.right - NOTIFICATION_WIDTH - 10,
            targetList: this.nc.targetList
        });

        //delete the trigger
        console.info("ALERT-TRIGGER: deleting");
        alerts.triggerService.deleteTrigger(oData.AlertId, oData.AlertSubject, function(){});
    }
};

NotificationListener.prototype.onAlertNotification = function(oNotification){
    //log the notification
    console.info("ALERT-NOTIFICATION: ", oNotification);

    //dismiss the notification
    console.info("ALERT-NOTIFICATION: dismissing");
    alerts.notificationService.dismiss(oNotification.AlertId, function(){});
}
