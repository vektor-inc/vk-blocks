/* eslint-disable jsdoc/check-tag-names */
/**
 * @jest-environment jsdom
 */
/* eslint-enable jsdoc/check-tag-names */
/* eslint-env jest, browser */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { useDisableLinks } from '@vkblocks/utils/disable-links';

const flushEffects = () => new Promise((resolve) => setTimeout(resolve, 0));

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

	afterEach(() => {
		if (container) {
			root.unmount();
			container.remove();
		}
		document.body.innerHTML = '';
	});

	it('disables click navigation and applies styles to existing links', async () => {
		const link = document.createElement('a');
		link.href = '#';
		document.body.appendChild(link);

		root.render(<TestComponent selector="a" />);
		// useEffect での初回実行と MutationObserver のコールバック実行の両方を待つ
		await flushEffects();
		await flushEffects();

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

		root.render(
			<TestComponent
				selector=".target a"
				onLinkProcess={processed}
				depsKey="deps"
			/>
		);
		await flushEffects();

		const wrapper = document.createElement('div');
		wrapper.className = 'target';
		const newLink = document.createElement('a');
		wrapper.appendChild(newLink);
		document.body.appendChild(wrapper);

		await flushEffects();

		expect(processed).toHaveBeenCalled();
		expect(newLink.dataset.processed).toBe('1');
	});
});
