/* eslint-env jest */
/**
 * issue #3237 — 蛍光マーカーの保存形式（パレットの色はスラッグで保存する）のテスト
 *
 * 固定したい境界は3つ。
 *
 * 1. パレットの一覧は標準・テーマ・カスタムの3階層を結合して引く（結合そのものの検証は
 *    editor-color-palette.test.js）。ここでは結合した一覧で引けることを固定する。
 * 2. CSS 変数名はコアと同じ正規化（kebab-case）を通す。通さないと変数が解決されず、
 *    追従が静かに効かなくなる。`data-color` には正規化前のスラッグを残す。
 * 3. 不透明度つきのパレット色には 0.7 を掛けない（#1356 の維持）。0.7 を掛ける側の変数
 *    （--vk-highlighter-base）に入れると、CSS 側で二重に薄くなる。
 */

// カラー関連のユーティリティはコアと同じ実装でモックする（リポジトリの既存テストと同じ方針）。
// @wordpress/block-editor をそのまま読み込むとエディター一式が持ち込まれるため。
jest.mock('@wordpress/block-editor', () => ({
	getColorObjectByColorValue: (colors, colorValue) =>
		colors?.find((color) => color.color === colorValue),
	getColorObjectByAttributeValues: (colors, definedColor, customColor) => {
		if (definedColor) {
			const colorObj = colors?.find((color) => color.slug === definedColor);
			if (colorObj) {
				return colorObj;
			}
		}
		return { color: customColor };
	},
}));

// パレットの一覧はテストごとに差し替える
jest.mock('@vkblocks/utils/editor-color-palette', () => ({
	getEditorColorPalette: jest.fn(),
}));

import { getEditorColorPalette } from '@vkblocks/utils/editor-color-palette';
import {
	buildHighlighterAttributes,
	getFallbackColorFromStyle,
	getHighlighterColorCode,
	defaultColor,
} from '../../src/extensions/common/highlighter/common';

// ── ヘルパー: モックの組み立て ───────────────────────────────────────────────

/**
 * パレットの一覧（3階層を結合した後の形）を指定する。
 *
 * @param {Array} colors パレットの色データの配列。
 */
const mockPaletteColors = (colors) => {
	getEditorColorPalette.mockReturnValue(colors);
};

const THEME_COLORS = [
	{ name: 'Primary', slug: 'primary', color: '#233A73' },
	{ name: 'Text Normal', slug: 'text-normal', color: '#333' },
	{ name: 'Text Secondary', slug: 'text-secondary', color: 'rgba(0,0,0,0.5)' },
];
const DEFAULT_COLORS = [{ name: 'Black', slug: 'black', color: '#000000' }];
const CUSTOM_COLORS = [
	{ name: 'My Color', slug: 'custom-1', color: '#abcdef' },
];

beforeEach(() => {
	getEditorColorPalette.mockReset();
});

describe('buildHighlighterAttributes', () => {
	it('サイト側がカスタム色を足していても、テーマパレットの色はスラッグで保存される', () => {
		// 結合した一覧ならテーマ色も含まれる（コアの colors はカスタム階層だけになる）
		mockPaletteColors([
			...THEME_COLORS,
			...DEFAULT_COLORS,
			...CUSTOM_COLORS,
		]);

		expect(buildHighlighterAttributes('#233A73')).toEqual({
			data: 'primary',
			style: '--vk-highlighter-base: var(--wp--preset--color--primary, #233A73);',
		});
	});

	it('標準パレットの色もスラッグで保存される', () => {
		mockPaletteColors(DEFAULT_COLORS);

		expect(buildHighlighterAttributes('#000000')).toEqual({
			data: 'black',
			style: '--vk-highlighter-base: var(--wp--preset--color--black, #000000);',
		});
	});

	it('同じスラッグはカスタム階層が優先される', () => {
		// 同じスラッグはカスタム階層で上書きされた後の形で届く
		mockPaletteColors([{ name: 'Primary', slug: 'primary', color: '#ff0000' }]);

		// テーマ側の色コードではもう引けない（上書きされているため）
		expect(buildHighlighterAttributes('#233A73').data).toBe('#233A73');
		expect(buildHighlighterAttributes('#ff0000')).toEqual({
			data: 'primary',
			style: '--vk-highlighter-base: var(--wp--preset--color--primary, #ff0000);',
		});
	});

	it('不透明度つきのパレット色は 0.7 を掛ける側の変数に入れない（#1356）', () => {
		mockPaletteColors(THEME_COLORS);

		const attributes = buildHighlighterAttributes('rgba(0,0,0,0.5)');
		expect(attributes).toEqual({
			data: 'text-secondary',
			style: '--vk-highlighter-color: var(--wp--preset--color--text-secondary, rgba(0,0,0,0.5));',
		});
		expect(attributes.style).not.toContain('--vk-highlighter-base');
	});

	it('kebab-case でないスラッグは、CSS 変数名だけコアと同じ正規化を通す', () => {
		mockPaletteColors([{ name: 'Brand', slug: 'brand_blue', color: '#0000ff' }]);

		expect(buildHighlighterAttributes('#0000ff')).toEqual({
			// data-color はパレットの一覧が持つ正規化前のスラッグのまま
			data: 'brand_blue',
			style: '--vk-highlighter-base: var(--wp--preset--color--brand-blue, #0000ff);',
		});
	});

	it('正規化すると空になるスラッグは、従来どおり色コードで保存する', () => {
		mockPaletteColors([{ name: '記号', slug: '---', color: '#0000ff' }]);

		expect(buildHighlighterAttributes('#0000ff')).toEqual({
			data: '#0000ff',
			style: '--vk-highlighter-color: rgba(0, 0, 255, 0.7);',
		});
	});

	it('パレットに無い色は従来どおり色コードで保存する', () => {
		mockPaletteColors(THEME_COLORS);

		expect(buildHighlighterAttributes('#ed65a5')).toEqual({
			data: '#ed65a5',
			style: '--vk-highlighter-color: rgba(237, 101, 165, 0.7);',
		});
	});

	it('色が指定されていない場合は既定色が入る', () => {
		mockPaletteColors([]);

		expect(buildHighlighterAttributes(undefined)).toEqual({
			data: defaultColor,
			style: '--vk-highlighter-color: rgba(255, 253, 107, 0.7);',
		});
	});

});

describe('getFallbackColorFromStyle', () => {
	it('予備の色コードを取り出す（括弧を含む値も取れる）', () => {
		const cases = [
			[
				'--vk-highlighter-base: var(--wp--preset--color--black, #000000);',
				'#000000',
			],
			[
				'--vk-highlighter-color: var(--wp--preset--color--text-secondary, rgba(0,0,0,0.5));',
				'rgba(0,0,0,0.5)',
			],
			// 予備の値を持たない従来の保存形式は対象外
			['--vk-highlighter-color: rgba(237, 101, 165, 0.7);', undefined],
			[undefined, undefined],
			// var( が閉じていない壊れた形は対象外
			[
				'--vk-highlighter-base: var(--wp--preset--color--black, #000000',
				undefined,
			],
			// 予備の値が空の形も対象外
			[
				'--vk-highlighter-base: var(--wp--preset--color--black, );',
				undefined,
			],
			// 他の宣言が後ろに続いていても、var() の中だけを見る
			[
				'--vk-highlighter-base: var(--wp--preset--color--primary, #233A73);color:red',
				'#233A73',
			],
		];

		cases.forEach(([style, expected]) => {
			expect(getFallbackColorFromStyle(style)).toBe(expected);
		});
	});

	/*
	 * 寄稿者が本文に仕込める形（括弧が釣り合っているため kses を通過する）。
	 * 最短一致の正規表現だった頃は、空白4,000個で約20秒かかっていた（記事を開いた
	 * 編集者・管理者側のエディターが止まる）。正規表現に戻されたらこのテストが落ちる。
	 */
	it('長い空白を含む一致しない style でも、待たされずに undefined が返る', () => {
		const style = `--vk-highlighter-base: var(--wp--preset--color--zzz,${' '.repeat(
			4000
		)});color:red`;

		const startedAt = Date.now();
		expect(getFallbackColorFromStyle(style)).toBeUndefined();
		expect(Date.now() - startedAt).toBeLessThan(100);
	});
});

describe('getHighlighterColorCode', () => {
	it('スラッグが引ければパレットの色コードを返す', () => {
		mockPaletteColors(THEME_COLORS);

		expect(
			getHighlighterColorCode({
				data: 'primary',
				style: '--vk-highlighter-base: var(--wp--preset--color--primary, #old);',
			})
		).toBe('#233A73');
	});

	it('スラッグが引けない場合は style に残した予備の色コードを返す', () => {
		// パレットから色が削除された／テーマを乗り換えてスラッグが変わった状態
		mockPaletteColors([]);

		expect(
			getHighlighterColorCode({
				data: 'primary',
				style: '--vk-highlighter-base: var(--wp--preset--color--primary, #233A73);',
			})
		).toBe('#233A73');
	});

	it('色コードで保存されている場合はその色コードを返す', () => {
		mockPaletteColors(THEME_COLORS);

		expect(
			getHighlighterColorCode({
				data: '#ed65a5',
				style: '--vk-highlighter-color: rgba(237, 101, 165, 0.7);',
			})
		).toBe('#ed65a5');
	});

	it('色が設定されていない場合は undefined を返す', () => {
		mockPaletteColors([]);

		expect(getHighlighterColorCode(undefined)).toBeUndefined();
		expect(getHighlighterColorCode({})).toBeUndefined();
	});
});
