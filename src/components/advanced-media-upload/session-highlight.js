/**
 * Ephemeral editor state for MediaUpload preselection.
 * Block attributes hold the image URL; this module holds the matching attachment ID
 * for the media library highlight only (never saved to post content).
 *
 * メディアライブラリの選択ハイライト用の一時状態。
 * ブロック属性は URL のみ保持し、添付 ID はここだけ（保存しない）。
 */

/**
 * @typedef {Object} MediaHighlight
 * @property {string|null} url          Image URL this highlight belongs to
 * @property {number|null} attachmentId WordPress attachment ID for MediaUpload.value
 */

/**
 * Create highlight state bound to an image URL.
 * URL が無いとき attachmentId も常に null。
 *
 * @param {string|null|undefined} url
 * @param {number|null|undefined} attachmentId
 * @return {MediaHighlight} Highlight bound to the URL, or empty when URL is absent.
 */
export function createHighlight(url, attachmentId = null) {
	const normalizedUrl = url || null;
	return {
		url: normalizedUrl,
		attachmentId: normalizedUrl ? (attachmentId ?? null) : null,
	};
}

/**
 * Reconcile highlight with the current attribute URL.
 * When attributes change externally (Undo/Redo), drop attachmentId that belonged to another URL.
 * 属性 URL が外部変更されたら、別 URL 用の ID を捨てる。
 *
 * @param {MediaHighlight}        highlight
 * @param {string|null|undefined} attributeUrl Current URL from block attributes
 * @return {MediaHighlight} Updated highlight; attachmentId cleared when URL changed.
 */
export function reconcileHighlightWithUrl(highlight, attributeUrl) {
	const url = attributeUrl || null;
	if (highlight.url === url) {
		return highlight;
	}
	return createHighlight(url, null);
}

/**
 * Attachment ID to pass to MediaUpload.value for the current attribute URL.
 * 現在の属性 URL に対応する、MediaUpload.value へ渡す添付 ID。
 *
 * @param {MediaHighlight}        highlight
 * @param {string|null|undefined} attributeUrl
 * @return {number|undefined} Attachment ID for MediaUpload.value, or undefined when none.
 */
export function attachmentIdForMediaUpload(highlight, attributeUrl) {
	const reconciled = reconcileHighlightWithUrl(highlight, attributeUrl);
	if (!attributeUrl || reconciled.attachmentId === null) {
		return undefined;
	}
	return reconciled.attachmentId;
}

/**
 * Bootstrap highlight from block attributes (URL only; never reuse saved attachment IDs).
 * ブロック属性からハイライトを初期化（URL のみ。保存済み添付 ID は使わない）
 *
 * @param {Object} attributes
 * @param {string} schema
 * @return {MediaHighlight} Initial highlight with attachmentId null.
 */
export function highlightFromAttributes(attributes, schema) {
	return createHighlight(attributes[schema], null);
}
