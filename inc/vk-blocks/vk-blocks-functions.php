<?php
/**
 * Load VK Blocks Files
 *
 * このファイルはinc/vk-blocks内にあるフォルダ内を読み込むだけ
 *
 * @package vk_blocks
 */

// Load Files
require_once __DIR__ . '/utils/hex-to-rgba.php';
require_once __DIR__ . '/utils/color-slug-to-color-code.php';
require_once __DIR__ . '/utils/array-merge.php';
require_once __DIR__ . '/utils/minify-css.php';
require_once __DIR__ . '/extensions/core/heading.php';
require_once __DIR__ . '/extensions/core/image.php';
require_once __DIR__ . '/extensions/core/list.php';
require_once __DIR__ . '/style/balloon.php';
require_once __DIR__ . '/style/flow.php';
require_once __DIR__ . '/style/hidden-extension.php';
require_once __DIR__ . '/style/common-margin.php';
require_once __DIR__ . '/view/responsive-br.php';
require_once __DIR__ . '/view/class-vk-blocks-postlist.php';
require_once __DIR__ . '/view/class-vk-blocks-scrollhintrenderer.php';
VK_Blocks_ScrollHintRenderer::init();

require_once __DIR__ . '/class-vk-blocks-print-css-variables.php';

// グローバル設定を定義
require_once __DIR__ . '/class-vk-blocks-global-settings.php';
VK_Blocks_Global_Settings::init();

require_once __DIR__ . '/class-vk-blocks-block-loader.php';
VK_Blocks_Block_Loader::init();

// オプション値を定義
require_once __DIR__ . '/class-vk-blocks-options.php';
VK_Blocks_Options::init();

// font-awesome
require_once __DIR__ . '/font-awesome/font-awesome-config.php';

// VK Blocks の管理画面.
require_once __DIR__ . '/admin/admin.php';
require_once __DIR__ . '/init.php';
require_once __DIR__ . '/blocks.php';
require_once __DIR__ . '/App/RestAPI/BlockMeta/class-vk-blocks-entrypoint.php';
new Vk_Blocks_EntryPoint();

// ブロック関連の処理
require_once __DIR__ . '/blocks/class-vk-blocks-faq-schema-manager.php';
VK_Blocks_Faq_Schema_Manager::init();

/**
 * VK Blocks active
 */
function vk_blocks_active() {
	return true;
}

// 翻訳を実行
add_action(
	'plugins_loaded',
	function () {
		// サイトのロケールを取得
		$locale = determine_locale();
		// 翻訳ファイルのパスを指定
		$path = plugin_dir_path( __FILE__ ) . 'languages';

		// 日本語の設定のみ翻訳ファイルを読み込み
		if ( strpos( $locale, 'ja' ) === 0 ) {
			// PHPファイルの翻訳読み込み
			load_textdomain( 'vk-blocks-pro', $path . '/vk-blocks-pro-ja.mo' );

			// JavaScriptファイルの翻訳設定
			add_action(
				'wp_enqueue_scripts',
				function () use ( $path ) {
					// スクリプト登録後に翻訳設定
					wp_set_script_translations( 'vk-blocks-build-js', 'vk-blocks-pro', $path );
					wp_set_script_translations( 'vk-blocks-admin-js', 'vk-blocks-pro', $path );
				}
			);
		}
	}
);

/**
 * VK Blocks 用の CSS クラスを追加
 */
add_filter(
	'body_class',
	function ( $body_class ) {
		$body_class[] = 'vk-blocks';
		return $body_class;
	}
);

/**
 * VK Blocks Assets
 */
function vk_blocks_blocks_assets() {
	$vk_blocks_options = VK_Blocks_Options::get_options();
	$has_theme_json    = false;

	// テーマに theme.json があるかどうかを判定（ content-width-half のパネル表示制御で使用 ）
	if ( function_exists( 'wp_is_block_theme' ) && wp_is_block_theme() ) {
		$has_theme_json = true;
	} elseif ( function_exists( 'wp_theme_has_theme_json' ) ) {
		$has_theme_json = wp_theme_has_theme_json();
	} else {
		$theme          = wp_get_theme();
		$has_theme_json = file_exists( $theme->get_stylesheet_directory() . '/theme.json' ) || file_exists( $theme->get_template_directory() . '/theme.json' );
	}

	// プロ版の値をフロントエンドに出力.
	include_once ABSPATH . 'wp-admin/includes/plugin.php';
	if ( is_plugin_active( 'vk-blocks-pro/vk-blocks.php' ) ) {
		wp_localize_script( 'vk-blocks-build-js', 'vk_blocks_check', array( 'is_pro' => true ) );
	} else {
		wp_localize_script( 'vk-blocks-build-js', 'vk_blocks_check', array( 'is_pro' => false ) );
	}

	wp_localize_script(
		'vk-blocks-build-js',
		'vk_blocks_params',
		array(
			'home_url'                    => home_url( '/' ),
			'show_custom_css_editor_flag' => $vk_blocks_options['show_custom_css_editor_flag'],
			'balloon_meta_lists'          => $vk_blocks_options['balloon_meta_lists'],
			'custom_format_lists'         => $vk_blocks_options['custom_format_lists'],
			'block_variation_lists'       => $vk_blocks_options['block_variation_lists'],
			'has_theme_json'              => $has_theme_json,
		)
	);

	global $vk_blocks_common_attributes;
	$vk_blocks_common_attributes = array(
		'vkb_hidden'       => array(
			'type'    => 'boolean',
			'default' => false,
		),
		'vkb_hidden_xxl'   => array(
			'type'    => 'boolean',
			'default' => false,
		),
		'vkb_hidden_xl_v2' => array(
			'type'    => 'boolean',
			'default' => false,
		),
		'vkb_hidden_xl'    => array(
			'type'    => 'boolean',
			'default' => false,
		),
		'vkb_hidden_lg'    => array(
			'type'    => 'boolean',
			'default' => false,
		),
		'vkb_hidden_md'    => array(
			'type'    => 'boolean',
			'default' => false,
		),
		'vkb_hidden_sm'    => array(
			'type'    => 'boolean',
			'default' => false,
		),
		'vkb_hidden_xs'    => array(
			'type'    => 'boolean',
			'default' => false,
		),
		'marginTop'        => array(
			'type'    => 'string',
			'default' => '',
		),
		'marginBottom'     => array(
			'type'    => 'string',
			'default' => '',
		),
	);

	// Pro版のためfunction_existsを挟む
	$dynamic_css = '';
	if ( function_exists( 'vk_blocks_get_custom_format_lists_inline_css' ) ) {
		$dynamic_css .= vk_blocks_get_custom_format_lists_inline_css();
	}

	$dynamic_css = vk_blocks_minify_css( $dynamic_css );

	// 分割読み込みが有効な場合は、フロント側ではローダー側で該当ハンドルに付与する
	if ( method_exists( 'VK_Blocks_Block_Loader', 'should_load_separate_assets' )
		&& VK_Blocks_Block_Loader::should_load_separate_assets() && ! is_admin() ) {
		if ( $dynamic_css ) {
			wp_add_inline_style( 'vk-blocks-utils-common-css', $dynamic_css );
		}
	} elseif ( $dynamic_css ) {
		// 一括読み込み時や管理画面では従来通り
		wp_add_inline_style( 'vk-blocks-build-css', $dynamic_css );
		wp_add_inline_style( 'vk-blocks-utils-common-css', $dynamic_css );
		// エディターにも追加
		wp_add_inline_style( 'wp-edit-blocks', $dynamic_css );
	}
}
add_action( 'init', 'vk_blocks_blocks_assets', 10 );

if ( ! function_exists( 'vk_blocks_set_wp_version' ) ) {
	/**
	 * VK Blocks Set WP Version
	 */
	function vk_blocks_set_wp_version() {
		global $wp_version;

		// RC版の場合ハイフンを削除.
		if ( strpos( $wp_version, '-' ) !== false ) {
			$_wp_version = strstr( $wp_version, '-', true );
		} else {
			$_wp_version = $wp_version;
		}

		echo '<script>',
			'var wpVersion = "' . esc_attr( $_wp_version ) . '";',
		'</script>';
	}
	add_action( 'admin_head', 'vk_blocks_set_wp_version', 10, 0 );
}

/**
 * スクリプトの読み込み
 */
function vk_blocks_load_scripts() {
	wp_enqueue_script( 'vk-blocks-slider', VK_BLOCKS_DIR_URL . 'build/vk-slider.min.js', array( 'vk-swiper-script' ), VK_BLOCKS_VERSION, true );

	// Group Block Scrollable Extension
	wp_enqueue_script( 'vk-blocks-group-scrollable', VK_BLOCKS_DIR_URL . 'build/vk-group-scrollable.min.js', array(), VK_BLOCKS_VERSION, true );
}
add_action( 'wp_enqueue_scripts', 'vk_blocks_load_scripts' );
