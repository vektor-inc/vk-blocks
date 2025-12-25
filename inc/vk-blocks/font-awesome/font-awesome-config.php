<?php
/**
 * VK Blocks Font Awesome
 *
 * @package vk_blocks
 */

use VektorInc\VK_Font_Awesome_Versions\VkFontAwesomeVersions;

/*
 * Font Awesome Load modules
 */
if ( ! class_exists( 'Vk_Font_Awesome_Versions' ) ) {
	if ( ! vk_blocks_is_lightning() ) {
		new VkFontAwesomeVersions();
		global $font_awesome_directory_uri;
		// phpcs:ignore
		$font_awesome_directory_uri = VK_BLOCKS_DIR_URL . 'vendor/vektor-inc/font-awesome-versions/src/';
	}
}

/*
 * Font Awesome API Load modules
 */
if ( ! class_exists( 'VK_Blocks_Font_Awesome_API' ) ) {
	require_once __DIR__ . '/class-vk-blocks-font-awesome-api.php';
	new VK_Blocks_Font_Awesome_API();
}

/**
 * Font Awesome のアイコンの URL を渡す
 */
function vk_blocks_font_awesome_init() {
	$options          = VkFontAwesomeVersions::get_option_fa();
	$fa_version       = is_array( $options ) && ! empty( $options['version'] ) ? $options['version'] : $options;
	$fa_compatibility = is_array( $options ) && ! empty( $options['compatibility'] ) ? $options['compatibility'] : array();
	$fa_icon_url      = '';
	$fa_family        = '';
	if ( '7_WebFonts_CSS' === $fa_version || '7_SVG_JS' === $fa_version ) {
		$fa_icon_url = 'https://fontawesome.com/search?ic=free-collection';
		$fa_family   = 'Font Awesome 7 Free';
	}

	$choice_array = VkFontAwesomeVersions::versions();

	$font_awesome_versions = array();

	foreach ( $choice_array as $key => $value ) {
		$font_awesome_versions[] = array(
			'label' => $value['label'],
			'value' => $key,
		);
	}

	wp_localize_script(
		'vk-blocks-build-js',
		'vkFontAwesome',
		array(
			'iconsUrl'       => $fa_icon_url,
			'iconFamily'     => $fa_family,
			'versions'       => $font_awesome_versions,
			'currentVersion' => array(
				'version'       => $fa_version,
				'compatibility' => $fa_compatibility,
			),
		)
	);
}
add_action( 'init', 'vk_blocks_font_awesome_init' );
