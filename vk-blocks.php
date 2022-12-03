<?php
/**
 * Plugin Name: VK Blocks 
 * Plugin URI: https://github.com/vektor-inc/vk-blocks
 * Description: This is a plugin that extends Gutenberg's blocks.
 * Version: 1.47.1.0
 * Stable tag: 1.47.1.0
 * Requires at least: 5.9
 * Author: Vektor,Inc.
 * Author URI: https://vektor-inc.co.jp
 * Text Domain: vk-blocks
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

if ( ! function_exists( 'vk_blocks_deactivate_plugin' ) ) {
	/**
	 * Plugin deactive function
	 *
	 * @param  string $plugin_path Plugin path to disable.
	 * @return void
	 */
	function vk_blocks_deactivate_plugin( $plugin_path ) {
		include_once ABSPATH . 'wp-admin/includes/plugin.php';
		if ( is_plugin_active( $plugin_path ) ) {
			$active_plugins = get_option( 'active_plugins' );
			// delete active plugin.
			$active_plugins = array_diff( $active_plugins, array( $plugin_path ) );
			// re index active plugin.
			$active_plugins = array_values( $active_plugins );
			update_option( 'active_plugins', $active_plugins );
		}
	}
}

/**
 * Deactive VK Blocks ( Free )
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
if ( strpos( plugin_dir_path( __FILE__ ), 'vk-blocks-pro' ) !== false ) {
	include_once ABSPATH . 'wp-admin/includes/plugin.php';

	if ( is_plugin_active( 'vk-blocks-pro/vk-blocks.php' ) ) {
		// Deactive Plugin VK Blocks ( free ).
		if ( function_exists( 'vk_blocks_deactivate_plugin' ) ) {
			vk_blocks_deactivate_plugin( 'vk-blocks/vk-blocks.php' );
		}
	}

	// Deactive ExUnit included VK Blocks.
	$vk_blocks_exunit_common_options = get_option( 'vkExUnit_common_options' );
	if ( ! empty( $vk_blocks_exunit_common_options['active_vk-blocks'] ) ) {
		$vk_blocks_exunit_common_options['active_vk-blocks'] = false;
		update_option( 'vkExUnit_common_options', $vk_blocks_exunit_common_options );
	}

	// Deactive VK Grid Colomun Card Plugin.
	if ( is_plugin_active( 'vk-gridcolcard/vk-gridcolcard.php' ) ) {
		if ( function_exists( 'vk_blocks_deactivate_plugin' ) ) {
			vk_blocks_deactivate_plugin( 'vk-gridcolcard/vk-gridcolcard.php' );
		}
	}
}

if ( is_admin() && ! is_network_admin() ) {
	$vk_blocks_options = get_option( 'vkExUnit_common_options' );
	if ( ! empty( $vk_blocks_options['active_vk-blocks'] ) ) {
		$vk_blocks_options['active_vk-blocks'] = false;
		update_option( 'vkExUnit_common_options', $vk_blocks_options );

		add_action(
			'admin_notices',
			function() {
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


/****************************************************************************************
 * Load updater ( Pro version only )
 */

if ( function_exists( 'vk_blocks_is_pro' ) && vk_blocks_is_pro() ) {

	// 本来 Pro 版でしか読み込まないが、1.36.0.0 は間違って読み込んでしまっており
	// 無料版 1.36.0 を有効化していると previously declared になるため ! function_exists() を通した上で宣言している.
	if ( ! function_exists( 'vk_blocks_update_checker' ) ) {
		/**
		 * Perform update checks on VK Blocks.
		 *
		 * @return void
		 */
		function vk_blocks_update_checker() {

			// Cope with : WP HTTP Error: cURL error 60: SSL certificate problem: certificate has expired.
			add_filter( 'https_ssl_verify', '__return_false' );

			$update_checker = Puc_v4_Factory::buildUpdateChecker(
				'https://vws.vektor-inc.co.jp/updates/?action=get_metadata&slug=vk-blocks-pro',
				__FILE__, // この処理を他の場所に移動するとここを変更しないといけなくなるので注意.
				'vk-blocks-pro'
			);

			$update_checker->addQueryArgFilter( 'vk_blocks_get_license_check_query_arg' );

			// 管理画面 かつ テーマオプションの編集権限がある場合.
			if ( is_admin() && current_user_can( 'edit_theme_options' ) ) {
				$network_runnning_pro = false;

				// マルチサイトでOriginal Brand Unitが動いていたら.
				if ( is_multisite() ) {
					$network_options = get_site_option( 'active_sitewide_plugins', array() );
					if ( isset( $network_options['lightning-original-brand-unit/lightning-original-brand-unit.php'] ) ) {
						$network_runnning_pro = true;
					}
				}

				// マルチサイトでOriginal Brand Unitが動いていない && Original Brand Unitが有効になっていない.
				$active_plugins = get_option( 'active_plugins', array() );
				if ( ! $network_runnning_pro && ! in_array( 'lightning-original-brand-unit/lightning-original-brand-unit.php', $active_plugins, true ) ) {
					add_action(
						'admin_notices',
						function () use ( $update_checker ) {
							vk_blocks_the_update_messsage( $update_checker );
						}
					);
				}
			}
		}
	}

	add_action( 'after_setup_theme', 'vk_blocks_update_checker' );

	if ( ! function_exists( 'vk_blocks_the_update_messsage' ) ) {
		/**
		 * Update alert message
		 *
		 * @param object $update_checker .
		 * @return void
		 */
		function vk_blocks_the_update_messsage( $update_checker ) {
			$state  = $update_checker->getUpdateState();
			$update = $state->getUpdate();

			$options = get_option( 'vk_blocks_options' );
			if ( ! empty( $options['vk_blocks_pro_license_key'] ) ) {
				$license = esc_html( $options['vk_blocks_pro_license_key'] );
			} else {
				$license = '';
			}

			$notice_title = '';

			// ライセンスキーが未入力の場合.
			if ( empty( $license ) && wp_get_theme()->Template !== 'katawara' ) {
				$notice_title = __( 'License Key has no registered.', 'vk-blocks' );
			} elseif ( ! empty( $update ) && empty( $update->download_url ) ) {

				// ライセンスが切れている あるいは 無効な場合.
				// アップデートは存在するがURLが帰ってこなかった場合.
				$notice_title = __(
					'The VK Blocks Pro license is invalid.',
					'vk-blocks'
				);
			}

			if ( empty( $notice_title ) ) {
				return;
			}

			$link_url = wp_nonce_url(
				add_query_arg(
					array(
						'puc_check_for_updates' => 1,
						'puc_slug'              => $update_checker->slug,
					),
					self_admin_url( 'plugins.php' )
				),
				'puc_check_for_updates'
			);

			$alert_html  = '';
			$alert_html .= '<div class="error">';
			$alert_html .= '<h4>VK Blocks Pro : ' . $notice_title . '</h4>';
			$alert_html .= '<p>' . __(
				'Enter a valid license key for any of the following products on the settings screen.',
				'vk-blocks'
			) . '</p>';
			$alert_html .= '<ul>';
			$alert_html .= '<li><a href="https://vws.vektor-inc.co.jp/product/lightning-g3-pro-pack/?rel=vk-blocks-pro-alert" target="_blank">Lightning G3 Pro Pack</a></li>';
			$alert_html .= '<li><a href="https://vws.vektor-inc.co.jp/product/lightning-pro-update-license?rel=vk-blocks-pro-alert" target="_blank">Lightning Pro</a></li>';
			$alert_html .= '</ul>';

			$alert_html .= '<p><a href="' . admin_url( '/options-general.php?page=vk_blocks_options' ) . '" class="button button-primary">' . __( 'Enter the license key', 'vk-blocks' ) . '</a></p>';

			$alert_html .= '<p>';
			$alert_html .= __( 'If this display does not disappear even after entering a valid license key, re-acquire the update.', 'vk-blocks' );
			$alert_html .= ' [ <a href="' . $link_url . '">' . __( 'Re-acquisition of updates', 'vk-blocks' ) . '</a> ]';
			$alert_html .= '</p>';

			$alert_html .= '</div>';
			echo wp_kses_post( $alert_html );
		}
	}

	if ( ! function_exists( 'vk_blocks_get_license_check_query_arg' ) ) {
		/**
		 * Register update license key
		 *
		 * @param array $query_args : updatechacker array.
		 * @return $query_args
		 */
		function vk_blocks_get_license_check_query_arg( $query_args ) {
			$options = get_option( 'vk_blocks_options' );
			$license = '';
			if ( ! empty( $options['vk_blocks_pro_license_key'] ) ) {
				$license = esc_html(
					preg_replace(
						"/\A[\x20\xE3\x80\x80]++|[\x20\xE3\x80\x80]++\z/u",
						'',
						$options['vk_blocks_pro_license_key']
					)
				);
			}

			if ( ! empty( $license ) ) {
				$query_args['vk-blocks-pro-license-key'] = $license;
			}
			$query_args['template'] = wp_get_theme()->Template;

			return $query_args;
		}
	}
}
