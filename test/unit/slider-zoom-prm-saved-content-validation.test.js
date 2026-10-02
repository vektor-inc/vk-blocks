/* eslint-disable jsdoc/check-tag-names */
/**
 * @jest-environment jsdom
 */
/* eslint-enable jsdoc/check-tag-names */
/* eslint-env jest */

// 「視差効果を減らす」対応（#3082）を入れても、それ以前に保存された投稿がリカバリーを
// 要求されないことを固定する。
//
// なぜ壊れうるか: スライダーのズーム用 CSS は `blocks.getSaveElement`（index.js）が
// <style> として保存マークアップに書き出しており、**保存内容の一部＝ブロック検証の対象**。
// #3082 で最終倍率を @media (prefers-reduced-motion: no-preference) で包んだため、
// 現行 save の出力は 1 文字単位で以前と変わっている。つまり 1.127.0 までに
// 「ズーム有効」で保存された投稿は、現行の save とは一致しない。
//
// なぜ救済できているか: 一致しない場合、Gutenberg は deprecated を順に試す。
// 1.125.0〜1.126.4 向けの deprecated（save1_126_4）は、対応するフック
// deprecated/hooks/1.126.4 が **包む前のズーム CSS** を出力する。この世代の save が現行と
// 違うのは停止/再生ボタンに焼き付いていたラベルだけで、そのラベルは
// `source: 'attribute'` で保存済みマークアップから読む。1.127.0 の保存内容にはラベルが
// 無く、値が undefined の属性を React は出力しないため、この save の出力は 1.127.0 の
// マークアップとそのまま一致する。結果として 1.127.0 世代も同じ deprecated で救われる。
//
// つまり #3082 では deprecated を新設していない。この「既存の deprecated が
// 1.127.0 も巻き取っている」という前提は、片方（ラベルの読み取り・フックの CSS）を
// 触ると静かに崩れる。崩れたことを検出するのがこのテスト。
//
// Pins down that the reduced-motion work (#3082) does not make posts saved before it ask for
// block recovery.
//
// Why it could break: the slider's zoom CSS is written into the saved markup as a <style> by
// `blocks.getSaveElement` (index.js), so it is part of the saved content and covered by block
// validation. #3082 wrapped the final scale in @media (prefers-reduced-motion: no-preference),
// so the current save output differs, character for character, from what it used to be — and
// content saved with zoom enabled up to 1.127.0 no longer matches the current save.
//
// Why it is nevertheless rescued: on a mismatch Gutenberg walks the deprecations. The one for
// 1.125.0 through 1.126.4 (save1_126_4) is paired with deprecated/hooks/1.126.4, which emits
// the zoom CSS as it was before the wrapping. What that generation's save does differently is
// the pause / play button labels baked into the markup, and those are read back out of the
// saved markup with `source: 'attribute'`. Content saved by 1.127.0 carries no labels, and
// React omits an attribute whose value is undefined, so that save's output matches the 1.127.0
// markup exactly — which is how the 1.127.0 generation ends up rescued by the same deprecation.
//
// In other words #3082 adds no deprecation of its own. That reliance — an existing deprecation
// also covering 1.127.0 — breaks silently if either side (reading the labels, or the hook's
// CSS) is touched. Catching that is what this test is for.

import fs from 'fs';
import path from 'path';
import {
	registerBlockType,
	unregisterBlockType,
	parse,
} from '@wordpress/blocks';

jest.mock('@wordpress/i18n', () => {
	const actual = jest.requireActual('@wordpress/i18n');
	return {
		...actual,
		__: (text) => text,
		_x: (text) => text,
	};
});

// index.js を副作用込みで import して、本番と同じ getSaveElement フィルタを登録する。
// これが無いとズーム用 <style> がそもそも出ず、検証パイプラインが本番と一致しない。
// Imported for its side effects so the real getSaveElement filter is registered, exactly as in
// production: without it no zoom <style> is emitted at all and the pipeline under test would
// not be the real one.
import {
	metadata as sliderMetadata,
	settings as sliderSettings,
} from '../../src/blocks/slider';
import {
	metadata as sliderItemMetadata,
	settings as sliderItemSettings,
} from '../../src/blocks/slider-item';
import '@wordpress/block-library/build-module/paragraph/init';

const FIXTURE_DIR = path.resolve(
	__dirname,
	'..',
	'e2e-tests',
	'fixtures',
	'blocks'
);

// #3082 より前（1.127.0）に「ズーム有効・停止/再生ボタン有効」で保存された投稿。
// 本文の <style> の最終倍率は @media で包まれていない＝出荷済みの形。
// A post saved before #3082 (by 1.127.0) with zoom and the pause / play button enabled. The
// final scale in its <style> is not wrapped in a media query — the shipped shape.
const PRE_FIX_FIXTURE =
	'vk-blocks__slider__deprecated-1-127-0-zoom-pause-button.html';

const readFixture = (fileName) =>
	fs.readFileSync(path.join(FIXTURE_DIR, fileName), 'utf8');

// parse() は「現行 save で検証 → 不一致なら deprecated を走査」という本番どおりの手順を
// 踏むため、救済が成功する正常系でも診断ログを出す。@wordpress/jest-console が未宣言の
// console 呼び出しで fail させるので握りつぶす（救済の成否は isValid で確認する）。
// parse() follows the production path — validate against the current save, then walk the
// deprecations — so it logs diagnostics even when the rescue succeeds. @wordpress/jest-console
// fails a test on undeclared console calls, so they are silenced here; the rescue itself is
// asserted through isValid.
const muteParseConsole = () => {
	/* eslint-disable no-console */
	const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
	const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
	/* eslint-enable no-console */
	return {
		restore: () => {
			errSpy.mockRestore();
			warnSpy.mockRestore();
			infoSpy.mockRestore();
		},
	};
};

describe('スライダー: #3082 より前に保存されたズーム投稿の検証 / zoom content saved before #3082', () => {
	beforeAll(() => {
		// edit は jsdom 上で不要なので最小スタブに差し替える（検証は save / deprecated のみ使う）。
		// category は独自カテゴリが jest 環境に未登録で警告になるため core の 'text' に寄せる。
		// The edit component is not needed under jsdom, so it is stubbed out; only save and the
		// deprecations take part in validation. The custom category is not registered in the
		// jest environment and would warn, so a core one is used instead.
		registerBlockType(
			{ ...sliderItemMetadata, category: 'text' },
			{ ...sliderItemSettings, edit: () => null }
		);
		registerBlockType(
			{ ...sliderMetadata, category: 'text' },
			{ ...sliderSettings, edit: () => null }
		);
	});

	afterAll(() => {
		unregisterBlockType('vk-blocks/slider');
		unregisterBlockType('vk-blocks/slider-item');
	});

	it('リカバリーを求められない / is not asked for block recovery', () => {
		const { restore } = muteParseConsole();

		try {
			const blocks = parse(readFixture(PRE_FIX_FIXTURE));

			expect(blocks).toHaveLength(1);
			expect(blocks[0].name).toBe('vk-blocks/slider');
			// 救済できていれば true。ここが false になったら、#3082 より前に保存された
			// ズーム付きの投稿が既存サイトで一斉にリカバリー表示になる。
			// True when the rescue works. A false here means every existing post with zoom
			// saved before #3082 shows the recovery notice.
			expect(blocks[0].isValid).toBe(true);
		} finally {
			restore();
		}
	});

	it('前提: fixture の最終倍率が @media で包まれていない / the fixture carries an unwrapped final scale', () => {
		// fixture を現行形式に作り替えてしまうと、上の検証が「現行 save と一致しただけ」に
		// なり、deprecated 経由の救済を何も確かめないまま通ってしまう。それを防ぐ。
		// If the fixture were ever regenerated in the current format, the assertion above would
		// pass merely by matching the current save and would stop exercising the rescue at all.
		const html = readFixture(PRE_FIX_FIXTURE);

		expect(html).toContain('.swiper-slide-active::before');
		expect(html).not.toContain('prefers-reduced-motion');
	});
});
