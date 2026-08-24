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

			// data-vk-link-to-post を含むすべての <a> タグの href をパーマリンクに置換する.
			// 正規表現による属性文字列の直接書き換えは、title/class 等の属性値内に含まれる
			// `href="` のような文字列を誤って属性境界として解釈し、クォート構造を破壊して
			// 攻撃者が仕込んだ onfocus 等を実属性として実行可能にしてしまう（属性インジェクション）ため使用しない.
			// WP_HTML_Tag_Processor は実際のブラウザと同じ HTML トークナイズ規則で属性を解釈するため、
			// このような壊れたクォート構造を安全に扱い、正しくエスケープされた形で再出力できる.
			// Replace the href of every <a> tag that has data-vk-link-to-post with the permalink.
			// Do not rewrite the attribute string with regex: a string such as `href="` appearing
			// inside another attribute's value (e.g. title, class) can be misread as an attribute
			// boundary, breaking the quote structure and letting an attacker-supplied attribute such
			// as onfocus become a real, executable attribute (attribute injection).
			// WP_HTML_Tag_Processor tokenizes attributes using the same rules a browser uses, so it
			// safely handles this kind of broken quote structure and re-serializes it with correct escaping.
			$processor = new WP_HTML_Tag_Processor( $block_content );
			while ( $processor->next_tag( array( 'tag_name' => 'a' ) ) ) {
				if ( '1' === $processor->get_attribute( 'data-vk-link-to-post' ) ) {
					$processor->set_attribute( 'href', $permalink_esc );
				}
			}

			return $processor->get_updated_html();
		}
	}
}
