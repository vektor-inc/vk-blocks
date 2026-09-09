<?php
/**
 * Extensions core site-title block.
 *
 * Replace the outermost wrapper of the core/site-title block with a <div>
 * tag on pages other than the front page when the isFrontPageH1 attribute
 * is enabled.
 *
 * isFrontPageH1 属性が有効なとき、フロントページ以外で core/site-title ブロックの
 * 最外殻 <h1> を <div> に置換する拡張。
 *
 * @package vk-blocks
 */

// Do not load directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Render filter for the core/site-title block.
 *
 * The `core/site-title` block outputs its content as
 * `<h1 class="wp-block-site-title ...">...</h1>` by default. When the
 * block's isFrontPageH1 attribute is disabled (default),
 * this filter does nothing and the core `<h1>` output is kept on every page.
 * When the attribute is enabled, the `<h1>` is kept as-is on the front page
 * (`is_front_page()`), and only on pages other than the front page is the
 * outermost `<h1 class="wp-block-site-title ...">...</h1>` wrapper replaced
 * with `<div>...</div>`, preserving the original attributes.
 *
 * core/site-title ブロックのレンダリングフィルタ。
 * core/site-title は標準で `<h1 class="wp-block-site-title ...">...</h1>` として
 * 出力される。isFrontPageH1 属性が無効（デフォルト）の場合はこのフィルタは何もせず、
 * どのページでもコア標準の `<h1>` のまま出力される。属性が有効な場合、フロントページ
 * （`is_front_page()`）ではすでに `<h1>` のため何もせず、フロントページ以外のときだけ
 * 最外殻の `<h1 class="wp-block-site-title ...">...</h1>` を `<div>...</div>` に
 * 置換する（属性は維持）。
 *
 * @param string $block_content Block content.
 * @param array  $block         Block data.
 * @return string Filtered block content.
 */
function vk_blocks_render_core_site_title( $block_content, $block ) {
	// 属性が無効なら何もしない（常にコア標準の <h1> のまま） / Bail when the attribute is disabled (always keep the core <h1>).
	if ( empty( $block['attrs']['isFrontPageH1'] ) ) {
		return $block_content;
	}

	// フロントページではすでに <h1> のため何もしない / Already <h1> on the front page, nothing to do.
	if ( is_front_page() ) {
		return $block_content;
	}

	// 空コンテンツガード / Guard against empty content.
	if ( empty( $block_content ) ) {
		return $block_content;
	}

	// フロントページ以外のみ、最外殻の <h1 class="wp-block-site-title ..."> ... </h1> を <div> に置換。
	// `wp-block-site-title` クラスが含まれる h1 だけをピンポイントで対象にする。
	// Only on pages other than the front page, replace the outermost
	// `<h1 class="wp-block-site-title ...">...</h1>` wrapper with `<div>...</div>`,
	// keeping all original attributes.
	$pattern     = '/^\s*<h1(\s[^>]*\bclass="[^"]*\bwp-block-site-title\b[^"]*"[^>]*)>(.*)<\/h1>\s*$/s';
	$replacement = '<div$1>$2</div>';

	$replaced = preg_replace( $pattern, $replacement, $block_content, 1 );

	// 置換失敗時（パターン不一致など）は元の内容を返す / Fall back when no replacement happens.
	if ( null === $replaced || $replaced === $block_content ) {
		return $block_content;
	}

	return $replaced;
}
add_filter( 'render_block_core/site-title', 'vk_blocks_render_core_site_title', 10, 2 );
