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

add_action(
	'plugins_loaded', function () {
		//Load language files.
		load_plugin_textdomain( 'vk-blocks', false, basename( dirname( __FILE__ ) ) . '/dist/languages' );
	}
);

function vkblocks_blocks_assets() {

	wp_register_style( 'vk-blocks-buid-css', plugins_url( 'dist/block-build.css', __FILE__ ), [], VK_BLOCKS_VERSION );
	wp_register_style( 'vk-blocks-buid-editor-css', plugins_url( 'dist/block-build-editor.css', __FILE__ ), [], VK_BLOCKS_VERSION );
	wp_register_script(
		'vk-blocks-buid-js', plugins_url( 'dist/block-build.js', __FILE__ ), array(
			'wp-blocks',
			'wp-i18n',
			'wp-element',
		), VK_BLOCKS_VERSION, true
	);

	if ( function_exists( 'gutenberg_get_jed_locale_data' ) ) {

		//Get translation data from indicated text-domain.
		$locale = gutenberg_get_jed_locale_data( 'vk-blocks' );

		//Add translation data to javasript object.
		$content = 'wp.i18n.setLocaleData( ' . json_encode( $locale ) . ', "vk-blocks" );';

		//Pass the data to javascript from php.
		wp_script_add_data( 'vk-blocks-buid-js', 'data', $content );
	}

	if ( defined( 'GUTENBERG_VERSION' ) ) {

		// Alert Block.
		register_block_type(
			'vk-blocks/alert', [
				'style'         => 'vk-blocks-buid-css',
				'editor_style'  => 'vk-blocks-buid-editor-css',
				'editor_script' => 'vk-blocks-buid-js',
			]
		);
		// Baloon Block.
		register_block_type(
			'vk-blocks/balloon', [
				'style'         => 'vk-blocks-buid-css',
				'editor_style'  => 'vk-blocks-buid-editor-css',
				'editor_script' => 'vk-blocks-buid-js',
			]
		);
		// Faq Block.
		register_block_type(
			'vk-blocks/faq', [
				'style'         => 'vk-blocks-buid-css',
				'editor_style'  => 'vk-blocks-buid-editor-css',
				'editor_script' => 'vk-blocks-buid-js',
			]
		);
		// Flow Block.
		register_block_type(
			'vk-blocks/flow', [
				'style'         => 'vk-blocks-buid-css',
				'editor_style'  => 'vk-blocks-buid-editor-css',
				'editor_script' => 'vk-blocks-buid-js',
			]
		);
	}
}
add_action( 'init', 'vkblocks_blocks_assets' );

// Add Block Category,
function vkblocks_blocks_categories( $categories, $post ) {
	return array_merge(
		$categories,
		array(
			array(
				'slug'  => 'vk-blocks-cat',
				'title' => __( 'Vektor Blocks（Beta）', 'vk-blocks' ),
				'icon'  => '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0V0z" /><path d="M19 13H5v-2h14v2z" /></svg>',
			),
		)
	);
}
add_filter( 'block_categories', 'vkblocks_blocks_categories', 10, 2 );
