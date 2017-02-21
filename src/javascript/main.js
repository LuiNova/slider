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