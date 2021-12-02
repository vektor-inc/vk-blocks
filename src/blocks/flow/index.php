<?php
/**
 * VK Blocks - Flow Blocks
 *
 * @package vk-blocks
 */

/**
 * Register Flow block.
 *
 * @return void
 */
function vk_blocks_register_block_flow() {
	// Register Style.
	if ( ! is_admin() ) {
		wp_register_style(
			'vk-blocks/flow',
			VK_BLOCKS_DIR_URL . 'build/flow/style.css',
			array(),
			VK_BLOCKS_VERSION
		);
	}

	// Register Script.
	$asset = include VK_BLOCKS_DIR_PATH . 'build/flow/block-build.asset.php';
	wp_register_script(
		'vk-blocks/flow',
		VK_BLOCKS_DIR_URL . 'build/flow/block-build.js',
		$asset['dependencies'],
		VK_BLOCKS_VERSION,
		true
	);

	if ( vk_blocks_is_lager_than_wp( '5.8' ) ) {
		register_block_type(
			__DIR__,
			array(
				'style'         => 'vk-blocks/flow',
				'editor_style'  => 'vk-blocks-build-editor-css',
				'editor_script' => 'vk-blocks-build-js',
			)
		);
	} else {
		register_block_type_from_metadata(
			__DIR__,
			array(
				'editor_style'  => 'vk-blocks-build-editor-css',
				'editor_script' => 'vk-blocks-build-js',
			)
		);
	}
}
add_action( 'init', 'vk_blocks_register_block_flow', 99 );

