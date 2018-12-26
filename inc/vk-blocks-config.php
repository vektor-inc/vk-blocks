<?php
/*-------------------------------------------*/
/*  Load modules
/*-------------------------------------------*/
// このファイルは基本 /vk-blocks/vk-blocks-functions.phpを読み込むファイルだけ
// vk-blocks
if ( ! function_exists( 'vkblocks_active' ) ) {

	require_once( 'vk-blocks/vk-blocks-functions.php' );

	// Set asset URL.
	define( 'VK_BLOCKS_URL', plugin_dir_url( __FILE__ ) . 'vk-blocks/' );
	// Set version number.
	define( 'VK_BLOCKS_VERSION', '0.2.2' );

	global $vk_blocks_prefix;
	$vk_blocks_prefix = apply_filters( 'vk_blocks_prefix', 'VK ' );


	// ExUnitなど読み込み先によってはあらかじめ読み込んでいるので不要の場合がある
	require_once( 'font-awesome-config.php' );

	// 管理画面へのbootstrapの読み込み
	function vkblocks_load_bootstrap_admin( $hook_suffix ) {

		if ( is_admin() ) {

			if ( 'post.php' === $hook_suffix || 'post-new.php' === $hook_suffix ) {
				wp_register_style( 'vkblocks-bootstrap', plugin_dir_url( __FILE__ ) . 'vk-blocks/plugins/bootstrap-4.1.3/css/bootstrap.min.css', false, '4.1.3' );
				wp_enqueue_style( 'vkblocks-bootstrap' );
			}
		} else {
			wp_register_style( 'vkblocks-bootstrap', plugin_dir_url( __FILE__ ) . 'vk-blocks/plugins/bootstrap-4.1.3/css/bootstrap.min.css', false, '4.1.3' );
			wp_enqueue_style( 'vkblocks-bootstrap' );
		}

	}
	add_action( 'admin_enqueue_scripts', 'vkblocks_load_bootstrap_admin' );
	add_action( 'wp_enqueue_scripts', 'vkblocks_load_bootstrap_admin' );
}
