/* eslint-env jest */
/**
 * タブラベルのパディング・角丸設定（issue #3022）で追加した UI 文字列の
 * 日本語翻訳が、ビルド済みの翻訳 JSON（jed 形式）に含まれていることを確認する回帰テスト。
 *
 * 翻訳ファイルを再生成した際に新規訳が欠落していないかを検知する目的。
 */
import fs from 'fs';
import path from 'path';

// 検証対象の翻訳 JSON（同一 .po から生成される build-js / admin-js の両ハンドル用）
// 片方だけ再生成された場合などのキー欠落・ドリフトを検知するため両方を確認する
const TRANSLATION_JSON_PATHS = {
	'build-js': path.resolve(
		__dirname,
		'../../languages/vk-blocks-pro-ja-vk-blocks-build-js.json'
	),
	'admin-js': path.resolve(
		__dirname,
		'../../languages/vk-blocks-pro-ja-vk-blocks-admin-js.json'
	),
};

// issue #3022 で追加した英語文字列 → 期待する日本語訳の対応表
const EXPECTED_TRANSLATIONS = {
	'Tab Label Design': 'タブラベルのデザイン',
	'Tab Label Padding': 'タブラベルの余白',
	'Tab Label Border Radius': 'タブラベルの角丸',
	'Top and bottom': '上下',
	'Left and right': '左右',
	'Top left': '左上',
	'Top right': '右上',
};

describe('タブラベルのパディング・角丸設定の日本語翻訳', () => {
	// build-js / admin-js の各 JSON について同じ検証を行う
	describe.each(Object.entries(TRANSLATION_JSON_PATHS))(
		'%s の翻訳 JSON',
		(handle, jsonPath) => {
			// jed 形式 JSON から msgid → msgstr のマップを取り出す
			const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
			const messages = json.locale_data.messages;

			it.each(Object.entries(EXPECTED_TRANSLATIONS))(
				'"%s" が "%s" に翻訳されている',
				(msgid, expected) => {
					// jed 形式では各 msgid の値は [msgstr] の配列
					expect(messages[msgid]).toBeDefined();
					expect(messages[msgid][0]).toBe(expected);
				}
			);
		}
	);
});
