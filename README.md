# OpenFin Tearouts Intro

The OpenFin Runtime makes it possible to 'tear out' elements from an application and have them persist in windows on their own.  A newly created tearout window becomes a child of the application it came from.

When you decide you want to tear out an element for your application, you need to create an OpenFin window to receive the DOM element. This is done with a call to new fin.desktop.Window. Because there is a startup cost to creating a window, often applications will create a pool of pre-created, empty windows and leave them in a hidden state until needed. When asked for a new window, the OpenFin Javascript adapter calls window.open and returns a reference to the parent that is wrapped in an OpenFin Window object. Being an OpenFin window means that the parent is able to make OpenFin API calls against it. For example, the parent window can move, animate, show, hide, minimize, maximize, etc the created child window.

The actual dragging out of the element can be initiated in a number of ways. One option (and the one demonstrated here) is to inject the element that is to be dragged out into a waiting destination tearout window on click. From here you can move the new tearout programmatically. Another option is to use native HTML5 drag and drop to determine where the drop location will be and on the drop event place the tearout window. The only caveat to this method is that once the mouse leaves the bounds of the parent window you no longer are able to set event.preventDefault() on a dragover event. Unfortunately, Windows does not show the 'not-allowed' cursor even though for our purposes we really can drop anywhere. To mitigate this, you can move an OpenFin window, with opacity set to .01, programmatically to always be behind the mouse. In so doing you are able to have the correct cursor prompt. The OpenChat (available on OpenFin’s Gallery) application is a good example of how to demonstrate this behavior.

## Keep In Mind

Applications such as MarketStack (available on OpenFin’s App Gallery) creates a tearout experience without actually moving DOM from one one window to another. Before transferring DOM elements from one window to another, decide if this is the best experience for the user.

## Whats Next?

Upcoming examples:
* How eventing is propagated between parent and tearout
* How to integrate with Angular