define('slider', [

], function(

) {
    'use strict';

    var transformPrefix   = '',
        transformProperty = 'transform',
        defaultSettings = {
            onSwipeEnd: noop,
            onDragStart: noop,
            onDrag: noop,
            onDragEnd: noop
        },
        supports = (function() {
            var div = document.createElement('div'),
                vendors = 'Khtml Ms O Moz Webkit'.split(' '),
                len = vendors.length;

            return function(prop) {
                if (prop in div.style) {
                    return true;
                }

                prop = prop.replace(/^[a-z]/, function(val) {
                    return val.toUpperCase();
                });

                while(len--) {
                    if ((vendors[len] + prop) in div.style) {
                        return true;
                    }
                }

                return false;
            };
        }()),
        supportTransform = supports('transform');

    /**
     * Helpful events to trigger: scroll, beforeScroll, scrollEnd
     * helpful info to send: x/y position, direciton, currentPage
     */
    var Slider = {
        init: function($element, settings) {
            var defaultSettingsCopy = extend({}, defaultSettings);

            this.settings = extend(defaultSettingsCopy, settings);

            this.cacheElements($element);

            this.loopItems($element);

            this.cacheValues();

            this.bindEvents();

            // make items loop before caching elements

            this.startPage = 2;
            this.goToPage(2, 0);

            return this;
        },

        cacheElements: function($element) {
            this.$rootElement = $element;
            this.$slider = this.$rootElement.querySelector('.js-slider-viewport');
        },

        cacheValues: function() {
            this.name = this.$rootElement.dataset.name;

            this.isTouch = 'ontouchstart' in window;

            var firstItem = this.$slider.querySelector('.js-slider-slide');
            this.scrollableArea = firstItem.offsetWidth * this.$slider.children.length;

            this.sliderWidth = this.$slider.offsetWidth;
        },

        loopItems: function($element) {
            var items = this.$slider.querySelectorAll('.js-slider-slide'),
                itemsLength = items.length;

            if (itemsLength >= 2 && itemsLength < 5) {
                var i,
                    itemsToCreateLoop = itemsLength === 2 ? 2 : (itemsLength - 2);

                // add last two elements to the front of array - need to be cloned
                this.$slider.insertBefore(items[itemsLength - 2].cloneNode(true), items[0]);
                this.$slider.insertBefore(items[itemsLength - 1].cloneNode(true), items[0]);

                for (i = 0; i < itemsToCreateLoop; i++) {
                    this.$slider.appendChild(items[i].cloneNode(true));
                }

            } else if (itemsLength >= 5) {
                // 5 or more items we just need to move the last 2 to the front - not cloned
                this.$slider.insertBefore(items[itemsLength - 2], items[0]);
                this.$slider.insertBefore(items[itemsLength - 1], items[0]);
            }
        },

        bindEvents: function() {
            this.$slider.addEventListener('touchstart', this._onTouchStart.bind(this), false);
            this.$slider.addEventListener('touchmove', this._onTouchMove.bind(this), false);
            this.$slider.addEventListener('touchend', this._onTouchEnd.bind(this), false);

            this.$slider.addEventListener('webkitTransitionEnd', this._onScrollTransformEnd.bind(this), false);
            this.$slider.addEventListener('oTransitionEnd', this._onScrollTransformEnd.bind(this), false);
            this.$slider.addEventListener('transitionend', this._onScrollTransformEnd.bind(this), false);
            this.$slider.addEventListener('transitionEnd', this._onScrollTransformEnd.bind(this), false);

            window.addEventListener('resize', this._reSizePages, false);
        },

        destroy: function() {
            this.$slider.removeEventListener('touchstart', this._onTouchStart.bind(this));
            this.$slider.removeEventListener('touchmove', this._onTouchMove.bind(this));
            this.$slider.removeEventListener('touchend', this._onTouchEnd.bind(this));

            window.removeEventListener('resize', this._reSizePages);
        },

        _onScrollTransformEnd: function(event) {
            this._onSwipeEnd(event);

            this.$slider.removeEventListener('webkitTransitionEnd', this._onScrollTransformEnd.bind(this));
            this.$slider.removeEventListener('oTransitionEnd', this._onScrollTransformEnd.bind(this));
            this.$slider.removeEventListener('transitionend', this._onScrollTransformEnd.bind(this));
            this.$slider.removeEventListener('transitionEnd', this._onScrollTransformEnd.bind(this));
        },

        /**
         * Returns an object containing the co-ordinates for the event.
         *
         * @param {Object} event
         * @returns {Object}
         */
        _getCoords: function(event) {
            // touch move and touch end have different touch data
            var touches = event.touches,
                data = touches && touches.length ? touches : event.changedTouches;

            return {
                pageX: data[0].pageX,
                pageY: data[0].pageY
            };
        },

        _parseEvent: function(event) {
            var coords = this._getCoords(event),
                x = this.startCoords.pageX - coords.pageX,
                y = this.startCoords.pageY - coords.pageY;

            return this._addDistanceValues(x, y);
        },

        _addDistanceValues: function(x, y) {
            var eventData = {
                distanceX: 0,
                distanceY: 0
            };

            eventData.distanceX = x;
            eventData.direction = x > 0 ? 'left' : 'right';

            return eventData;
        },

        _reSizePages: function() {
            console.log('Rezising');
        },

        _onTouchStart: function(event) {
            if (!this.$slider) {
                return;
            }

            this.startCoords = this._getCoords(event);

            this.isScrolling = undefined;
            this.resistance = 1;
            this.lastSlide = -(this.$slider.children.length - 1);
            this.startTime = +new Date();
            this.pageX = this.startCoords.pageX;//event.touches[0].pageX;
            this.pageY = this.startCoords.pageY;//event.touches[0].pageY;
            this.deltaX = 0;
            this.deltaY = 0;

            this._setSlideNumber(0);

            this.$slider.style[transformPrefix + 'transition-duration'] = 0;

            this.settings.onDragStart.call(this, event);
        },

        _onTouchMove: function(event) {
            if (event.touches.length > 1 || !this.$slider) {
                return; // Exit if a pinch || no slider
            }

            var coords = this._getCoords(event);

            // adjust the starting position if we just started to avoid jumpage
            if (!this.startedMoving) {
                this.pageX += (coords.pageX - this.pageX) - 1;
            }

            this.deltaX = coords.pageX - this.pageX;
            this.deltaY = coords.pageY - this.pageY;
            this.pageX  = coords.pageX;
            this.pageY  = coords.pageY;

            if (typeof this.isScrolling === 'undefined' && this.startedMoving) {
                this.isScrolling = Math.abs(this.deltaY) > Math.abs(this.deltaX);
            }

            if (this.isScrolling) {
                return;
            }

            this.offsetX = (this.deltaX / this.resistance) + this._getScroll();

            event.preventDefault();

            this.resistance = this.slideNumber === 0 && this.deltaX > 0 ? (this.pageX / this.sliderWidth) + 1.25 : this.slideNumber === this.lastSlide && this.deltaX < 0 ? (Math.abs(this.pageX) / this.sliderWidth) + 1.25 : 1;

            this.$slider.style[transformProperty] = 'translate3d(' + this.offsetX + 'px,0,0)';

            // started moving
            this.startedMoving = true;

            var parsedEvent = this._parseEvent(event);

            this.settings.onDrag.call(this, event, parsedEvent);
        },

        _onTouchEnd: function(event) {
            if (!this.$slider || this.isScrolling) {
                return;
            }

            // we're done moving
            this.startedMoving = false;

            this._setSlideNumber((+new Date()) - this.startTime < 1000 && Math.abs(this.deltaX) > 15 ? (this.deltaX < 0 ? -1 : 1) : 0);

            this.offsetX = this.slideNumber * this.sliderWidth;

            this.$slider.style[transformPrefix + 'transition-duration'] = '.2s';
            this.$slider.style[transformProperty] = 'translate3d(' + this.offsetX + 'px,0,0)';

            this._dispatchEvent();

            this.settings.onDragEnd.call(this, event);
        },

        _onSwipeEnd: function(event) {
            this.settings.onSwipeEnd.call(this, event);
        },

        _dispatchEvent: function() {
            if (this.name) {
                var e = new CustomEvent('slide:' + this.name, {
                    detail: {
                        name: this.name,
                        slideNumber: Math.abs(this.slideNumber)
                    },
                    bubbles: true,
                    cancelable: true
                });

                this.$slider.parentNode.dispatchEvent(e);
            }
        },

        _getScroll: function() {
            var translate3d = this.$slider.style[transformProperty].match(/translate3d\(([^,]*)/),
                ret = translate3d ? translate3d[1] : 0;

            return parseInt(ret, 10);
        },

        _setSlideNumber: function(offset) {
            var round = offset ? (this.deltaX < 0 ? 'ceil' : 'floor') : 'round';

            this.slideNumber = Math[round](this._getScroll() / (this.scrollableArea / this.$slider.children.length));
            this.slideNumber += offset;
            this.slideNumber = Math.min(this.slideNumber, 0);
            this.slideNumber = Math.max(-(this.$slider.children.length - 1), this.slideNumber);
        },

        /**
         * Method to go to a specific page
         *
         * @page    pageNumber
         * @time    milliseconds
         */
        goToPage: function(page, time) {
            // if no time was provided set default to .2 seconds
            time = typeof time === 'undefined' ? 200 : time;

            var transitionTime = (time / 1000);

            this.slideNumber = -page;

            this.offsetX = page * this.sliderWidth;

            this.$slider.style[transformPrefix + 'transition-duration'] = transitionTime + 's';
            this.$slider.style[transformProperty] = 'translate3d(' + -this.offsetX + 'px,0,0)';

            this._dispatchEvent();
        },

        next: function() {
            this.goToPage(Math.abs(this.slideNumber) + 1);
        },

        previous: function() {
            this.goToPage(Math.abs(this.slideNumber) - 1);
        }
    };

    function extend(destination, source) {
        var property;

        for (property in source) {
            destination[property] = source[property];
        }

        return destination;
    }

    function noop() {}

    function falseFn() {
        return false;
    }

    function setStyles(element, styles) {

        var property,
            value;

        for (property in styles) {
            if (styles.hasOwnProperty(property)) {
                value = styles[property];

                switch (value) {
                    case 'height':
                    case 'width':
                    case 'marginLeft':
                    case 'marginTop':
                        value += "px";
                        break;
                    default:
                        value = value;
                }

                element.style[property] = value;
            }
        }

        return element;
    }

    return {
        createComponent: function($element, settings) {
            if (!$element) {
                console.log('Element does not exists in DOM');
                return;
            }

            $element.className += ' slider--loaded';

            var slider = Object.create(Slider);

            return slider.init($element, settings);
        }
    };
});