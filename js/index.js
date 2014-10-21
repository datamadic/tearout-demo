/* global initDragAndDrop, fin*/
// Returns a config object that is used to create the tearout windows. The 
// frame param will account for the height of the nav bar. 
var createTearoutWindowConfig = function(frame) {
    'use strict';

    return {
        'name': 'duplicate-demo' + Math.random(),
        'maxWidth': 210,
        'maxHeight': 210 + (frame ? 28 : 0),
        'defaultWidth': 210,
        'defaultHeight': 210 + (frame ? 28 : 0),
        'autoShow': false,
        'url': 'views/tearout.html',
        'frame': frame || false,
        'resizable': false,
        'maximizable': false
    };
};


var initDragDemo = function() {
    'use strict';

    // Add a tearout that uses frames 
    var frame = true;
    initDragAndDrop({
        element: document.querySelector('.indianred'),
        tearoutWindow: new fin.desktop.Window(createTearoutWindowConfig(frame)),
        dropTarget: document.querySelector('.indianred').parentNode,
        frame: true
    });

    // Add a frameless tearout 
    initDragAndDrop({
        element: document.querySelector('.gold'),
        tearoutWindow: new fin.desktop.Window(createTearoutWindowConfig()),
        dropTarget: document.querySelector('.gold').parentNode
    });

};

// Init the demo in once the OpenFin adapter is ready 
fin.desktop.main(function() {
    'use strict';
    initDragDemo();
});