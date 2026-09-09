import {
	attachmentIdForMediaUpload,
	createHighlight,
	highlightFromAttributes,
	reconcileHighlightWithUrl,
} from '../../src/components/advanced-media-upload/session-highlight';

const URL_A = 'https://example.test/a.png';
const URL_B = 'https://example.test/b.png';

describe('session-highlight', () => {
	describe('reconcileHighlightWithUrl', () => {
		it('keeps attachmentId when attribute URL is unchanged', () => {
			const highlight = createHighlight(URL_A, 101);
			expect(reconcileHighlightWithUrl(highlight, URL_A)).toBe(highlight);
		});

		it('clears attachmentId when attribute URL changes (Undo/Redo)', () => {
			const highlight = createHighlight(URL_B, 202);
			expect(reconcileHighlightWithUrl(highlight, URL_A)).toEqual({
				url: URL_A,
				attachmentId: null,
			});
		});
	});

	describe('attachmentIdForMediaUpload', () => {
		it('returns id only for matching URL', () => {
			expect(
				attachmentIdForMediaUpload(
					createHighlight(URL_A, 101),
					URL_A
				)
			).toBe(101);
			expect(
				attachmentIdForMediaUpload(
					createHighlight(URL_B, 202),
					URL_A
				)
			).toBeUndefined();
		});
	});

	describe('highlightFromAttributes', () => {
		it('bootstraps URL only and ignores legacy saved attachment id', () => {
			expect(
				highlightFromAttributes(
					{ insertImage: URL_A, insertImageId: 55 },
					'insertImage'
				)
			).toEqual({ url: URL_A, attachmentId: null });
		});
	});
});
