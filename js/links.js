/*global fin*/

// open links in a browser 
(function initLinks() {
    'use strict';

    [].forEach.call(document.querySelectorAll('.browser-link'), function(item) {
        item.addEventListener('click', function() {
            fin.desktop
                .System
                .openUrlWithBrowser(item.getAttribute('destination'));
        });
    });
})();
