<?php
/**
 * Register flow block.
 *
 */

defined( 'ABSPATH' ) || die();

// Register block.
add_action( 'init', function() {
	// Register CSS
	wp_register_style( 'vk-block-flow', VK_BLOCKS_ASSET_URL . 'assets/css/flow.css', [], VK_BLOCKS_VERSION );
	// Register JS
	wp_register_script( 'vk-block-flow', VK_BLOCKS_ASSET_URL . 'assets/js/flow.js', [ 'wp-element', 'wp-blocks' ], VK_BLOCKS_VERSION, true );
	// Register block.
	if ( defined( 'GUTENBERG_VERSION' ) ) {
		// Alert Block.
		register_block_type( 'vk-block/flow', [
			'editor_style'  => 'vk-block-flow',
			'editor_script' => 'vk-block-flow',
		] );
	}
} );

// Enqueue css for theme.
add_action( 'wp_enqueue_scripts', function() {
	wp_enqueue_style( 'vk-block-flow' );
} );