import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { MediaUpload } from '@wordpress/block-editor';
import { resolveSelect } from '@wordpress/data';
import { useEffect, useRef, useState } from '@wordpress/element';
import noImage from '../../../inc/vk-blocks/images/no-image.svg';

/**
 * Resolve an attachment ID from a media URL.
 * REST API only allows per_page 1–100, so avoid fetching all attachments.
 * Search by filename, then match source_url exactly. Return null on failure.
 * メディアURLから添付IDを解決する。
 * REST API の per_page は 1〜100 のみなので全件取得は使わない。
 * ファイル名で検索し source_url が一致するものを返す。失敗時は null。
 *
 * @param {string} imageUrl
 * @return {Promise<number|null>} Attachment ID, or null when not found / on failure.
 */
export async function resolveAttachmentIdByUrl(imageUrl) {
	if (!imageUrl) {
		return null;
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

	let media;
	try {
		media = await resolveSelect('core').getEntityRecords(
			'postType',
			'attachment',
			{
				search: fileName,
				per_page: 100,
			}
		);
	} catch {
		// REST / resolver failure → open media library without ID.
		// REST / resolver 失敗時は ID なしでメディアライブラリを開く。
		return null;
	}
	const mediaItem = media?.find((item) => item.source_url === imageUrl);
	return mediaItem?.id ?? null;
}

/**
 * Media select / replace / delete UI with attachment ID backfill.
 * 添付IDの補完付きメディア選択・置換・削除 UI。
 *
 * @param {Object}   props
 * @param {string}   props.schema                 URL attribute key (e.g. bgImage)
 * @param {string}   [props.schemaId]             ID attribute key (default: schema + 'Id')
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
	const imageId = attributes[schemaIdKey];
	const imageAlt = altSchema ? attributes[altSchema] : undefined;

	// Keep the latest URL for stale-async guards.
	// 非同期解決の stale 判定用に最新の URL を保持する
	const imageUrlRef = useRef(imageUrl);
	useEffect(() => {
		imageUrlRef.current = imageUrl;
	}, [imageUrl]);

	// Hold MediaUpload's open so we can call it after imageId is in props.
	// imageId が props に反映されたあとに開くため、open を保持する
	const openRef = useRef(null);
	const [shouldOpenAfterId, setShouldOpenAfterId] = useState(false);

	useEffect(() => {
		if (shouldOpenAfterId && imageId && openRef.current) {
			openRef.current();
			setShouldOpenAfterId(false);
		}
	}, [shouldOpenAfterId, imageId]);

	// Backfill missing attachment ID when URL exists (legacy / migrated blocks).
	// URL があるのに ID が無い既存ブロック向けに添付IDを補完する
	useEffect(() => {
		let cancelled = false;

		if (!imageUrl || imageId) {
			return undefined;
		}

		const requestedUrl = imageUrl;
		(async () => {
			const id = await resolveAttachmentIdByUrl(requestedUrl);
			if (cancelled) {
				return;
			}
			if (imageUrlRef.current !== requestedUrl) {
				return;
			}
			if (id) {
				setAttributes({ [schemaIdKey]: id });
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [imageUrl, imageId, schemaIdKey, setAttributes]);

	const deleteImgBtn = () => {
		const next = {
			[schema]: null,
			[schemaIdKey]: null,
		};
		if (altSchema) {
			next[altSchema] = null;
		}
		setAttributes(next);
	};

	/**
	 * Resolve missing attachment ID, then open the media library so the
	 * current image can be highlighted. Wait until React has the new value.
	 * 不足している添付IDを解決してからメディアライブラリを開き、現在画像を
	 * 選択状態にする。ID が props に載るまで open を待つ。
	 */
	const ensureImageId = async () => {
		if (imageId) {
			openRef.current?.();
			return;
		}

		if (!imageUrl) {
			openRef.current?.();
			return;
		}

		const requestedUrl = imageUrl;
		const id = await resolveAttachmentIdByUrl(requestedUrl);

		if (imageUrlRef.current !== requestedUrl) {
			return;
		}

		if (id) {
			setAttributes({ [schemaIdKey]: id });
			setShouldOpenAfterId(true);
			return;
		}

		// Resolve failed — still open without a highlighted selection.
		// 解決失敗時もハイライトなしでライブラリを開く
		openRef.current?.();
	};

	return (
		<MediaUpload
			onSelect={(value) => {
				const newAttributes = {
					[schema]: value.url,
				};
				if (altSchema) {
					newAttributes[altSchema] = value.alt;
				}

				if (value.id) {
					newAttributes[schemaIdKey] = value.id;
					imageUrlRef.current = value.url;
					setAttributes(newAttributes);
					return;
				}

				// Clear stale ID when onSelect has no id; resolve async.
				// onSelect に id が無いときは古い ID を残さず、非同期で解決する
				newAttributes[schemaIdKey] = null;
				imageUrlRef.current = value.url;
				setAttributes(newAttributes);

				const requestedUrl = value.url;
				resolveAttachmentIdByUrl(requestedUrl).then((id) => {
					if (id && imageUrlRef.current === requestedUrl) {
						setAttributes({ [schemaIdKey]: id });
					}
				});
			}}
			type="image"
			value={imageId}
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
