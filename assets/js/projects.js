$(document).ready(function() {
    // Carousel setup
    $('.carousel').each(function() {
        var $t = $(this),
            $forward = $('<span class="forward"></span>').appendTo($t),
            $backward = $('<span class="backward"></span>').appendTo($t),
            $reel = $t.find('.reel'),
            $items = $reel.find('article'),
            margin = 40;  // Adjust this margin to increase the space after the last item

        var pos = 0,
            leftLimit,
            rightLimit,
            itemWidth = $items.outerWidth(true),  // Ensure this includes margin
            reelWidth = $reel[0].scrollWidth;

        // Calculate limits
        leftLimit = -1 * (reelWidth - $(window).width() + margin);
        // rightLimit = -1 * (reelWidth - $(window).width() + 100);  // Adding 20 or more, depending on your padding/margin
        rightLimit = 0;

        $forward.on('mouseenter', function(e) {
            timerId = setInterval(function() {
                if (pos > leftLimit) {
                    pos -= 10; // Or use a calculated speed based on settings
                    $reel.css('transform', 'translateX(' + pos + 'px)');
                } else {
                    clearInterval(timerId);
                }
            }, 10);
        }).on('mouseleave', function(e) {
            clearInterval(timerId);
        });

        $backward.on('mouseenter', function(e) {
            timerId = setInterval(function() {
                if (pos < rightLimit) {
                    pos += 10; // Or use a calculated speed based on settings
                    $reel.css('transform', 'translateX(' + pos + 'px)');
                } else {
                    clearInterval(timerId);
                }
            }, 10);
        }).on('mouseleave', function(e) {
            clearInterval(timerId);
        });

        // Ensure arrows are visible and clickable
        $forward.show();
        $backward.show();
    });

    // Add classes to first and last carousel items
    $('.carousel .reel article:first-child').addClass('first-item');
    $('.carousel .reel article:last-child').addClass('last-item');
});
