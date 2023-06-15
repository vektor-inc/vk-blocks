<?php
/**
 * VK Swiper
 *
 * @package vektor-inc/vk-swiper
 * @license GPL-2.0+
 *
 * @version 0.3.1
 */

namespace VektorInc\VK_Swiper;

// Set version number.
const SWIPER_VERSION = '9.3.2';

/**
 * VK Swiper
 */
class VkSwiper {
	/**
	 * Init
	 */
	public function __construct() {
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'register_swiper' ) );
		add_filter( 'vk_css_simple_minify_handles', array( __CLASS__, 'css_simple_minify_handles' ) );
	}

	/**
	 * Change Path to URL
	 * 
	 * @param string File Path.
	 */
	public static function get_directory_uri( $path ) {

		$uri = '';

		// PATH を正規化
		$path = wp_normalize_path( $path );

		// ファイルのパスの wp-content より前の部分を site_url() に置換する
		// ABSPATH の部分を site_url() に置換したいところだが、ABSPATHは WordPress.com で /wordpress/core/5.9.3/ のような返し方をされて、一般的なサーバーのパスとは異なるので、置換などには使用しない.
		preg_match( '/(.*)(wp-content.*)/', $path, $matches, PREG_OFFSET_CAPTURE );
		if ( ! empty( $matches[2][0] ) ) {
			$uri = site_url( '/' ) . $matches[2][0] . '/';
		}

		return $uri;
	}

	/**
	 * Load Swiper
	 */
	public static function register_swiper() {
		$current_url  = self::get_directory_uri( dirname( __FILE__ ) );
		wp_register_style( 'vk-swiper-style', $current_url . '/assets/css/swiper-bundle.min.css', array(), SWIPER_VERSION );
		wp_register_script( 'vk-swiper-script', $current_url . '/assets/js/swiper-bundle.min.js', array(), SWIPER_VERSION, true );
	}

	/**
	 * Enque Swiper
	 * テーマなどの vk-swiper/config.php から必要に応じて読み込む
	 */
	public static function enqueue_swiper() {
		add_action(
			'wp_enqueue_scripts',
			function() {
				wp_enqueue_style( 'vk-swiper-style' );
				wp_enqueue_script( 'vk-swiper-script' );
			}
		);
	}

	/**
	 * Simple Minify Array
	 */
	public static function css_simple_minify_handles( $vk_css_simple_minify_handles ) {

		// Register common css.
		$vk_css_simple_minify_handles [] = 'vk-swiper-style';		
		return $vk_css_simple_minify_handles;

	}
}
