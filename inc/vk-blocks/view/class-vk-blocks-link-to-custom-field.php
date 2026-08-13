<?php
/**
 * Link to Custom Field render filter.
 *
 * When a block with the linkToCustomField attribute is rendered, replaces the
 * placeholder href with the URL stored in the specified custom field (post meta)
 * of the current post. Inside a query loop the value is resolved per post.
 *
 * linkToCustomField 属性を持つブロックの描画時に、指定されたカスタムフィールド
 * （投稿メタ）に保存された URL を href に差し込むフィルター。クエリループ内では
 * 各投稿ごとにカスタムフィールド値を解決する。
 *
 * @package vk-blocks-pro
 */

if ( ! class_exists( 'VK_Blocks_Link_To_Custom_Field' ) ) {

	/**
	 * VK_Blocks_Link_To_Custom_Field
	 *
	 * 「リンク先をカスタムフィールドから取得」機能のサーバー側処理。
	 * VK_Blocks_Link_To_Post とは責務が異なるため、継承せず独立したクラスにしている。
	 */
	class VK_Blocks_Link_To_Custom_Field {

		/**
		 * Block names that support linkToCustomField via LinkToolbar.
		 * リンクツールバーで「カスタムフィールドURL」を実装したブロックを列挙する。
		 * MVP は button のみだが、将来の拡張に備えて配列で保持する。
		 *
		 * @var array<string>
		 */
		private static $supported_blocks = array(
			'vk-blocks/button',
		);

		/**
		 * Initialize.
		 * フィルターを登録する。第3引数に WP_Block インスタンスを受け取るため、
		 * 引数の個数は必ず 3 を指定する（context['postId'] の解決に使う）。
		 */
		public static function init() {
			add_filter( 'render_block', array( __CLASS__, 'inject_custom_field_url' ), 10, 3 );
		}

		/**
		 * Replace the placeholder href with the URL stored in a custom field.
		 * プレースホルダの href を、指定カスタムフィールドに保存された URL へ置換する。
		 *
		 * @param string        $block_content Block output.
		 * @param array         $block         Block data (context is not included).
		 * @param WP_Block|null $instance      Block instance that holds context['postId'].
		 * @return string
		 */
		public static function inject_custom_field_url( $block_content, $block, $instance = null ) {
			// (a) blockName が空、または未対応ブロックのときは何もしない.
			if ( empty( $block['blockName'] ) || ! in_array( $block['blockName'], self::$supported_blocks, true ) ) {
				return $block_content;
			}

			// (b) トグル OFF のときは何もしない（既存ボタンはここで素通し）.
			if ( empty( $block['attrs']['linkToCustomField'] ) ) {
				return $block_content;
			}

			// (c) マーカーが無い出力（＝カスタムフィールドURLの <a> が存在しない）ときは何もしない.
			if ( strpos( $block_content, 'data-vk-link-to-custom-field-url' ) === false ) {
				return $block_content;
			}

			// (d) フィールド名が未指定のときは、リンク先が定まらないためボタンを出力しない（fail-close）.
			// トグル ON で名前空欄のまま保存した場合に、href="#" の死んだボタンをフロントに残さない.
			if ( empty( $block['attrs']['linkCustomFieldName'] ) ) {
				return '';
			}

			// postId の解決（最重要）.
			// render_block の第2引数 $block には context が載らないため、
			// 第3引数 $instance（WP_Block）の public プロパティ context['postId'] を優先して使う。
			// クエリループ内では各投稿の ID がここに入る。無ければ現在のグローバル投稿にフォールバックする。
			// is_object() + ! empty() のガードにより、PHPUnit から stdClass スタブを渡して
			// 投稿別解決を単体検証できる。
			$post_id = ( is_object( $instance ) && ! empty( $instance->context['postId'] ) )
				? $instance->context['postId']
				: get_the_ID();
			// 投稿コンテキストを解決できない場合（クエリループ外・グローバル投稿の無いテンプレート等）は、
			// メタ値を読めずリンク先が定まらないため、他の失敗ケースと同様にボタンを出力しない（fail-close）.
			if ( ! $post_id ) {
				return '';
			}

			// カスタムフィールド（投稿メタ）から URL を取得する.
			$url = get_post_meta( $post_id, $block['attrs']['linkCustomFieldName'], true );

			// 値が非文字列（配列・オブジェクト等）または空の投稿では、行き先の無い CTA を
			// フロントに出さないため、ボタン自体を出力しない（所長決定の挙動）.
			// ※非文字列を esc_url に渡すと PHP 8 で TypeError になるため、文字列ガードも兼ねる.
			if ( ! is_string( $url ) || '' === $url ) {
				return '';
			}

			// URL をエスケープする.
			$url_esc = esc_url( $url );

			// javascript: 等、esc_url が空化した不正値のときもボタンを出力しない.
			if ( empty( $url_esc ) ) {
				return '';
			}

			// preg_replace の replacement 文字列では $0〜$9 / ${n} が後方参照として解釈される.
			// esc_url は $ を通すため、置換文字列に入れる $ をエスケープして URL 破損を防ぐ.
			$url_replacement = str_replace( '$', '\\$', $url_esc );

			// data-vk-link-to-custom-field-url を含むすべての <a> タグ内の href を
			// カスタムフィールド URL に置換する（属性順は不定・href がマーカーより前にある並びにも対応）.
			$block_content = preg_replace_callback(
				'/<a\s([^>]*data-vk-link-to-custom-field-url="1"[^>]*)>/',
				function ( $m ) use ( $url_esc, $url_replacement ) {
					$attrs = $m[1];
					$attrs = preg_replace( '/\shref="[^"]*"/', ' href="' . $url_replacement . '"', $attrs, 1 );
					// href がマーカーより前にある場合（先頭に href がある並び）にも対応する.
					if ( strpos( $attrs, 'href="' . $url_esc . '"' ) === false ) {
						$attrs = preg_replace( '/href="[^"]*"/', 'href="' . $url_replacement . '"', $attrs, 1 );
					}
					return '<a ' . $attrs . '>';
				},
				$block_content
			);

			return $block_content;
		}
	}
}
