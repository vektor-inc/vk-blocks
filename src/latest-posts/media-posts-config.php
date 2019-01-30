<?php
/*-------------------------------------------*/
/*  Load modules
/*-------------------------------------------*/
if ( ! class_exists( 'Lightning_media_posts' ) ) {

	require_once( 'media-posts/class-media-posts.php' );

	global $system_name;
	$system_name = lightning_get_theme_name();

	global $customize_section_name;
	if ( function_exists( 'lightning_get_prefix_customize_panel' ) ) {
		// 空のパネル名を設定出来るように最後に空白は入れない
		$customize_section_name = lightning_get_prefix_customize_panel();
	} else {
		$customize_section_name = 'Lightning ';
	}

	// プリフィックス
	global $vk_media_post_prefix;
	$vk_media_post_prefix = lightning_get_prefix();

	/*
	メディアポストのCSSはデフォルトでは読み込まれない。common.cssに結合してある。
	もし個別で出力する場合は下記フックを使用する。
	*/
	// add_filter( 'lightning_print_media_posts_css_custom', 'ltg_pro_print_media_posts_css' );
	// function ltg_pro_print_media_posts_css( $print_css_default ) {
	// 	$print_css_default = true;
	// 	return $print_css_default;
	// }
}
