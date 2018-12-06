<?php
/*-------------------------------------------*/
/*  Load modules
/*-------------------------------------------*/
if ( ! function_exists( 'vkblocks_active' ) ) {

	require_once( 'vk-blocks/vk-blocks-functions.php' );
	// Set asset URL.
	define( 'VK_BLOCKS_URL', plugin_dir_url( __FILE__ ) . 'vk-blocks/' );
	// Set version number.
	define( 'VK_BLOCKS_VERSION', '0.2.0' );

	global $vk_blocks_prefix;
	$vk_blocks_prefix = apply_filters( 'vk_blocks_prefix', 'VK ' );

	function vkblocks_load_bootstrap_admin() {
		wp_register_style( 'vkblocks-bootstrap', plugin_dir_url(__FILE__) . 'vk-blocks/plugins/bootstrap-4.1.3/css/bootstrap.min.css', false, '4.1.3' );
		wp_enqueue_style( 'vkblocks-bootstrap' );
	}
	add_action( 'admin_enqueue_scripts', 'vkblocks_load_bootstrap_admin' );


}
