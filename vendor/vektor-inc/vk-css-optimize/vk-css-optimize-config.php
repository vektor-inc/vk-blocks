<?php
/**
 * VK CSS Tree Shaking Config
 *
 * @package Katawara
 */

global $prefix_customize_panel;
$prefix_customize_panel = '';

/**
 * Optimize CSS.
 */

if ( ! class_exists( 'VK_CSS_Optimize' ) ) {
	require_once dirname( __FILE__ ) . '/package/class-vk-css-optimize.php';
}

function Katawara_css_tree_shaking_array( $vk_css_tree_shaking_array ){
	$Katawara_style_array = array(
		'id'      => 'katawara-design-style',
		'url'     => get_template_directory_uri() . '/assets/css/style.min.css',
		'path'    => get_parent_theme_file_path( '/assets/css/style.min.css' ),
		'version' => KATAWARA_THEME_VERSION,
	);
	array_push( $vk_css_tree_shaking_array, $Katawara_style_array );
	return $vk_css_tree_shaking_array;
}
add_filter( 'vk_css_tree_shaking_array', 'Katawara_css_tree_shaking_array' );
	
/**
 * 
 * CSS Tree Shaking Exclude
 *
 * @param array $inidata CSS Tree Shaking Exclude Paramator.
 */
function katawara_css_tree_shaking_exclude_class( $inidata ) {
	$exclude_classes_array = array(
		'customize-partial-edit-shortcut',
		'card',
		'card-noborder',
		'card-imageRound',
		'vk_posts',
		'vk_post-col-xs-12',
		'vk_post-col-xs-6',
		'vk_post-col-xs-4',
		'vk_post-col-xs-3',
		'vk_post-col-xs-2',
		'vk_post-col-sm-12',
		'vk_post-col-sm-6',
		'vk_post-col-sm-4',
		'vk_post-col-sm-3',
		'vk_post-col-sm-2',
		'vk_post-col-lg-12',
		'vk_post-col-lg-6',
		'vk_post-col-lg-4',
		'vk_post-col-lg-3',
		'vk_post-col-lg-2',
		'vk_post-col-xl-12',
		'vk_post-col-xl-6',
		'vk_post-col-xl-4',
		'vk_post-col-xl-3',
		'vk_post-col-xl-2',
		'vk_post-btn-display',
	);
	$inidata['class']      = array_merge( $inidata['class'], $exclude_classes_array );

	return $inidata;
}
add_filter( 'css_tree_shaking_exclude', 'katawara_css_tree_shaking_exclude_class' );
