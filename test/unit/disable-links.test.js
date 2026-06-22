/* eslint-disable jsdoc/check-tag-names */
/**
 * @jest-environment jsdom
 */
/* eslint-enable jsdoc/check-tag-names */
/* eslint-env jest, browser */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { useDisableLinks } from '@vkblocks/utils/disable-links';

global.IS_REACT_ACT_ENVIRONMENT = true;

// MutationObserver のコールバックはマイクロタスクで配送されるため、
// 1 マクロタスク分待機して反映を待つ
const flushMutations = () =>
	act(async () => {
		await new Promise((resolve) => setTimeout(resolve, 0));
	});

const TestComponent = ({ selector, onLinkProcess, depsKey }) => {
	useDisableLinks({
		selector,
		onLinkProcess,
		deps: [depsKey],
	});
	return null;
};

describe('useDisableLinks', () => {
	let container;
	let root;

	beforeEach(() => {
		container = document.createElement('div');
		document.body.innerHTML = '';
		document.body.appendChild(container);
		root = createRoot(container);
	});

	afterEach(async () => {
		if (container) {
			await act(async () => {
				root.unmount();
			});
			container.remove();
		}
		document.body.innerHTML = '';
	});

	it('disables click navigation and applies styles to existing links', async () => {
		const link = document.createElement('a');
		link.href = '#';
		document.body.appendChild(link);

		// render を act で囲むことで useEffect（初回の disableLinks）の実行を待つ
		await act(async () => {
			root.render(<TestComponent selector="a" />);
		});

		const clickEvent = new MouseEvent('click', {
			bubbles: true,
			cancelable: true,
		});
		link.dispatchEvent(clickEvent);

		expect(clickEvent.defaultPrevented).toBe(true);
		expect(link.style.cursor).toBe('default');
		expect(link.style.boxShadow).toBe('unset');
		expect(link.style.textDecorationColor).toBe('inherit');
	});

	it('reapplies processing when new links are added via mutations', async () => {
		const processed = jest.fn((newLink) => {
			newLink.dataset.processed = '1';
		});

		await act(async () => {
			root.render(
				<TestComponent
					selector=".target a"
					onLinkProcess={processed}
					depsKey="deps"
				/>
			);
		});

		const wrapper = document.createElement('div');
		wrapper.className = 'target';
		const newLink = document.createElement('a');
		wrapper.appendChild(newLink);
		document.body.appendChild(wrapper);

		// MutationObserver のコールバック（disableLinks の再実行）を待つ
		await flushMutations();

		expect(processed).toHaveBeenCalled();
		expect(newLink.dataset.processed).toBe('1');
	});
});
