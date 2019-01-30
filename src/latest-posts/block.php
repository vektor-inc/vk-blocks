<?php
require_once (dirname(__FILE__).'/media-posts/views/class-loop-post-view.php');

function vk_blocks_render_latest_posts( $attributes ) {

	$layout = $attributes['layout'];
	$numberPosts = $attributes['numberPosts'];

	if ( class_exists( 'Ltg_Media_Post_View' ) ) {
		$Ltg_Media_Post_View = new Ltg_Media_Post_View();
		$elm = $Ltg_Media_Post_View::post_loop('image_1st','');
	}

	return $elm;
}
