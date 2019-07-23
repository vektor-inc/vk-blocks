<?php

/**
 * Trim excerpt text. less than 90 words
 * @param $post
 *
 * @return mixed|string|void
 */
function vkblocks_child_page_excerpt( $post ) {

	// そもそも post_excerpt が存在しなかったらreturn（ $post自体が正しく受け取れてない ）
	if ( ! isset( $post->post_excerpt ) ) {
		return; }

	// 抜粋を取得
	$page_excerpt = nl2br( esc_textarea( strip_tags( $post->post_excerpt ) ) );

	// 抜粋欄が未入力だった場合（本文欄の内容を引っ張る）
	if ( ! $page_excerpt ) {

		// 本文欄から取得し、タグを除去
		$page_excerpt = esc_textarea( strip_tags( $post->post_content ) );

		if ( 90 < mb_strlen( $page_excerpt ) ) {
			// 90文字でトリム
			$page_excerpt = mb_substr( $page_excerpt, 0, 90 );
			// ... を追加
			$page_excerpt .= '...';

		}
	}
	$page_excerpt = str_replace( PHP_EOL, '', $page_excerpt );
	return $page_excerpt;
}

/**
 * @param $currentPageId
 *
 * @return bool|string
 */
function vkblocks_render_child_page($currentPageId) {

	$my_wp_query = new WP_Query();
	$all_wp_pages = $my_wp_query->query( array(
		'post_type' => 'page',
		'nopaging'  => 'true'
	) );

    // すべての固定ページから指定されたIDの子ページを探す
	$childrens = get_page_children( $currentPageId, $all_wp_pages );

	if ( empty( $childrens ) ) {
		return vkblocks_render_no_child_page();
	}

	$childPageList_html = PHP_EOL . '<div class="vkblocks_childPage_list">' . PHP_EOL;
	foreach ( $childrens as $children ) :

		$postExcerpt = vkblocks_child_page_excerpt( $children );

		// Page Item build
		$childPageList_html .= '<a href="' . esc_url( get_permalink( $children->ID ) ) . '" class="childPage_list_box"><div class="childPage_list_box_inner">';
		$childPageList_html .= '<h3 class="childPage_list_title">' . esc_html( strip_tags( $children->post_title ) ) . '</h3>';
		$childPageList_html .= '<div class="childPage_list_body">';
		$childPageList_html .= apply_filters( 'vkblocks_child_index_thumbnail', get_the_post_thumbnail( $children->ID, 'thumbnail' ) );
		$childPageList_html .= '<p class="childPage_list_text">' . $postExcerpt . '</p>';
		$childPageList_html .= '<span class="childPage_list_more btn btn-primary btn-xs">' . apply_filters( 'vkblocks_childPage_list_read_more_txt', __( 'Read more', 'vk-blocks' ) ) . '</span>';
		$childPageList_html .= '</div>';

		$childPageList_html .= '</div></a>' . PHP_EOL;
	endforeach;

	$childPageList_html .= PHP_EOL . '</div><!-- [ /.vkblocks_childPage_list ] -->' . PHP_EOL;
	wp_reset_query();

	return $childPageList_html;
}

function vkblocks_render_no_child_page(){
	wp_reset_query();
	return '<div>' . __( 'There is no child page.', 'vk-blocks' ) . '</div>';
}
