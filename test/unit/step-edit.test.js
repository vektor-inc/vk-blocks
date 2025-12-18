/**
 * @jest-environment jsdom
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import StepEdit from '../../src/blocks/_pro/step/edit';

global.IS_REACT_ACT_ENVIRONMENT = true;

const mockInnerBlocks = jest.fn();
const mockUpdateBlockAttributes = jest.fn();

jest.mock('@wordpress/i18n', () => ({
	__: (text) => text,
}));

jest.mock('@wordpress/block-editor', () => {
	const InnerBlocks = (props) => {
		mockInnerBlocks(props);
		return <div data-testid="inner-blocks" />;
	};
	InnerBlocks.ButtonBlockAppender = ({ label }) => (
		<button type="button">{label}</button>
	);
	return {
		InspectorControls: ({ children }) => <div>{children}</div>,
		InnerBlocks,
		useBlockProps: () => ({}),
	};
});

jest.mock('@wordpress/components', () => ({
	PanelBody: ({ children }) => <div>{children}</div>,
	__experimentalNumberControl: ({ onChange }) => (
		<input
			data-testid="number-control"
			type="number"
			onChange={(event) => onChange(Number(event.target.value))}
		/>
	),
}));

jest.mock('@wordpress/data', () => ({
	useSelect: jest.fn(() => []),
dispatch: jest.fn(() => ({
	updateBlockAttributes: mockUpdateBlockAttributes,
})),
}));

describe('StepEdit', () => {
	beforeEach(() => {
		mockInnerBlocks.mockClear();
		mockUpdateBlockAttributes.mockClear();
	});

	it('passes a custom renderAppender to InnerBlocks', () => {
		const container = document.createElement('div');
		document.body.appendChild(container);
		const root = createRoot(container);
		act(() => {
			root.render(
				<StepEdit
					attributes={{ firstDotNum: 1 }}
					setAttributes={jest.fn()}
					clientId="test"
				/>
			);
		});

		const innerBlocksProps = mockInnerBlocks.mock.calls[0][0];
		expect(typeof innerBlocksProps.renderAppender).toBe('function');

		act(() => {
			root.render(innerBlocksProps.renderAppender());
		});
		const button = container.querySelector('button');
		expect(button).not.toBeNull();

		act(() => {
			root.unmount();
		});
		container.remove();
	});
});
