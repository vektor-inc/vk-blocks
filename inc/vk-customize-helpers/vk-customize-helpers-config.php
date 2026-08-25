<?php
/**
 * VK Customize Helpers Config
 *
 * @package vk-blocks
 */

// Do not load directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Custom_Text_Control' ) ) {
	require_once plugin_dir_path( __FILE__ ) . 'package/vk-customize-helpers.php';
}
