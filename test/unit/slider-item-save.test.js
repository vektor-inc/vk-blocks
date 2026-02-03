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

// Simplify sub components that are irrelevant for save behaviour.
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
	blockId: 'test',
	style: {},
};

const getDom = (markup) => {
	const parser = new DOMParser();
	return parser.parseFromString(markup, 'text/html');
};

describe('slider-item save layout handling', () => {
	it('adds constrained layout and container classes when contentWidth is set', () => {
		const markup = renderToStaticMarkup(
			save({ attributes: { ...baseAttributes, contentWidth: true } })
		);
		const dom = getDom(markup);
		const container = dom.querySelector('.vk_slider_item_container');
		expect(container).not.toBeNull();
		expect(container.classList.contains('container')).toBe(true);

		const outer = dom.querySelector('.vk_slider_item');
		expect(outer).not.toBeNull();
		expect(outer.classList.contains('is-layout-constrained')).toBe(true);
		expect(outer.classList.contains('vk_slider_item-paddingLR-use')).toBe(
			true
		);
	});

	it('omits constrained layout and container classes when contentWidth is not set', () => {
		const markup = renderToStaticMarkup(
			save({ attributes: baseAttributes })
		);
		const dom = getDom(markup);
		const container = dom.querySelector('.vk_slider_item_container');
		expect(container).not.toBeNull();
		expect(container.classList.contains('container')).toBe(false);

		const outer = dom.querySelector('.vk_slider_item');
		expect(outer).not.toBeNull();
		expect(outer.classList.contains('is-layout-constrained')).toBe(false);
	});

	it('omits constrained layout and container classes when contentWidth is false', () => {
		const markup = renderToStaticMarkup(
			save({ attributes: { ...baseAttributes, contentWidth: false } })
		);
		const dom = getDom(markup);
		const container = dom.querySelector('.vk_slider_item_container');
		expect(container).not.toBeNull();
		expect(container.classList.contains('container')).toBe(false);

		const outer = dom.querySelector('.vk_slider_item');
		expect(outer).not.toBeNull();
		expect(outer.classList.contains('is-layout-constrained')).toBe(false);
	});

	it('uses explicit spacing padding when provided', () => {
		const markup = renderToStaticMarkup(
			save({
				attributes: {
					...baseAttributes,
					contentWidth: true,
					style: {
						spacing: {
							padding: {
								left: '12px',
								right: '8px',
							},
						},
					},
				},
			})
		);
		const dom = getDom(markup);
		const outer = dom.querySelector('.vk_slider_item');
		expect(outer).not.toBeNull();
		expect(outer.classList.contains('is-layout-constrained')).toBe(true);
		expect(outer.classList.contains('vk_slider_item-paddingLR-use')).toBe(
			false
		);
		expect(outer.style.paddingLeft).toBe('12px');
		expect(outer.style.paddingRight).toBe('8px');
	});

	it('converts spacing preset tokens to CSS variables', () => {
		const markup = renderToStaticMarkup(
			save({
				attributes: {
					...baseAttributes,
					style: {
						spacing: {
							padding: {
								left: 'var:preset|spacing|60',
								right: 'var:preset|spacing|70',
							},
						},
					},
					bgColor: '#8ed1fc',
					opacity: 0.5,
				},
			})
		);
		const dom = getDom(markup);
		const outer = dom.querySelector('.vk_slider_item');
		expect(outer).not.toBeNull();
		expect(outer.getAttribute('style')).toContain(
			'padding-left:var(--wp--preset--spacing--60)'
		);
		expect(outer.getAttribute('style')).toContain(
			'padding-right:var(--wp--preset--spacing--70)'
		);

		const bgArea = dom.querySelector('.vk_slider_item-background-area');
		expect(bgArea).not.toBeNull();
		expect(bgArea.getAttribute('style')).toContain(
			'padding-left:var(--wp--preset--spacing--60)'
		);
		expect(bgArea.getAttribute('style')).toContain(
			'padding-right:var(--wp--preset--spacing--70)'
		);
	});
});
