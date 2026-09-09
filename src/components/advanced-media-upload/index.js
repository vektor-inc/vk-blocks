import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { MediaUpload } from '@wordpress/block-editor';
import { resolveSelect } from '@wordpress/data';
import { useEffect, useRef, useState } from '@wordpress/element';
import noImage from '../../../inc/vk-blocks/images/no-image.svg';
import {
	attachmentIdForMediaUpload,
	createHighlight,
	highlightFromAttributes,
} from './session-highlight';

export const ATTACHMENT_SEARCH_PER_PAGE = 100;
export const ATTACHMENT_SEARCH_MAX_PAGES = 20;

const resolvedAttachmentIdByUrl = new Map();

/**
 * Clear the session cache of URL → attachment ID lookups.
 * テスト用。URL → 添付 ID のセッションキャッシュを消す。
 */
export function clearResolvedAttachmentIdCache() {
	resolvedAttachmentIdByUrl.clear();
}

/**
 * Resolve an attachment ID from a media URL.
 * REST API only allows per_page 1–100 (unlike WP_Query, -1 is invalid), so
 * search by filename and page through results until source_url matches exactly.
 * メディアURLから添付IDを解決する。
 * REST API の per_page は 1〜100 のみ（WP_Query と違い -1 は無効）なので、
 * ファイル名で検索し、source_url が一致するまでページングする。
 *
 * @param {string} imageUrl
 * @return {Promise<number|null>} Attachment ID, or null when not found / on failure.
 */
export async function resolveAttachmentIdByUrl(imageUrl) {
	if (!imageUrl) {
		return null;
	}

	if (resolvedAttachmentIdByUrl.has(imageUrl)) {
		return resolvedAttachmentIdByUrl.get(imageUrl);
	}

	let fileName;
	try {
		fileName = decodeURIComponent(
			new URL(imageUrl, window.location.href).pathname
				.split('/')
				.filter(Boolean)
				.pop() || ''
		);
	} catch {
		return null;
	}

	if (!fileName) {
		return null;
	}

	// Cap pages so a huge media library cannot loop forever.
	// 巨大ライブラリで無限ループしないようページ数に上限を設ける
	const perPage = ATTACHMENT_SEARCH_PER_PAGE;
	const maxPages = ATTACHMENT_SEARCH_MAX_PAGES;

	try {
		for (let page = 1; page <= maxPages; page++) {
			const media = await resolveSelect('core').getEntityRecords(
				'postType',
				'attachment',
				{
					search: fileName,
					per_page: perPage,
					page,
					orderby: 'id',
					order: 'asc',
				}
			);

			if (!media?.length) {
				return null;
			}

			const mediaItem = media.find(
				(item) => item.source_url === imageUrl
			);
			if (mediaItem?.id) {
				resolvedAttachmentIdByUrl.set(imageUrl, mediaItem.id);
				return mediaItem.id;
			}

			// Last page is shorter than per_page — no further results.
			// 最終ページ（per_page 未満）なら以降は無い
			if (media.length < perPage) {
				return null;
			}
		}
	} catch {
		// REST / resolver failure → open media library without ID.
		// REST / resolver 失敗時は ID なしでメディアライブラリを開く。
		return null;
	}

	return null;
}

/**
 * Media select / replace / delete UI.
 * Attachment IDs stay in session state only (not block attributes),
 * so opening a post does not mark it dirty.
 * メディア選択・置換・削除 UI。
 * 添付 ID はセッション内のみ保持し属性には書かない
 * （投稿を開いただけでは dirty にしない）。
 *
 * @param {Object}   props
 * @param {string}   props.schema                 URL attribute key (e.g. bgImage)
 * @param {string}   [props.schemaId]             Legacy attachment-ID attribute key to clear on delete/replace (default: schema + 'Id')
 * @param {string}   [props.altSchema]            Optional alt attribute key
 * @param {boolean}  [props.showPlaceholder=true] Show no-image placeholder when empty
 * @param {Function} props.setAttributes          Attribute setter
 * @param {Object}   props.attributes             Block attributes
 * @return {JSX.Element} Media upload UI
 */
export const AdvancedMediaUpload = (props) => {
	const {
		schema,
		schemaId,
		altSchema,
		setAttributes,
		attributes,
		showPlaceholder = true,
	} = props;

	const schemaIdKey = schemaId || `${schema}Id`;
	const imageUrl = attributes[schema];
	const imageAlt = altSchema ? attributes[altSchema] : undefined;

	// Ephemeral highlight for MediaUpload — reconciled with attribute URL on every render.
	// 属性 URL と毎 render で突き合わせる一時ハイライト状態
	const [highlight, setHighlight] = useState(() =>
		highlightFromAttributes(attributes, schema)
	);
	const mediaUploadId = attachmentIdForMediaUpload(highlight, imageUrl);

	const openRef = useRef(null);
	const [shouldOpenAfterId, setShouldOpenAfterId] = useState(false);

	const imageUrlRef = useRef(imageUrl);
	useEffect(() => {
		imageUrlRef.current = imageUrl;
		setShouldOpenAfterId(false);
	}, [imageUrl]);

	// Open after highlight is in state so MediaUpload.value has the current ID.
	// ハイライトが state に載ってから開く（value に現在 ID が入った状態でライブラリを出す）
	useEffect(() => {
		if (shouldOpenAfterId && mediaUploadId && openRef.current) {
			openRef.current();
			setShouldOpenAfterId(false);
		}
	}, [shouldOpenAfterId, mediaUploadId]);

	const deleteImgBtn = () => {
		imageUrlRef.current = null;
		setShouldOpenAfterId(false);
		setHighlight(createHighlight(null, null));
		const next = {
			[schema]: null,
			[schemaIdKey]: null,
		};
		if (altSchema) {
			next[altSchema] = null;
		}
		setAttributes(next);
	};

	const ensureImageId = async () => {
		if (mediaUploadId) {
			openRef.current?.();
			return;
		}

		if (!imageUrl) {
			openRef.current?.();
			return;
		}

		const requestedUrl = imageUrl;
		const attachmentId = await resolveAttachmentIdByUrl(requestedUrl);

		if (imageUrlRef.current !== requestedUrl) {
			return;
		}

		if (attachmentId) {
			setHighlight(createHighlight(requestedUrl, attachmentId));
			setShouldOpenAfterId(true);
			return;
		}

		openRef.current?.();
	};

	return (
		<MediaUpload
			onSelect={(value) => {
				const newAttributes = {
					[schema]: value.url,
					[schemaIdKey]: null,
				};
				if (altSchema) {
					newAttributes[altSchema] = value.alt;
				}

				imageUrlRef.current = value.url;
				setHighlight(createHighlight(value.url, value.id ?? null));
				setAttributes(newAttributes);

				if (value.id) {
					return;
				}

				const requestedUrl = value.url;
				resolveAttachmentIdByUrl(requestedUrl).then((resolvedId) => {
					if (resolvedId && imageUrlRef.current === requestedUrl) {
						setHighlight(createHighlight(requestedUrl, resolvedId));
					}
				});
			}}
			type="image"
			value={mediaUploadId}
			render={({ open }) => {
				openRef.current = open;
				return (
					<>
						{imageUrl ? (
							<>
								{/* eslint-disable-next-line jsx-a11y/alt-text */}
								<img
									className={'icon-image'}
									src={imageUrl}
									alt={imageAlt || ''}
								/>
								<div className="components-button-group">
									<Button
										onClick={deleteImgBtn}
										className={
											'image-button button button-delete'
										}
									>
										{__('Delete Image', 'vk-blocks')}
									</Button>
									<Button
										onClick={ensureImageId}
										className={
											'image-button button button-replace'
										}
									>
										{__('Replace Image', 'vk-blocks')}
									</Button>
								</div>
							</>
						) : (
							<>
								{showPlaceholder && (
									/* eslint-disable-next-line jsx-a11y/alt-text */
									<img
										className={'icon-image'}
										src={noImage}
										alt=""
									/>
								)}
								<Button
									onClick={open}
									variant={
										showPlaceholder
											? undefined
											: 'secondary'
									}
									className={
										showPlaceholder
											? 'button button-large components-button'
											: 'button button-large'
									}
								>
									{__('Select image', 'vk-blocks')}
								</Button>
							</>
						)}
					</>
				);
			}}
		/>
	);
};
