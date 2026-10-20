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
	 * Fix block saving for Non-Super-Admins (no unfiltered_html capability).
	 * For Non-Super-Admins, some styles & HTML tags/attributes are removed upon saving,
	 * this allows vkblocks HTML tags & attributes from being saved.
	 *
	 * For every vkblocks block, add the HTML tags and attributes used here.
	 *
	 * @see The list of tags & attributes currently allowed: https://core.trac.wordpress.org/browser/tags/5.2/src/wp-includes/kses.php#L61
	 *
	 * @param array $tags Allowed HTML tags & attributes.
	 *
	 * @return array Modified HTML tags & attributes.
	 */
	function vk_blocks_allow_wp_kses_allowed_html( $tags ) {

		$style_defaults = array(
			'type' => true,
		);
		$input_defaults = array(
			'type'        => true,
			'id'          => true,
			'class'       => true,
			'style'       => true,
			'name'        => true,
			'value'       => true,
			'checked'     => true,
			'placeholder' => true,
		);
		$svg_defaults   = array(
			'viewbox'             => true,
			'xmlns'               => true,
			'preserveaspectratio' => true,
		);
		$path_defaults  = array(
			'fill'         => true,
			'd'            => true,
			'stroke-width' => true,
		);

		$current_style = ( isset( $tags['style'] ) && is_array( $tags['style'] ) ) ? $tags['style'] : array();
		$tags['style'] = array_merge( $style_defaults, $current_style );

		$current_input = ( isset( $tags['input'] ) && is_array( $tags['input'] ) ) ? $tags['input'] : array();
		$tags['input'] = array_merge( $input_defaults, $current_input );

		$current_svg = ( isset( $tags['svg'] ) && is_array( $tags['svg'] ) ) ? $tags['svg'] : array();
		$tags['svg'] = array_merge( $svg_defaults, $current_svg );

		$current_path = ( isset( $tags['path'] ) && is_array( $tags['path'] ) ) ? $tags['path'] : array();
		$tags['path'] = array_merge( $path_defaults, $current_path );

		return $tags;
	}

	add_filter( 'wp_kses_allowed_html', 'vk_blocks_allow_wp_kses_allowed_html', 10, 1 );
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
	 * The highlighter format outputs `style="--vk-highlighter-color: rgba(...);"`.
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
