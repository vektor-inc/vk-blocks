<?php

/**
 * Registers the `vk-blocks/pr-content` block.
 */
if ( function_exists( 'register_block_type_from_metadata' ) ) {

	function register_block_vkb_pr_content() {
		register_block_type_from_metadata(
			__DIR__,
			array(
				'editor_style'  => 'vk-blocks-build-editor-css',
				'editor_script' => 'vk-blocks-build-js',
			)
		);
	}
	add_action( 'init', 'register_block_vkb_pr_content', 99 );
}

