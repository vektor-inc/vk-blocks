/**
 * @jest-environment jsdom
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { resolveSelect } from '@wordpress/data';
import {
	AdvancedMediaUpload,
	ATTACHMENT_SEARCH_MAX_PAGES,
	ATTACHMENT_SEARCH_PER_PAGE,
	clearResolvedAttachmentIdCache,
	resolveAttachmentIdByUrl,
} from '../../src/components/advanced-media-upload/index';

global.IS_REACT_ACT_ENVIRONMENT = true;

const URL_A = 'https://example.test/a.png';
const URL_B = 'https://example.test/b.png';

jest.mock('@wordpress/i18n', () => ({
	__: (text) => text,
}));

const mockOpen = jest.fn();
let mockMediaUploadOpen = mockOpen;
let lastMediaUploadProps = null;

jest.mock('@wordpress/block-editor', () => ({
	MediaUpload: (props) => {
		lastMediaUploadProps = props;
		return props.render({ open: mockMediaUploadOpen });
	},
}));

jest.mock('@wordpress/data', () => ({
	resolveSelect: jest.fn(),
}));

jest.mock('@wordpress/components', () => ({
	Button: ({ onClick, children, className, variant }) => (
		<button
			type="button"
			onClick={onClick}
			className={className}
			data-variant={variant}
		>
			{children}
		</button>
	),
}));

function mockAttachmentLookup(recordsByUrl) {
	resolveSelect.mockReturnValue({
		getEntityRecords: jest.fn(async (_type, _subtype, query) => {
			const url = Object.keys(recordsByUrl).find((candidate) =>
				candidate.includes(query.search.replace('.png', ''))
			);
			if (!url) {
				return [];
			}
			return [{ id: recordsByUrl[url], source_url: url }];
		}),
	});
}

function renderAmu(attributes, props = {}) {
	const container = document.createElement('div');
	document.body.appendChild(container);
	const root = createRoot(container);
	const setAttributes = jest.fn();

	act(() => {
		root.render(
			<AdvancedMediaUpload
				schema="insertImage"
				setAttributes={setAttributes}
				attributes={attributes}
				{...props}
			/>
		);
	});

	return { container, root, setAttributes };
}

describe('AdvancedMediaUpload replace after Undo/Redo', () => {
	beforeEach(() => {
		mockOpen.mockClear();
		mockMediaUploadOpen = mockOpen;
		lastMediaUploadProps = null;
		resolveSelect.mockReset();
		clearResolvedAttachmentIdCache();
		document.body.innerHTML = '';
	});

	it('re-resolves ID for current URL after Undo, not stale highlight', async () => {
		mockAttachmentLookup({ [URL_A]: 101 });

		const { container, root } = renderAmu({ insertImage: URL_B });

		act(() => {
			lastMediaUploadProps.onSelect({ url: URL_B, id: 202, alt: '' });
		});
		expect(lastMediaUploadProps.value).toBe(202);

		act(() => {
			root.render(
				<AdvancedMediaUpload
					schema="insertImage"
					setAttributes={jest.fn()}
					attributes={{ insertImage: URL_A }}
				/>
			);
		});

		expect(lastMediaUploadProps.value).toBeUndefined();

		const replaceButton = container.querySelector('.button-replace');
		await act(async () => {
			replaceButton.click();
			await Promise.resolve();
			await Promise.resolve();
		});

		expect(lastMediaUploadProps.value).toBe(101);
		expect(mockOpen).toHaveBeenCalled();
	});

	it('uses matching highlight again after Redo without REST lookup', async () => {
		mockAttachmentLookup({ [URL_A]: 101 });

		const { container, root } = renderAmu({ insertImage: URL_A });

		act(() => {
			lastMediaUploadProps.onSelect({ url: URL_B, id: 202, alt: '' });
		});

		act(() => {
			root.render(
				<AdvancedMediaUpload
					schema="insertImage"
					setAttributes={jest.fn()}
					attributes={{ insertImage: URL_A }}
				/>
			);
		});

		act(() => {
			root.render(
				<AdvancedMediaUpload
					schema="insertImage"
					setAttributes={jest.fn()}
					attributes={{ insertImage: URL_B }}
				/>
			);
		});

		expect(lastMediaUploadProps.value).toBe(202);

		resolveSelect.mockClear();
		const replaceButton = container.querySelector('.button-replace');

		await act(async () => {
			replaceButton.click();
		});

		expect(resolveSelect).not.toHaveBeenCalled();
		expect(mockOpen).toHaveBeenCalled();
	});

	it('clears legacy insertImageId on replace and ignores it after remount', async () => {
		mockAttachmentLookup({ [URL_B]: 202 });

		const { container, root, setAttributes } = renderAmu({
			insertImage: URL_A,
			insertImageId: 999,
		});

		expect(lastMediaUploadProps.value).toBeUndefined();

		act(() => {
			lastMediaUploadProps.onSelect({ url: URL_B, id: 202, alt: '' });
		});

		// insertImageId is a legacy attribute key; replace clears it explicitly.
		// insertImageId はレガシー属性。置換時に明示的に null へ更新する。
		expect(setAttributes).toHaveBeenCalledWith({
			insertImage: URL_B,
			insertImageId: null,
		});

		act(() => {
			root.render(
				<AdvancedMediaUpload
					schema="insertImage"
					setAttributes={setAttributes}
					attributes={{
						insertImage: URL_B,
						insertImageId: null,
					}}
				/>
			);
		});

		expect(lastMediaUploadProps.value).toBe(202);

		act(() => {
			root.unmount();
		});

		const remountContainer = document.createElement('div');
		document.body.appendChild(remountContainer);
		const remountRoot = createRoot(remountContainer);

		act(() => {
			remountRoot.render(
				<AdvancedMediaUpload
					schema="insertImage"
					setAttributes={jest.fn()}
					attributes={{
						insertImage: URL_B,
						insertImageId: 999,
					}}
				/>
			);
		});

		expect(lastMediaUploadProps.value).toBeUndefined();

		resolveSelect.mockClear();
		const replaceButton = remountContainer.querySelector('.button-replace');

		await act(async () => {
			replaceButton.click();
			await Promise.resolve();
			await Promise.resolve();
		});

		expect(lastMediaUploadProps.value).toBe(202);
		expect(mockOpen).toHaveBeenCalled();
	});

	it('does not restore a deleted image when its attachment lookup resolves late', async () => {
		let resolveLookup;
		resolveSelect.mockReturnValue({
			getEntityRecords: jest.fn(
				() =>
					new Promise((resolve) => {
						resolveLookup = resolve;
					})
			),
		});

		const { container } = renderAmu({ insertImage: URL_A });

		await act(async () => {
			container.querySelector('.button-replace').click();
		});

		act(() => {
			container.querySelector('.button-delete').click();
		});

		await act(async () => {
			resolveLookup([{ id: 101, source_url: URL_A }]);
		});

		expect(lastMediaUploadProps.value).toBeUndefined();
		expect(mockOpen).not.toHaveBeenCalled();
	});

	it('discards a pending open when the image URL changes', async () => {
		let resolveLookup;
		resolveSelect.mockReturnValue({
			getEntityRecords: jest.fn(
				() =>
					new Promise((resolve) => {
						resolveLookup = resolve;
					})
			),
		});

		const setAttributes = jest.fn();
		const { container, root } = renderAmu({ insertImage: URL_A });

		await act(async () => {
			container.querySelector('.button-replace').click();
		});

		mockMediaUploadOpen = undefined;
		await act(async () => {
			resolveLookup([{ id: 101, source_url: URL_A }]);
		});

		mockMediaUploadOpen = mockOpen;
		act(() => {
			root.render(
				<AdvancedMediaUpload
					schema="insertImage"
					setAttributes={setAttributes}
					attributes={{ insertImage: URL_B }}
				/>
			);
		});

		act(() => {
			root.render(
				<AdvancedMediaUpload
					schema="insertImage"
					setAttributes={setAttributes}
					attributes={{ insertImage: URL_A }}
				/>
			);
		});

		expect(mockOpen).not.toHaveBeenCalled();
	});

	it('renders the empty Flow control as a secondary button', () => {
		const { container } = renderAmu(
			{ insertImage: null },
			{ showPlaceholder: false }
		);

		expect(
			container.querySelector('button').getAttribute('data-variant')
		).toBe('secondary');
	});
});

function fillerPage(pageIndex) {
	return Array.from({ length: ATTACHMENT_SEARCH_PER_PAGE }, (_, i) => ({
		id: pageIndex * ATTACHMENT_SEARCH_PER_PAGE + i + 1,
		source_url: `https://example.test/other-${pageIndex}-${i}.png`,
	}));
}

describe('resolveAttachmentIdByUrl paging', () => {
	beforeEach(() => {
		resolveSelect.mockReset();
		clearResolvedAttachmentIdCache();
	});

	it('finds a source_url match on page 2', async () => {
		const getEntityRecords = jest.fn(async (_type, _subtype, query) => {
			if (query.page === 1) {
				return fillerPage(0);
			}
			if (query.page === 2) {
				return [{ id: 201, source_url: URL_A }];
			}
			return [];
		});
		resolveSelect.mockReturnValue({ getEntityRecords });

		await expect(resolveAttachmentIdByUrl(URL_A)).resolves.toBe(201);
		expect(getEntityRecords).toHaveBeenCalledTimes(2);
	});

	it('stops when a page is shorter than per_page', async () => {
		const getEntityRecords = jest.fn(async (_type, _subtype, query) => {
			if (query.page === 1) {
				return fillerPage(0);
			}
			if (query.page === 2) {
				return [
					{
						id: 301,
						source_url: 'https://example.test/unrelated.png',
					},
				];
			}
			return fillerPage(query.page);
		});
		resolveSelect.mockReturnValue({ getEntityRecords });

		await expect(resolveAttachmentIdByUrl(URL_A)).resolves.toBeNull();
		expect(getEntityRecords).toHaveBeenCalledTimes(2);
	});

	it('returns null after maxPages without a match', async () => {
		const getEntityRecords = jest.fn(async () => fillerPage(0));
		resolveSelect.mockReturnValue({ getEntityRecords });

		await expect(resolveAttachmentIdByUrl(URL_A)).resolves.toBeNull();
		expect(getEntityRecords).toHaveBeenCalledTimes(
			ATTACHMENT_SEARCH_MAX_PAGES
		);
	});

	it('returns null when the first page is undefined', async () => {
		const getEntityRecords = jest.fn(async () => undefined);
		resolveSelect.mockReturnValue({ getEntityRecords });

		await expect(resolveAttachmentIdByUrl(URL_A)).resolves.toBeNull();
		expect(getEntityRecords).toHaveBeenCalledTimes(1);
	});
});
