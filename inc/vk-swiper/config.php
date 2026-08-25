<?php
/**
 * VK Swiper Config
 *
 * @package vektor-inc/vk-blocks
 */

// Do not load directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use VektorInc\VK_Swiper\VkSwiper;
new VkSwiper();
VkSwiper::enqueue_swiper();
