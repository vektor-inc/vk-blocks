/**
 * テスト共通ユーティリティ（unit / e2e の双方から利用）。
 */

// 正規表現に動的な文字列を埋め込む際、メタ文字をエスケープするためのヘルパー。
export const escapeRegExp = (value: string): string =>
	value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
