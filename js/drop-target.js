/*global fin, geometry*/

(function() {
    'use strict';

    var dropTargetAPI = {};

    var dropTarget,
        dropCallback = function() {},
        initialDragOver = false;

    dropTargetAPI.setDropTarget = function(element) {
        dropTarget = element;
    };
    dropTargetAPI.setDropCallback = function(callback) {
        dropCallback = callback;
    };
    dropTargetAPI.setInitialDragOver = function(state) {
        initialDragOver = state;
    };

    var getWindowPosition = function(windowElement) {
        return {
            height: windowElement.outerHeight,
            width: windowElement.outerWidth,
            top: windowElement.screenY,
            left: windowElement.screenX
        };
    };
    var elementScreenPosition = function(windowElement, element) {
        var relativeElementPosition = element.getBoundingClientRect();
        return {
            height: relativeElementPosition.height,
            width: relativeElementPosition.width,
            top: windowElement.top + relativeElementPosition.top,
            left: windowElement.left + relativeElementPosition.left
        };
    };

    fin.desktop.main(function() {
        var currentWindow = fin.desktop.Window.getCurrent();

        currentWindow.addEventListener('bounds-changing', function() {
            var overDropTarget = geometry.rectangle(getWindowPosition(window))
                .intersects(
                    geometry.rectangle(
                        elementScreenPosition(
                            getWindowPosition(opener), dropTarget)));

            if (overDropTarget && initialDragOver) {
                dropCallback();
            }
        });
    });

    window.dropTargetAPI = dropTargetAPI;
})(window);
