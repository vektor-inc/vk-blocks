<?php
/**
 * Link to Post render filter.
 *
 * When a block with linkToPost attribute is inside a query loop (or on a single post),
 * replaces the empty href with the current post permalink.
 *
 * @package vk-blocks-pro
 */

if ( ! class_exists( 'VK_Blocks_Link_To_Post' ) ) {

	/**
	 * VK_Blocks_Link_To_Post
	 */
	class VK_Blocks_Link_To_Post {

		/**
		 * Block names that support linkToPost via LinkToolbar.
		 * リンクツールバーで「投稿へのリンク」を実装したブロックを列挙する。
		 *
		 * @var array<string>
		 */
		private static $supported_blocks = array(
			'vk-blocks/icon',
			'vk-blocks/button',
			'vk-blocks/outer',
			'core/group',
			'core/cover',
		);

		/**
		 * Initialize.
		 */
		public static function init() {
			add_filter( 'render_block', array( __CLASS__, 'inject_post_permalink' ), 10, 2 );
		}

		/**
		 * Replace empty href with current post permalink when block has linkToPost.
		 *
		 * @param string $block_content Block output.
		 * @param array  $block        Block data.
		 * @return string
		 */
		public static function inject_post_permalink( $block_content, $block ) {
			if ( empty( $block['blockName'] ) || empty( $block['attrs']['linkToPost'] ) ) {
				return $block_content;
			}

			if ( ! in_array( $block['blockName'], self::$supported_blocks, true ) ) {
				return $block_content;
			}

			// data-vk-link-to-post を持つすべての <a> の href を現在の投稿パーマリンクに置換する.
			// （グループ等で子ブロックの <a> が先に来るため、当ブロック自身の <a> も置換するよう「すべて」置換する）
			if ( strpos( $block_content, 'data-vk-link-to-post' ) === false ) {
				return $block_content;
			}

			$permalink = get_the_permalink();
			if ( ! $permalink ) {
				return $block_content;
			}

			$permalink_esc = esc_url( $permalink );

			// data-vk-link-to-post を含むすべての <a> タグ内の href をパーマリンクに置換（属性順は不定）.
			$block_content = preg_replace_callback(
				'/<a\s([^>]*data-vk-link-to-post="1"[^>]*)>/',
				function ( $m ) use ( $permalink_esc ) {
					$attrs = $m[1];
					$attrs = preg_replace( '/\shref="[^"]*"/', ' href="' . $permalink_esc . '"', $attrs, 1 );
					// href が先にある場合 (data-vk-link-to-post の前).
					if ( strpos( $attrs, 'href="' . $permalink_esc . '"' ) === false ) {
						$attrs = preg_replace( '/href="[^"]*"/', 'href="' . $permalink_esc . '"', $attrs, 1 );
					}
					return '<a ' . $attrs . '>';
				},
				$block_content
			);

			return $block_content;
		}
	}
}
