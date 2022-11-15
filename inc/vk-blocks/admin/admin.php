<?php
/**
 * VK Blocks Admin Setting
 *
 * @package VK Blocks
 */

if ( ! function_exists( 'vk_blocks_setting' ) ) {

	/**
	 * Check need license environment
	 *
	 * @return bool
	 */
	function vk_blocks_is_license_setting() {
		if ( vk_blocks_is_pro() && wp_get_theme()->Template !== 'katawara' ) {
			return true;
		}
	}

	/**
	 * VK Blocks Setting
	 *
	 * @return void
	 */
	function vk_blocks_setting() {
		?>
		<div id="vk-blocks-admin"></div>
		<?php
	}
}

$vk_blocks_admin_pages = array( 'settings_page_vk_blocks_options' );
Vk_Admin::admin_scripts( $vk_blocks_admin_pages );

global $vk_blocks_prefix;
$vk_blocks_prefix = 'VK';

/**
 * VK Blocks Setting Menu
 *
 * @return void
 */
function vk_blocks_setting_menu() {
	global $vk_blocks_prefix;
	$custom_page = add_options_page(
		$vk_blocks_prefix . ' ' . __( 'Blocks setting', 'vk-blocks' ),       // Name of page.
		$vk_blocks_prefix . ' ' . _x( 'Blocks', 'label in admin menu', 'vk-blocks' ),                // Label in menu.
		'edit_theme_options',               // Capability required　このメニューページを閲覧・使用するために最低限必要なユーザーレベルまたはユーザーの種類と権限.
		'vk_blocks_options',               // ユニークなこのサブメニューページの識別子.
		'vk_blocks_setting_page'         // メニューページのコンテンツを出力する関数.
	);
	if ( ! $custom_page ) {
		return;
	}
}
add_action( 'admin_menu', 'vk_blocks_setting_menu' );

/**
 * Setting Page
 */
function vk_blocks_setting_page() {
	global $vk_blocks_prefix;
	$get_page_title = $vk_blocks_prefix . ' ' . __( 'Blocks Setting', 'vk-blocks' );

	$get_logo_html = '<img src="' . plugin_dir_url( __FILE__ ) . '/images/vk-blocks-logo_ol.svg" alt="VK Blocks" />';
	$get_logo_html = apply_filters( 'vk_blocks_logo_html', $get_logo_html );

	$get_menu_html = '';
	if ( vk_blocks_is_license_setting() ) {
		$get_menu_html .= '<li><a href="#license-setting">' . __( 'License Key', 'vk-blocks' ) . '</a></li>';
	}
	$get_menu_html .= '<li><a href="#balloon-setting">' . __( 'Balloon Block Setting', 'vk-blocks' ) . '</a></li>';
	$get_menu_html .= '<li><a href="#margin-setting">' . __( 'Common Margin Setting', 'vk-blocks' ) . '</a></li>';
	$get_menu_html .= '<li><a href="#load-separete-setting">' . __( 'Load Separete Setting', 'vk-blocks' ) . '</a></li>';
	$get_menu_html .= apply_filters( 'vk_blocks_pro_menu', '' );

	Vk_Admin::admin_page_frame( $get_page_title, 'vk_blocks_setting', $get_logo_html, $get_menu_html );
}

/**
 * VK Blocks add setting link
 *
 * @param array  $links VK Blocks action links.
 * @param string $file Path to the plugin file relative to the plugins directory.
 *
 * @return array
 */
function vk_blocks_add_setting_link( $links, $file ) {
	if ( plugin_basename( VK_BLOCKS_DIR_PATH . '/vk-blocks.php' ) === $file ) {
		$settings_link = '<a href="' . esc_url( admin_url( '/options-general.php?page=vk_blocks_options' ) ) . '">' . __( 'Setting', 'vk-blocks' ) . '</a>';
		array_unshift( $links, $settings_link );
	}
	return $links;
}
add_filter( 'plugin_action_links', 'vk_blocks_add_setting_link', 10, 2 );

/**
 * Enqueue scripts
 *
 * @param string $hook_suffix hook suffix.
 */
function vk_blocks_options_enqueue_scripts( $hook_suffix ) {
	// 作成したオプションページ以外では読み込まない.
	if ( 'settings_page_vk_blocks_options' !== $hook_suffix ) {
		return;
	}

	$asset = include VK_BLOCKS_DIR_PATH . 'inc/vk-blocks/build/admin-build.asset.php';
	// Enqueue CSS dependencies.
	foreach ( $asset['dependencies'] as $style ) {
		wp_enqueue_style( $style );
	}

	// メディアピッカーを使用するため.
	wp_enqueue_media();

	wp_enqueue_script(
		'vk-blocks-admin-js',
		VK_BLOCKS_DIR_URL . 'inc/vk-blocks/build/admin-build.js',
		$asset['dependencies'],
		$asset['version'],
		true
	);
	wp_set_script_translations( 'vk-blocks-admin-js', 'vk-blocks', VK_BLOCKS_DIR_PATH . 'inc/vk-blocks/languages' );

	wp_localize_script(
		'vk-blocks-admin-js',
		'vkBlocksObject',
		array(
			'options'          => VK_Blocks_Options::get_options(),
			'balloonMeta'      => VK_Blocks_Options::get_balloon_meta_options(),
			'imageNumber'      => VK_Blocks_Options::balloon_image_number(),
			'isLicenseSetting' => vk_blocks_is_license_setting(),
			'isPro'            => vk_blocks_is_pro(),
		)
	);

	wp_enqueue_style(
		'vk_blocks_options-style',
		VK_BLOCKS_DIR_URL . 'build/vk_blocks_options.css',
		array(),
		VK_BLOCKS_VERSION
	);
}
add_action( 'admin_enqueue_scripts', 'vk_blocks_options_enqueue_scripts' );
