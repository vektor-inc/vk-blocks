<?php


class VkBlocksLatestPosts{

	/**
	 * Return html to display latest post list.
	 *
	 * @param $attributes
	 *
	 * @return string
	 */
	public function render_latest_posts( $attributes ) {

		$layout            = $attributes['layout'];
		$layoutClass = '';
		//プルダウンの値によってデザインのクラスを変更
		if ( $layout === 'image_1st' ) {
			$layoutClass = 'image_1st';
		} elseif ( $layout === 'image_2st' ) {
			$layoutClass = 'image_2st';
		}

		$wp_query = $this->get_loop_query( $attributes );
		return $wp_query;

		$elm = '';
//
//		if ( $wp_query->have_posts() ) :
//			$elm .= '<div class="vk_latestPosts">';
//			$elm .= '<ul class=' . $layoutClass . '>';
//			while ( $wp_query->have_posts() ) {
//				$wp_query->the_post();
//				$elm .= '<li>';
//				$elm .= '<li>' . get_the_title() . '</li>';
////				$elm .= $this->get_loop_post_view($wp_query->post);
//				$elm .= '</li>';
//			} // while ( have_posts() ) {
//			$elm .= '</ul>';
//			$elm .= '</div>';
//		endif;

		wp_reset_query();
		wp_reset_postdata();

		return $elm;
	}

	private function isArrayExist( $array ) {
		if ( ! $array ) {
			return false;
		}
	}

	/**
	 * Get array of checked posttype as args. Ex, array(post => true, page = false, attachment = true);
	 * Return array of posttype which value is true. array(post,attachment);
	 *
	 * @param $isCheckedPostType
	 *
	 * @return array|bool
	 */
	public function formatPostTypeToQuery( $isCheckedPostType ) {

		$this::isArrayExist( $isCheckedPostType );
		$return = [];

		foreach ( $isCheckedPostType as $key => $value ) {

			if ( $value ) {
				array_push( $return, $key );
			}
		}

		return $return;
	}

	public function formatToTaxonomyQuery( $coreTerms ) {

		$this::isArrayExist( $coreTerms );
		$return = "";

		foreach ( $coreTerms as $key => $value ) {

			if ( $value ) {
				$return = + $key . ",";
			}
		}

		return $return;

	}

	public function get_loop_query( $attributes ) {

		$isCheckedPostType = json_decode( $attributes['isCheckedPostType'], true );
		$coreTerms = json_decode( $attributes['coreTerms'], true );


		// $count      = ( isset( $instance['count'] ) && $instance['count'] ) ? $instance['count'] : 10;
		$args = array(
			'post_type'      => $this::formatPostTypeToQuery( $isCheckedPostType ),
			'category_name'  => $this::formatToTaxonomyQuery( $coreTerms ),
			'paged'          => 1,
			'posts_per_page' => $attributes['numberPosts'],
		);

		$result = var_export($args, true);

//		'category_name=staff,news'

		// if ( $instance['format'] ) {
		// 	$this->_taxonomy_init( $post_type ); }
		//
		// if ( isset( $instance['terms'] ) && $instance['terms'] ) {
		// 	$taxonomies          = get_taxonomies( array() );
		// 	$args['tax_query'] = array(
		// 		'relation' => 'OR',
		// 	);
		// 	$terms_array         = explode( ',', $instance['terms'] );
		// 	foreach ( $taxonomies as $taxonomy ) {
		// 		$args['tax_query'][] = array(
		// 			'taxonomy' => $taxonomy,
		// 			'field'    => 'id',
		// 			'terms'    => $terms_array,
		// 		);
		// 	}
		// }

		$wp_query = new WP_Query( $args );


		// if ( have_posts() ) :
		// 	$layout = $instance['format'];
		// 	Ltg_Media_Post_View::post_loop( $layout, $instance );
		// endif;
		return $result;
	}


	public function get_loop_post_view( $post ) {
		$elm          = '';
		$elm         .= '<div class="card" id="post-' . get_the_ID() . '">' . "\n";
		$thumbnail_id = get_post_thumbnail_id( $post->ID );
		if ( $thumbnail_id ) {
			$thumbnail_src  = wp_get_attachment_image_src( $thumbnail_id, 'large' );
			$thumbnail_src  = $thumbnail_src[0];
			$class_no_image = '';
		} else {
			// $thumbnail_src  = VK_MEDIA_POSTS_URL . 'images/no-image.png';
			$thumbnail_src  = 'images/no-image.png';
			$class_no_image = ' noimage';
		}
		// $elm      .= '<div class="card-img-top' . $class_no_image . '" style="background-image:url(' . $thumbnail_src . ');">' . "\n";
		$attr = array(
			// 'src'   => $src,  // アイキャッチ画像の URL
			'class' => 'card-img-top',    // 指定した大きさ
			// 'alt'   => trim( strip_tags( $attachment->post_excerpt ) ),	// アイキャッチ画像の抜粋
			// 'title' => trim( strip_tags( $attachment->post_title ) ),	// アイキャッチ画像のタイトル
		);
		$thumbnail = get_the_post_thumbnail( $post->ID, 'media_thumbnail', $attr );
		$elm      .= ( $thumbnail ) ? $thumbnail : '<img class="card-img-top" src="' . $thumbnail_src . '" alt="NO IMAGE" />';
		$elm      .= '<a href="' . esc_url( get_the_permalink() ) . '">' . "\n";

		// $elm      .= '</div>';
		// ※アーカイブページの場合はこのメソッドが呼び出される時点で instance に数字が入っているで、ここの数字を変更しても反映されない
		$days  = isset( $instance['new_icon_display'] ) ? $instance['new_icon_display'] : 7; //Newを表示させたい期間の日数
		$today = date_i18n( 'U' );
		$entry = get_the_time( 'U' );
		$kiji  = date( 'U', ( $today - $entry ) ) / 86400;
		if ( $days > $kiji ) {
			$elm .= '<div class="media_post_label_new">NEW</div>';
		}

		$elm       .= '<div class="media_post_text">' . "\n";
		$elm       .= '<div class="media_post_meta">' . "\n";
		$elm       .= '<span class="published media_post_date">' . esc_html( get_the_date() ) . '</span>';
		$taxonomies = get_the_taxonomies();
		if ( $taxonomies ) :
			// get $taxonomy name
			$taxonomy   = key( $taxonomies );
			$terms      = get_the_terms( get_the_ID(), $taxonomy );
			$term_name  = esc_html( $terms[0]->name );
			$term_color = Vk_term_color::get_term_color( $terms[0]->term_id );
			$term_color = ( $term_color ) ? ' style="background-color:' . $term_color . '"' : '';
			$elm       .= '<span class="media_post_term"' . $term_color . '>' . $term_name . '</span>';
		endif;
		$elm .= '<span class="vcard author"><span class="fn">' . get_the_author() . '</span></span>';
		$elm .= '</div>' . "\n"; // entry-meta
		$elm .= '<h4 class="media_post_title">' . esc_html( get_the_title() ) . '</h4>';
		$elm .= '<p class="media_post_excerpt">' . esc_html( get_the_excerpt() ) . '</p>';
		$elm .= '</div>';
		$elm .= '</a>';
		$elm .= '</div>';
		return $elm;
	}
}


/**
 * Gutenberg Callback function.
 *
 * @param $attributes
 *
 * @return string
 */
function vk_blocks_render_latest_posts( $attributes ) {

	$LatestPosts = new VkBlocksLatestPosts();

	return $LatestPosts->render_latest_posts( $attributes );

}
