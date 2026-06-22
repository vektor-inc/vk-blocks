<?php
/**
 * Extensions core navigation block.
 *
 * Add a block-scoped class to the outermost wrapper of the core/navigation
 * block when its showDescription attribute is enabled, so that the menu item
 * description (hidden by core CSS with display:none) can be shown only for
 * that navigation block.
 *
 * core/navigation ブロックの showDescription 属性が有効なとき、最外殻ラッパーに
 * ブロック単位クラスを付与する拡張。これにより、そのナビゲーションブロックに
 * 限ってメニュー項目の説明（コア CSS で display:none）を表示できる。
 *
 * @package vk-blocks
 */

/**
 * Render filter for the core/navigation block.
 *
 * When the block's showDescription attribute is true, inject the block-scoped
 * class `vk-navigation-show-description` into the outermost wrapper's class
 * attribute. The class is targeted at the wrapper that already carries the
 * `wp-block-navigation` class.
 *
 * core/navigation ブロックのレンダリングフィルタ。
 * showDescription 属性が true のとき、最外殻ラッパー（`wp-block-navigation`
 * クラスを持つ要素）の class 属性へブロック単位クラス
 * `vk-navigation-show-description` を注入する。
 *
 * @param string $block_content Block content.
 * @param array  $block         Block data.
 * @return string Filtered block content.
 */
function vk_blocks_render_core_navigation( $block_content, $block ) {
	// 属性が無効なら何もしない / Bail when the attribute is disabled.
	if ( empty( $block['attrs']['showDescription'] ) ) {
		return $block_content;
	}

	// 空コンテンツガード / Guard against empty content.
	if ( empty( $block_content ) ) {
		return $block_content;
	}

	// 最外殻タグ（先頭）の class 属性に `wp-block-navigation` が含まれる場合のみ、
	// その class 属性へ `vk-navigation-show-description` を追記する。
	// すでに同じクラスが付いている場合は二重付与しないようガードする。
	// Append `vk-navigation-show-description` to the class attribute of the
	// outermost opening tag that contains the `wp-block-navigation` class.
	$class_name = 'vk-navigation-show-description';

	// 最外殻タグの class 属性に既付与済みなら素通り。内側要素に同名クラス文字列が
	// 含まれていても誤って早期 return しないよう、最外殻の開始タグのみを判定する。
	// Skip only when the outermost opening tag's class attribute already
	// carries the class; ignore the same string appearing in inner elements.
	$already_added_on_outermost = 1 === preg_match(
		'/^\s*<[a-zA-Z][^>]*\bclass="[^"]*\b' . preg_quote( $class_name, '/' ) . '\b[^"]*"/',
		$block_content
	);
	if ( $already_added_on_outermost ) {
		return $block_content;
	}

	// 先頭の開始タグの class="..." に wp-block-navigation を含むものへ class を追記。
	// Match the first opening tag whose class attribute contains
	// `wp-block-navigation`, and append our class to that attribute.
	$pattern     = '/^(\s*<[a-zA-Z][^>]*\bclass=")([^"]*\bwp-block-navigation\b[^"]*)(")/';
	$replacement = '$1$2 ' . $class_name . '$3';

	$replaced = preg_replace( $pattern, $replacement, $block_content, 1 );

	// 置換失敗時（パターン不一致など）は元の内容を返す / Fall back when no replacement happens.
	if ( null === $replaced || $replaced === $block_content ) {
		return $block_content;
	}

	return $replaced;
}
add_filter( 'render_block_core/navigation', 'vk_blocks_render_core_navigation', 10, 2 );
