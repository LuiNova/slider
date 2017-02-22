define('main', [
    'slider'
], function(
    Slider
) {
    'use strict';

    return {
        init: function() {
            var slider = document.querySelector('.js-slider');
            var pictureSlider = Slider.createComponent(slider, {
                onSwipeEnd: function(event) {
                    var currentSlide = Math.abs(this.slideNumber),
                        slide = currentSlide,
                        items = this.$slider.querySelectorAll('.js-slider-slide'),
                        itemsLength = items.length;

                    // direction left -> current page is > previous
                    // direction right -> current page is < previous
                    if (currentSlide > this.startPage) {
                        slide = currentSlide - 1;

                        // Move first slide to the end of carousel
                        this.$slider.appendChild(items[0]);
                    } else if (currentSlide < this.startPage) {
                        slide = currentSlide + 1;

                        // Move last slide to the beginning of carousel
                        this.$slider.insertBefore(items[itemsLength - 1], items[0]);
                    }

                    this.goToPage(slide, 0);
                }
            });
            console.log(pictureSlider);

            document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);

            window.addEventListener('slide:pictureSlider', function(event) {
                console.log('Slider Picture');
                console.log(event);
            });
        }
    };
});