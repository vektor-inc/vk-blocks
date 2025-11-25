<?php
/**
 * Extensions core image block style .
 *
 * @package VK Blocks
 */

/**
 * Load Scripts
 */
function vk_blocks_image_style() {
	$dynamic_css = '
	:root {
		--vk_image-mask-circle: url(' . VK_BLOCKS_URL . 'images/circle.svg);
		--vk_image-mask-wave01: url(' . VK_BLOCKS_URL . 'images/wave01.svg);
		--vk_image-mask-wave02: url(' . VK_BLOCKS_URL . 'images/wave02.svg);
		--vk_image-mask-wave03: url(' . VK_BLOCKS_URL . 'images/wave03.svg);
		--vk_image-mask-wave04: url(' . VK_BLOCKS_URL . 'images/wave04.svg);
	}
	';

	// 分割読み込みが有効時は image ブロックのハンドルに付与、それ以外は従来通り
	if ( method_exists( 'VK_Blocks_Block_Loader', 'should_load_separate_assets' )
		&& VK_Blocks_Block_Loader::should_load_separate_assets() && ! is_admin() ) {
		// フロント分割時はコアブロック image のハンドルへ
		wp_add_inline_style( 'wp-block-image', $dynamic_css );
	} else {
		// 一括読み込みや管理画面では従来通り
		wp_add_inline_style( 'vk-blocks-build-css', $dynamic_css );
		wp_add_inline_style( 'vk-blocks-utils-common-css', $dynamic_css );
	}

	if ( is_admin() && class_exists( 'WP_Screen' ) && WP_Screen::get()->is_block_editor() ) {
		wp_add_inline_style( 'vk-blocks-build-editor-css', $dynamic_css );
	}
}
add_action( 'wp_enqueue_scripts', 'vk_blocks_image_style' );
add_action( 'enqueue_block_editor_assets', 'vk_blocks_image_style' );
