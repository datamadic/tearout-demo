NotificationPool = function (size){
    this.poolSize = size; //total size of the notification pool
    this.allocatedCount = 0; //number of windows being used/allocated
    this.freeCells = [];
    this.pool = []; //array of the notification pool window
    this.initialize();
};

NotificationPool.prototype = {
    initialize: function(){
        for (var i = 0; i < this.poolSize; i++) {
            this.freeCells[i] = true; //true to indicate emptiness
            this.pool[i] = new NotificationWindow(i);
        }
    },
    //returns the next available window from the notification pool, null if none available
    getNotification: function() {
        if (this.allocatedCount >= this.poolSize) {
            if (this.allocatedCount > this.poolSize) {
                console.error("Oops allocatedCount (" + this.allocatedCount + ") is larger than poolSize (" + this.poolSize + ")");
            }
            return null;
        } else {
            var nextAvailableIndex = 0;
            for (nextAvailableIndex = 0; nextAvailableIndex < this.poolSize; ++nextAvailableIndex) {
                if (this.freeCells[nextAvailableIndex] == true) {
                    break;
                }
            }

            console.log("Next available index: " + nextAvailableIndex);
            if (nextAvailableIndex < this.poolSize) {
                this.allocatedCount += 1;
                this.freeCells[nextAvailableIndex] = false;
                return this.pool[nextAvailableIndex];
            } else {
                return null;
            }

        }
    },
    returnNotification: function(notificationIndex) {
        var recyce_wnd = this.pool[notificationIndex].wnd;
        console.warn("Recycling " + recyce_wnd.name + " and redirecting to about:blank");
        recyce_wnd.redirect("about:blank");
        var me = this;

        setTimeout(function(){
            me.freeCells[notificationIndex] = true;
            //update counts
            me.allocatedCount -= 1;
        }, 150);
    }
};