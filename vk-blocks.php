<?php
/**
 * Plugin Name: VK Blocks
 * Plugin URI: https://github.com/vektor-inc/vk-blocks
 * Description: This is a plugin that extends Block Editor.
 * Version: 1.126.4
 * Requires at least: 6.6
 * Author: Vektor,Inc.
 * Author URI: https://vektor-inc.co.jp
 * Text Domain: vk-blocks
 * License: GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 *
 * @package vk-blocks
 */

// Do not load directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}


/*
無料版の VK Blocks の無効化が正常に動作しなかった場合に無料版の関数が先に定義され
重複 -> Fatal error になるため function_exists は フォールバックとして付与している
*/
if ( ! function_exists( 'vk_blocks_get_version' ) ) {
	/**
	 * Get Plugin Version
	 *
	 * @return string
	 */
	function vk_blocks_get_version() {
		$data = get_file_data( __FILE__, array( 'version' => 'Version' ) );
		return $data['version'];
	}
}

/**
 * Deactivate VK Blocks ( Free )
 *
 * 読み込んでだ時に無料版が有効化されていたら、誤動作しないようになるべく早く無効化するためそのまま実行させている
 * VK Blocks 無料版の 1.36.0 で vk_blocks_is_pro を function_exists を経由せずに定義してしまっているため、
 * 無料版 1.36.0 を停止する前に vk_blocks_is_pro を定義するとエラーになるため、
 * vk_blocks_is_pro の定義前に無料版の無効化処理を行っている
 * 1.36.0無料版有効化時にPRo版を有効化時に一瞬エラーが表示されるが、再読み込みで復帰する
 * 1.36.0無料版をアップデートしてもらわないとこれは避けられないので、当面はこのまま運用する
 *
 * プロ版での読み込みかどうかの判定は strpos を使っているが、
 * strpos は"合致している"にも関わらず返り値は"0"を返してしまうため !== false で処理している.
 */
require_once ABSPATH . 'wp-admin/includes/plugin.php';

if ( strpos( plugin_dir_path( __FILE__ ), 'vk-blocks-pro' ) !== false ) {
	if ( is_plugin_active( 'vk-blocks/vk-blocks.php' ) ) {
		deactivate_plugins( 'vk-blocks/vk-blocks.php' );

		// Deactivate ExUnit included VK Blocks.
		$vk_blocks_exunit_common_options = get_option( 'vkExUnit_common_options' );
		if ( ! empty( $vk_blocks_exunit_common_options['active_vk-blocks'] ) ) {
			$vk_blocks_exunit_common_options['active_vk-blocks'] = false;
			update_option( 'vkExUnit_common_options', $vk_blocks_exunit_common_options );
		}
		return;
	}
	if ( is_plugin_active( 'vk-gridcolcard/vk-gridcolcard.php' ) ) {
		deactivate_plugins( 'vk-gridcolcard/vk-gridcolcard.php' );
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		// Deactivate ExUnit included VK Blocks.
		$vk_blocks_exunit_common_options = get_option( 'vkExUnit_common_options' );
		if ( ! empty( $vk_blocks_exunit_common_options['active_vk-blocks'] ) ) {
			$vk_blocks_exunit_common_options['active_vk-blocks'] = false;
			update_option( 'vkExUnit_common_options', $vk_blocks_exunit_common_options );
		}
		return;
	}
} elseif ( strpos( plugin_dir_path( __FILE__ ), 'vk-blocks' ) !== false ) {
	if ( is_plugin_active( 'vk-blocks-pro/vk-blocks.php' ) ) {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		// Deactivate ExUnit included VK Blocks.
		$vk_blocks_exunit_common_options = get_option( 'vkExUnit_common_options' );
		if ( ! empty( $vk_blocks_exunit_common_options['active_vk-blocks'] ) ) {
			$vk_blocks_exunit_common_options['active_vk-blocks'] = false;
			update_option( 'vkExUnit_common_options', $vk_blocks_exunit_common_options );
		}
		return;
	}
}

if ( is_admin() && ! is_network_admin() ) {
	$vk_blocks_options = get_option( 'vkExUnit_common_options' );
	if ( ! empty( $vk_blocks_options['active_vk-blocks'] ) ) {
		$vk_blocks_options['active_vk-blocks'] = false;
		update_option( 'vkExUnit_common_options', $vk_blocks_options );

		add_action(
			'admin_notices',
			function () {
				echo '<div class="updated notice"><p>';
				echo esc_html( __( 'Disabled Blocks module on VK All in One Expansion Unit. Because VK-Blocks Plugin running.', 'vk-blocks' ) );
				echo '</p></div>';
			}
		);
	}
}

/*
無料版の VK Blocks の無効化が正常に動作しなかった場合に無料版の関数が先に定義され
重複 -> Fatal error になるため function_exists は フォールバックとして付与している
*/
if ( ! function_exists( 'vk_blocks_is_pro' ) ) {
	/**
	 * Check Free or Pro
	 *
	 * @return bool
	 */
	function vk_blocks_is_pro() {
		$return = false;
		// 注意 : strpos() は合致した開始位置を返すので、最初に合致すると、
		// "合致している"にも関わらず返り値は"0"を返してしまうため !== false で処理している.
		if ( strpos( plugin_dir_path( __FILE__ ), 'vk-blocks-pro' ) !== false ) {
			$return = true;
		}
		return $return;
	}
}

/****************************************************************************************
 * Start VK Blocks
 * 無料版を無効化した後に書かないと関数の二重宣言などになるので注意
 */
if ( ! function_exists( 'vk_blocks_loaded' ) ) {
	/**
	 * Load VK Blocks
	 *
	 * @return void
	 */
	function vk_blocks_loaded() {
		// Composer のファイルを読み込み ( composer install --no-dev ).
		require_once plugin_dir_path( __FILE__ ) . 'vendor/autoload.php';
		// Set plugin dir path.
		if ( ! defined( 'VK_BLOCKS_DIR_PATH' ) ) {
			define( 'VK_BLOCKS_DIR_PATH', plugin_dir_path( __FILE__ ) );
		}
		// Set Plugin Dir URL.
		if ( ! defined( 'VK_BLOCKS_DIR_URL' ) ) {
			define( 'VK_BLOCKS_DIR_URL', plugin_dir_url( __FILE__ ) );
		}
		// Load VK Blocks
		require_once plugin_dir_path( __FILE__ ) . 'inc/vk-blocks-config.php';
	}
	add_action( 'plugins_loaded', 'vk_blocks_loaded' );
}


/****************************************************************************************
 * Load updater ( Pro version only )
 *
 * This code lives in inc/vk-blocks-pro/updater.php, not here, so that it is
 * never present in the free version's distributed files (that file is excluded
 * from the free repository sync via .freeignore).
 * このコードを本ファイルに直接書かず inc/vk-blocks-pro/updater.php に分離しているのは、
 * 無料版の配布物にこのコード（アップデートチェッカー）が含まれないようにするため。
 * このファイルは .freeignore により無料版リポジトリへの同期対象から除外される。
 */
$vk_blocks_pro_updater_file = plugin_dir_path( __FILE__ ) . 'inc/vk-blocks-pro/updater.php';
if ( file_exists( $vk_blocks_pro_updater_file ) ) {
	require_once $vk_blocks_pro_updater_file;
}

if ( function_exists( 'register_deactivation_hook' ) ) {
	register_deactivation_hook( __FILE__, 'vk_blocks_deactivate_function' );
}

if ( ! function_exists( 'vk_blocks_deactivate_function' ) ) {
	/**
	 * Deactivate function
	 *
	 * @return void
	 */
	function vk_blocks_deactivate_function() {
		delete_option( 'vk_blocks_checked_flags' );
	}
}
