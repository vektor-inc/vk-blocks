<?php
if ( ! class_exists( 'Lightning_media_posts' ) ) {
	class Lightning_media_posts {


//		static function init() {
//			if ( self::is_theme() ) {
//				define( 'VK_MEDIA_POSTS_URL', get_template_directory_uri() . '/inc/media-posts/' );
//				define( 'VK_MEDIA_POSTS_DIR', dirname( __FILE__ ) );
//			} else {
//				define( 'VK_MEDIA_POSTS_URL', plugin_dir_url( __FILE__ ) );
//				define( 'VK_MEDIA_POSTS_DIR', plugin_dir_path( __FILE__ ) );
//			}
//			define( 'VK_MEDIA_POSTS_VERSION', '1.2' );
//		}

//		private static function is_theme() {
//			$file_path = __FILE__;
//			$pattern   = '/themes/';
//			preg_match( $pattern, $file_path, $matches );
//			if ( $matches ) {
//				return true;
//			} else {
//				return false;
//			}
//		}

		public static function patterns() {

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
			return $patterns;
		}

//		public static function patterns_select_options( $selected ) {
//
//			$patterns = Lightning_media_posts::patterns();
//			global $system_name;
//			if ( $system_name ) {
//				$system_name = $system_name . ' ';
//			}
//
//			$selected_html = ( isset( $selected ) && ( $selected == 'default' ) ) ? ' selected' : '';
//			$select_html   = '<option value="default">' . $system_name . __( 'default', 'lightning-pro' ) . '</option>';
//
//			foreach ( $patterns as $key => $value ) {
//				$selected_html = ( isset( $selected ) && ( $selected == $key ) ) ? ' selected' : '';
//				$select_html  .= '<option value="' . $key . '"' . $selected_html . '>' . $value['label'] . '</option>' . "\n";
//			}
//			echo $select_html;
//		}

		//get label names from theme options & translation file (if)
//		public static function labelNames() {
//
//			$post_types_labels = array(
//				'post' => __( 'Posts' ),
//				'page' => __( 'Pages', 'lightning-pro' ),
//			);
//
//			return $post_types_labels;
//		}

//		public static function get_custom_types() {
//
//			//gets all custom post types set PUBLIC
//			$args = array(
//				'public'   => true,
//				'_builtin' => false,
//			);
//
//			$custom_types = get_post_types( $args, 'names' );
//
//			// foreach ($custom_types as $name => $slug) {
//			//  	$custom_types[ $name ] = 0;
//			// }
//
//			return $custom_types;
//		}

//		public static function get_custom_types_labels() {
//
//			//gets all custom post types set PUBLIC
//			$args = array(
//				'public'   => true,
//				'_builtin' => false,
//			);
//
//			$custom_types        = get_post_types( $args, 'objects' );
//			$custom_types_labels = array();
//
//			foreach ( $custom_types as $custom_type ) {
//				$custom_types_labels[ $custom_type->name ] = $custom_type->label;
//			}
//
//			return $custom_types_labels;
//		}

		/*-------------------------------------------*/
		/*  Widgets init
		/*-------------------------------------------*/
//		static function widgets_init() {
//
//			register_sidebar(
//				array(
//					'name'          => __( 'Home content top after left', 'lightning-pro' ),
//					'id'            => 'home-content-top-after-left-widget-area',
//					'before_widget' => '<div class="widget %2$s" id="%1$s">',
//					'after_widget'  => '</div>',
//					'before_title'  => '<h2 class="mainSection-title">',
//					'after_title'   => '</h2>',
//				)
//			);
//			register_sidebar(
//				array(
//					'name'          => __( 'Home content top after right', 'lightning-pro' ),
//					'id'            => 'home-content-top-after-right-widget-area',
//					'before_widget' => '<div class="widget %2$s" id="%1$s">',
//					'after_widget'  => '</div>',
//					'before_title'  => '<h2 class="mainSection-title">',
//					'after_title'   => '</h2>',
//				)
//			);
//			register_sidebar(
//				array(
//					'name'          => __( 'Home content top bottom widget', 'lightning-pro' ),
//					'id'            => 'home-content-top-bottom-widget-area',
//					'before_widget' => '<div class="widget %2$s" id="%1$s">',
//					'after_widget'  => '</div>',
//					'before_title'  => '<h2 class="mainSection-title">',
//					'after_title'   => '</h2>',
//				)
//			);
//		}

//		static function add_widget_area() {
//			if (
//				is_active_sidebar( 'home-content-top-after-left-widget-area' ) ||
//				is_active_sidebar( 'home-content-top-after-right-widget-area' )
//			) :
//				echo '<div class="row">';
//				if ( is_active_sidebar( 'home-content-top-after-left-widget-area' ) ) :
//					echo '<div class="col-sm-6">';
//					dynamic_sidebar( 'home-content-top-after-left-widget-area' );
//					echo '</div>';
//				endif;
//				if ( is_active_sidebar( 'home-content-top-after-right-widget-area' ) ) :
//					echo '<div class="col-sm-6">';
//					dynamic_sidebar( 'home-content-top-after-right-widget-area' );
//					echo '</div>';
//				endif;
//				echo '</div>';
//			endif;
//			if ( is_active_sidebar( 'home-content-top-bottom-widget-area' ) ) :
//				echo '<div class="row">';
//				echo '<div class="col-sm-12">';
//				dynamic_sidebar( 'home-content-top-bottom-widget-area' );
//				echo '</div>';
//				echo '</div>';
//			endif;
//		}

		/*-------------------------------------------*/
		/*  Add media unit css
		/*-------------------------------------------*/

		static function print_css() {
			// デフォルトでは出力しない
			$print_css_default = false;
			if ( apply_filters( 'lightning_print_media_posts_css_custom', $print_css_default ) ) {
				wp_enqueue_style( 'vk-media-posts-style', VK_MEDIA_POSTS_URL . 'css/media-posts.css', array(), VK_MEDIA_POSTS_VERSION, 'all' );
			}
		}

		/*-------------------------------------------*/
		/*  実行
		/*-------------------------------------------*/

		public function __construct() {

			add_action( 'wp_enqueue_scripts', array( $this, 'print_css' ) );
//			add_action( 'lightning_home_content_top_widget_area_after', array( $this, 'add_widget_area' ) );
//			add_action( 'widgets_init', array( $this, 'widgets_init' ), 100 );
			// 0.618 = 1:1.618 = 0.38 : 0.62
			add_image_size( 'media_thumbnail', 600, 371, true );

			require_once( 'class-media-posts-admin.php' );

			if ( locate_template( array( 'inc/media-posts/views/class-loop-post-view.php' ), false, false ) ) {
				get_template_part( 'inc/media-posts/views/class-loop-post-view' );
			} else {
				require_once( 'views/class-loop-post-view.php' );
			}

			if ( locate_template( array( 'inc/media-posts/class-media-posts-widget.php' ), false, false ) ) {
				get_template_part( 'inc/media-posts/class-media-posts-widget' );
			} else {
				require_once( 'class-media-posts-widget.php' );
			}
		}

	} // class Lightning_media_posts

	new Lightning_media_posts();
	Lightning_media_posts::init();

	/*-------------------------------------------*/
	/*  Archive Loop change
	/*-------------------------------------------*/
	/* アーカイブループのレイアウトを改変するかどうかの判定 */
	function lmu_is_loop_layout_change_flag( $post_type = 'post', $flag = false ) {
		$ltg_media_unit_archive_loop_layout = get_option( 'ltg_media_unit_archive_loop_layout' );
		// 指定の投稿タイプアーカイブのレイアウトに値が存在する場合
		if ( ! empty( $ltg_media_unit_archive_loop_layout[ $post_type ] ) ) {
			// デフォルトじゃない場合
			if ( $ltg_media_unit_archive_loop_layout[ $post_type ] != 'default' ) {
				$flag = true;
			} // if ( $ltg_media_unit_archive_loop_layout[ $postType ] != 'default' ) {
		}
		return $flag;
	}

	/* アーカイブループを改変するかどうかの指定 */
	add_filter( 'is_lightning_extend_loop', 'lmu_is_loop_layout_change' );
	function lmu_is_loop_layout_change( $flag ) {
		$post_type_info = lightning_get_post_type();
		$post_type      = $post_type_info['slug'];

		if ( is_author() ) {
			$postType = 'author';
		}

		$flag = lmu_is_loop_layout_change_flag( $post_type, $flag );
		return $flag;
	}

	// 発火不良の時用
	// add_action( 'after_setup_theme', 'lmu_do_loop_layout_change_trigger' );
	// function lmu_do_loop_layout_change_trigger() {
	// 	add_action( 'lightning_extend_loop', 'lmu_do_loop_layout_change' );
	// }

	add_action( 'lightning_extend_loop', 'lmu_do_loop_layout_change' );
	function lmu_do_loop_layout_change() {

		$ltg_media_unit_archive_loop_layout = get_option( 'ltg_media_unit_archive_loop_layout' );

		$post_type      = lightning_get_post_type();
		$post_type_slug = $post_type['slug'];
		$post_type_slug = ( is_author() ) ? 'author' : $post_type['slug'];

		$flag = lmu_is_loop_layout_change_flag( $post_type_slug );
		if ( $flag ) {
			$layout                       = $ltg_media_unit_archive_loop_layout[ $post_type_slug ];
			$instance['new_icon_display'] = apply_filters( 'lmu_new_icon_display', 7 );
			echo '<div class="loop_outer">';

			Ltg_Media_Post_View::post_loop( $layout, $instance );

			echo '</div>';
		}
	}
} // if ( ! class_exists( 'Lightning_media_posts' ) )
