<?php
/**
 * Ballon Style Setting
 *
 * @package VK Blocks
 */

function vk_blocks_balloon_style() {
	$vk_blocks_options        = vkblocks_get_options();
	// 線の太さ.
	$vk_balloon_border_width  = intval( $vk_blocks_options['balloon_border_width'] );
	// offset = -11 - 線の太さ.
	$vk_balloon_speech_offset = -11 - $vk_balloon_border_width;

	$dynamic_css = '
	:root {

		--vk-balloon-border-width:' .  $vk_balloon_border_width . 'px;

		--vk-balloon-speech-offset:' .  $vk_balloon_speech_offset . 'px;
	}
	';

	wp_add_inline_style( 'vk-blocks-build-css', $dynamic_css );
}
add_action( 'wp_enqueue_scripts', 'vk_blocks_balloon_style' );
add_action( 'enqueue_block_editor_assets', 'vk_blocks_balloon_style' );

