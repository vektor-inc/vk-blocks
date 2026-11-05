<?php
/**
 * Helper
 *
 * @package vk-blocks
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * VK Blocks Is Lightning
 *
 * 使われているテーマがLightningかどうかを判別する
 */
function vk_blocks_is_lightning() {
	// テーマがLightning系の場合読み込まない
	$current_template = ! empty( $_GET['wp_theme_preview'] ) ? sanitize_text_field( wp_unslash( $_GET['wp_theme_preview'] ) ) : get_template(); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( 'lightning' === $current_template || 'lightning-pro' === $current_template || 'katawara' === $current_template ) {
		return true;
	}

	return false;
}

if ( ! function_exists( 'vk_blocks_allow_wp_kses_allowed_html' ) ) {

	/**
	 * Add the tags that VK Blocks saves in post content to the allowed HTML list of the 'post' context.
	 * VK Blocks が投稿の本文に保存するタグを、投稿の本文の場面（'post'）の HTML 許可リストに追加する。
	 *
	 * Users without the unfiltered_html capability (Author, Contributor, and every user on multisite
	 * except Super Admin) have their content filtered by KSES on save. This keeps the style / svg / path / rect
	 * tags and the attributes of a / li (button, outer, slider and tab blocks) output by VK Blocks from being removed.
	 * unfiltered_html 権限を持たないユーザー（投稿者・寄稿者、マルチサイトのスーパー管理者以外）は、
	 * 保存時に KSES で内容が絞られる。VK Blocks が出力する style・svg・path・rect と、a・li の
	 * 属性（ボタン・アウター・スライダー・タブの各ブロック）が消えないようにする。
	 *
	 * Only the 'post' context is changed. Other contexts (comments, 'data', 'strip', post titles,
	 * profile descriptions, and so on) get the list back unchanged, so WordPress's own limits stay as they are.
	 * 変えるのは投稿の本文の場面だけ。コメント・data・strip・投稿タイトル・プロフィール文などの場面は、
	 * 受け取った一覧をそのまま返し、WordPress 本来の制限を保つ。
	 *
	 * The input tag is not added, because adding it makes WordPress allow related tags automatically.
	 * An input already added by another plugin is left as it is.
	 * input は足さない（足すと WordPress 本体が関連するタグを自動で許可するため）。
	 * ほかのプラグインが足した input には触らない。
	 *
	 * Keep the default value of $context. Another plugin may call apply_filters( 'wp_kses_allowed_html', $tags )
	 * with only one argument, and WordPress then passes only $tags to this function.
	 * $context の既定値は外さないこと。ほかのプラグインが apply_filters( 'wp_kses_allowed_html', $tags ) と
	 * 引数 1 つで呼ぶと、WordPress はこの関数に $tags だけを渡すため、既定値が無いと致命的エラーになる。
	 *
	 * @see wp_kses_allowed_html()
	 *
	 * @param array  $tags    Allowed HTML tags and attributes. / 許可するタグと属性の一覧.
	 * @param string $context Optional. Context name of the allowed list (such as 'post'). Default '' (nothing is added). /
	 *                        省略可。許可リストの場面名（'post' など）。既定値は ''（何も足さずに返す）.
	 * @return array In the 'post' context, the list with the tags and attributes above added. Otherwise the list as received.
	 *               'post' の場面では上記のタグと属性を足した一覧。それ以外の場面では受け取った一覧のまま。
	 */
	function vk_blocks_allow_wp_kses_allowed_html( $tags, $context = '' ) {
		// Leave every context other than post content unchanged.
		// 投稿の本文以外の場面は何も足さずに返す。
		if ( 'post' !== $context ) {
			return $tags;
		}

		// Attributes used by VK Blocks. Existing definitions are merged in so that attributes added by other plugins remain.
		// VK Blocks が使う属性。ほかのプラグインが足した属性が残るよう、既存の定義と合わせる。
		$style_defaults = array(
			'type' => true,
		);
		$svg_defaults   = array(
			'viewbox'             => true,
			'xmlns'               => true,
			'preserveaspectratio' => true,
			'class'               => true,
			'width'               => true,
			'height'              => true,
			'aria-hidden'         => true,
			'focusable'           => true,
		);
		$path_defaults  = array(
			'fill'         => true,
			'd'            => true,
			'stroke-width' => true,
			'class'        => true,
		);
		$rect_defaults  = array(
			'x'      => true,
			'y'      => true,
			'width'  => true,
			'height' => true,
			'rx'     => true,
		);
		$a_defaults     = array(
			'aria-pressed' => true,
		);
		$li_defaults    = array(
			'aria-selected' => true,
			'tabindex'      => true,
		);

		$current_style = ( isset( $tags['style'] ) && is_array( $tags['style'] ) ) ? $tags['style'] : array();
		$tags['style'] = array_merge( $style_defaults, $current_style );

		$current_svg = ( isset( $tags['svg'] ) && is_array( $tags['svg'] ) ) ? $tags['svg'] : array();
		$tags['svg'] = array_merge( $svg_defaults, $current_svg );

		$current_path = ( isset( $tags['path'] ) && is_array( $tags['path'] ) ) ? $tags['path'] : array();
		$tags['path'] = array_merge( $path_defaults, $current_path );

		$current_rect = ( isset( $tags['rect'] ) && is_array( $tags['rect'] ) ) ? $tags['rect'] : array();
		$tags['rect'] = array_merge( $rect_defaults, $current_rect );

		$current_a = ( isset( $tags['a'] ) && is_array( $tags['a'] ) ) ? $tags['a'] : array();
		$tags['a'] = array_merge( $a_defaults, $current_a );

		$current_li = ( isset( $tags['li'] ) && is_array( $tags['li'] ) ) ? $tags['li'] : array();
		$tags['li'] = array_merge( $li_defaults, $current_li );

		return $tags;
	}

	add_filter( 'wp_kses_allowed_html', 'vk_blocks_allow_wp_kses_allowed_html', 10, 2 );
}

/*
 * ---------------------------------------------------------------------------
 * kses filters (called from wp_kses_post() → safecss_filter_attr())
 * ---------------------------------------------------------------------------
 */

if ( ! function_exists( 'vk_blocks_allow_color_functions_in_kses' ) ) {

	/**
	 * Allow rgb/rgba/hsl/hsla color functions in inline CSS when saving posts.
	 *
	 * The highlighter format outputs `style="--vk-highlighter-color: rgba(...);"` for a color
	 * picked outside the palette. A color picked from the palette is stored as a reference
	 * instead (`--vk-highlighter-base: var(--wp--preset--color--<slug>, <color code>);`, or
	 * `--vk-highlighter-color: var(...)` when the palette color already carries an alpha);
	 * those pass core's own `var()` handling and do not depend on this filter, but the
	 * fallback color code inside them can still be an rgba() value.
	 * WordPress core's `safecss_filter_attr()` strips any CSS declaration whose
	 * value contains parentheses other than the built-in `var()`, `calc()`, and a
	 * few other functions. That behavior removes the highlighter color for any
	 * user without the `unfiltered_html` capability (Author, Contributor, and
	 * every user on multisite except Super Admin), so the marker appears without
	 * color on the front end.
	 *
	 * rgb/rgba/hsl/hsla are well-defined color functions that accept only numeric
	 * arguments. They cannot be used to smuggle URLs or scripts, so it is safe to
	 * treat them the same as `var()` and strip them from the test string before
	 * the final character check.
	 *
	 * @param bool   $allow_css       Whether the CSS is considered safe so far.
	 * @param string $css_test_string The CSS declaration being tested.
	 * @return bool
	 */
	function vk_blocks_allow_color_functions_in_kses( $allow_css, $css_test_string ) {
		if ( $allow_css ) {
			return $allow_css;
		}

		/*
		 * Strip rgb/rgba/hsl/hsla function calls so that the remaining string can pass
		 * the core disallow check. This is not a strict color-value validator; the
		 * character class intentionally allows commas/spaces/%/minus/dot so that core's
		 * final `[\(]` check is what ultimately decides safety.
		 *
		 * The quantifiers are possessive (`*+`, `++`) so a very long run of digits/commas/
		 * spaces with no closing `)` cannot trigger catastrophic backtracking and hit
		 * PCRE's backtrack limit.
		 */
		$stripped = preg_replace(
			'/\b(?:rgba?|hsla?)\(\s*+[\d.\s,%\-]++\s*+\)/i',
			'',
			$css_test_string
		);

		// preg_replace() returns null on a PCRE error (e.g. backtrack/recursion limit
		// reached). Treat that as unsafe (fail closed) instead of letting it fall through
		// to preg_match(), which would read "no dangerous characters" from a null haystack.
		if ( null === $stripped ) {
			return false;
		}

		// Same pattern as core's default `safecss_filter_attr_allow_css` check (see wp-includes/kses.php).
		return ! preg_match( '%[\\\(&=}]|/\*%', $stripped );
	}
	// @todo WP core が rgb/rgba/hsl/hsla を safecss_filter_attr() の許可関数として公式サポートしたら、このフィルター全体を削除する。
	add_filter( 'safecss_filter_attr_allow_css', 'vk_blocks_allow_color_functions_in_kses', 10, 2 );
}

if ( ! function_exists( 'vk_blocks_fix_gt_style_errors' ) ) {

	/**
	 * Fix block saving for Non-Super-Admins (no unfiltered_html capability).
	 * For Non-Super-Admins, style tags with the ">" symbol are replaced with
	 * "&gt;", ">" is used across a lot of vkblocks block styles. When these
	 * are replaced, the blocks may show an error, and the blocks styles will
	 * not take effect in the frontend.
	 *
	 * This function checks the page content for vkblocks blocks that use the
	 * "&gt;" in styles, then replaces them with the correct ">" symbol.
	 *
	 * We do the replacement upon post saving and not on `render_block` so that
	 * we don't need to do any processing for the frontend.
	 *
	 * @see Issue: https://core.trac.wordpress.org/ticket/48873#ticket
	 * @see https://github.com/gambitph/vkblocks/issues/510
	 *
	 * @param array $data Post data.
	 *
	 * @return array Post data to save.
	 */
	function vk_blocks_fix_gt_style_errors( $data ) {
		if ( empty( $data['post_content'] ) ) {
			return $data;
		}

		// Check whether there are any "&gt;" symbols inside <style> tags of
		// vkblocks blocks.
		// Go through each block's "&gt;" and replace them with ">", only do
		// this for vkblocks blocks.
		$data['post_content'] = preg_replace_callback(
			'%wp:vk-blocks/\w+(.*)?/wp:vk-blocks/\w+%s',
			function ( $matches ) {
				return preg_replace_callback(
					'%(<style[^<>]*>)(.*)</style>%s',
					function ( $matches ) {
						return $matches[1] . preg_replace( '/&gt;/', '>', $matches[2] ) . '</style>';
					},
					$matches[0]
				);
			},
			$data['post_content']
		);

		return $data;
	}
	add_filter( 'wp_insert_post_data', 'vk_blocks_fix_gt_style_errors', 99, 1 );
}
