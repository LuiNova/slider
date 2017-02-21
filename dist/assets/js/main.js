// For any third party dependencies, like jQuery, place them in the lib folder.

// Configure loading modules from the lib directory,
// except for 'app' ones, which are in a sibling
// directory.
requirejs.config({
    baseUrl: 'src/javascript',
    paths: {
        app: '../dist'
    }
});

// Start loading the main app file. Put all of
// your application logic in there.
requirejs(['main'], function(main) {
    main.init();
});
define('main', [
    'slider'
], function(
    Slider
) {
    'use strict';

    return {
        init: function() {
            var slider = document.querySelector('.js-slider');
            Slider.createComponent(slider);

            window.addEventListener('slide:pictureSlider', function(event) {
                console.log('Slider Picture');
                console.log(event);
            });
        }
    };
});
define('slider', [

], function(

) {
    'use strict';

    var transformPrefix   = '',
        transformProperty = 'transform';

    /**
     * Helpful events to trigger: scroll, beforeScroll, scrollEnd
     */
    var Slider = {
        init: function($element) {
            this.cacheElements($element);
            this.bindEvents();

            // make items loop before caching elements

            this.goToPage(2, 0);
        },

        cacheElements: function($element) {
            this.$rootElement = $element;
            this.name = this.$rootElement.dataset.name;
            this.$slider = this.$rootElement.querySelector('.js-slider-viewport');

            var firstItem = this.$slider.querySelector('.js-slider-slide');
            this.scrollableArea = firstItem.offsetWidth * this.$slider.children.length;

            this.sliderWidth = this.$slider.offsetWidth;
        },

        bindEvents: function() {
            this.$slider.addEventListener('touchstart', this.onTouchStart.bind(this));
            this.$slider.addEventListener('touchmove', this.onTouchMove.bind(this));
            this.$slider.addEventListener('touchend', this.onTouchEnd.bind(this));
        },

        onTouchStart: function(event) {
            if (!this.$slider) {
                return;
            }

            this.isScrolling = undefined;
            this.resistance = 1;
            this.lastSlide = -(this.$slider.children.length - 1);
            this.startTime = +new Date();
            this.pageX = event.touches[0].pageX;
            this.pageY = event.touches[0].pageY;
            this.deltaX = 0;
            this.deltaY = 0;

            this._setSlideNumber(0);

            this.$slider.style[transformPrefix + 'transition-duration'] = 0;
        },

        onTouchMove: function(event) {
            if (event.touches.length > 1 || !this.$slider) {
                return; // Exit if a pinch || no slider
            }

            // adjust the starting position if we just started to avoid jumpage
            if (!this.startedMoving) {
                this.pageX += (event.touches[0].pageX - this.pageX) - 1;
            }

            this.deltaX = event.touches[0].pageX - this.pageX;
            this.deltaY = event.touches[0].pageY - this.pageY;
            this.pageX  = event.touches[0].pageX;
            this.pageY  = event.touches[0].pageY;

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
        },

        onTouchEnd: function(event) {
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

    return {
        createComponent: function($element) {
            if (!$element) {
                console.log('Element does not exists in DOM');
                return;
            }

            $element.className += ' slider--loaded';

            var slider = Object.create(Slider);

            return slider.init($element);
        }
    };
});