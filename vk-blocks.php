<?php
/**
 * Plugin Name: VK Blocks
 * Plugin URI: https://github.com/vektor-inc/vk-blocks
 * Description: This is a plugin that extends Gutenberg's blocks.
 * Version: 0.22.4
 * Author: Vektor,Inc.
 * Author URI: https://vektor-inc.co.jp
 * Text Domain: vk-blocks
 */

// Do not load directly.
defined( 'ABSPATH' ) || die();

if ( is_admin() ) {
	$options = get_option( 'active_plugins' );

	if ( in_array( 'vk-blocks-pro/vk-blocks.php', $options) ) {
		$key = array_search( 'vk-blocks/vk-blocks.php', $options );
		if ( false !== $key ) {
			$do_blog = true;
			unset( $options[ $key ] );
			update_option( 'active_plugins', $options );

			add_action( 'admin_notices', function(){
				echo '<div class="updated notice"><p>';
				echo "Pro版VK-Blocksが起動したため、VK-Blocksを停止しました。";
				echo '</p></div>';
			} );
		}
	}

	$options = get_option( 'vkExUnit_common_options' );
	if ( !empty( $options['active_vk-blocks'] ) ) {
		$options['active_vk-blocks'] = false;
		update_option( 'vkExUnit_common_options', $options );

		add_action( 'admin_notices', function(){
			echo '<div class="updated notice"><p>';
			echo "VK-Blocksと競合するため、VK All in One Expansion UnitのBlock機能を停止しました。";
			echo '</p></div>';
		} );
	}
	die();
}

require_once 'inc/vk-blocks-config.php';

add_action(
	'plugins_loaded',
	function () {
		// Load language files.
		load_plugin_textdomain( 'vk-blocks', false, 'vk-blocks/inc/vk-blocks/build/languages' );
	}
);

/*
  Load updater
/*-------------------------------------------*/
$plugin_base_dir = dirname( __FILE__ );
if ( strpos( $plugin_base_dir, 'vk-blocks-pro' ) !== false ) {

	$updater_url = dirname( __FILE__ ) . '/inc/plugin-update-checker/plugin-update-checker.php';
	if ( file_exists( $updater_url ) ) {
		require dirname( __FILE__ ) . '/inc/plugin-update-checker/plugin-update-checker.php';
		$myUpdateChecker = Puc_v4_Factory::buildUpdateChecker(
			'https://vws.vektor-inc.co.jp/updates/?action=get_metadata&slug=vk-blocks-pro',
			__FILE__,
			'vk-blocks-pro'
		);
	}
}
