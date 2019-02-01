<?php

function vk_blocks_render_latest_posts( $attributes ) {

	$layout = $attributes['layout'];
	$numberPosts = $attributes['numberPosts'];

	$layoutClass = '';

	//プルダウンの値によってデザインのクラスを変更
	if($layout === 'image_1st'){
		$layoutClass = 'image_1st';
	}elseif ($layout === 'image_2st'){
		$layoutClass = 'image_1st';
	}

	$elm = '';
	$elm .= '<ul class='. $layoutClass .'>';
	$elm .= '<li>';
    $elm .= '<h2>Posts Recentes</h2>';
    $elm .= '<ul>';

      $number_recent_posts = $numberPosts;  // 必要な件数を指定します
      $recent_posts = wp_get_recent_posts( $number_recent_posts );
      foreach($recent_posts as $post){
	      $elm .= '<li><a href="' . get_permalink($post["ID"]) . '" title="Look '.$post["post_title"].'" >' .   $post["post_title"].'</a> </li> ';
      }
	$elm .= '</ul>';
	$elm .= '</li>';
	$elm .='</ul>';

	return $elm;
}