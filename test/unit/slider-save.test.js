/* eslint-disable jsdoc/check-tag-names */
/**
 * @jest-environment jsdom
 */
/* eslint-enable jsdoc/check-tag-names */
/* eslint-env jest */
/* global DOMParser */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import save from '../../src/blocks/slider/save';

// 翻訳関数はそのまま文字列を返すようにモックする
jest.mock('@wordpress/i18n', () => ({
	__: (text) => text,
}));

// save が依存する block-editor のコンポーネントを最小実装に差し替える
jest.mock('@wordpress/block-editor', () => {
	const Content = () => <div data-testid="inner" />;
	return {
		InnerBlocks: { Content },
		useBlockProps: {
			save: ({ className }) => ({
				className: className?.trim(),
			}),
		},
	};
});

// スライダーの基本属性（停止/再生ボタン関連以外は固定）
const baseAttributes = {
	blockId: 'test',
	pagination: 'bullets',
	navigationPosition: 'mobile-bottom',
	autoPlay: true,
	autoPlayStop: true,
	autoPlayDelay: 2500,
	loop: true,
	effect: 'slide',
	speed: 500,
	direction: 'rtl',
};

const getDom = (markup) => {
	const parser = new DOMParser();
	return parser.parseFromString(markup, 'text/html');
};

describe('slider save pause/play button handling', () => {
	it('renders the pause button when autoPlay and pauseButton are both enabled', () => {
		const markup = renderToStaticMarkup(
			save({
				attributes: {
					...baseAttributes,
					autoPlay: true,
					pauseButton: true,
				},
			})
		);
		const dom = getDom(markup);
		const button = dom.querySelector('.swiper-pause-button');
		expect(button).not.toBeNull();
		// 翻訳文が保存出力に焼き付かないことを固定する回帰テスト（#3071）。
		// aria-label / data-label-* は PHP の render_block フィルタが描画時に付与するため、
		// save 出力には一切含めない。ここが復活すると、翻訳を変更した時点で
		// 保存済みコンテンツがブロック検証エラーになる。
		expect(button.hasAttribute('aria-label')).toBe(false);
		expect(button.hasAttribute('data-label-pause')).toBe(false);
		expect(button.hasAttribute('data-label-play')).toBe(false);
		// data-vkb-slider ペイロードにも pauseButton:true が反映される
		const slider = dom.querySelector('.vk_slider');
		const sliderData = JSON.parse(slider.getAttribute('data-vkb-slider'));
		expect(sliderData.pauseButton).toBe(true);
	});

	it('does not render the pause button when pauseButton is disabled', () => {
		const markup = renderToStaticMarkup(
			save({
				attributes: {
					...baseAttributes,
					autoPlay: true,
					pauseButton: false,
				},
			})
		);
		const dom = getDom(markup);
		expect(dom.querySelector('.swiper-pause-button')).toBeNull();
	});

	it('does not render the pause button when autoPlay is disabled', () => {
		const markup = renderToStaticMarkup(
			save({
				attributes: {
					...baseAttributes,
					autoPlay: false,
					pauseButton: true,
				},
			})
		);
		const dom = getDom(markup);
		expect(dom.querySelector('.swiper-pause-button')).toBeNull();
		// ボタンは出力されないが、data-vkb-slider には入力どおり pauseButton:true が保持される
		// （DOM のゲートは autoPlay && pauseButton で行い、ペイロードは属性値をそのまま反映する）
		const slider = dom.querySelector('.vk_slider');
		const sliderData = JSON.parse(slider.getAttribute('data-vkb-slider'));
		expect(sliderData.pauseButton).toBe(true);
	});

	it('renders the pause button with both pause and play icon elements', () => {
		const markup = renderToStaticMarkup(
			save({
				attributes: {
					...baseAttributes,
					autoPlay: true,
					pauseButton: true,
				},
			})
		);
		const dom = getDom(markup);
		const button = dom.querySelector('.swiper-pause-button');
		expect(button).not.toBeNull();
		// 停止アイコンと再生アイコンの両方が出力されている
		expect(
			button.querySelector('.vk_slider_pauseButton_icon-pause')
		).not.toBeNull();
		expect(
			button.querySelector('.vk_slider_pauseButton_icon-play')
		).not.toBeNull();
	});

	it('omits the pause button and keeps pauseButton false in the payload when autoPlay and pauseButton are both disabled', () => {
		const markup = renderToStaticMarkup(
			save({
				attributes: {
					...baseAttributes,
					autoPlay: false,
					pauseButton: false,
				},
			})
		);
		const dom = getDom(markup);
		expect(dom.querySelector('.swiper-pause-button')).toBeNull();
		const slider = dom.querySelector('.vk_slider');
		const sliderData = JSON.parse(slider.getAttribute('data-vkb-slider'));
		expect(sliderData.pauseButton).toBe(false);
	});
});

// #3080: ループOFF×「スライドの枚数」ページネーション時の「実際のスライド数で表示」トグル。
// #3080: the "Show actual slide count" toggle for loop-off + "Number of slides" pagination.
describe('slider save showActualSlideCount handling', () => {
	// `undefined` は、この属性が存在しなかった時期（#3080 実装前）に保存された
	// 投稿を再現するケース。block.json の default（false）は attributes に
	// 反映される前提の値のため、パース後の実データとしては存在しない
	// （＝undefined）ことがある点をここで担保する。
	//
	// `undefined` reproduces posts saved before this attribute existed (pre-#3080).
	// block.json's `default` (false) is applied by the block parser, but the raw
	// parsed attribute itself can be absent (`undefined`) for such legacy content,
	// so this case is verified separately from the explicit `false` default.
	it.each([
		{ name: 'showActualSlideCount is false (the default)', value: false },
		{
			name: 'showActualSlideCount is undefined (posts saved before this attribute existed)',
			value: undefined,
		},
	])(
		'omits the showActualSlideCount key entirely when $name, so existing posts keep an identical payload',
		({ value }) => {
			const markup = renderToStaticMarkup(
				save({
					attributes: {
						...baseAttributes,
						pagination: 'fraction',
						loop: false,
						showActualSlideCount: value,
					},
				})
			);
			const dom = getDom(markup);
			const slider = dom.querySelector('.vk_slider');
			const sliderData = JSON.parse(
				slider.getAttribute('data-vkb-slider')
			);
			expect(
				Object.prototype.hasOwnProperty.call(
					sliderData,
					'showActualSlideCount'
				)
			).toBe(false);
		}
	);

	it('includes showActualSlideCount:true in the payload when loop is off and pagination is fraction', () => {
		const markup = renderToStaticMarkup(
			save({
				attributes: {
					...baseAttributes,
					pagination: 'fraction',
					loop: false,
					showActualSlideCount: true,
				},
			})
		);
		const dom = getDom(markup);
		const slider = dom.querySelector('.vk_slider');
		const sliderData = JSON.parse(slider.getAttribute('data-vkb-slider'));
		expect(sliderData.showActualSlideCount).toBe(true);
	});

	// #3080 CodeRabbit指摘の回帰テスト: save() は決定的関数である必要があるため、
	// __() の翻訳結果（ロケール依存）をこの属性として保存HTMLに埋め込んではいけない
	// （埋め込むと、後でサイトの言語設定を変えた際に save() の再計算結果と保存済み
	// HTMLが食い違い、ブロック検証エラーになる）。翻訳文字列は wp_localize_script()
	// 経由でフロントエンドへ渡すため、save() の出力には一切現れないことを保証する。
	//
	// #3080 CodeRabbit feedback regression test: save() must be a deterministic
	// function, so the locale-dependent result of __() must never be embedded in
	// the saved HTML as this attribute (doing so would make save()'s recomputed
	// output diverge from the frozen saved HTML if the site's language setting
	// changes later, causing a block-validation error). The translated string is
	// passed to the front end via wp_localize_script() instead, so it must never
	// appear anywhere in save()'s output.
	it.each([
		{
			name: 'showActualSlideCount ON, fraction, loop off',
			attrs: {
				pagination: 'fraction',
				loop: false,
				showActualSlideCount: true,
			},
		},
		{
			name: 'showActualSlideCount OFF (default)',
			attrs: {
				pagination: 'fraction',
				loop: false,
				showActualSlideCount: false,
			},
		},
		{
			name: 'loop ON',
			attrs: {
				pagination: 'fraction',
				loop: true,
				showActualSlideCount: true,
			},
		},
		{
			name: 'pagination is bullets',
			attrs: {
				pagination: 'bullets',
				loop: false,
				showActualSlideCount: true,
			},
		},
	])(
		'never embeds a translated aria-label attribute on the pagination element ($name)',
		({ attrs }) => {
			const markup = renderToStaticMarkup(
				save({ attributes: { ...baseAttributes, ...attrs } })
			);
			const dom = getDom(markup);
			const pagination = dom.querySelector('.swiper-pagination');
			expect(
				pagination.getAttribute('data-vkb-slider-actual-count-label')
			).toBeNull();
			// aria-label 自体も存在しないことを検証する（CodeRabbit指摘）。
			// 存在チェックの対象がこの属性だけだと、保存処理が万一ロケール依存の
			// aria-label を出力してしまっても、このテストは成功してしまう。
			// Also verify the aria-label attribute itself is absent (CodeRabbit
			// feedback). Checking only the custom attribute above would still
			// pass even if save() somehow emitted a locale-dependent aria-label.
			expect(pagination.getAttribute('aria-label')).toBeNull();
			expect(pagination.outerHTML).not.toMatch(/Showing/);
		}
	);
});
