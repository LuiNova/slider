define('main', [
    'slider'
], function(
    Slider
) {
    'use strict';

    return {
        init: function() {
            var slider = document.querySelector('.js-slider');
            var pictureSlider = Slider.createComponent(slider);
            console.log(pictureSlider);

            window.addEventListener('slide:pictureSlider', function(event) {
                console.log('Slider Picture');
                console.log(event);
            });
        }
    };
});