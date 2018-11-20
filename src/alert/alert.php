<?php
/**
 * Register alert block.
 *
 */

defined( 'ABSPATH' ) || die();

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