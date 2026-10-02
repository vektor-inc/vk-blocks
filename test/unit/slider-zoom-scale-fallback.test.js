/* eslint-disable jsdoc/check-tag-names */
/**
 * @jest-environment jsdom
 */
/* eslint-enable jsdoc/check-tag-names */
/* eslint-env jest */

// ズーム倍率が壊れた値でも CSS に流れ込まないことを固定する。#3082
//
// 倍率は 2 か所で CSS に埋め込まれる。どちらも同じ `toZoomScale` 相当の処理を持つが、
// view.js は gulp が直接 minify する制約で import が使えず、実装が重複している。
//   (a) 保存マークアップの <style>: src/blocks/slider/index.js の blocks.getSaveElement
//   (b) 表示時に <head> へ足す <style>: src/blocks/slider/view.js
//
// 素通しだと `scale(NaN)` や `scale(undefined)` のような無効な宣言が出る。CSS は無効宣言を
// 捨てるため、`transform` が効かずに背景が原寸で出たり、「視差効果を減らす」時の上書きが
// 消えてズームが止まらなくなったりする。(a) は保存内容＝ブロック検証の対象でもあるため、
// 出力がぶれること自体が事故になりうる。
//
// 無効値は理屈の上の話ではない。倍率は data-vkb-slider の JSON から来るので、手書きの
// マークアップ、他ツールが書き換えた投稿、古い typo 属性（zoomFinalScal）からの引き継ぎで
// 文字列や欠損値が入りうる。
//
// 期待する値: 初期倍率の既定は 1、最終倍率の既定は 1.25。両方を (a)(b) 双方で確認する。
//
// Pins down that a broken zoom scale never reaches the CSS. #3082
//
// The scales are embedded in two places, each carrying its own copy of the same `toZoomScale`
// logic — view.js is minified directly by gulp and cannot import, hence the duplication:
//   (a) the <style> in the saved markup, from blocks.getSaveElement in src/blocks/slider/index.js
//   (b) the <style> src/blocks/slider/view.js appends to <head> at display time
//
// Passed through unchecked, they produce invalid declarations such as `scale(NaN)` or
// `scale(undefined)`. CSS drops an invalid declaration, so the `transform` simply does not
// apply: the background renders unzoomed, or the reduced-motion override disappears and the
// zoom keeps running. (a) is also part of the saved content and therefore covered by block
// validation, so unstable output there is a problem in its own right.
//
// Invalid values are not hypothetical: the scales come from the data-vkb-slider JSON, so
// hand-written markup, posts rewritten by another tool, or a value carried over from the old
// typo attribute (zoomFinalScal) can all deliver strings or missing values.
//
// Expected: the initial scale defaults to 1 and the final scale to 1.25, in both (a) and (b).

import { renderToStaticMarkup } from 'react-dom/server';
import { applyFilters } from '@wordpress/hooks';

// index.js を副作用込みで import して、本番と同じ blocks.getSaveElement フィルタを登録する。
// Imported for its side effects, registering the real blocks.getSaveElement filter.
import '../../src/blocks/slider';

jest.mock('@wordpress/i18n', () => {
	const actual = jest.requireActual('@wordpress/i18n');
	return {
		...actual,
		__: (text) => text,
		_x: (text) => text,
	};
});

const BLOCK_ID = 'testblock';
const DEFAULT_INITIAL_SCALE = 1;
const DEFAULT_FINAL_SCALE = 1.25;

const baseAttributes = {
	blockId: BLOCK_ID,
	autoPlay: false,
	autoPlayStop: false,
	autoPlayDelay: 2500,
	pauseButton: false,
	pagination: 'bullets',
	width: '',
	loop: false,
	effect: 'slide',
	speed: 500,
	direction: 'rtl',
	slidesPerViewMobile: 1,
	slidesPerViewTablet: 1,
	slidesPerViewPC: 1,
	slidesPerGroup: 'one-by-one',
	centeredSlides: false,
	zoomAnimation: true,
};

// 倍率として受け付けてはいけない値。Number() を通すと NaN・Infinity・0 以下になるものと、
// 数値に見えない文字列を並べている。undefined / null は属性が欠けている投稿に相当する。
// Values that must never be accepted as a scale: everything that Number() turns into NaN,
// Infinity or a non-positive number, plus strings that are not numbers at all. undefined and
// null stand for posts where the attribute is missing.
const invalidScales = [
	['NaN', NaN],
	['Infinity', Infinity],
	['-Infinity', -Infinity],
	['0', 0],
	['負の数 / a negative number', -1.5],
	['数値でない文字列 / a non-numeric string', 'zoom!'],
	['空文字 / an empty string', ''],
	['undefined', undefined],
	['null', null],
];

/**
 * 保存マークアップ側（index.js の blocks.getSaveElement）が出す CSS を取り出す。
 *
 * type.save は deprecated のどの save でもない関数を渡す。deprecated/hooks の対応表は
 * save 関数の参照で引くため、これで本番の「現行の保存形式」の経路を通る。
 *
 * Returns the CSS emitted for the saved markup by blocks.getSaveElement in index.js. The
 * `type.save` passed in is a function that is none of the deprecated saves, so the lookup in
 * deprecated/hooks misses and the current-format path — the one under test — runs.
 *
 * @param {Object} attributes ブロックの属性 / the block attributes.
 * @return {string} 出力された CSS（<style> の中身を含む HTML 文字列）/ the emitted markup.
 */
const getSavedCss = (attributes) =>
	renderToStaticMarkup(
		applyFilters(
			'blocks.getSaveElement',
			null,
			{ name: 'vk-blocks/slider', save: () => null },
			attributes
		)
	);

/**
 * view.js を読み込んで実行し、<head> に足された <style> の中身を返す。
 *
 * view.js は 'load' で動き、毎回の require() でリスナーが積み上がるため、この require() が
 * 登録したリスナーだけを直接呼んで、呼んだ後に解除する
 * （test/unit/slider-view-actual-count.test.js と同じ手順）。
 *
 * Loads and runs view.js, returning the text of the <style> it appends to <head>. view.js acts
 * on 'load' and each require() piles up another listener, so only the listener registered by
 * this require() is invoked directly and then removed — the same approach as
 * test/unit/slider-view-actual-count.test.js.
 *
 * @param {Object} attributes data-vkb-slider に入れる属性 / the attributes to put in data-vkb-slider.
 * @return {string} <head> に追加された <style> の中身 / the appended <style> text.
 */
const getViewCss = (attributes) => {
	document.body.innerHTML = `
		<div data-vkb-slider='${JSON.stringify(attributes)}' class="vk_slider vk_slider_${BLOCK_ID}">
			<div class="swiper-wrapper">
				<div class="swiper-slide vk_slider_item"></div>
			</div>
			<div class="swiper-pagination"></div>
		</div>
	`;

	global.Swiper = jest.fn(function FakeSwiper() {
		return {};
	});

	const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
	jest.resetModules();
	require('../../src/blocks/slider/view.js');
	const loadCall = addEventListenerSpy.mock.calls.find(
		([type]) => type === 'load'
	);
	addEventListenerSpy.mockRestore();

	if (loadCall) {
		const [, listener] = loadCall;
		listener();
		window.removeEventListener('load', listener);
	}

	return Array.from(document.head.querySelectorAll('style'))
		.map((style) => style.textContent)
		.join('\n');
};

/**
 * CSS に無効な倍率が 1 つも出ていないことを確認する。
 *
 * 個別の `scale()` を数え上げるより、壊れた値が文字列としてどこにも現れないことを見る方が
 * 取りこぼしが無い（将来セレクタが増えても効く）。
 *
 * Asserts that no invalid scale made it into the CSS. Checking that the broken values appear
 * nowhere as text catches more than enumerating individual `scale()` calls, and keeps working
 * when selectors are added later.
 *
 * @param {string} css 検査対象の CSS / the CSS under test.
 */
const expectNoBrokenScale = (css) => {
	expect(css).not.toMatch(/scale\(\s*(NaN|undefined|null|Infinity)/i);
	expect(css).not.toMatch(/scale\(\s*-/);
	expect(css).not.toMatch(/scale\(\s*0\s*\)/);
	expect(css).not.toContain('scale()');
};

describe('スライダー: ズーム倍率のフォールバック / zoom scale fallback', () => {
	afterEach(() => {
		delete global.Swiper;
		document.body.innerHTML = '';
		document.head.innerHTML = '';
	});

	describe('保存マークアップの CSS（index.js）/ the saved markup CSS', () => {
		it.each(invalidScales)(
			'初期倍率が %s でも scale(1) になる / falls back to scale(1)',
			(_label, value) => {
				const css = getSavedCss({
					...baseAttributes,
					zoomInitialScale: value,
					zoomFinalScale: 2,
				});

				// 基本規則と、前後スライドの規則の両方が初期倍率を使う。
				// Both the base rule and the prev / next rule use the initial scale.
				expect(css.match(/scale\(1\)/g)).toHaveLength(2);
				expectNoBrokenScale(css);
			}
		);

		it.each(invalidScales)(
			'最終倍率が %s でも scale(1.25) になる / falls back to scale(1.25)',
			(_label, value) => {
				const css = getSavedCss({
					...baseAttributes,
					zoomInitialScale: 1,
					zoomFinalScale: value,
				});

				// 最終倍率は「視差効果を減らす」を要求していない環境向けの規則にだけ入る。
				// The final scale appears only in the rule for visitors who have not asked for
				// reduced motion.
				expect(css).toContain('prefers-reduced-motion: no-preference');
				expect(css).toContain(`scale(${DEFAULT_FINAL_SCALE})`);
				expectNoBrokenScale(css);
			}
		);

		it('数値として読める文字列はその値を使う / a numeric string is used as its number', () => {
			// block.json の型は number だが、data-vkb-slider の JSON を手で書き換えた投稿など
			// 文字列で入ってくる経路がある。切り捨てずに数値として通すことを固定する。
			// block.json types these as numbers, but they can arrive as strings — from markup
			// edited by hand, for instance. Pin down that such a value is used, not discarded.
			const css = getSavedCss({
				...baseAttributes,
				zoomInitialScale: '1.5',
				zoomFinalScale: '2.5',
			});

			expect(css).toContain('scale(1.5)');
			expect(css).toContain('scale(2.5)');
			expectNoBrokenScale(css);
		});
	});

	describe('表示時に足す CSS（view.js）/ the CSS added at display time', () => {
		it.each(invalidScales)(
			'初期倍率が %s でも scale(1) になる / falls back to scale(1)',
			(_label, value) => {
				const css = getViewCss({
					...baseAttributes,
					zoomInitialScale: value,
					zoomFinalScale: 2,
				});

				// 「視差効果を減らす」時の上書きも初期倍率へ戻すため、こちらにも出る。
				// The reduced-motion override returns to the initial scale as well, so it
				// appears there too.
				expect(css).toContain('prefers-reduced-motion: reduce');
				expect(css).toContain(
					`scale(${DEFAULT_INITIAL_SCALE}) !important`
				);
				expectNoBrokenScale(css);
			}
		);

		it.each(invalidScales)(
			'最終倍率が %s でも scale(1.25) になる / falls back to scale(1.25)',
			(_label, value) => {
				const css = getViewCss({
					...baseAttributes,
					zoomInitialScale: 1,
					zoomFinalScale: value,
				});

				expect(css).toContain('prefers-reduced-motion: no-preference');
				expect(css).toContain(`scale(${DEFAULT_FINAL_SCALE})`);
				expectNoBrokenScale(css);
			}
		);

		it('壊れた倍率でも「視差効果を減らす」時の上書きが残る / the reduced-motion override survives a broken scale', () => {
			// 上書きが消えると、既存投稿の本文に残っている包まれていない最終倍率が通ってしまい、
			// 「視差効果を減らす」を設定していてもズームが動き続ける（#3082 の不具合そのもの）。
			// If the override were dropped, the unwrapped final scale still sitting in existing
			// posts would win and the zoom would keep running for visitors who asked for
			// reduced motion — exactly the bug #3082 is about.
			const css = getViewCss({
				...baseAttributes,
				zoomInitialScale: NaN,
				zoomFinalScale: NaN,
			});

			expect(css).toMatch(
				/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*scale\(1\) !important;[\s\S]*\}/
			);
		});
	});
});
