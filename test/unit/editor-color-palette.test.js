/* eslint-env jest */
/**
 * issue #3237 — エディターのカラーパレットを1つの一覧に結合する処理のテスト
 *
 * `getSettings().colors` はコアが `custom ?? theme ?? default` と1階層しか入れない
 * （wp-includes/block-editor.php）。そのためサイト側が Global Styles で独自色を1色でも
 * 足すと、テーマパレットの色が一覧から丸ごと外れる。利用者がクリックする ColorPalette は
 * 3階層すべてを表示するので、`colors` だけで引くとパレットの大半を取りこぼす。
 */

// @wordpress/data の select はモックする
// （このテストが読み込むモジュールは @wordpress/data 以外のストアを使わない）
jest.mock('@wordpress/data', () => ({
	select: jest.fn(),
}));

import { select } from '@wordpress/data';
import { getEditorColorPalette } from '../../src/utils/editor-color-palette';

// ── ヘルパー: モックの組み立て ───────────────────────────────────────────────

/**
 * ブロックエディターの設定が指定の内容を返すようにモックする。
 *
 * @param {Object|undefined} settings getSettings() が返す設定オブジェクト。
 */
const mockEditorSettings = (settings) => {
	select.mockImplementation((store) =>
		store === 'core/block-editor' ? { getSettings: () => settings } : {}
	);
};

const THEME = [{ name: 'Primary', slug: 'primary', color: '#233A73' }];
const DEFAULT = [{ name: 'Black', slug: 'black', color: '#000000' }];
const CUSTOM = [{ name: 'My Color', slug: 'custom-1', color: '#abcdef' }];

beforeEach(() => {
	select.mockReset();
});

describe('getEditorColorPalette', () => {
	it('標準・テーマ・カスタムの3階層をすべて含む', () => {
		mockEditorSettings({
			// コアはカスタム階層だけを colors に入れる（= テーマ色が落ちる状態）
			colors: CUSTOM,
			__experimentalFeatures: {
				color: { palette: { default: DEFAULT, theme: THEME, custom: CUSTOM } },
			},
		});

		expect(getEditorColorPalette().map(({ slug }) => slug)).toEqual([
			// 並び順は ColorPalette の表示順（テーマ → 標準 → カスタム）
			'primary',
			'black',
			'custom-1',
		]);
	});

	it('同じスラッグは custom > theme > default の順で後から上書きされる', () => {
		mockEditorSettings({
			colors: [],
			__experimentalFeatures: {
				color: {
					palette: {
						default: [{ slug: 'primary', color: '#111111' }],
						theme: [{ slug: 'primary', color: '#222222' }],
						custom: [{ slug: 'primary', color: '#333333' }],
					},
				},
			},
		});

		expect(getEditorColorPalette()).toEqual([
			{ slug: 'primary', color: '#333333' },
		]);
	});

	it('__experimentalFeatures が取れない場合は getSettings().colors へ退避する', () => {
		mockEditorSettings({ colors: THEME });

		expect(getEditorColorPalette()).toEqual(THEME);
	});

	it('設定そのものが取れない場合は空の配列を返す', () => {
		mockEditorSettings(undefined);
		expect(getEditorColorPalette()).toEqual([]);

		select.mockImplementation(() => undefined);
		expect(getEditorColorPalette()).toEqual([]);
	});
});
