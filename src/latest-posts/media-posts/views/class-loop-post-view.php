<?php
require_once (dirname(__FILE__).'/class.term-color.php');

//VK_MEDIA_POSTS_URL
define( 'VK_MEDIA_POSTS_URL_VKB', plugin_dir_url( __FILE__ ) );

if ( ! class_exists( 'Ltg_Media_Post_View' ) ) {

	class Ltg_Media_Post_View {


		public static function post_loop( $layout, $instance ) {

			$patterns = array(
				'image_1st'            => array(
					'label'       => __( 'Image card 1st feature', 'lightning-pro' ),
					'class_outer' => 'image_1st',
					// 1stは２件目以降とpostのクラスが異なるためここに値が無い
				),
				'image_3'              => array(
					'label'            => __( 'Image card 3 colmun', 'lightning-pro' ),
					'class_outer'      => 'row image_3 flex_height',
					'class_post_outer' => 'col-sm-6 col-md-4 col-lg-4 flex_height_col',
					'class_post_item'  => ' image_card',
				),
				'image_1'              => array(
					'label'            => __( 'Image card 1 colmun', 'lightning-pro' ),
					'class_outer'      => 'row image_1',
					'class_post_outer' => 'col-sm-12',
					'class_post_item'  => ' image_card',
				),
				'vert_3'               => array(
					'label'            => __( 'Vertical card 3 column', 'lightning-pro' ),
					'class_outer'      => 'row vert_3 flex_height',
					'class_post_outer' => 'col-sm-6 col-md-4 col-lg-4 flex_height_col',
					'class_post_item'  => ' vertical_card normal_image',
				),
				'vert_1'               => array(
					'label'            => __( 'Vertical card 1 column', 'lightning-pro' ),
					'class_outer'      => 'row vert_1',
					'class_post_outer' => 'col-sm-12',
					'class_post_item'  => ' vertical_card normal_image',
				),
				'vert_large_image_3'   => array(
					'label'            => __( 'Vertical card large image 3 column', 'lightning-pro' ),
					'class_outer'      => 'row vert_large_image_3 flex_height',
					'class_post_outer' => 'col-sm-6 col-md-4 col-lg-4 flex_height_col',
					'class_post_item'  => ' vertical_card large_image',
				),
				'vert_large_image_1'   => array(
					'label'            => __( 'Vertical card large image 1 column', 'lightning-pro' ),
					'class_outer'      => 'row vert_large_image_1',
					'class_post_outer' => 'col-sm-12',
					'class_post_item'  => ' vertical_card large_image',
				),
				'oblong_1'             => array(
					'label'            => __( 'Oblong card 1 column', 'lightning-pro' ),
					'class_outer'      => 'row oblong_1',
					'class_post_outer' => 'col-sm-12',
					'class_post_item'  => ' oblong_card normal_image',
				),
				'oblong_large_image_1' => array(
					'label'            => __( 'Oblong card large image 1 column', 'lightning-pro' ),
					'class_outer'      => 'row oblong_large_image_1',
					'class_post_outer' => 'col-sm-12',
					'class_post_item'  => ' oblong_card large_image',
				),
			);

			$elm = '<div class="' . $patterns[ $layout ]['class_outer'] . '">';
			if ( $layout == 'image_1st' ) {
				global $wp_query;
				$count = 1;
				/*
				1 左
				2 右
				3 右
				4 左 +
				5 左
				6 右
				7 左 +
				8 左
				9 右
				4 と 4に3の倍数を足した数の場合は改行
				*/

				while ( have_posts() ) :
					the_post();
					$media_post_class = ( $count == 1 ) ? ' image_card first' : ' image_card normal';

					if ( ( $count % 3 ) != 0 && $count != 2 ) {
						$media_post_class .= ' left';
					}
					if (
						$count == 4 ||
						( ( $count - 4 ) % 3 == 0 )
						) {
						$media_post_class .= ' clear';
					}
//					$elm .= Ltg_Media_Post_View::media_post_item( $media_post_class, $instance,$elm );
					$elm .= Ltg_Media_Post_View::media_post_item( $media_post_class,$elm );
					$count++;
				endwhile;
			}
//			else {
//				while ( have_posts() ) :
//					the_post();
//					$elm .= '<div class="' . $patterns[ $layout ]['class_post_outer'] . '">';
//					$elm .= Ltg_Media_Post_View::media_post_item( $patterns[ $layout ]['class_post_item'], $instance,$elm );
//					$elm .= '</div>';
//				endwhile;
//			}
			$elm .= '</div>';

			return $elm;
		}

//		public static function media_post_item( $media_post_class, $instance = '',$elm ) {
		public static function media_post_item( $media_post_class,$elm ) {

			$elm .= 'Hello';
			return $elm;

			global $post;
			$elm .= '<article class="media_post media_post_base' . $media_post_class . '" id="post-' . get_the_ID() . '">' . "\n";
			$elm .= '<a href="' . esc_url( get_the_permalink() ) . '">' . "\n";
			$thumbnail_id = get_post_thumbnail_id( $post->ID );
			if ( $thumbnail_id ) {
				$thumbnail_src  = wp_get_attachment_image_src( $thumbnail_id, 'large' );
				$thumbnail_src  = $thumbnail_src[0];
				$class_no_image = '';
			} else {
				$thumbnail_src  = VK_MEDIA_POSTS_URL_VKB . 'images/no-image.png';
				$class_no_image = ' noimage';
			}
			$elm .= '<div class="media_post_image' . $class_no_image . '" style="background-image:url(' . $thumbnail_src . ');">' . "\n";
			$thumbnail = get_the_post_thumbnail( $post->ID, 'media_thumbnail' );
			$elm .=  ( $thumbnail ) ? $thumbnail : '<img src="' . $thumbnail_src . '" alt="NO IMAGE" />';
			$elm .= '</div>';
			// ※アーカイブページの場合はこのメソッドが呼び出される時点で instance に数字が入っているで、ここの数字を変更しても反映されない

//			$days  = isset( $instance['new_icon_display'] ) ? $instance['new_icon_display'] : 7; //Newを表示させたい期間の日数
			$today = date_i18n( 'U' );
			$entry = get_the_time( 'U' );
//			$kiji  = date( 'U', ( $today - $entry ) ) / 86400;
//			if ( $days > $kiji ) {
//				$elm .= '<div class="media_post_label_new">NEW</div>';
//			}

			$elm .= '<div class="media_post_text">' . "\n";
			$elm .= '<div class="media_post_meta">' . "\n";
			$elm .= '<span class="published media_post_date">' . esc_html( get_the_date() ) . '</span>';
			$taxonomies = get_the_taxonomies();
//			if ( $taxonomies ) :
//				// get $taxonomy name
//				$taxonomy   = key( $taxonomies );
//				$terms      = get_the_terms( get_the_ID(), $taxonomy );
//				$term_name  = esc_html( $terms[0]->name );
//				$term_color = Vk_term_color::get_term_color( $terms[0]->term_id );
//				$term_color = ( $term_color ) ? ' style="background-color:' . $term_color . '"' : '';
//				$elm .= '<span class="media_post_term"' . $term_color . '>' . $term_name . '</span>';
//			endif;
			$elm .= '<span class="vcard author"><span class="fn">' . get_the_author() . '</span></span>';
			$elm .= '</div>' . "\n"; // entry-meta
			$elm .= '<h4 class="media_post_title">' . esc_html( get_the_title() ) . '</h4>';
			$elm .= '<p class="media_post_excerpt">' . esc_html( get_the_excerpt() ) . '</p>';
			$elm .= '</div>';
			$elm .= '</a>';
			$elm .= '</article>';

			return $elm;
		}

	}

}
