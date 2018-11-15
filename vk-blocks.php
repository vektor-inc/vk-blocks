<?php
/**
 * Plugin Name: VK Blocks
 * Plugin URI: https://github.com/vektor-inc/vk-blocks
 * Description:
 * Version: 1.0.0
 * Author: Vektor,Inc.
 * Author URI:
 *
 */

// Do not load directly.
defined( 'ABSPATH' ) || die();

// Set version number.
define( 'VK_BLOCKS_VERSION', '1.0.0' );

// Set asset URL.
define( 'VK_BLOCKS_ASSET_URL', plugin_dir_url( __FILE__ ) );

// Load all files in includes dir.
require __DIR__ . '/includes/alert.php';
require __DIR__ . '/includes/baloon.php';
require __DIR__ . '/includes/flow.php';
require __DIR__ . '/includes/faq.php';
