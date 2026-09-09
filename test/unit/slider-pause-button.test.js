/* eslint-disable jsdoc/check-tag-names */
/**
 * @jest-environment jsdom
 */
/* eslint-enable jsdoc/check-tag-names */
/* eslint-env jest */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PauseButton } from '../../src/blocks/slider/pause-button';

// 翻訳関数はそのまま文字列を返すようにモックする
jest.mock('@wordpress/i18n', () => ({
	__: (text) => text,
}));

const getButton = (element) => {
	const parser = new DOMParser();
	const dom = parser.parseFromString(
		renderToStaticMarkup(element),
		'text/html'
	);
	return dom.querySelector('.swiper-pause-button');
};

describe('slider PauseButton label handling (#3071)', () => {
	it('omits the labels by default so they are never baked into the saved markup', () => {
		const button = getButton(<PauseButton />);
		expect(button).not.toBeNull();
		// save から呼ばれる既定形。翻訳文が保存出力へ入らないことを固定する。
		expect(button.hasAttribute('aria-label')).toBe(false);
		expect(button.hasAttribute('data-label-pause')).toBe(false);
		expect(button.hasAttribute('data-label-play')).toBe(false);
	});

	it('renders the labels when withLabels is set, for the editor preview', () => {
		const button = getButton(<PauseButton withLabels />);
		expect(button.getAttribute('aria-label')).toBe('Pause slideshow');
		expect(button.getAttribute('data-label-pause')).toBe('Pause slideshow');
		expect(button.getAttribute('data-label-play')).toBe('Play slideshow');
	});

	it('always renders both the pause and play icons', () => {
		// アイコンはラベルの有無に関わらず出力される（CSS の is-paused で切り替えるため）
		[<PauseButton key="plain" />, <PauseButton key="labeled" withLabels />]
			.map(getButton)
			.forEach((button) => {
				expect(
					button.querySelector('.vk_slider_pauseButton_icon-pause')
				).not.toBeNull();
				expect(
					button.querySelector('.vk_slider_pauseButton_icon-play')
				).not.toBeNull();
			});
	});
});
