<?php
/**
 * Plugin Name: VK Blocks
 * Plugin URI: https://github.com/vektor-inc/vk-blocks
 * Description:
 * Version: 1.0.0
 * Author: Vektor,Inc.
 * Author URI:
 * Text Domain: vk-blocks
 */

// Do not load directly.
defined( 'ABSPATH' ) || die();

// Set version number.
define( 'VK_BLOCKS_VERSION', '1.0.0' );

// Set asset URL.
define( 'VK_BLOCKS_ASSET_URL', plugin_dir_url( __FILE__ ) );

add_action( 'plugins_loaded', function () {

	//Load language files.
	load_plugin_textdomain( 'vk-blocks', false, basename( dirname( __FILE__ ) ) . '/assets/languages' );
} );

// Load all files in includes dir.
//require __DIR__ . '/includes/alert.php';
//require __DIR__ . '/includes/baloon.php';
//require __DIR__ . '/includes/flow.php';
//require __DIR__ . '/includes/faq.php';


// Register block.
add_action(
	'init', function() {
	// Register CSS
	wp_register_style( 'vk-block-alert-css', VK_BLOCKS_ASSET_URL . 'assets/css/style.css', [], VK_BLOCKS_VERSION );
	// Register JS
	wp_register_script( 'vk-block-alert-js', VK_BLOCKS_ASSET_URL . 'assets/js/block.js', [ 'wp-element', 'wp-blocks','wp-i18n' ], VK_BLOCKS_VERSION, true );
	// Register block.


	if ( defined( 'GUTENBERG_VERSION' ) ) {
		// Alert Block.
		register_block_type(
			'vk-block/alert', [
				'editor_style'  => 'vk-block-alert-css',
				'editor_script' => 'vk-block-alert-js',
			]
		);
	}


	if ( function_exists( 'gutenberg_get_jed_locale_data' ) ) {

		//Get translation data from indicated text-domain.
		$locale  = gutenberg_get_jed_locale_data( 'vk-blocks' );

		//Add translation data to javasript object.
		$content = 'wp.i18n.setLocaleData( ' . json_encode( $locale ) . ', "vk-blocks" );';

		//Pass the data to javascript from php.
		wp_script_add_data( 'vk-block-alert-js', 'data', $content );
	}


}
);

// Enqueue css for plugin.
add_action(
	'wp_enqueue_scripts', function() {
	wp_enqueue_style( 'vk-block-alert-css' );
}
);