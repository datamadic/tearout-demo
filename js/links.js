/*global fin*/

// open links the a browser 
(function initLinks() {
    'use strict';

    [].forEach.call(document.querySelectorAll('.openfin-gallery'), function(item) {
        item.addEventListener('click', function() {
            fin.desktop
                .System
                .openUrlWithBrowser('http://openfin.co/app-gallery.html');
        });
    });
})();

// open the annotated source 
(function initLinks() {
    'use strict';

    [].forEach.call(document.querySelectorAll('.openfin-gallery'), function(item) {
        item.addEventListener('click', function() {
            fin.desktop
                .System
                .openUrlWithBrowser('http://openfin.co/app-gallery.html');
        });
    });
})();
