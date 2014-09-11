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
    'resizable': false
};

var initDragWithoutGhost = function(config) {
    'use strict';

    var me = {
            currentlyDragging: false,
            offsetX: 0,
            offsetY: 0,
            element: config.element,
            tearoutWindow: config.tearoutWindow,
            dropTarget: config.dropTarget || null
        },
        dragTarget = config.element.setCapture ? config.element : document;

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
    me.moveDropTarget = function(x, y) {
        me.tearoutWindow.moveTo(x, y);
        return me;
    };
    me.displayDropTarget = function() {
        me.tearoutWindow.show();
        me.tearoutWindow.setAsForeground();
        return me;
    };

    /* inject the content of the tearout into the new window */
    me.appendToOpenfinWindow = function(injection, openfinWindow) {
        console.log(me.tearoutWindow, me.element);
        openfinWindow
            .contentWindow
            .document
            .body
            .appendChild(injection);

        return me;
    };

    /* 
		attempt to set the drop target that the torn out window will look for 
		while moving. we do this by trying to call a the setDropTarget function
		that is expected to be on the remote window
    */
    me.setDropTarget = function() {
        var remoteDropFunction = me.tearoutWindow
            .getNativeWindow()
            .setDropTarget;

        if (remoteDropFunction && me.dropTarget) {
            remoteDropFunction(me.dropTarget);
        }

        return me;
    };

    /*****
		Mouse Event Handlers
    *****/
    me.handleMouseDown = function(e) {
        me.setCurrentlyDragging(true)
            .setElementCapture()
            .setOffsetX(e.offsetX)
            .setOffsetY(e.offsetY)
            .moveDropTarget(e.screenX - e.offsetX, e.screenY - e.offsetY)
            .appendToOpenfinWindow(me.element, me.tearoutWindow)
            .displayDropTarget()
            .setDropTarget();
    };
    me.handleMouseMove = function(e) {
        if (me.currentlyDragging) {
            me.moveDropTarget(e.screenX - me.getOffsetX(), e.screenY - me.getOffsetY());
        }
    };
    me.handleMouseUp = function() {
        me.currentlyDragging = false;
    };



    me.element.addEventListener('mousedown', me.handleMouseDown);
    dragTarget.addEventListener('mousemove', me.handleMouseMove, true);
    dragTarget.addEventListener('mouseup', me.handleMouseUp, true);

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

var initDragDemo = function() {
    console.log('from the main');
    //initDuplicateDrag();
    initDragWithoutGhost({
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
