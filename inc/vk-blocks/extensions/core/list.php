<?php
/**
 * Extensions core list block style .
 *
 * @package vk-blocks
 */

/**
 * Extensions core list block style.
 *
 * @param string $block_content block_content.
 * @param array  $block block.
 * @return string
 */
function vk_blocks_render_core_list( $block_content, $block ) {
	// 以前の形式 vk-has-(.*)-colorで保存されている場合
	$has_deprecated_classname = ! empty( $block['attrs']['className'] ) && strpos( $block['attrs']['className'], 'vk-has-(.*)-color' ) !== false;
	if ( $has_deprecated_classname ) {
		return $block_content;
	}

	// WP6.2未満の場合
	if ( ! class_exists( 'WP_HTML_Tag_Processor' ) ) {
		return $block_content;
	}

	$class_name         = ! empty( $block['attrs']['className'] ) ? $block['attrs']['className'] : '';
	$is_numbered_square = ! empty( $class_name ) && strpos( $class_name, 'is-style-vk-numbered-square-mark' ) !== false;
	$is_numbered_circle = ! empty( $class_name ) && strpos( $class_name, 'is-style-vk-numbered-circle-mark' ) !== false;
	$line_height_length = '';
	if ( $is_numbered_square || $is_numbered_circle ) {
		$line_height_length = vk_blocks_get_numbered_list_line_height_length( $block );
	}

	$has_color = ! empty( $block['attrs']['color'] );
	if ( ! $has_color && ! $line_height_length ) {
		return $block_content;
	}

	$block_content = new WP_HTML_Tag_Processor( $block_content );
	if ( empty( $block['attrs']['ordered'] ) ) {
		$block_content->next_tag(
			array( 'tag_name' => 'ul' )
		);
	} else {
		$block_content->next_tag(
			array( 'tag_name' => 'ol' )
		);
	}
	$unique_classname = wp_unique_id( 'vk_list_' );
	$block_content->add_class( $unique_classname );

	if ( $line_height_length ) {
		$inline_style = $block_content->get_attribute( 'style' );
		$inline_style = vk_blocks_append_inline_style_declaration(
			$inline_style,
			'--vk-numbered-line-height-length',
			$line_height_length
		);
		$block_content->set_attribute( 'style', $inline_style );
	}

	$updated_html = $block_content->get_updated_html();

	$list_styles = array();
	if ( $has_color ) {
		if ( $is_numbered_square ) {
			$list_styles = array(
				array(
					'selector'     => ".is-style-vk-numbered-square-mark.{$unique_classname} li::before",
					'declarations' => array(
						'color'            => '#fff',
						'background-color' => vk_blocks_get_color_code( $block['attrs']['color'] ) . ' !important',
					),
				),
			);
		} elseif ( $is_numbered_circle ) {
			$list_styles = array(
				array(
					'selector'     => ".is-style-vk-numbered-circle-mark.{$unique_classname} li::before",
					'declarations' => array(
						'color'            => '#fff',
						'background-color' => vk_blocks_get_color_code( $block['attrs']['color'] ) . ' !important',
					),
				),
			);
		} else {
			$list_styles = array(
				array(
					'selector'     => ".{$unique_classname} li::marker,.{$unique_classname} li::before",
					'declarations' => array(
						'color' => vk_blocks_get_color_code( $block['attrs']['color'] ) . ' !important',
					),
				),
			);
		}
	}

	// フロントエンド用のスタイルエンジン処理
	if ( ! empty( $list_styles ) ) {
		wp_style_engine_get_stylesheet_from_css_rules(
			$list_styles,
			array(
				'context' => 'vk-blocks',
			)
		);
	}

	// エディター用のインラインスタイルを追加
	if ( is_admin() && ! empty( $list_styles ) ) {
		$css = '';
		foreach ( $list_styles as $style ) {
			$css .= $style['selector'] . ' {';
			foreach ( $style['declarations'] as $property => $value ) {
				$css .= $property . ': ' . $value . ';';
			}
			$css .= '}';
		}
		wp_add_inline_style( 'vk-blocks-build-editor-css', $css );
	}

	return $updated_html;
}
add_filter( 'render_block_core/list', 'vk_blocks_render_core_list', 10, 2 );

/**
 * Append a CSS declaration to an inline style string.
 *
 * @param string $style_attr Existing style attribute.
 * @param string $property   CSS property name.
 * @param string $value      CSS value.
 * @return string
 */
function vk_blocks_append_inline_style_declaration( $style_attr, $property, $value ) {
	$style_attr = (string) $style_attr;
	if ( '' !== $style_attr ) {
		$style_attr = rtrim( $style_attr );
		if ( ';' !== substr( $style_attr, -1 ) ) {
			$style_attr .= ';';
		}
	}
	return $style_attr . $property . ':' . $value . ';';
}

/**
 * Convert line-height attribute to a length value usable in CSS calculations.
 *
 * @param array $block Block attributes.
 * @return string
 */
function vk_blocks_get_numbered_list_line_height_length( $block ) {
	if ( empty( $block['attrs']['style']['typography']['lineHeight'] ) ) {
		return '';
	}

	$line_height = trim( $block['attrs']['style']['typography']['lineHeight'] );
	if ( '' === $line_height || 'normal' === strtolower( $line_height ) ) {
		return '';
	}

	if ( 0 === strpos( $line_height, 'var:preset|' ) ) {
		$line_height = vk_blocks_convert_preset_to_css_var( $line_height );
	}

	if ( 0 === strpos( strtolower( $line_height ), 'calc(' ) ) {
		return $line_height;
	}

	if ( 0 === strpos( $line_height, 'var(' ) ) {
		return 'calc( ' . $line_height . ' * 1em )';
	}

	if ( '%' === substr( $line_height, -1 ) ) {
		$numeric = rtrim( $line_height, '%' );
		if ( is_numeric( $numeric ) ) {
			return 'calc( ' . ( (float) $numeric / 100 ) . ' * 1em )';
		}
	}

	if ( is_numeric( $line_height ) ) {
		return 'calc( ' . $line_height . ' * 1em )';
	}

	return $line_height;
}

/**
 * Convert preset notation (var:preset|type|slug) to a CSS var string.
 *
 * @param string $value Preset notation.
 * @return string
 */
function vk_blocks_convert_preset_to_css_var( $value ) {
	if ( preg_match( '/^var:preset\|([^|]+)\|([^|]+)$/', $value, $matches ) ) {
		return sprintf( 'var(--wp--preset--%1$s--%2$s)', $matches[1], $matches[2] );
	}
	return $value;
}
