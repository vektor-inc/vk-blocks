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
define( 'VK_BLOCKS_URL', plugin_dir_url( __FILE__ ) );

add_action( 'plugins_loaded', function () {
	//Load language files.
	load_plugin_textdomain( 'vk-blocks', false, basename( dirname( __FILE__ ) ) . '/dist/languages' );
} );

function vkblocks_blocks_assets() {

	wp_register_script(
		'vk-blocks-buid', plugins_url( 'dist/block-build.js', __FILE__ ), array(
		'wp-blocks',
		'wp-i18n',
		'wp-element',
	), VK_BLOCKS_VERSION, true
	);

	if ( function_exists( 'gutenberg_get_jed_locale_data' ) ) {

		//Get translation data from indicated text-domain.
		$locale  = gutenberg_get_jed_locale_data( 'vk-blocks' );

		//Add translation data to javasript object.
		$content = 'wp.i18n.setLocaleData( ' . json_encode( $locale ) . ', "vk-blocks" );';

		//Pass the data to javascript from php.
		wp_script_add_data( 'vk-blocks-buid', 'data', $content );
	}

	if ( defined( 'GUTENBERG_VERSION' ) ) {

		// Alert Block.
		register_block_type(
			'vk-blocks/alert', [
				'editor_script' => 'vk-blocks-buid',
			]
		);
		// Baloon Block.
		register_block_type(
			'vk-blocks/balloon', [
				'editor_script' => 'vk-blocks-buid',
			]
		);
		// Faq Block.
		register_block_type(
			'vk-blocks/faq', [
				'editor_script' => 'vk-blocks-buid',
			]
		);
		// Flow Block.
		register_block_type(
			'vk-blocks/flow', [
				'editor_script' => 'vk-blocks-buid',
			]
		);
	}
}

add_action( 'init', 'vkblocks_blocks_assets' );