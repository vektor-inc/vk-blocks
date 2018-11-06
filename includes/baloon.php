<?php
/**
 * Register baloon block.
 *
 */

defined( 'ABSPATH' ) || die();

// Register block.
add_action( 'init', function() {
	// Register CSS
	wp_register_style( 'vk-block-baloon', VK_BLOCKS_ASSET_URL . 'assets/css/baloon.css', [], VK_BLOCKS_VERSION );
	// Register JS
	wp_register_script( 'vk-block-baloon', VK_BLOCKS_ASSET_URL . 'assets/js/baloon.js', [ 'wp-element', 'wp-blocks' ], VK_BLOCKS_VERSION, true );
	// Register block.
	if ( defined( 'GUTENBERG_VERSION' ) ) {
		// Alert Block.
		register_block_type( 'vk-block/baloon', [
			'editor_style'  => 'vk-block-baloon',
			'editor_script' => 'vk-block-baloon',
		] );
	}
} );

// Enqueue css for theme.
add_action( 'wp_enqueue_scripts', function() {
	wp_enqueue_style( 'vk-block-baloon' );
} );