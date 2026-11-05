<?php
/**
 * Get_hex_to_rgba
 *
 * @package vk-blocks
 */

// Do not load directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Get_color_code
 *
 * 保存されたカラーの名前orカラーコードからCSS変数に変換する関数
 *
 * @param string $value : color string.
 *
 * @return string
 */
function vk_blocks_get_color_code( $value ) {
	// 16進数の色コード
	if ( preg_match( '/^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6}|[a-fA-F0-9]{8})$/', $value ) ) {
		$return = $value;
	} elseif ( preg_match( '/^rgba?\s*\(/', $value ) ) {
		// rgba()形式を#形式に変換
		if ( preg_match( '/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/', $value, $matches ) ) {
			$r = intval( $matches[1] );
			$g = intval( $matches[2] );
			$b = intval( $matches[3] );
			$a = isset( $matches[4] ) ? floatval( $matches[4] ) : 1.0;
			// RGBを16進数に変換
			$hex = sprintf( '#%02x%02x%02x', $r, $g, $b );
			// アルファ値がある場合は8桁の16進数に変換
			if ( $a < 1.0 ) {
				$alpha_hex = sprintf( '%02x', round( $a * 255 ) );
				$hex      .= $alpha_hex;
			}
			$return = $hex;
		} else {
			$return = $value;
		}
	} elseif ( strpos( $value, '-' ) !== false ) {
		// ハイフンを含む場合はWordPressカラーパレットのスラッグとして処理
		$slug   = str_replace( '--', '-', $value );
		$slug   = rtrim( $slug, '-' );
		$return = 'var(--wp--preset--color--' . $slug . ')';
	} elseif ( preg_match( '/^[a-zA-Z]+$/', $value ) ) {
		// ハイフンを含まない英字のみの場合はWordPressカラーパレットのスラッグとして処理
		// （テストケースに合わせて、'black'などもWordPressのカラーパレットスラッグとして扱う）
		$return = 'var(--wp--preset--color--' . $value . ')';
	} else {
		// その他はそのまま返す
		$return = $value;
	}
	return $return;
}

/**
 * Get_safe_color_code
 *
 * 保存された色の値を CSS の色コードに変換し、安全な形だけを返す関数。
 * 許可する形は HEX（#fff / #ffff / #ffffff / #ffffffff）と、パレットスラッグの CSS 変数のみ。
 * スラッグは ASCII 英数字・_・- に加え、日本語や絵文字など ASCII 以外の文字も許可する（CSS の区切りは ASCII のみのため）。
 * それ以外（<style> を閉じる文字や宣言を足す文字を含む値など）は空文字を返す。
 *
 * @param string $value : color string.
 *
 * @return string 安全な色コード。許可しない値のときは空文字。
 */
function vk_blocks_get_safe_color_code( $value ) {
	if ( ! is_string( $value ) ) {
		return '';
	}

	// 既存の変換を通した結果が、許可する形に一致するものだけ返す
	$color_code = vk_blocks_get_color_code( $value );
	if ( preg_match( '/\A#(?:[a-fA-F0-9]{3}|[a-fA-F0-9]{4}|[a-fA-F0-9]{6}|[a-fA-F0-9]{8})\z/', $color_code ) ) {
		return $color_code;
	}
	if ( preg_match( '/\Avar\(--wp--preset--color--(?:[a-zA-Z0-9_-]|[^\x00-\x7F])+\)\z/u', $color_code ) ) {
		return $color_code;
	}
	return '';
}
