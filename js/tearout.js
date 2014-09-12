/*global fin*/

var getConfig = function(frame) {
    'use strict';

    return {
        'name': 'duplicate-demo' + Math.random(),
        'maxWidth': 210,
        'maxHeight': 210 + (frame ? 28 : 0),
        'defaultWidth': 210,
        'defaultHeight': 210 + (frame ? 28 : 0),
        'width': 210,
        'height': 210 + (frame ? 28 : 0),
        'autoShow': false,
        'url': 'views/duplicate.html',
        'frame': frame || false,
        'resizable': false,
        'maximizable': false
    };
};

var initDragAndDrop = function(config) {
    'use strict';

    var me = {
            currentlyDragging: false,
            moveEventOccured: false,
            inTearout: false,
            offsetX: 0,
            offsetY: 0,
            element: config.element,
            tearoutWindow: config.tearoutWindow,
            dropTarget: config.dropTarget || null,
            frame: config.frame || null
        },
        dragTarget = config.element.setCapture ? config.element : document;


    me.setOffsetX = function(x) {
        me.offsetX = x;
        return me;
    };
    /* account for the heder bar if in a frame */
    me.setOffsetY = function(y) {
        me.offsetY = me.frame ? y + 28 : y;
        return me;
    };
    me.getOffsetX = function() {
        return me.offsetX;
    };
    me.getOffsetY = function() {
        return me.offsetY;
    };
    me.setInTearout = function(state) {
        me.inTearout = state;
        return me;
    };
    me.getInTearout = function() {
        return me.inTearout;
    };
    me.setCurrentlyDragging = function(dragging) {
        me.currentlyDragging = dragging;
        return me;
    };
    me.getCurrentlyDragging = function() {
        return me.currentlyDragging;
    };
    me.setElementCapture = function() {
        if (me.element.setCapture) {
            me.element.setCapture();
        }
        return me;
    };
    me.setMoveEventOccured = function(state) {
        me.moveEventOccured = state;
        return me;
    };
    me.getMoveEventOccured = function() {
        return me.moveEventOccured;
    };
    me.moveDropTarget = function(x, y) {
        me.tearoutWindow.moveTo(x, y);
        return me;
    };
    me.displayDropTarget = function() {
        me.tearoutWindow.show();
        me.tearoutWindow.setAsForeground();
        return me;
    };
    me.hideDropTarget = function() {
        me.tearoutWindow.hide();
        return me;
    };

    /* inject the content of the tearout into the new window */
    me.appendToOpenfinWindow = function(injection, openfinWindow) {
        openfinWindow
            .contentWindow
            .document
            .body
            .appendChild(injection);

        return me;
    };
    me.appendElementBackFromTearout = function() {
        me.dropTarget.appendChild(me.element);
        return me;
    };
    me.callTearoutWindowFunction = function(functionName, args) {
        var tearoutWindow = me.tearoutWindow
            .getNativeWindow(),
            dropTargetAPI = tearoutWindow.dropTargetAPI,
            remoteDropFunction = dropTargetAPI && dropTargetAPI[functionName];

        if (remoteDropFunction) {
            remoteDropFunction.apply(tearoutWindow, args);
        }

        return me;
    };
    me.clearIncomingTearoutWindow = function() {
        /* clear out all the elements but keep the js context ;) */
        me.tearoutWindow
            .getNativeWindow()
            .document
            .body = me.tearoutWindow
            .getNativeWindow()
            .document.createElement('body');
        return me;
    };
    me.returnFromTearout = function() {
        me.hideDropTarget()
            .appendElementBackFromTearout()
            .setInTearout(false)
            .callTearoutWindowFunction('setInitialDragOver', [false]);
    };
    me.dropCallback = function() {
        if (me.frame) {
            return;
        }
        me.returnFromTearout();
    };

    /* 
		when an elemet is being dragged do not allow background elements to be 
		selected. this prevents problems when dragging back in while the browser
		still thinks that the there is a focused/selected element 
    */
    me.disableDocumentElementSelection = function() {
        var style = document.body.style;
        style.cssText = style.cssText + '-webkit-user-select: none';
        return me;
    };
    me.enableDocumentElementSelection = function() {
        var style = document.body.style;
        style.cssText = style.cssText.replace('-webkit-user-select: none', '');
        return me;
    };


    /*****
		Mouse Event Handlers
    *****/
    me.handleMouseDown = function(e) {

        /* 
			if already in a tearout, or the src element is not the 
			the base element passed to be make tearout-able do nothing
        */
        if (me.getInTearout() || e.srcElement !== me.element) {
            return false;
        }

        me.setCurrentlyDragging(true)
            .setElementCapture()
            .disableDocumentElementSelection()
            .setOffsetX(e.offsetX)
            .setOffsetY(e.offsetY)
            .moveDropTarget(e.screenX - me.offsetX, e.screenY - me.offsetY)
            .clearIncomingTearoutWindow()
            .appendToOpenfinWindow(me.element, me.tearoutWindow)
            .setInTearout(true)
            .displayDropTarget()
            .callTearoutWindowFunction('setDropTarget', [me.dropTarget])
            .callTearoutWindowFunction('setDropCallback', [me.dropCallback])
            .callTearoutWindowFunction('setCloseCallback', [me.returnFromTearout]);
    };
    me.handleMouseMove = function(e) {

        if (me.currentlyDragging) {
            me.setMoveEventOccured(true)
                .moveDropTarget(e.screenX - me.offsetX, e.screenY - me.offsetY);
        }
    };
    me.handleMouseUp = function() {
        me.setCurrentlyDragging(false)
            .enableDocumentElementSelection();

        /* 
			we do not want to set the initialDragOver flag on the tearout
			window if there were no mouse move events. this prevents us from
			being sucked back into the drop target after clicking on a non-
			dragable selection 
        */
        if (me.getMoveEventOccured()) {
            me.callTearoutWindowFunction('setInitialDragOver', [true]);
        }

        me.setMoveEventOccured(false);
    };

    /*****
		Register Handlers
    *****/
    me.element.addEventListener('mousedown', me.handleMouseDown);
    dragTarget.addEventListener('mousemove', me.handleMouseMove, true);
    dragTarget.addEventListener('mouseup', me.handleMouseUp, true);
};


var initDragDemo = function() {
    'use strict';

    initDragAndDrop({
        element: document.querySelector('.gold'),
        tearoutWindow: new fin.desktop.Window(getConfig()),
        dropTarget: document.querySelector('.gold').parentNode
    });

    /* add a tearout that uses frames */
    var frame = true;
    initDragAndDrop({
        element: document.querySelector('.indianred'),
        tearoutWindow: new fin.desktop.Window(getConfig(frame)),
        dropTarget: document.querySelector('.indianred').parentNode,
        frame: true
    });

};

fin.desktop.main(function() {
    'use strict';
    initDragDemo();
});
