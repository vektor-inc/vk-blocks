import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	useBlockProps,
	BlockControls,
} from '@wordpress/block-editor';

import {
	PanelBody,
	TextareaControl,
	TextControl,
	Notice,
	Placeholder,
} from '@wordpress/components';
import { getBlockType } from '@wordpress/blocks';
import { useEffect, useRef, useState } from '@wordpress/element';

import { ReactComponent as Icon } from './icon.svg';
import { getCssLength } from './utils/get-css-length';
import {
	EMPTY_EMBED_ATTRIBUTES,
	getAllowedUrlPatterns,
	extractEmbedAttributes,
	sanitizeEmbedAttributes,
	createIframeCode,
	isValidEmbedSize,
} from './utils/embed-attributes';
import { getYouTubePreviewData } from './utils/youtube-preview';

export default function EmbedCodeEdit({ attributes, setAttributes }) {
	const { iframeWidth, iframeHeight } = attributes;
	const allowedUrlPatterns = getAllowedUrlPatterns();
	// 保存データから表示用の iframe を組み立てる（保存データに不許可の URL や属性があっても表示しない）
	const embedAttributes = sanitizeEmbedAttributes(
		attributes.embedAttributes,
		allowedUrlPatterns
	);
	const iframeCode = createIframeCode(embedAttributes);
	const isIframe = !!embedAttributes.src;
	// 入力欄の文字列は保存データとは別に持つ（不許可のコードも修正できるよう入力欄に残すため）
	const [tempIframeCode, setTempIframeCode] = useState(iframeCode);
	const [hasInputError, setHasInputError] = useState(false);
	const prevIframeWidth = useRef(iframeWidth);
	const lastAppliedIframeCode = useRef(iframeCode);

	useEffect(() => {
		// Undo/Redo・RTC など外部からの属性変更を入力欄と通知へ反映する（入力中の無効な文字列も置き換える）
		if (iframeCode !== lastAppliedIframeCode.current) {
			setTempIframeCode(iframeCode);
			setHasInputError(false);
			lastAppliedIframeCode.current = iframeCode;
		}
	}, [iframeCode]);

	useEffect(() => {
		// align がユーザーによって設定されていたら変更しない
		if (attributes.align !== undefined) {
			return;
		}

		const isFullWidth = String(iframeWidth) === '100%';
		const wasFullWidth = String(prevIframeWidth.current) === '100%';

		// 100% から 100% 以外に変わった瞬間のみ align: "center" を適用
		if (wasFullWidth && !isFullWidth) {
			setAttributes({ align: 'center' });
		}

		// iframeWidth の変更を記録
		prevIframeWidth.current = iframeWidth;
	}, [iframeWidth]);

	const blockProps = useBlockProps({
		className: 'vk-visual-embed',
	});
	const youtubePreviewData = getYouTubePreviewData(iframeCode);
	const youtubePreviewStyle = {
		width: getCssLength(iframeWidth),
		height: getCssLength(iframeHeight),
	};

	// 入力欄の埋め込みコードを検証して保存データへ反映する
	const applyIframeCode = () => {
		const data = extractEmbedAttributes(tempIframeCode, allowedUrlPatterns);
		const isInvalid = !!tempIframeCode && !data.src;
		setHasInputError(isInvalid);

		// 空にした場合と、不許可の URL や iframe 以外のコードの場合は、保存データとプレビューを空にする。
		// 不許可の入力文字列は修正できるよう入力欄に残す
		if (!data.src) {
			lastAppliedIframeCode.current = '';
			if (!isInvalid) {
				setTempIframeCode('');
			}
			// 既に空なら保存データを変えない（フォーカスを外しただけで投稿が変更扱いにならないように）
			if (isIframe) {
				setAttributes({ embedAttributes: EMPTY_EMBED_ATTRIBUTES });
			}
			return;
		}

		const appliedIframeCode = createIframeCode(data);
		lastAppliedIframeCode.current = appliedIframeCode;
		setTempIframeCode(appliedIframeCode);
		// 埋め込みが変わっていなければ保存データを変えない
		if (appliedIframeCode === iframeCode) {
			return;
		}
		setAttributes({
			embedAttributes: data,
			iframeWidth: data.width || iframeWidth,
			iframeHeight: data.height || iframeHeight,
		});
	};

	// 設定欄の幅・高さを iframe へ反映する（空の値は iframe の現在値を保つ）
	const updateIframeSize = (size) => {
		// 埋め込みが無い場合と、値が変わっていない場合は保存データを変えない
		if (
			!isIframe ||
			Object.keys(size).every(
				(name) => embedAttributes[name] === size[name]
			)
		) {
			return;
		}
		setAttributes({
			embedAttributes: sanitizeEmbedAttributes(
				{ ...embedAttributes, ...size },
				allowedUrlPatterns
			),
		});
	};

	return (
		<div {...blockProps}>
			<BlockControls />
			<InspectorControls>
				<PanelBody title={__('Embed Code Settings', 'vk-blocks')}>
					<TextareaControl
						label={__('Embed Code', 'vk-blocks')}
						value={tempIframeCode}
						onChange={(newCode) => {
							setTempIframeCode(newCode);
						}}
						onBlur={applyIframeCode}
						help={__(
							'Please paste the iframe embed code directly. Only iframe tags with allowed URLs (Google Maps, Google Calendar, Google Forms, YouTube、OpenStreetMap, Vimeo) are permitted.',
							'vk-blocks'
						)}
					/>
					{!iframeCode && !hasInputError && (
						<Notice
							status="error"
							isDismissible={false}
							className="vk-visual-embed_notice"
						>
							{__(
								'Please enter an iframe embed code.',
								'vk-blocks'
							)}
						</Notice>
					)}
					{hasInputError && (
						<Notice
							status="error"
							isDismissible={false}
							className="vk-visual-embed_notice"
						>
							{__(
								'The provided URL is not allowed. Please use an approved embed source.',
								'vk-blocks'
							)}
						</Notice>
					)}
					<TextControl
						label={__('Iframe Width', 'vk-blocks')}
						value={iframeWidth}
						onChange={(newWidth) => {
							setAttributes({ iframeWidth: newWidth });
						}}
						onBlur={() => {
							// 空にしたら iframe の現在の幅を設定欄へ戻す
							if (!iframeWidth) {
								setAttributes({
									iframeWidth: embedAttributes.width || '',
								});
								return;
							}
							if (isValidEmbedSize(iframeWidth)) {
								updateIframeSize({ width: iframeWidth });
							} else {
								setAttributes({ iframeWidth: '' });
							}
						}}
						disabled={!isIframe}
					/>
					<TextControl
						label={__('Iframe Height', 'vk-blocks')}
						value={iframeHeight}
						onChange={(newHeight) => {
							setAttributes({ iframeHeight: newHeight });
						}}
						onBlur={() => {
							// 空にしたら iframe の現在の高さを設定欄へ戻す
							if (!iframeHeight) {
								setAttributes({
									iframeHeight: embedAttributes.height || '',
								});
								return;
							}
							if (isValidEmbedSize(iframeHeight)) {
								updateIframeSize({ height: iframeHeight });
							} else {
								setAttributes({ iframeHeight: '' });
							}
						}}
						disabled={!isIframe}
					/>
					{!isIframe && (
						<Notice status="warning" isDismissible={false}>
							{__(
								'Note: These settings are only applicable to iframe tags. Other embed codes will not respond to these adjustments.',
								'vk-blocks'
							)}
						</Notice>
					)}
				</PanelBody>
			</InspectorControls>
			<div style={{ position: 'relative' }}>
				{!iframeCode && (
					// 空のブロックがキャンバスで高さ 0 にならず、クリックで選べるようにする。
					// 見出しはブロック名（block.json の翻訳）、説明は既存の文言を使う
					<Placeholder
						icon={<Icon />}
						label={
							(getBlockType('vk-blocks/visual-embed') || {}).title
						}
						instructions={__(
							'Please enter an iframe embed code.',
							'vk-blocks'
						)}
					/>
				)}
				{iframeCode && youtubePreviewData && (
					<div
						className="vk-visual-embed-preview vk-visual-embed-preview--youtube"
						style={youtubePreviewStyle}
						title={__(
							'Preview only. The video plays on the published page.',
							'vk-blocks'
						)}
					>
						<img
							className="vk-visual-embed-preview__youtube-thumbnail"
							src={youtubePreviewData.thumbnailUrl}
							alt={__('YouTube video preview', 'vk-blocks')}
							decoding="async"
						/>
						<span
							className="vk-visual-embed-preview__youtube-play"
							aria-hidden="true"
						>
							<svg
								className="vk-visual-embed-preview__youtube-play-icon"
								viewBox="0 0 17 20"
								xmlns="http://www.w3.org/2000/svg"
								focusable="false"
							>
								<path d="M0 0 L17 10 L0 20 Z" />
							</svg>
						</span>
					</div>
				)}
				{iframeCode && !youtubePreviewData && (
					<div
						className="vk-visual-embed-preview"
						dangerouslySetInnerHTML={{ __html: iframeCode }}
						style={{
							pointerEvents: 'none',
						}}
					/>
				)}
			</div>
		</div>
	);
}
