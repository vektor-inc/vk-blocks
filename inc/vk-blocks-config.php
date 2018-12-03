<?php
/*-------------------------------------------*/
/*  Load modules
/*-------------------------------------------*/
if ( ! function_exists( 'vkblocks_active' ) ) {

	require_once('vk-blocks/plugins/font-awesome/font-awesome-config.php');
	require_once( 'vk-blocks/vk-blocks-functions.php' );
	// Set asset URL.
	define( 'VK_BLOCKS_URL', plugin_dir_url( __FILE__ ) . 'vk-blocks/' );
	// Set version number.
	define( 'VK_BLOCKS_VERSION', '1.0.0' );

	global $vk_blocks_prefix;
	$vk_blocks_prefix = apply_filters( 'vk_blocks_prefix', 'VK ' );

}
