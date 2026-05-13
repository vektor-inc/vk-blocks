<?php
/**
 * Extensions core site-logo block.
 *
 * Replace the outermost wrapper of the core/site-logo block with an <h1>
 * tag only on the front page when the isFrontPageH1 attribute is enabled.
 *
 * フロントページのみ core/site-logo ブロックの最外殻 <div> を <h1> に置換する拡張。
 *
 * @package vk-blocks
 */

/**
 * Render filter for the core/site-logo block.
 *
 * When the block's isFrontPageH1 attribute is true and the current view is
 * the front page (`is_front_page()`), replace the outermost
 * `<div class="wp-block-site-logo ...">...</div>` wrapper with `<h1>...</h1>`
 * preserving the original attributes.
 *
 * core/site-logo ブロックのレンダリングフィルタ。
 * isFrontPageH1 属性が true かつフロントページ表示時のみ、最外殻の
 * `<div class="wp-block-site-logo ...">...</div>` を `<h1>...</h1>` に
 * 置換する（属性は維持）。
 *
 * @param string $block_content Block content.
 * @param array  $block         Block data.
 * @return string Filtered block content.
 */
function vk_blocks_render_core_site_logo( $block_content, $block ) {
	// 属性が無効なら何もしない / Bail when the attribute is disabled.
	if ( empty( $block['attrs']['isFrontPageH1'] ) ) {
		return $block_content;
	}

	// フロントページ以外では何もしない / Only act on the front page.
	if ( ! is_front_page() ) {
		return $block_content;
	}

	// 空コンテンツガード / Guard against empty content.
	if ( empty( $block_content ) ) {
		return $block_content;
	}

	// 最外殻の <div class="wp-block-site-logo ..."> ... </div> を <h1> に置換。
	// `wp-block-site-logo` クラスが含まれる div だけをピンポイントで対象にする。
	// Replace only the outermost `<div class="wp-block-site-logo ...">...</div>`
	// wrapper with `<h1>...</h1>`, keeping all original attributes.
	$pattern     = '/^\s*<div(\s[^>]*\bclass="[^"]*\bwp-block-site-logo\b[^"]*"[^>]*)>(.*)<\/div>\s*$/s';
	$replacement = '<h1$1>$2</h1>';

	$replaced = preg_replace( $pattern, $replacement, $block_content, 1 );

	// 置換失敗時（パターン不一致など）は元の内容を返す / Fall back when no replacement happens.
	if ( null === $replaced || $replaced === $block_content ) {
		return $block_content;
	}

	return $replaced;
}
add_filter( 'render_block_core/site-logo', 'vk_blocks_render_core_site_logo', 10, 2 );
