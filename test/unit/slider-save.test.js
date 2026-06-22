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
		// 初期状態（再生中）は aria-label が「停止」操作を示す
		expect(button.getAttribute('aria-label')).toBe('Pause slideshow');
		// 状態切り替え用のラベルが data 属性に保持されている
		expect(button.getAttribute('data-label-pause')).toBe('Pause slideshow');
		expect(button.getAttribute('data-label-play')).toBe('Play slideshow');
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
