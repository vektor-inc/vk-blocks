<?php
/**
 * Extensions core heading block style .
 *
 * @package vk-blocks
 */

/**
 * Extensions core heading block style.
 *
 * @param string $block_content block_content.
 * @return string
 */
function vk_blocks_render_core_heading( $block_content ) {
	// 左右線スタイル（both_ends）かチェック
	if ( strpos( $block_content, 'is-style-vk-heading-both_ends' ) === false ) {
		return $block_content;
	}

	// 常にspanで囲む
	$pattern     = '/<h([1-6])([^>]*)>(.*?)<\/h\1>/s';
	$replacement = '<h$1$2><span class="vk-heading__text-wrapper">$3</span></h$1>';

	return preg_replace( $pattern, $replacement, $block_content );
}
add_filter( 'render_block_core/heading', 'vk_blocks_render_core_heading', 10, 1 );
