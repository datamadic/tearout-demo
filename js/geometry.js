var geometry = geometry || {};
(function() {
    'use strict';

    var Point = function(anX, aY) {
        this.x = anX || 0;
        this.y = aY || 0;
    };
    Point.constructor = Point;

    Point.prototype = {
        plus: function(aPoint) {
            var aResult = new Point(this.x + aPoint.x, this.y + aPoint.y);
            return aResult;
        },
        minus: function(aPoint) {
            var aResult = new Point(this.x - aPoint.x, this.y - aPoint.y);
            return aResult;
        },
        min: function(aPoint) {
            var aResult = new Point(Math.min(this.x, aPoint.x), Math.min(this.y, aPoint.y));
            return aResult;
        },
        max: function(aPoint) {
            var aResult = new Point(Math.max(this.x, aPoint.x), Math.max(this.y, aPoint.y));
            return aResult;
        },
        distance: function(aPoint) {
            var dx = aPoint.x - this.x,
                dy = aPoint.y - this.y,
                aResult = Math.sqrt(dx * dx + (dy * dy));
            return aResult;
        },
        toString: function() {
            return 'geometry.point(' + this.x + ',' + this.y + ')';
        },
        greaterThan: function(aPoint) {
            var aResult = this.x > aPoint.x && this.y > aPoint.y;
            return aResult;
        },
        lessThan: function(aPoint) {
            var aResult = this.x < aPoint.x && this.y < aPoint.y;
            return aResult;
        },
        greaterThanEqualTo: function(aPoint) {
            var aResult = this.x >= aPoint.x && this.y >= aPoint.y;
            return aResult;
        },
        lessThanEqualTo: function(aPoint) {
            var aResult = this.x <= aPoint.x && this.y <= aPoint.y;
            return aResult;
        },
        isContainedWithinRectangle: function(aRect) {
            var aResult = aRect.origin.lessThanEqualTo(this) && aRect.corner().greaterThanEqualTo(this);
            return aResult;
        }
    };

    var Rectangle = function(rect) {
        this.origin = new Point(rect.left, rect.top);
        this.extent = new Point(rect.width, rect.height);
    };

    Rectangle.constructor = Rectangle;

    Rectangle.prototype = {
        top: function() {
            return this.origin.y;
        },
        left: function() {
            return this.origin.x;
        },
        bottom: function() {
            return this.top() + this.extent.y;
        },
        right: function() {
            return this.left() + this.extent.x;
        },
        corner: function() {
            var aResult = new Point(this.right(), this.bottom());
            return aResult;
        },
        // extent: function() {
        //     var aResult = new Point(this.extent.x, this.extent.y);
        //     return aResult;
        // },
        area: function() {
            return this.extent.x * this.extent.y;
        },
        contains: function(aPointOrRect) {
            var aResult = aPointOrRect.isContainedWithinRectangle(this);
            return aResult;
        },
        isContainedWithinRectangle: function(aRect) {
            var aResult = aRect.origin.lessThanEqualTo(this.origin) && aRect.corner().greaterThanEqualTo(this.corner());
            return aResult;
        },
        center: function() {
            //return the center point
            var anX = this.origin.x + (this.extent.x / 2);
            var aY = this.origin.y + (this.extent.y / 2);
            return new Point(anX, aY);
        },
        union: function(aRectangle) {
            //answer a rectangle that contains the receiver and argment rectangles
            var anOrigin = this.origin.min(aRectangle.origin),
                aCorner = this.corner().max(aRectangle.corner()),
                aWidth = aCorner.x - anOrigin.x,
                aHeight = aCorner.y - anOrigin.y;
            aResult = new Rectangle(anOrigin.x, anOrigin.y, aWidth, aHeight);

            return aResult;
        },
        intersect: function(aRectangle, ifNoneAction) {
            //Answer a Rectangle that is the area in which the receiver overlaps with 
            //aRectangle. Optimized for speed
            var aPoint = aRectangle.origin,
                myCorner = this.corner(),
                left = null,
                right = null,
                top = null,
                bottom = null,
                aResult = null;

            if (ifNoneAction && !this.intersects(aRectangle)) return ifNoneAction.call(this, aRectangle);

            if (aPoint.x > this.origin.x) {
                left = aPoint.x;
            } else {
                left = this.origin.x;
            }

            if (aPoint.y > this.origin.y) {
                top = aPoint.y;
            } else {
                top = this.origin.y;
            }

            aPoint = aRectangle.corner();
            if (aPoint.x < myCorner.x) {
                right = aPoint.x;
            } else {
                right = myCorner.x;
            }

            if (aPoint.y < myCorner.y) {
                bottom = aPoint.y;
            } else {
                bottom = myCorner.y;
            }
            aResult = new Rectangle(left, top, right - left, bottom - top);
            return aResult;
        },
        intersects: function(aRectangle) {
            //return true if we overlap, false otherwise

            var rOrigin = aRectangle.origin,
                rCorner = aRectangle.corner();

            if (rCorner.x <= this.origin.x) {
                return false;
            }
            if (rCorner.y <= this.origin.y) {
                return false;
            }
            if (rOrigin.x >= this.corner().x) {
                return false;
            }
            if (rOrigin.y >= this.corner().y) {
                return false;
            }

            return true;
        },
        toString: function() {
            return 'geometry.rectangle(' + this.origin.x + ', ' + this.origin.y + ', ' + this.extent.x + ', ' + this.extent.y + ')';
        }
    };

    /*
        argument rect is an object with this shape:
        {
            top: <number>,
            left: <number>,
            width: <number>,
            height: <number>
        }
    */
    geometry.rectangle = function(rect) {
        return new Rectangle(rect);
    };
    geometry.point = function(anX, aY) {
        return new Point(anX, aY);
    };
})();
