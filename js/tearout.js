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

var initDuplicateDrag = function() {
    'use strict';


    var dragElement = document.querySelector('.duplicate'),
        newWindow = new fin.desktop.Window(duplicateElementWindowConfig);

    //function draggable(element) {
    var dragging = null,
        offsetX, offsetY;;

    dragElement.addEventListener('mousedown', function(e) {
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

    document.addEventListener('mouseup', function(e) {
        console.log('this is the up event', e, e.screenX - e.offsetX, e.screenY - e.offsetY);
        newWindow.moveTo(e.screenX - offsetX, e.screenY - offsetY);
        newWindow.show();
        // newWindow.bringToFront();
        newWindow.setAsForeground();
        dragging = null;
    }, true);

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
        }

        // if (!dragging) return;

        // var e = window.event || e;
        // var top = dragging.startY + (e.clientY - dragging.mouseY);
        // var left = dragging.startX + (e.clientX - dragging.mouseX);

        // dragElement.style.top = (Math.max(0, top)) + "px";
        // dragElement.style.left = (Math.max(0, left)) + "px";
    }, true);
    //};

    //draggable(document.getElementById("drag"));

    // console.log(dragElement);
    // dragElement.addEventListener('mousedown', function(e) {
    //     console.log('hte event', e);

    //     newWindow.moveTo(e.screenX - e.offsetX, e.screenY - e.offsetY);
    //     newWindow.show();
    //     // newWindow.bringToFront();
    //     newWindow.setAsForeground();

    //     console.log('this is the new windwo', newWindow);

    //     var evt = document.createEvent("MouseEvents");
    //     evt.initMouseEvent("mousedown", true, true, window,
    //         0, 0, 0, 0, 0, false, false, false, false, 0, null);
    //     newWindow.contentWindow.window.document.querySelector('div').dispatchEvent(evt);

    // }, false);
    // dragElement.addEventListener('mouseup', function(e) {
    //     console.log('uppers', e);

    // }, false);
    // dragElement.addEventListener('drag', function(e) {
    //     //console.log('drag event', e);
    // });
    // dragElement.addEventListener('dragend', function(e) {
    //     //console.log('end event', e);
    // });
    // // window.addEventListener('mousemove', function(e) {
    // //     console.warn('this is a mouse move event', e);
    // // });
};

var initDragDemo = function() {
    console.log('from the main');
    initDuplicateDrag();
};

fin.desktop.main(function() {
    'use strict';
    initDragDemo();
});
