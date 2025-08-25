<?php
/**
 * VK Blocks REST API Init Actions
 *
 * @package vk_blocks
 */

use VektorInc\VK_Term_Color\VkTermColor;

/**
 * Vk_Blocks_EntryPoint
 */
class Vk_Blocks_EntryPoint {
	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'vk_blocks_rest_api_init' ) );
	}

	/**
	 * Vk Blocks Rest Api Init
	 *
	 * @return void
	 */
	public function vk_blocks_rest_api_init() {
		register_rest_route(
			'vk-blocks/v1',
			'/update_vk_blocks_options',
			array(
				array(
					'methods'             => 'GET',
					'callback'            => array( $this, 'get_vk_blocks_options' ),
					'permission_callback' => function () {
						return current_user_can( 'edit_theme_options' );
					},
				),
				array(
					'methods'             => 'POST',
					'callback'            => array( $this, 'update_vk_blocks_options' ),
					'permission_callback' => function () {
						return current_user_can( 'edit_theme_options' );
					},
				),
			)
		);
		register_rest_route(
			'vk-blocks/v1',
			'/get_post_single_term_info',
			array(
				array(
					'methods'             => 'POST',
					'callback'            => array( $this, 'get_post_single_term_info' ),
					'permission_callback' => function () {
						return current_user_can( 'edit_theme_options' );
					},
				),
			)
		);
		register_rest_route(
			'vk-blocks/v1',
			'/get_post_multiple_terms_info',
			array(
				array(
					'methods'             => 'POST',
					'callback'            => array( $this, 'get_post_multiple_terms_info' ),
					'permission_callback' => array( $this, 'get_post_multiple_terms_info_permission_check' ),
				),
			)
		);
	}

	/**
	 * VK Blocks Rest Get Callback
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function get_vk_blocks_options() {
		$options                   = array();
		$options['vkBlocksOption'] = VK_Blocks_Options::get_options();
		return rest_ensure_response( $options );
	}

	/**
	 * VK Blocks Rest Update Callback
	 *
	 * @param object $request — .
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function update_vk_blocks_options( $request ) {
		$json_params = $request->get_json_params();
		update_option( 'vk_blocks_options', $json_params['vkBlocksOption'] );
		return rest_ensure_response(
			array(
				'success' => true,
			)
		);
	}

	/**
	 * VK Term Color Callback
	 *
	 * @param object $request — .
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_post_single_term_info( $request ) {

		$args = array();
		if ( $request->get_param( 'taxonomy' ) ) {
			$args['taxonomy'] = $request->get_param( 'taxonomy' );
		}

		$result = VkTermColor::get_post_single_term_info( $request->get_param( 'post_id' ), $args );
		if ( is_null( $result ) ) {
			return rest_ensure_response( array( 'error' => 'not found' ) );
		}
		return rest_ensure_response( $result );
	}

	/**
	 * Permission check for get_post_multiple_terms_info
	 *
	 * @param object $request — .
	 * @return boolean
	 */
	public function get_post_multiple_terms_info_permission_check( $request ) {
		$post_id = $request->get_param( 'post_id' );

		// post_idが指定されていない場合は拒否
		if ( empty( $post_id ) ) {
			return false;
		}

		$post = get_post( $post_id );

		// 投稿が存在しない場合は拒否
		if ( ! $post ) {
			return false;
		}

		// 投稿が公開されている場合は許可
		if ( 'publish' === $post->post_status ) {
			return true;
		}

		// 非公開投稿の場合、現在のユーザーがその投稿を編集できるかチェック
		return current_user_can( 'edit_post', $post_id );
	}

	/**
	 * VK Term Color Multiple Terms Callback
	 *
	 * @param object $request — .
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_post_multiple_terms_info( $request ) {

		// VkTermColorクラスが存在するかチェック
		if ( ! class_exists( 'VektorInc\\VK_Term_Color\\VkTermColor' ) ) {
			return rest_ensure_response( array( 'error' => 'VkTermColor class not found' ) );
		}

		$post_id  = $request->get_param( 'post_id' );
		$taxonomy = $request->get_param( 'taxonomy' );

		// 投稿オブジェクトを取得
		$post = get_post( $post_id );
		if ( ! $post ) {
			return rest_ensure_response( array( 'error' => 'Post not found' ) );
		}

		// 結果を格納する配列
		$results = array();

		// 処理対象のタクソノミーを決定
		$target_taxonomies = array();
		if ( ! empty( $taxonomy ) ) {
			// 特定のタクソノミーが指定されている場合
			$target_taxonomies[ $taxonomy ] = $taxonomy;
		} else {
			// 自動選択の場合：投稿に設定されているすべてのタクソノミーからタームを取得
			$taxonomies        = get_the_taxonomies( $post );
			$taxonomies        = VkTermColor::get_display_taxonomies_exclusion( $taxonomies, array( 'post_tag', 'product_type' ) );
			$target_taxonomies = $taxonomies;
		}

		// 各タクソノミーからタームを取得
		foreach ( $target_taxonomies as $taxonomy_name => $v ) {
			$terms = get_the_terms( $post, $taxonomy_name );

			if ( $terms && ! is_wp_error( $terms ) ) {
				foreach ( $terms as $term ) {
					$color      = VkTermColor::get_term_color( $term->term_id );
					$text_color = VkTermColor::get_dynamic_text_color( $color );
					$term_url   = get_term_link( $term );

					if ( is_wp_error( $term_url ) ) {
						$term_url = '';
					}

					$results[] = array(
						'term_id'    => $term->term_id,
						'term_name'  => $term->name,
						'color'      => $color,
						'term_url'   => $term_url,
						'text_color' => $text_color,
						'taxonomy'   => $taxonomy_name,
					);
				}
				// 最初のタクソノミーのみ処理（元のロジックに合わせる）
				break;
			}
		}

		if ( empty( $results ) ) {
			return rest_ensure_response( array( 'error' => 'not found' ) );
		}

		return rest_ensure_response( $results );
	}
}
