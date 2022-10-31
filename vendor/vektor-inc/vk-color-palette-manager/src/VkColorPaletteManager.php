<?php //phpcs:ignore
/**
 * VK_Color_Palette_Manager
 *
 * @package vektor-inc/vk-color-palette-manager
 * @license GPL-2.0+
 *
 * @version 0.4.0
 */

namespace VektorInc\VK_Color_Palette_Manager;

use WP_Customize_Color_Control;
use VK_Custom_Html_Control;

/**
 * VK_Color_Palette_Manager
 */
class VkColorPaletteManager {

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'customize_register', array( __CLASS__, 'customize_register' ) );
		if ( self::is_lager_than_wp('6.1') ) {
			add_filter( 'wp_theme_json_data_default', array( __CLASS__, 'filter_theme_json_theme' ) );
		} else {
			// Cope with before WP6.1.
			add_filter( 'block_editor_settings_all', array( __CLASS__, 'additional_color_palette' ), 10, 2 );
			// 11 指定が無いと先に読み込んでしまって効かない
			add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'add_color_palette_css_to_editor' ), 11 );
		}
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'add_color_palette_css' ), 11 );
		load_textdomain( 'vk-color-palette-manager', dirname( __FILE__ ) . '/languages/vk-color-palette-manager-' . get_locale() . '.mo' );
	}

	/**
	 *  Is Larger than WP
	 *
	 * @param string $target_version Target version.
	 */
	public static function is_lager_than_wp( $target_version ){
		global $wp_version;
		// バージョンにハイフンを含んでいる場合（ RC / beta 版の場合）ハイフンより前の数値だけに変換
		$_wp_version = strpos( $wp_version, '-' ) !== false ? strstr( $wp_version, '-', true ) : $wp_version;
		return version_compare( $_wp_version, $target_version, '>=' );
	}

	/**
	 * Customizer
	 *
	 * @param object $wp_customize : customize object.
	 */
	public static function customize_register( $wp_customize ) {

		if ( class_exists( 'VK_Custom_Html_Control' ) ) {
			$wp_customize->add_setting(
				'color_palette_title',
				array(
					'sanitize_callback' => 'sanitize_text_field',
				)
			);
			$wp_customize->add_control(
				new VK_Custom_Html_Control(
					$wp_customize,
					'color_palette_title',
					array(
						'label'            => '',
						'section'          => 'colors',
						'type'             => 'text',
						'custom_title_sub' => __( 'Color Palette Setting', 'vk-color-palette-manager' ),
						'custom_html'      => __( 'This color is reflected in the block editor\'s color palette.', 'vk-color-palette-manager' ),
						'priority'         => 1000,
					)
				)
			);
		}

		for ( $i = 1; $i <= 5; $i++ ) {
			$wp_customize->add_setting(
				'vk_color_manager_options[color_custom_' . $i . ']',
				array(
					'default'           => '',
					'type'              => 'option',
					'capability'        => 'edit_theme_options',
					'sanitize_callback' => 'sanitize_hex_color',
				)
			);
			$label = __( 'Custom color', 'vk-color-palette-manager' ) . ' ' . $i;
			$wp_customize->add_control(
				new WP_Customize_Color_Control(
					$wp_customize,
					'vk_color_manager_options[color_custom_' . $i . ']',
					array(
						'label'    => $label,
						'section'  => 'colors',
						'settings' => 'vk_color_manager_options[color_custom_' . $i . ']',
						'priority' => 1000,
					)
				)
			);
		}
	}

	/**
	 * Filter 'wp_theme_json_data_default'
	 *
	 * @param object $theme_json : theme_json object.
	 */
	public static function filter_theme_json_theme( $theme_json ){
		$get_data  = $theme_json->get_data();
		$add_color = self::add_color_array();
		$add_data  = array_merge(
			$get_data["settings"]["color"]["palette"]["default"],
			$add_color
		);
		$new_data = array(
			'version'  => 2,
			'settings' => array(
				'color' => array(
					'palette' => $add_data,
				),
			),
		);
		return $theme_json->update_with( $new_data );
	}

	/**
	 * Additional color palette array
	 */
	public static function add_color_array() {
		$options_color       = get_option( 'vk_color_manager_options' );
		$vcm_add_color_array = array();
		if ( $options_color ) {
			for ( $i = 1; $i <= 5; $i++ ) {
				if ( ! empty( $options_color[ 'color_custom_' . $i ] ) ) {
					$vcm_add_color_array[] = array(
						'name'  => __( 'Custom color', 'vk-color-palette-manager' ) . ' ' . $i,
						'slug'  => 'vk-color-custom-' . $i,
						'color' => $options_color[ 'color_custom_' . $i ],
					);
				}
			}
		}
		return apply_filters( 'vcm_add_color_array', $vcm_add_color_array );
	}

	/**
	 * Add color palettes
	 *
	 * @param array $editor_settings : editor_settings.
	 * @param array $block_editor_context : block_editor_context.
	 * @return array $editor_settings :  editor_settings.
	 */
	public static function additional_color_palette( $editor_settings, $block_editor_context ) {
		$add_color = self::add_color_array();
		if ( ! empty( $add_color ) ) {
			if ( ! empty( $editor_settings['__experimentalFeatures']['color']['palette']['default'] ) ) {
				$editor_settings['__experimentalFeatures']['color']['palette']['default'] = array_merge(
					$editor_settings['__experimentalFeatures']['color']['palette']['default'],
					$add_color
				);
			} elseif ( ! empty( $editor_settings['__experimentalFeatures']['color']['palette']['core'] ) ) {
				$editor_settings['__experimentalFeatures']['color']['palette']['core'] = array_merge(
					$editor_settings['__experimentalFeatures']['color']['palette']['core'],
					$add_color
				);
			} else {
				$editor_settings['__experimentalFeatures']['color']['palette']['default'] = $add_color;
				$editor_settings['__experimentalFeatures']['color']['palette']['core']    = $add_color;
			}
			$editor_settings['colors'] = array_merge(
				$editor_settings['colors'],
				$add_color
			);
		}
		return $editor_settings;
	}

	/**
	 * Create color palettes css
	 *
	 * @return string
	 */
	public static function inline_css() {
		$options_color = get_option( 'vk_color_manager_options' );
		$colors        = self::add_color_array();

		$dynamic_css = '/* VK Color Palettes */';
		foreach ( $colors as $key => $color ) {
			if ( ! empty( $color['color'] ) ) {
				// 色はこのクラスでだけの利用なら直接指定でも良いが、他のクラス名で応用できるように一旦css変数に格納している.
				// 6.1より画像ブロックなどでインラインでstyle="border-top-color:var(--wp--preset--color--$slug);"が入るため変数名をコアに合わせる.
				$dynamic_css .= ':root{ --wp--preset--color--' . $color['slug'] . ':' . $color['color'] . '}';
				// 古いCSS変数名のフォールバック.
				$dynamic_css .= '/* --' . $color['slug'] . ' is deprecated. */';
				$dynamic_css .= ':root{ --' . $color['slug'] . ': var(--wp--preset--color--' . $color['slug'] . ');}';
				if ( ! self::is_lager_than_wp( '6.1' ) ) {
					$dynamic_css .= '.has-' . $color['slug'] . '-color { color:var(--wp--preset--color--' . $color['slug'] . ') !important; }';
					$dynamic_css .= '.has-' . $color['slug'] . '-background-color { background-color:var(--wp--preset--color--' . $color['slug'] . ') !important; }';
					$dynamic_css .= '.has-' . $color['slug'] . '-border-color { border-color:var(--wp--preset--color--' . $color['slug'] . ') !important; }';
				}
			}
		}

		// Delete before after space.
		$dynamic_css = trim( $dynamic_css );
		// Convert tab and br to space.
		$dynamic_css = preg_replace( '/[\n\r\t]/', '', $dynamic_css );
		// Change multiple spaces to single space.
		$dynamic_css = preg_replace( '/\s(?=\s)/', '', $dynamic_css );
		return $dynamic_css;
	}

	/**
	 * Add front css
	 *
	 * @return void
	 */
	public static function add_color_palette_css() {
		$dynamic_css = self::inline_css();
		wp_add_inline_style( 'wp-block-library', $dynamic_css );
	}

	/**
	 * Add editor css
	 *
	 * @return void
	 */
	public static function add_color_palette_css_to_editor() {
		$dynamic_css = self::inline_css();
		wp_add_inline_style( 'wp-edit-blocks', $dynamic_css, 11 );
	}

}
