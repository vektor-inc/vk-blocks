<?php

/**
 * Registers the `vk-blocks/faq2` block.
 */
if ( function_exists( 'register_block_type_from_metadata' ) ) {

	function register_block_vk_faq2() {
		register_block_type_from_metadata(
			__DIR__,
			array(
				'editor_style'  => 'vk-blocks-build-editor-css',
				'editor_script' => 'vk-blocks-build-js',
			)
		);
	}
	add_action( 'init', 'register_block_vk_faq2', 99 );
}

function vk_faq2_render_callback( $block_content, $block ) {
	$vk_blocks_options = vk_blocks_get_options();
	if ( 'vk-blocks/faq2' === $block['blockName'] ) {
		if ( ! empty( $vk_blocks_options['new_faq_accordion'] ) && 'open' === $vk_blocks_options['new_faq_accordion'] ) {
			$block_content = str_replace( '[accordion_trigger_switch]', 'vk_faq-accordion vk_faq-accordion-open', $block_content );
		} elseif ( ! empty( $vk_blocks_options['new_faq_accordion'] ) && 'close' === $vk_blocks_options['new_faq_accordion'] ) {
			$block_content = str_replace( '[accordion_trigger_switch]', 'vk_faq-accordion vk_faq-accordion-close', $block_content );
		} else {
			$block_content = str_replace( '[accordion_trigger_switch]', '', $block_content );
		}
	}
	return $block_content;
}

add_filter( 'render_block', 'vk_faq2_render_callback', 10, 2 );
