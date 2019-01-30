<?php

/*-------------------------------------------*/
/*  Side Post list widget
/*-------------------------------------------*/
class WP_Widget_media_post extends WP_Widget {

	public $taxonomies = array( 'category' );

	function __construct() {
		global $vk_media_post_prefix;

		$widget_name = $vk_media_post_prefix . __( 'Media Posts', 'lightning-pro' );
		parent::__construct(
			'ltg_media_posts_media_post',
			$widget_name,
			array( 'description' => __( 'It is a widget that displays the post list. Various shapes can be selected.', 'lightning-pro' ) )
		);
	}

	public static function widget_title( $instance ) {
		if ( isset( $instance['title'] ) ) {
			$title = $instance['title'];
		} elseif ( isset( $instance['label'] ) ) {
			$title = $instance['label'];
		} else {
			$title = __( 'Recent Posts', 'lightning-pro' );
		}
		return $title;
	}

	function widget( $args, $instance ) {

		$title = self::widget_title( $instance );

		if ( ! isset( $instance['format'] ) || ! $instance['format'] ) {
			$instance['format'] = 'image_1st'; }

		echo $args['before_widget'];
		// echo '<div class="'.$instance['format'].'">';
		$iconFont_class = ( isset( $instance['iconFont_class'] ) && $instance['iconFont_class'] ) ? $instance['iconFont_class'] : '';

		if ( $title ) {
			echo $args['before_title'];
			if ( $iconFont_class ) {
				echo '<i class="fa ' . $iconFont_class . '" aria-hidden="true"></i>';
			}
			echo $title;
			echo $args['after_title'];
		}

		// $count      = ( isset( $instance['count'] ) && $instance['count'] ) ? $instance['count'] : 10;
		$post_type = ( isset( $instance['post_type'] ) && $instance['post_type'] ) ? $instance['post_type'] : 'post';

		if ( $instance['format'] ) {
			$this->_taxonomy_init( $post_type ); }

		$p_args = array(
			'post_type' => $post_type,
			'paged'     => 1,
		);

		if ( isset( $instance['terms'] ) && $instance['terms'] ) {
			$taxonomies          = get_taxonomies( array() );
			$p_args['tax_query'] = array(
				'relation' => 'OR',
			);
			$terms_array         = explode( ',', $instance['terms'] );
			foreach ( $taxonomies as $taxonomy ) {
				$p_args['tax_query'][] = array(
					'taxonomy' => $taxonomy,
					'field'    => 'id',
					'terms'    => $terms_array,
				);
			}
		}

		global $wp_query;

		$p_args['posts_per_page'] = ( isset( $instance['count'] ) && $instance['count'] ) ? mb_convert_kana( $instance['count'], 'n' ) : 6;
		$p_args['offset']         = ( isset( $instance['offset'] ) && $instance['offset'] ) ? mb_convert_kana( $instance['offset'], 'n' ) : '';

		$wp_query = new WP_Query( $p_args );
		if ( have_posts() ) :
			$layout = $instance['format'];
			Ltg_Media_Post_View::post_loop( $layout, $instance );
		endif;
		// echo '</div>';
		echo $args['after_widget'];

		wp_reset_postdata();
		wp_reset_query();

	} // widget($args, $instance)


	function _taxonomy_init( $post_type ) {
		if ( $post_type == 'post' ) {
			return; }
		$this->taxonomies = get_object_taxonomies( $post_type );
	}

	function taxonomy_list( $post_id = 0, $before = ' ', $sep = ',', $after = '' ) {
		if ( ! $post_id ) {
			$post_id = get_the_ID(); }

		$taxo_catelist = array();

		foreach ( $this->taxonomies as $taxonomy ) {
			$terms = get_the_term_list( $post_id, $taxonomy, $before, $sep, $after );
			if ( $terms ) {
				$taxo_catelist[] = $terms; }
		}

		if ( count( $taxo_catelist ) ) {
			return join( $taxo_catelist, $sep ); }
		return '';
	}

	function form( $instance ) {

		$defaults = array(
			'iconFont_class' => 'fa-file-text-o',
			'count'          => 6,
			'offset'         => '',
			'title'          => __( 'Recent Posts', 'lightning-pro' ),
			'post_type'      => 'post',
			'terms'          => '',
			'format'         => '0',
		);
		if ( ! empty( $instance['label'] ) ) {
			$defaults['title'] = $instance['label'];
		}

		$instance = wp_parse_args( (array) $instance, $defaults );

		//タイトル ?>
		<br />
		<label><?php _e( 'Title:' ); ?><br/>
		<input type="text" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" value="<?php echo $instance['title']; ?>" /></label>
		<br/><br />

		<?php echo _e( 'Title icon:', 'lightning-pro' ); ?>
		<?php

		/*  Icon font
		/*-------------------------------------------*/
		// icon font class input
		echo '<p><label for="' . $this->get_field_id( 'iconFont_' ) . '">' . __( 'Class name of the icon font you want to use:', 'lightning-pro' ) . '</label><br/>';
		echo '<input type="text" id="' . $this->get_field_id( 'iconFont_class' ) . '-font" class="font_class" name="' . $this->get_field_name( 'iconFont_class' ) . '" value="' . esc_attr( $instance['iconFont_class'] ) . '" /><br>';

		if ( class_exists( 'Vk_Font_Awesome_Versions' ) ) {
			echo Vk_Font_Awesome_Versions::ex_and_link();
		}

		echo '</p>';

		?>

		<?php echo _e( 'Display Format', 'lightning-pro' ); ?>:<br/>
		<ul>

			<?php
			$patterns = Lightning_media_posts::patterns();

			foreach ( $patterns as $key => $value ) {
				$checked = ( $instance['format'] == $key ) ? ' checked' : '';

				echo '<li><label><input type="radio" name="' . $this->get_field_name( 'format' ) . '" value="' . $key . '"' . $checked . ' />' . $value['label'] . '</label></li>';
			}
			?>

		</ul>
		<br/>

		<?php //表示件数 ?>
		<label for="<?php echo $this->get_field_id( 'count' ); ?>"><?php _e( 'Display count', 'lightning-pro' ); ?>:</label><br/>
		<input type="text" id="<?php echo $this->get_field_id( 'count' ); ?>" name="<?php echo $this->get_field_name( 'count' ); ?>" value="<?php echo $instance['count']; ?>" />
		<br /><br />

		<?php //オフセット件数 ?>
		<label for="<?php echo $this->get_field_id( 'offset' ); ?>"><?php _e( 'Offset count', 'lightning-pro' ); ?>:</label><br/>
		<input type="text" id="<?php echo $this->get_field_id( 'offset' ); ?>" name="<?php echo $this->get_field_name( 'offset' ); ?>" value="<?php echo $instance['offset']; ?>" />
		<br />
		<?php _e( 'If you skip 2 posts and you want to display from 3rd post, please enter a 2.', 'lightning-pro' ); ?>
		<br /> <br />

		<?php
		//NEWアイコン表示期間
		$new_icon_display = ( isset( $instance['new_icon_display'] ) ) ? $instance['new_icon_display'] : 7;
		?>
		<label for="<?php echo $this->get_field_id( 'new_icon_display' ); ?>"><?php _e( 'Number of days to display the New icon', 'lightning-pro' ); ?>:</label><br/>
		<input type="text" id="<?php echo $this->get_field_id( 'new_icon_display' ); ?>" name="<?php echo $this->get_field_name( 'new_icon_display' ); ?>" value="<?php echo $new_icon_display; ?>" />
		<br /><br />

		<?php //投稿タイプ ?>
		<label for="<?php echo $this->get_field_id( 'post_type' ); ?>"><?php _e( 'Slug for the post type you want to display', 'lightning-pro' ); ?>:</label><br />
		<input type="text" id="<?php echo $this->get_field_id( 'post_type' ); ?>" name="<?php echo $this->get_field_name( 'post_type' ); ?>" value="<?php echo esc_attr( $instance['post_type'] ); ?>" />
		<br/><br/>

		<?php // Terms ?>
		<label for="<?php echo $this->get_field_id( 'terms' ); ?>"><?php _e( 'Category(Term) ID', 'lightning-pro' ); ?>:</label><br />
		<input type="text" id="<?php echo $this->get_field_id( 'terms' ); ?>" name="<?php echo $this->get_field_name( 'terms' ); ?>" value="<?php echo esc_attr( $instance['terms'] ); ?>" /><br />
		<?php
		_e( 'If you need filtering by category(term), add the category ID separate by ",".', 'lightning-pro' );
		echo '<br/>';
		_e( 'If empty this area, I will do not filtering.', 'lightning-pro' );
		echo '<br/><br/>';
	}

	function update( $new_instance, $old_instance ) {
		$instance                     = $old_instance;
		$instance['iconFont_class']   = $new_instance['iconFont_class'];
		$instance['format']           = ! empty( $new_instance['format'] ) ? strip_tags( $new_instance['format'] ) : 'image_1st';
		$instance['new_icon_display'] = ! empty( $new_instance['new_icon_display'] ) ? mb_convert_kana( $new_instance['new_icon_display'], 'n' ) : 7;
		$instance['count']            = $new_instance['count'];
		$instance['offset']           = $new_instance['offset'];
		$instance['title']            = esc_attr( $new_instance['title'] );
		$instance['post_type']        = ! empty( $new_instance['post_type'] ) ? strip_tags( $new_instance['post_type'] ) : 'post';
		$instance['terms']            = preg_replace( '/([^0-9,]+)/', '', $new_instance['terms'] );
		return $instance;
	}
}
add_action( 'widgets_init', 'widget_register_media_posts' );
if ( ! function_exists( 'widget_register_media_posts' ) ) {
	function widget_register_media_posts() {
		return register_widget( 'WP_Widget_media_post' );
	}
}
