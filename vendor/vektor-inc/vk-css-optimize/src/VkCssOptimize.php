<?php  // phpcs:ignore
/**
 * VK CSS Optimize
 *
 * @package vektor-inc/vk-css-optimize
 * @license GPL-2.0+
 *
 * @version 0.2.0
 */

namespace VektorInc\VK_CSS_Optimize;

/**
 * VK CSS Optimize
 */
class VkCssOptimize {

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'customize_register', array( __CLASS__, 'customize_register' ) );
		add_filter( 'css_tree_shaking_exclude', array( __CLASS__, 'tree_shaking_exclude' ) );

		$options = self::get_css_optimize_options();

		if ( ! empty( $options['tree_shaking'] ) ) {
			add_filter( 'wp_using_themes', array( __CLASS__, 'get_html_start' ), 1, 1 );
		}

		if ( ! empty( $options['preload'] ) ) {
			add_filter( 'style_loader_tag', array( __CLASS__, 'css_preload' ), 10, 4 );
		}
		/**
		 * テキストドメイン
		 */
		if ( did_action( 'init' ) ) {
			self::load_text_domain();
		} else {
			add_action( 'init', array( __CLASS__, 'load_text_domain' ) );
		}
	}

	public static function load_text_domain() {
		// We're not using load_plugin_textdomain() or its siblings because figuring out where
		// the library is located (plugin, mu-plugin, theme, custom wp-content paths) is messy.
		$domain = 'css-optimize';
		$locale = apply_filters(
			'plugin_locale',
			( is_admin() && function_exists( 'get_user_locale' ) ) ? get_user_locale() : get_locale(),
			$domain
		);

		$mo_file = $domain . '-' . $locale . '.mo';
		$path    = realpath( dirname( __FILE__ ) . '/languages' );
		if ( $path && file_exists( $path ) ) {
			load_textdomain( $domain, $path . '/' . $mo_file );
		}
	}

	/**
	 * Customize Register
	 *
	 * @param object $wp_customize : wp custommize object .
	 */
	public static function customize_register( $wp_customize ) {

		require_once dirname( __FILE__ ) . '/CustomHtmlControl.php';
		require_once dirname( __FILE__ ) . '/CustomTextControl.php';

		global $prefix_customize_panel;
		$wp_customize->add_section(
			'css_optimize',
			array(
				'title'    => $prefix_customize_panel . __( 'CSS Optimize ( Speed up ) Settings', 'css-optimize' ),
				'priority' => 450,
			)
		);

		// Tree shaking.
		$wp_customize->add_setting(
			'tree_shaking_title',
			array(
				'sanitize_callback' => 'sanitize_text_field',
			)
		);
		$wp_customize->add_control(
			new CustomHtmlControl(
				$wp_customize,
				'tree_shaking_title',
				array(
					'label'            => __( 'Tree shaking', 'css-optimize' ),
					'section'          => 'css_optimize',
					'type'             => 'text',
					'custom_title_sub' => '',
				)
			)
		);

		$wp_customize->add_setting(
			'vk_css_optimize_options[tree_shaking]',
			array(
				'default'           => '',
				'type'              => 'option',
				'capability'        => 'edit_theme_options',
				'sanitize_callback' => 'sanitize_text_field',
			)
		);
		$wp_customize->add_control(
			'vk_css_optimize_options[tree_shaking]',
			array(
				'label'       => __( 'Tree shaking activation settings', 'css-optimize' ),
				'section'     => 'css_optimize',
				'settings'    => 'vk_css_optimize_options[tree_shaking]',
				'type'        => 'select',
				'description' => __( 'Output only the main CSS of the page inline', 'css-optimize' ),
				'choices'     => array(
					''       => __( 'Nothing to do', 'css-optimize' ),
					'active' => __( 'Active Tree shaking (Recomend)', 'css-optimize' ),
				),
			)
		);

		$wp_customize->add_setting(
			'vk_css_optimize_options[tree_shaking_class_exclude]',
			array(
				'default'           => '',
				'type'              => 'option',
				'capability'        => 'edit_theme_options',
				'sanitize_callback' => 'sanitize_text_field',
			)
		);
		$wp_customize->add_control(
			'vk_css_optimize_options[tree_shaking_class_exclude]',
			array(
				'label'       => __( 'Exclude class of Tree shaking', 'css-optimize' ),
				'section'     => 'css_optimize',
				'settings'    => 'vk_css_optimize_options[tree_shaking_class_exclude]',
				'type'        => 'textarea',
				'description' => __( 'If you choose "Active Tree shaking" that delete the useless css.If you using active css class that please fill in class name. Ex) btn-active,slide-active,scrolled', 'css-optimize' ),
			)
		);

		// Preload.
		$wp_customize->add_setting(
			'css_preload_title',
			array(
				'sanitize_callback' => 'sanitize_text_field',
			)
		);
		$wp_customize->add_control(
			new CustomHtmlControl(
				$wp_customize,
				'css_preload_title',
				array(
					'label'            => __( 'Preload CSS', 'css-optimize' ),
					'section'          => 'css_optimize',
					'type'             => 'text',
					'custom_title_sub' => '',
				)
			)
		);

		$wp_customize->add_setting(
			'vk_css_optimize_options[preload]',
			array(
				'default'           => '',
				'type'              => 'option',
				'capability'        => 'edit_theme_options',
				'sanitize_callback' => 'sanitize_text_field',
			)
		);
		$wp_customize->add_control(
			'vk_css_optimize_options[preload]',
			array(
				'label'       => __( 'Preload CSS activation settings', 'css-optimize' ),
				'section'     => 'css_optimize',
				'settings'    => 'vk_css_optimize_options[preload]',
				'description' => __( 'Preload css except for critical css', 'css-optimize' ),
				'type'        => 'select',
				'choices'     => array(
					''       => __( 'Nothing to do', 'css-optimize' ),
					'active' => __( 'Active Preload CSS (Recomend)', 'css-optimize' ),
				),
			)
		);

		$wp_customize->add_setting(
			'vk_css_optimize_options[preload_handle_exclude]',
			array(
				'default'           => '',
				'type'              => 'option',
				'capability'        => 'edit_theme_options',
				'sanitize_callback' => 'sanitize_text_field',
			)
		);
		$wp_customize->add_control(
			'vk_css_optimize_options[preload_handle_exclude]',
			array(
				'label'       => __( 'Exclude class of Preload CSS', 'css-optimize' ),
				'section'     => 'css_optimize',
				'settings'    => 'vk_css_optimize_options[preload_handle_exclude]',
				'type'        => 'textarea',
				'description' => __( 'If you choose "Active Preload CSS" that css load timing was changed.If you have any do not want to preload css file that please fill in handle(id) name. Ex) pluginname_a-style,pluginname_b-css', 'css-optimize' ),
			)
		);

	}

	/**
	 * CSS Optimize Default Options
	 *
	 * @return array $vk_css_optimize_options_default .
	 */
	public static function get_css_optimize_options_default() {
		$vk_css_optimize_options_default = array(
			'tree_shaking' => '',
			'preload'      => '',
		);
		return apply_filters( 'vk_css_optimize_options_default', $vk_css_optimize_options_default );
	}

	/**
	 * CSS Optimize Options
	 * 古いオプションやデフォルト値を結合して返す
	 *
	 * @return array{
	 *   tree_shaking: string,
	 *   tree_shaking_class_exclude: string,
	 *   preload: string
	 *   preload_handle_exclude: string
	 * } $vk_css_optimize_options.
	 */
	public static function get_css_optimize_options() {

		$theme_textdomain = wp_get_theme()->get( 'TextDomain' );

		// CSS高速化を各テーマなどのoption側で保存していた頃の互換処理.
		if ( 'lightning' === $theme_textdomain || 'lightning-pro' === $theme_textdomain ) {
			$old_options = get_option( 'lightning_theme_options' );
		} elseif ( 'katawara' === $theme_textdomain ) {
			$old_options = get_option( 'katawara_theme_options' );
		} else {
			$old_options = get_option( 'vk_blocks_options' );
		}

		$vk_css_optimize_options         = get_option( 'vk_css_optimize_options' );
		$vk_css_optimize_options_default = self::get_css_optimize_options_default();

		// 新しい保存値に保存されていない場合.
		if ( ! isset( $vk_css_optimize_options['tree_shaking'] ) ) {
			// 古い設定がある場合（互換処理）.
			if ( isset( $old_options['optimize_css'] ) ) {
				// 古い設定でCSS最適化が有効だった場合.
				if ( 'optomize-all-css' === $old_options['optimize_css'] || 'tree-shaking' === $old_options['optimize_css'] ) {
					$vk_css_optimize_options['tree_shaking'] = 'active';
				} else {
					$vk_css_optimize_options['tree_shaking'] = '';
				}
			}
		}

		// 除外指定がない場合.
		if ( ! isset( $vk_css_optimize_options['tree_shaking_class_exclude'] ) ) {
			// 古いoption値で除外指定が存在する場合（互換処理）.
			if ( ! empty( $old_options['tree_shaking_class_exclude'] ) ) {
				// 古いoption値に保存されている除外指定を新しいoption値に格納.
				$vk_css_optimize_options['tree_shaking_class_exclude'] = esc_html( $old_options['tree_shaking_class_exclude'] );
			}
		}

		// プリロード指定がない場合.
		if ( ! isset( $vk_css_optimize_options['preload'] ) ) {
			// 古いoption値でプリロード設定が存在する場合（互換処理）.
			if ( isset( $old_options['optimize_css'] ) ) {
				// 古いoption値に保存されているプリロード指定を新しいoption値に格納.
				if ( 'optomize-all-css' === $old_options['optimize_css'] ) {
					$vk_css_optimize_options['preload'] = 'active';
				} else {
					$vk_css_optimize_options['preload'] = '';
				}
			}
		}

		// オプション値に格納するのは不要と見て削除
		// ここで削除している tree_shaking_css や simple_minify_css は古いバージョンで保存されたもので、
		// 不要になったため。2023.6末以降あたり削除で良いと思われる
		// @since 0.2.0 .
		if ( ! empty( $vk_css_optimize_options['tree_shaking_css'] ) || ! empty( $vk_css_optimize_options['simple_minify_css'] ) ) {
			unset( $vk_css_optimize_options['tree_shaking_css'] );
			unset( $vk_css_optimize_options['simple_minify_css'] );
		}

		$vk_css_optimize_options = wp_parse_args( $vk_css_optimize_options, $vk_css_optimize_options_default );

		if (
			! isset( $vk_css_optimize_options['tree_shaking'] ) ||
			! isset( $vk_css_optimize_options['tree_shaking_class_exclude'] ) ||
			! isset( $vk_css_optimize_options['preload'] )
		) {
			update_option( 'vk_css_optimize_options', $vk_css_optimize_options );
		}

		return $vk_css_optimize_options;
	}

	/**
	 * Get HTML Document Start
	 *
	 * @param bool $is_use_themes .
	 * @return $is_use_themes;
	 */
	public static function get_html_start( $is_use_themes ) {
		// template_redirect が呼ばれる前でのみ実行する .
		if ( $is_use_themes && did_action( 'template_redirect' ) === 0 ) {
			// バッファ開始.
			ob_start( 'self::css_tree_shaking_buffer' );
		}
		return $is_use_themes;
	}

	/**
	 * Array of Apply Tree Shaking
	 * Tree Shaking にかけるCSS情報の配列
	 *
	 * @return array $vk_css_tree_shaking_handles.
	 */
	public static function css_tree_shaking_handles() {
		$vk_css_tree_shaking_handles = array();
		$vk_css_tree_shaking_handles = apply_filters( 'vk_css_tree_shaking_handles', $vk_css_tree_shaking_handles );
		return $vk_css_tree_shaking_handles;
	}

	/**
	 * Array of Apply Simple Minify
	 * 単純なCSS最小化にかけるCSS情報の配列
	 *
	 * @return array $vk_css_simple_minify_handles
	 */
	public static function css_simple_minify_handles() {
		$vk_css_simple_minify_handles = array();
		$vk_css_simple_minify_handles = apply_filters( 'vk_css_simple_minify_handles', $vk_css_simple_minify_handles );
		return $vk_css_simple_minify_handles;
	}

	/**
	 * ハンドル名からCSSのパスなどを取得してオプションに保存する
	 *
	 * @return void
	 */
	public static function get_css_minify_array() {

		global $wp_styles;
		$registerd = $wp_styles->registered;

		$css_array             = array(
			'tree_shaking_css'  => array(),
			'simple_minify_css' => array(),
		);
		$tree_shaking_handles  = self::css_tree_shaking_handles();
		$simple_minify_handles = self::css_simple_minify_handles();

		// tree_shaking用の情報を生成.
		if ( ! empty( $tree_shaking_handles ) && is_array( $tree_shaking_handles ) ) {
			foreach ( $tree_shaking_handles as $css_handle ) {
				if ( ! empty( $registerd[ $css_handle ] ) && false !== strpos( $registerd[ $css_handle ]->src, site_url() ) ) {
					$css_array['tree_shaking_css'][ $css_handle ] = array(
						'id'      => $css_handle,
						'url'     => $registerd[ $css_handle ]->src,
						// file_get_content で取得して処理するためCSSのURLをパスに変換.
						'path'    => str_replace( site_url(), ABSPATH, $registerd[ $css_handle ]->src ),
						'version' => $registerd[ $css_handle ]->ver,
						'args'    => $registerd[ $css_handle ]->args,
					);
				}
			}
		}

		// 圧縮用の情報を生成.
		if ( ! empty( $simple_minify_handles ) && is_array( $simple_minify_handles ) ) {
			foreach ( $simple_minify_handles as $css_handle ) {
				if ( ! empty( $registerd[ $css_handle ] && false !== strpos( $registerd[ $css_handle ]->src, site_url() ) ) ) {
					$css_array['simple_minify_css'][ $css_handle ] = array(
						'id'      => $css_handle,
						'url'     => $registerd[ $css_handle ]->src,
						// file_get_content で取得して処理するためCSSのURLをパスに変換.
						'path'    => str_replace( site_url(), ABSPATH, $registerd[ $css_handle ]->src ),
						'version' => $registerd[ $css_handle ]->ver,
						'args'    => $registerd[ $css_handle ]->args,
					);
				}
			}
		}

		return $css_array;
	}

	/**
	 * Change Buffer of HTML Document
	 *
	 * @param string $buffer Gotten HTML Document.
	 * @return $buffer
	 */
	public static function css_tree_shaking_buffer( $buffer ) {

		$css_array = self::get_css_minify_array();

		// Lode Modules.
		// Tree shaking モジュール読み込み .
		require_once dirname( __FILE__ ) . '/class-css-tree-shaking.php';

		// Load CSS Arrays
		// 軽量化するCSSの情報配列読み込み.
		$vk_css_tree_shaking_array  = $css_array['tree_shaking_css'];
		$vk_css_simple_minify_array = $css_array['simple_minify_css'];

		// WP_Filesystem() が使えるように読み込み.
		global $wp_filesystem;
		if ( empty( $wp_filesystem ) ) {
			require_once ABSPATH . '/wp-admin/includes/file.php';
			// KUSANAGI で FTP が使えない場合があるので、FTP が使える場合のみ認証を行う.
			// request_filesystem_credentialsを使って認証情報を取得するように調整.
			// KUSANAGI環境ではFTP_HOST、FTP_USERまでは初期設定でwp-config.phpに書き込まれているが、
			// FTP_PASSは書き込まれていないので、FTP_PASSが定義されている場合のみ認証を行う.
			if ( ( defined( 'FTP_HOST' ) && defined( 'FTP_USER' ) && defined( 'FTP_PASS' ) ) || is_admin() ) {
				// https://developer.wordpress.org/reference/functions/request_filesystem_credentials/ .
				$creds = request_filesystem_credentials( '', '', false, false, null );
			}
			if ( ! empty( $creds ) ) {
				WP_Filesystem( $creds );
			} else {
				WP_Filesystem();
			}
		}

		// href の前のスペースが２つから１つになったので差分を修正
		// (過去のWordPressバージョン対応（5.9くらい？ 6.3 くらいになったら削除OK）).
		$buffer = str_replace(
			'  href',
			' href',
			$buffer
		);

		// CSS Tree Shaking //////////////////////////////////////////// .
		// まずは $buffer から tree shaking で不要なCSSを削除.
		if ( ! empty( $vk_css_tree_shaking_array ) && is_array( $vk_css_tree_shaking_array ) ) {
			foreach ( $vk_css_tree_shaking_array as $vk_css_array ) {

				// CSS を初期化.
				$css = '';

				// 読み込むCSSファイルのパス.
				$path_name = $vk_css_array['path'];
				if ( ! empty( $wp_filesystem ) ) {
					$css = $wp_filesystem->get_contents( $path_name );
				}

				// CSS の中身が取得できた場合のみ Tree Shaking を反映する
				if ( ! empty( $css ) ) {
					// tree shaking を実行して再格納 .
					$css = CSS_tree_shaking::extended_minify( CSS_tree_shaking::simple_minify( $css ), $buffer );

					// ファイルで読み込んでいるCSSを直接出力に置換（バージョンパラメーターあり）.
					$buffer = str_replace(
						'<link rel=\'stylesheet\' id=\'' . $vk_css_array['id'] . '-css\' href=\'' . $vk_css_array['url'] . '?ver=' . $vk_css_array['version'] . '\' type=\'text/css\' media=\'all\' />',
						'<style id=\'' . $vk_css_array['id'] . '-css\' type=\'text/css\'>' . $css . '</style>',
						$buffer
					);

					// ↓↓↓↓↓↓↓↓ 軽微な互換処理（削除しても Fatal error などにはなない）2023.06.30 以降削除可
					// 旧バージョン CSS Optimize ライブラリ が他のプラグインなどで動作していて、preload が実行されている場合
					// Preloadが有効だと以下のように書き換わっているので、Tree shaking が検出できずに効かなくなるので追加対応.
					$buffer = str_replace(
						'<link rel=\'preload\' id=\'' . $vk_css_array['id'] . '-css\' href=\'' . $vk_css_array['url'] . '?ver=' . $vk_css_array['version'] . '\' as=\'style\' onload="this.onload=null;this.rel=\'stylesheet\'"/>',
						'<style id=\'' . $vk_css_array['id'] . '-css\' type=\'text/css\'>' . $css . '</style>',
						$buffer
					);
					// Preloadが有効だとついでに以下も出力されるので削除.
					$search = "<link rel='stylesheet' id='" . $vk_css_array['id'] . "-css' href='" . $vk_css_array['url'] . '?ver=' . $vk_css_array['version'] . "' media='print' onload=\"this.media='all'; this.onload=null;\">\n";
					$buffer = str_replace(
						$search,
						'',
						$buffer
					);
					// ↑↑↑↑↑↑↑↑ 軽微な互換処理（削除しても Fatal error などにはなない）2023.06.30 以降削除可

					// ↓↓↓↓↓↓↓↓↓↓↓ 必要性不明のためコメントアウト 2023.06.30 以降削除可
					// ファイルで読み込んでいるCSSを直接出力に置換（バージョンパラメーターなし）.
					// $buffer = str_replace(
					// '<link rel=\'stylesheet\' id=\'' . $handle . '-css\' href=\'' . $href . '\' media=\'print\' onload=\"this.media=\'all\'; this.onload=null;\">',
					// '',
					// $buffer
					// );
				}
			}
		}

		// CSS Simply Minify //////////////////////////////////////////// .
		// 続いて $buffer から simply minify で CSS を圧縮.
		if ( ! empty( $vk_css_simple_minify_array ) && is_array( $vk_css_simple_minify_array ) ) {
			foreach ( $vk_css_simple_minify_array as $vk_css_array ) {

				// CSS を初期化.
				$css = '';

				// 読み込むCSSファイルのパス.
				$path_name = $vk_css_array['path'];
				if ( ! empty( $wp_filesystem ) ) {
					$css = $wp_filesystem->get_contents( $path_name );
				}

				// CSS の中身が取得できた場合のみ Simply Minify を反映する.
				if ( ! empty( $css ) ) {
					$css = CSS_tree_shaking::simple_minify( $css );

					// ファイルで読み込んでいるCSSを直接出力に置換（バージョンパラメーターあり）.
					$buffer = str_replace(
						'<link rel=\'stylesheet\' id=\'' . $vk_css_array['id'] . '-css\' href=\'' . $vk_css_array['url'] . '?ver=' . $vk_css_array['version'] . '\' type=\'text/css\' media=\'all\' />',
						'<style id=\'' . $vk_css_array['id'] . '-css\' type=\'text/css\'>' . $css . '</style>',
						$buffer
					);
					// ファイルで読み込んでいるCSSを直接出力に置換（バージョンパラメーターなし）.
					$buffer = str_replace(
						'<link rel=\'stylesheet\' id=\'' . $vk_css_array['id'] . '-css\' href=\'' . $vk_css_array['url'] . '\' type=\'text/css\' media=\'all\' />',
						'<style id=\'' . $vk_css_array['id'] . '-css\' type=\'text/css\'>' . $css . '</style>',
						$buffer
					);
				}
			}
		}

		return $buffer;
	}

	/**
	 * Undocumented function
	 *
	 * @param string $tag .
	 * @param string $handle .
	 * @param string $href .
	 * @param string $media .
	 * @return string $tag .
	 */
	public static function css_preload( $tag, $handle, $href, $media ) {

		// Load CSS Arrays
		// 軽量化するCSSの情報配列読み込み.
		$tree_shaking_handles  = self::css_tree_shaking_handles();
		$simple_minify_handles = self::css_simple_minify_handles();

		$exclude_handles = array( 'woocommerce-layout', 'woocommerce-smallscreen', 'woocommerce-general' );

		// tree shaking がかかっているものはpreloadの除外リストに追加する ////////////////////
		// ※ 除外しないと表示時に一瞬崩れて結局実用性に問題があるため.

		if ( ! empty( $tree_shaking_handles ) && is_array( $tree_shaking_handles ) ) {
			foreach ( $tree_shaking_handles as $css_handles ) {
				// ハンドル名をプリロード除外リストに追加.
				$exclude_handles[] = $css_handles;
			}
		}

		// Simple Minify がかかっているものはpreloadから除外する ////////////////////
		// ※ 除外しないと表示時に一瞬崩れて結局実用性に問題があるため.
		if ( ! empty( $simple_minify_handles ) && is_array( $simple_minify_handles ) ) {
			foreach ( $simple_minify_handles as $css_handles ) {
				// ハンドル名をプリロード除外リストに追加.
				$exclude_handles[] = $css_handles;
			}
		}

		// プリロードから除外するCSSハンドルが option で保存されている場合.
		if ( ! empty( $options['preload_handle_exclude'] ) ) {
			// 保存されているされている除外するCSSハンドルを配列に変換.
			$exclude_array = explode( ',', $options['preload_handle_exclude'] );
			// 除外するCSSハンドルの配列をマージ.
			$exclude_handles = array_merge( $exclude_array, $exclude_handles );
		}

		$exclude_handles = apply_filters( 'vk_css_preload_exclude_handles', $exclude_handles );

		// クリティカルじゃないCSS（tree shakingにかけているもの以外）をpreload .
		if ( ! in_array( $handle, $exclude_handles ) ) {
			// preload を追加する.
			$tag  = "<link rel='preload' id='" . $handle . "-css-preload' href='" . $href . "' as='style' onload=\"this.onload=null;this.rel='stylesheet'\"/>\n";
			$tag .= "<link rel='stylesheet' id='" . $handle . "-css' href='" . $href . "' media='print' onload=\"this.media='all'; this.onload=null;\">\n";
		}

		return $tag;
	}


	/**
	 * Exclude CSS.
	 *
	 * @param string $inidata exclude css class.
	 */
	public static function tree_shaking_exclude( $inidata ) {
		$options = self::get_css_optimize_options();

		$exclude_classes_array = array();

		if ( ! empty( $options['tree_shaking_class_exclude'] ) ) {

			// delete before after space.
			$exclude_clssses = trim( $options['tree_shaking_class_exclude'] );

			// convert tab and br to space.
			$exclude_clssses = preg_replace( '/[\n\r\t]/', '', $exclude_clssses );

			// Change multiple spaces to single space.
			$exclude_clssses       = preg_replace( '/\s/', '', $exclude_clssses );
			$exclude_clssses       = str_replace( '，', ',', $exclude_clssses );
			$exclude_clssses       = str_replace( '、', ',', $exclude_clssses );
			$exclude_classes_array = explode( ',', $exclude_clssses );

		}

		$inidata['class'] = array_merge( $inidata['class'], $exclude_classes_array );

		return $inidata;
	}

}
