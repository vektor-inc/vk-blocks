/* eslint-disable jsdoc/check-tag-names */
/**
 * @jest-environment jsdom
 */
/* eslint-enable jsdoc/check-tag-names */
/* eslint-env jest */
/* global DOMParser */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import save from '../../src/blocks/slider-item/save';

// Simplify sub components that are irrelevant for width behaviour.
jest.mock('../../src/blocks/slider-item/GenerateBgImage', () => () => null);

jest.mock('@wordpress/i18n', () => ({
	__: (text) => text,
}));

jest.mock('@wordpress/block-editor', () => {
	const Content = () => <div data-testid="inner" />;
	return {
		InnerBlocks: { Content },
		useBlockProps: {
			save: ({ className, style }) => ({
				className: className?.trim(),
				style,
			}),
		},
	};
});

const baseAttributes = {
	verticalAlignment: 'center',
	padding_left_and_right: '0',
	blockId: 'test',
};

const getDom = (markup) => {
	const parser = new DOMParser();
	return parser.parseFromString(markup, 'text/html');
};

describe('slider-item save width handling', () => {
	it('omits container class when width is full', () => {
		const markup = renderToStaticMarkup(
			save({ attributes: { ...baseAttributes, width: 'full' } })
		);
		const dom = getDom(markup);
		const container = dom.querySelector('.vk_slider_item_container');
		expect(container).not.toBeNull();
		expect(container.classList.contains('container')).toBe(true);

		const outer = dom.querySelector('.vk_slider_item');
		expect(outer.classList.contains('is-layout-constrained')).toBe(true);
	});

	it('adds container class and constrained layout when width is container', () => {
		const markup = renderToStaticMarkup(
			save({ attributes: { ...baseAttributes, width: 'container' } })
		);
		const dom = getDom(markup);
		const container = dom.querySelector('.vk_slider_item_container');
		expect(container).not.toBeNull();
		expect(container.classList.contains('container')).toBe(true);

		const outer = dom.querySelector('.vk_slider_item');
		expect(outer.classList.contains('is-layout-constrained')).toBe(true);
	});
});
