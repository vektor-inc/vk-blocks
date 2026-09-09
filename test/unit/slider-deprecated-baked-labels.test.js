/* eslint camelcase: 0 */
/* eslint-disable jsdoc/check-tag-names */
/**
 * @jest-environment jsdom
 */
/* eslint-enable jsdoc/check-tag-names */
/* eslint-env jest */

// 停止/再生ボタンのラベルが焼き付いていた世代の deprecated が、翻訳やロケールに依存せず
// 保存内容を復元できることを固定する。#3071
//
// この性質が無いと何が起きるか: ラベルは 1.126.4 まで保存内容に焼き付いていた。その値を
// deprecated の save が `__()` で作り直すと、「保存した時の訳文」と「いま開いている人の
// ロケールの現在の訳文」が食い違った瞬間に保存内容と一致せず、ブロックエディタが
// リカバリー警告を出す。訳文の変更や、ユーザーごとに異なる管理画面言語だけでなく、
// エディタ用の翻訳 JSON が読み込まれなかっただけでも `__()` は英語を返すため、
// 日本語で保存した投稿が丸ごと警告対象になる。
//
// 実装では `source: 'attribute'` で保存済みマークアップから実値を読み、save がそれを
// そのまま出力することで一致を保証している。ここではその「訳文と食い違っていても一致する」
// という性質そのものを検証する。本 PR の開発中、この検証が無かったために
// 「原理的に救えない」という誤った結論が通ってしまった経緯がある。
//
// Pins down that the deprecations for the generations which baked the pause / play button's
// labels into the saved content can restore it regardless of translation or locale. #3071
//
// Why it matters: the labels were part of the saved content up to 1.126.4. If a deprecation's
// save rebuilds them with `__()`, the output stops matching the saved content as soon as the
// translation at save time and the current translation in the reader's locale diverge, and the
// block editor raises a recovery notice. That happens not only when the wording changes or
// when users have different admin languages, but also when the editor's translation JSON
// merely fails to load: `__()` then returns English and every post saved in Japanese is hit.
//
// The implementation reads the real values out of the saved markup with `source: 'attribute'`
// and emits exactly those, which guarantees the match. What is verified here is that property
// itself — matching even when the labels differ from any translation. The absence of this
// check is what let the (incorrect) conclusion "this cannot be rescued" stand while this PR
// was being developed.

import { renderToStaticMarkup } from 'react-dom/server';
import save1_126_4 from '../../src/blocks/slider/deprecated/save/1.126.4/save';
import save1_124_0 from '../../src/blocks/slider/deprecated/save/1.124.0/save';

jest.mock('@wordpress/block-editor', () => ({
	InnerBlocks: { Content: () => null },
	useBlockProps: {
		save: ({ className }) => ({ className: className?.trim() }),
	},
}));

// 保存当時の訳文に見立てた文字列。現在の翻訳（英語の原文でも日本語訳でも）とは一致しない。
// Strings standing in for the translation as it was at save time; they match no current
// translation, English original or Japanese alike.
const SAVED_ARIA_LABEL = 'ЯКИЙСЬ СТАРИЙ ПЕРЕКЛАД';
const SAVED_LABEL_PAUSE = 'ЯКИЙСЬ СТАРИЙ ПЕРЕКЛАД';
const SAVED_LABEL_PLAY = 'ІНШИЙ СТАРИЙ ПЕРЕКЛАД';

const baseAttributes = {
	blockId: 'test',
	pagination: 'bullets',
	navigationPosition: 'mobile-bottom',
	autoPlay: true,
	autoPlayStop: true,
	autoPlayDelay: 2500,
	pauseButton: true,
	loop: true,
	effect: 'slide',
	speed: 500,
	direction: 'rtl',
	slidesPerViewMobile: 1,
	slidesPerViewTablet: 1,
	slidesPerViewPC: 1,
	slidesPerGroup: 'one-by-one',
	centeredSlides: false,
	zoomAnimation: false,
	zoomInitialScale: 1,
	zoomFinalScale: 1.25,
	width: '',
};

const withBakedLabels = {
	...baseAttributes,
	bakedAriaLabel: SAVED_ARIA_LABEL,
	bakedLabelPause: SAVED_LABEL_PAUSE,
	bakedLabelPlay: SAVED_LABEL_PLAY,
};

// 両世代とも同じ性質を持つ必要があるためループで回す。1.124.0 側が欠けると、その世代が
// 持つ isEligible（旧クラス swiper-container の除去）まで巻き添えで効かなくなる。
// Both generations must hold the same property, so they are looped. A gap on the 1.124.0 side
// would also take down that generation's isEligible — the removal of the legacy
// swiper-container class — as collateral damage.
const generations = [
	{ label: '1.125.0〜1.126.4 / 1.125.0 through 1.126.4', save: save1_126_4 },
	{ label: '1.124.0 まで / up to 1.124.0', save: save1_124_0 },
];

describe('slider deprecated: 焼き付いたラベルの復元 / restoring baked-in labels', () => {
	for (const generation of generations) {
		it(`保存済みの値をそのまま出力する（${generation.label}） / emits the saved values verbatim`, () => {
			const html = renderToStaticMarkup(
				generation.save({ attributes: withBakedLabels })
			);

			// 現在の訳文ではなく、保存されていた値がそのまま出ること。
			// これが「翻訳が変わっても一致する」の実体。
			// The saved values, not the current translation, must come out. This is what
			// "matches even when the translation changed" actually means.
			expect(html).toContain(`aria-label="${SAVED_ARIA_LABEL}"`);
			expect(html).toContain(`data-label-pause="${SAVED_LABEL_PAUSE}"`);
			expect(html).toContain(`data-label-play="${SAVED_LABEL_PLAY}"`);

			// 翻訳の原文が紛れ込んでいないこと（＝ `__()` で作り直していないことの裏返し）。
			// The untranslated originals must not appear — the flip side of not rebuilding
			// them with `__()`.
			expect(html).not.toContain('Pause slideshow');
			expect(html).not.toContain('Play slideshow');
		});

		it(`aria-label と data-label-pause がずれていても両方そのまま出す（${generation.label}） / keeps them apart when they differ`, () => {
			// 通常この 2 つは同値だが、手で編集されたマークアップではずれ得る。片方から
			// もう片方を導出していると、その場合に出力が保存内容と食い違う。
			// The two are normally equal but can diverge in hand-edited markup. Deriving one
			// from the other would make the output disagree with the saved content there.
			const html = renderToStaticMarkup(
				generation.save({
					attributes: {
						...withBakedLabels,
						bakedAriaLabel: 'DIFFERENT FROM PAUSE',
					},
				})
			);

			expect(html).toContain('aria-label="DIFFERENT FROM PAUSE"');
			expect(html).toContain(`data-label-pause="${SAVED_LABEL_PAUSE}"`);
		});

		it(`ラベルが無い保存内容では属性ごと省く（${generation.label}） / omits the attributes when the saved content has none`, () => {
			// マークアップにラベルが無ければ属性は undefined になる。React は undefined の
			// 属性を出力しないため、この場合も出力は保存内容と一致する。
			// Absent labels in the markup leave the attributes undefined. React omits
			// undefined attributes, so the output matches the saved content in that case too.
			const html = renderToStaticMarkup(
				generation.save({ attributes: baseAttributes })
			);

			expect(html).toContain('swiper-pause-button');
			expect(html).not.toContain('aria-label');
			expect(html).not.toContain('data-label-pause');
			expect(html).not.toContain('data-label-play');
		});

		it(`停止ボタンが無効なら出力しない（${generation.label}） / emits no button when it is disabled`, () => {
			const html = renderToStaticMarkup(
				generation.save({
					attributes: { ...withBakedLabels, pauseButton: false },
				})
			);

			expect(html).not.toContain('swiper-pause-button');
			expect(html).not.toContain(SAVED_ARIA_LABEL);
		});
	}
});
