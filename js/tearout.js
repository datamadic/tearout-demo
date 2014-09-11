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



var initDragWithoutGhost = function(element, dropWindow) {
    'use strict';

    var me = {
            currentlyDragging: false,
            offsetX: 0,
            offsetY: 0,
            element: element,
            dropWindow: dropWindow
        },
        dragTarget = element.setCapture ? element : document;

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
        me.dropWindow.moveTo(x, y);
        return me;
    };
    me.displayDropTarget = function() {
        me.dropWindow.show();
        me.dropWindow.setAsForeground();
        return me;
    };

    /*
		Mouse Event Handlers
    */
    me.handleMouseDown = function(e) {
        me.setCurrentlyDragging(true)
            .setElementCapture()
            .setOffsetX(e.offsetX)
            .setOffsetY(e.offsetY)
            .moveDropTarget(e.screenX - e.offsetX, e.screenY - e.offsetY)
            .displayDropTarget();
    };
    me.handleMouseMove = function(e) {
        if (me.currentlyDragging) {
            me.moveDropTarget(e.screenX - me.getOffsetX(), e.screenY - me.getOffsetY());
        }
    };
    me.handleMouseUp = function() {
        me.currentlyDragging = false;
    };

    element.addEventListener('mousedown', me.handleMouseDown);
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

var initDragDemo = function() {
    console.log('from the main');
    //initDuplicateDrag();
    initDragWithoutGhost(document.querySelector('.gold'), new fin.desktop.Window(duplicateElementWindowConfig));
};

fin.desktop.main(function() {
    'use strict';
    initDragDemo();
});
