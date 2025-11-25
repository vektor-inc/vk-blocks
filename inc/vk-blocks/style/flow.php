<?php
/**
 * Flow Style Setting
 *
 * @package VK Blocks
 */

/**
 * Load Scripts
 */
function vk_blocks_flow_style() {
	$dynamic_css = '
	:root {
		--vk_flow-arrow: url(' . VK_BLOCKS_URL . 'images/arrow_bottom.svg);
	}
	';

	// 分割読み込みが有効時は flow ブロックのハンドルに付与、それ以外は従来通り
	if ( method_exists( 'VK_Blocks_Block_Loader', 'should_load_separate_assets' )
		&& VK_Blocks_Block_Loader::should_load_separate_assets() && ! is_admin() ) {
		// フロント分割時はブロック固有ハンドルへ
		wp_add_inline_style( 'vk-blocks/flow', $dynamic_css );
	} else {
		// 一括読み込みや管理画面では従来通り
		wp_add_inline_style( 'vk-blocks-build-css', $dynamic_css );
		wp_add_inline_style( 'vk-blocks-utils-common-css', $dynamic_css );
	}

	$screen = class_exists( 'WP_Screen' ) ? WP_Screen::get() : null;
	if ( is_admin() && $screen && method_exists( $screen, 'is_block_editor' ) && $screen->is_block_editor() ) {
		wp_add_inline_style( 'vk-blocks-build-editor-css', $dynamic_css );
	}
}
add_action( 'wp_enqueue_scripts', 'vk_blocks_flow_style' );
add_action( 'enqueue_block_editor_assets', 'vk_blocks_flow_style' );
