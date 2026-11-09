/**
 * @jest-environment jsdom
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import Edit from '../../src/blocks/visual-embed/edit';

global.IS_REACT_ACT_ENVIRONMENT = true;
// PHP が渡す許可パターン
window.vkBlocksVisualEmbed = {
	allowedUrlPatterns: ['https://*.google.com/*'],
};

jest.mock('@wordpress/i18n', () => ({ __: (text) => text }));
jest.mock('@wordpress/blocks', () => ({
	getBlockType: () => ({ title: 'Visual Embed' }),
}));
jest.mock('@wordpress/block-editor', () => ({
	InspectorControls: () => null,
	BlockControls: () => null,
	useBlockProps: (props) => ({ ...props, 'data-block-props': 'on' }),
}));
jest.mock('@wordpress/components', () => ({
	PanelBody: ({ children }) => <div>{children}</div>,
	TextareaControl: () => null,
	TextControl: () => null,
	Notice: () => null,
	Placeholder: ({ label, instructions }) => (
		<div data-testid="placeholder">
			{label}|{instructions}
		</div>
	),
}));
jest.mock('../../src/blocks/visual-embed/icon.svg', () => ({
	ReactComponent: () => <svg />,
}));

const PLACEHOLDER_TEXT = 'Visual Embed|Please enter an iframe embed code.';

const render = (embedAttributes) => {
	const container = document.createElement('div');
	const root = createRoot(container);
	act(() => {
		root.render(
			<Edit attributes={{ embedAttributes }} setAttributes={() => {}} />
		);
	});
	return container;
};

describe('visual-embed: 空状態の Placeholder', () => {
	test.each([
		['src が空（消失済み）', { src: '' }, PLACEHOLDER_TEXT],
		['不許可の URL', { src: 'https://evil.example/x' }, PLACEHOLDER_TEXT],
		['許可された埋め込み', { src: 'https://www.google.com/maps' }, null],
	])('%s', (name, embedAttributes, expected) => {
		const container = render(embedAttributes);
		const placeholder = container.querySelector(
			'[data-testid="placeholder"]'
		);
		expect(placeholder ? placeholder.textContent : null).toBe(expected);
		// ブロックの外枠（useBlockProps）は常に付く
		expect(container.querySelector('[data-block-props]')).not.toBeNull();
	});
});
