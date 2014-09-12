/*global fin*/

var duplicateElementWindowConfig = {
    'name': 'duplicate-demo',
    'maxWidth': 210,
    'maxHeight': 210,
    'defaultWidth': 210,
    'defaultHeight': 210,
    'width': 210,
    'height': 210,
    'autoShow': false,
    'url': 'views/duplicate.html',
    'frame': false,
    'resizable': false,
    'maximizable': false
};

var initDragWithoutGhost = function(config) {
    'use strict';

    var me = {
            currentlyDragging: false,
            moveEventOccured: false,
            inTearout: false,
            offsetX: 0,
            offsetY: 0,
            element: config.element,
            tearoutWindow: config.tearoutWindow,
            dropTarget: config.dropTarget || null
        },
        dragTarget = config.element.setCapture ? config.element : document;
    console.log('this is the drag target', dragTarget);

    me.setOffsetX = function(x) {
        me.offsetX = x;
        return me;
    };
    me.setOffsetY = function(y) {
        me.offsetY = y;
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
    me.releaseElementCapture = function() {
        if (me.element.releaseCapture) {
            me.element.releaseCapture();
        }
        return me;
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
            dropTargetAPI = tearoutWindow['dropTargetAPI'],
            remoteDropFunction = dropTargetAPI && dropTargetAPI[functionName];

        if (remoteDropFunction) {
            remoteDropFunction.apply(tearoutWindow, args);
        }

        return me;
    };
    me.clearIncomingTearoutWindow = function() {
        me.tearoutWindow
            .getNativeWindow()
            .document
            .body = me.tearoutWindow
            .getNativeWindow()
            .document.createElement('body');
        return me;
    };

    /* 
    	when an elemet is being dragged do not allow back ground elements to be 
    	selected. this prevents problems when dragging back in while the browser
    	still thinks that the there is a focused/selected element 
    */
    me.disableDocumentElementSelection = function() {
        document.body.style.cssText = document.body.style.cssText + '-webkit-user-select: none';
        return me;
    };
    me.enableDocumentElementSelection = function() {
        document.body.style.cssText = document.body.style.cssText.replace('-webkit-user-select: none', '');
        return me;
    };


    /*****
		Mouse Event Handlers
    *****/
    me.handleMouseDown = function(e) {
        console.log(e.srcElement.nodeType, e);
        /* if already in a tearout, do nothing */
        if (me.getInTearout() || e.srcElement !== me.element) {
            console.log('returning', me.getInTearout(), e.srcElement !== me.element);
            return false;
        }
        /* 
			attempt to set the drop target that the torn out window will look for 
			while moving. we do this by trying to call a the setDropTarget function
			that is expected to be on the remote window. the drop callback is set 
			in the same way.
	    */
        me.setCurrentlyDragging(true)
            .setElementCapture()
            .disableDocumentElementSelection()
            .setOffsetX(e.offsetX)
            .setOffsetY(e.offsetY)
            .moveDropTarget(e.screenX - e.offsetX, e.screenY - e.offsetY)
            .clearIncomingTearoutWindow()
            .appendToOpenfinWindow(me.element, me.tearoutWindow)
            .setInTearout(true)
            .displayDropTarget()
            .callTearoutWindowFunction('setDropTarget', [me.dropTarget])
            .callTearoutWindowFunction('setDropCallback', [
                // if (me.getCurrentlyDragging) return;

                function() {
                    me.hideDropTarget()
                        .appendElementBackFromTearout()
                        .setInTearout(false)
                        .callTearoutWindowFunction('setInitialDragOver', [false]);

                    /*dont carry over the mouse down event from the child window*/
                    // setTimeout(function() {
                    //     me.setInTearout(false);
                    // }, 1);
                }
            ])
            .callTearoutWindowFunction('setSharedState', [me.dropTarget]);

    };
    me.handleMouseMove = function(e) {

        if (me.currentlyDragging) {
            me.setMoveEventOccured(true)
                .moveDropTarget(e.screenX - me.getOffsetX(), e.screenY - me.getOffsetY());
        }
    };
    me.handleMouseUp = function() {
        me.setCurrentlyDragging(false)
            .enableDocumentElementSelection()

        /* 
        	we do not want to set the initial drag over flag on the tearout
        	window if there were no mouse move events. this prevents up from
        	being sucked back into the drop target after clicking on a non-
        	dragable selection 
        */
        if (me.getMoveEventOccured()) {
            me.callTearoutWindowFunction('setInitialDragOver', [true]);
        }

        me.setMoveEventOccured(false);
    };



    me.element.addEventListener('mousedown', me.handleMouseDown);
    dragTarget.addEventListener('mousemove', me.handleMouseMove, true);
    dragTarget.addEventListener('mouseup', me.handleMouseUp, true);

    return me;

};

var initDuplicateDrag = function() {
    'use strict';


    var dragElement = document.querySelector('.duplicate'),
        newWindow = new fin.desktop.Window(duplicateElementWindowConfig);

    //function draggable(element) {
    var dragging = null,
        offsetX, offsetY;;

    dragElement.addEventListener('mousedown', function(e) {
        // newWindow.show();
        // newWindow.setAsForeground();
        e = window.event || e;
        offsetX = e.offsetX;
        offsetY = e.offsetY;

        dragging = {
            mouseX: e.clientX,
            mouseY: e.clientY
        };
        if (dragElement.setCapture) {
            dragElement.setCapture();
        }
    });

    dragElement.addEventListener('losecapture', function(e) {
        dragging = null;
    });
    dragElement.addEventListener('drag', function(e) {
        console.log('drag ', e);
        //newWindow.moveTo(e.screenX - offsetX, e.screenY - offsetY);
        //dragging = null;
    });
    dragElement.addEventListener('dragstart', function(e) {
        console.log('drag ', e);
        e.dataTransfer.effectAllowed = 'copy'; //.dropEffect = 'move';
        //newWindow.moveTo(e.screenX - offsetX, e.screenY - offsetY);
        //dragging = null;
    });

    // document.addEventListener('mouseup', function(e) {
    //     console.log('this is the up event', e, e.screenX - e.offsetX, e.screenY - e.offsetY);
    //     newWindow.moveTo(e.screenX - offsetX, e.screenY - offsetY);
    //     //newWindow.show();
    //     // newWindow.bringToFront();
    //     newWindow.setAsForeground();
    //     dragging = null;
    // }, true);

    document.addEventListener('dragend', function(e) {
        console.log('this is the up event', e, e.screenX - e.offsetX, e.screenY - e.offsetY);
        newWindow.moveTo(e.screenX - offsetX, e.screenY - offsetY);
        newWindow.show();
        // newWindow.bringToFront();
        newWindow.setAsForeground();
        dragging = null;
    }, true);

    var dragTarget = dragElement.setCapture ? dragElement : document;

    dragTarget.addEventListener('mousemove', function(e) {
        if (dragging) {
            console.log(e);
            //newWindow.moveTo(e.screenX - offsetX, e.screenY - offsetY);
        }
    }, true);

};

//var ghostWindow = new fin.desktop.Window(duplicateElementWindowConfig);
var me;
var initDragDemo = function() {
    console.log('from the main');
    //initDuplicateDrag();
    me = initDragWithoutGhost({
        element: document.querySelector('.gold'),
        tearoutWindow: new fin.desktop.Window(duplicateElementWindowConfig),
        dropTarget: document.querySelector('.gold').parentNode
    });

    // document.querySelector('.gold').addEventListener('dragover', function(e) {
    //     e.preventDefault();
    //     console.log(e);
    // });
    // document.querySelector('.gold').addEventListener('drop', function(e) {
    //     e.preventDefault();
    //     console.log(e);
    // });

    // document.querySelector('.gold').addEventListener('dragstart', function(e) {
    //     document.querySelector('.gold').style.cursor = 'crosshair';
    //     e.preventDefault();
    // });

    // document.querySelector('.indianred').addEventListener('dragstart', function(e) {
    //     document.querySelector('.indianred').style.cursor = 'crosshair';
    //     e.preventDefault();
    // });


};

fin.desktop.main(function() {
    'use strict';
    initDragDemo();
});
