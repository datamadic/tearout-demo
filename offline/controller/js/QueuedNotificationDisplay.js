QueuedNotificationDisplay = function(options, callback) {
    this.windowReady = false;

    this._private = {};
    var _private = this._private;

    _private.setShowing = function(showing) {
        _private.showing = showing;
    };
    _private.setShowing(false);

    _private.wnd = new fin.desktop.Window({
        name: "queueCounter",
        url: "queue_counter.html",
        defaultWidth: QUEUE_COUNTER_WIDTH,
        defaultHeight: QUEUE_COUNTER_HEIGHT,
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
        _private.windowReady = true;
        if(typeof callback == 'function') callback();
    }.call(this));

};

QueuedNotificationDisplay.prototype = {
    isShowing: function() {
        return this._private.showing;
    },
    getWindow: function() {
        return this._private.wnd;
    },
    animateTo: function(left, top, callback) {
        var _private = this._private;
        if(_private.windowReady) {
            var wnd = _private.wnd;
            if(this.isShowing()) {
                wnd.animate({
                    position: {
                        left: left,
                        top: top,
                        duration: 500
                    }
                }, {interrupt: false}, function(){
                    if(typeof callback == 'function') callback();
                });
            } else {
                wnd.moveTo(left, top, function(){
                    if(typeof callback == 'function') callback();
                });
            }
        }
    },
    show: function(options, callback){
        var opt = options || {};
        var pos = opt.pos;
        var _private = this._private;
        var wnd = _private.wnd;
        this.setQueueCount((typeof opt.count == 'number'? opt.count : "Error"));

        if(!this.isShowing()) {
            _private.setShowing(true);

            if(pos) {
                wnd.moveTo(pos.left, pos.top);
            }

            wnd.updateOptions({opacity: 0.0});
            wnd.show();
            wnd.animate({
                opacity: {
                    opacity: 1.0,
                    duration: 500
                }
            }, {interrupt: false}, function(evt){
                if(typeof callback == 'function') callback();
            });
        } else {
            if(typeof callback == 'function') callback();
        }
    },
    hide: function(callback) {
        var _private = this._private;
        var wnd = _private.wnd;
        var me = this;

        if(me.isShowing()) {
            _private.setShowing(false);
            wnd.animate({
                opacity: {
                    opacity: 0.0,
                    duration: 500
                }
            }, {interrupt: false}, function(evt){
                wnd.hide();
                wnd.updateOptions({opacity: 0.0});
                me.setQueueCount(0);
                if(typeof callback == 'function') callback(evt);
            });
        } else {
            if(typeof callback == 'function') callback(evt);
        }
    },
    setQueueCount: function(count) {
        var _private = this._private;
        if(_private.windowReady && count != _private.count) {
            _private.count = count;
            var native_wnd = _private.wnd.getNativeWindow();
            if(native_wnd && typeof native_wnd.setQueueCount == 'function') {
                native_wnd.setQueueCount((typeof count == 'number'? count : "Error"));
            }
        }
    },
    getQueueCount: function() {
        var _private = this._private;
        return (_private.windowReady? _private.count : 0);
    }
};