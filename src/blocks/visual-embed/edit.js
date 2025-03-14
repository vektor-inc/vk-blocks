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
} from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';

const allowedUrlPatterns =
	typeof vkBlocksVisualEmbed !== 'undefined' && // eslint-disable-line no-undef
	vkBlocksVisualEmbed.allowedUrlPatterns // eslint-disable-line no-undef
		? vkBlocksVisualEmbed.allowedUrlPatterns // eslint-disable-line no-undef
		: [];

// 許可するURLパターンの配列
const ALLOWED_URL_PATTERNS = [
	'https://*.google.com/*',
	'https://*.youtube.com/embed/*',
	'https://www.openstreetmap.org/export/*',
	'https://player.vimeo.com/*',
];

// フィルターフックを使用してURLパターンを変更
const filteredAllowedUrlPatterns = [
	...ALLOWED_URL_PATTERNS,
	// eslint-disable-next-line no-undef
	...allowedUrlPatterns,
];

export default function EmbedCodeEdit({ attributes, setAttributes }) {
	const { iframeCode, iframeWidth, iframeHeight } = attributes;
	const [tempIframeCode, setTempIframeCode] = useState(iframeCode);
	const prevIframeWidth = useRef(attributes.iframeWidth);

	useEffect(() => {
		// align がユーザーによって設定されていたら変更しない
		if (attributes.align !== undefined) {
			return;
		}

		const isFullWidth = String(attributes.iframeWidth) === '100%';
		const wasFullWidth = String(prevIframeWidth.current) === '100%';

		// 100% から 100% 以外に変わった瞬間のみ align: "center" を適用
		if (wasFullWidth && !isFullWidth) {
			setAttributes({ align: 'center' });
		}

		// iframeWidth の変更を記録
		prevIframeWidth.current = attributes.iframeWidth;
	}, [attributes.iframeWidth]);

	useEffect(() => {
		if (iframeWidth && isIframe) {
			updateIframeAttributes(iframeWidth, iframeHeight);
		}
	}, [iframeWidth, iframeHeight]);

	// iframeを解析する関数
	const parseIframeCode = (code) => {
		const parser = new window.DOMParser();
		const doc = parser.parseFromString(code, 'text/html');
		const iframe = doc.querySelector('iframe');
		return iframe ? iframe : false;
	};
	const [isIframe, setIsIframe] = useState(!!parseIframeCode(iframeCode));

	const blockProps = useBlockProps({
		className: 'vk-visual-embed',
	});

	// iframeのsrc属性を検証する関数
	const isAllowedSrc = (src) => {
		if (!src) {
			return false;
		}
		return filteredAllowedUrlPatterns.some((pattern) => {
			// ワイルドカードパターンを正規表現に変換
			const regexPattern = pattern
				.replace(/\./g, '\\.')
				.replace(/\*/g, '.*');
			const regex = new RegExp(`^${regexPattern}$`);
			return regex.test(src);
		});
	};

	// iframeタグ以外を削除する関数
	const sanitizeIframeCode = (code) => {
		if (!code) {
			return '';
		}

		// DOMParserが利用できない環境の場合は入力をそのまま返す
		if (typeof window.DOMParser === 'undefined') {
			return code;
		}

		const iframe = parseIframeCode(code);

		if (!iframe) {
			return '';
		}

		// src属性を検証
		const src = iframe.getAttribute('src');
		if (!isAllowedSrc(src)) {
			return __('Only allowed URLs can be embedded.', 'vk-blocks');
		}

		return iframe.outerHTML;
	};

	// iframeの属性を解析して幅と高さを取得
	const extractIframeAttributes = (code) => {
		if (typeof window.DOMParser === 'undefined') {
			return false;
		}

		const iframe = parseIframeCode(code);

		if (iframe) {
			const newWidth = iframe.getAttribute('width') || iframeWidth;
			const newHeight = iframe.getAttribute('height') || iframeHeight;

			// 抽出した値を設定パネルに反映
			setAttributes({
				iframeWidth: newWidth,
				iframeHeight: newHeight,
			});

			return true; // iframeが見つかった場合はtrueを返す
		}

		return false; // iframeが見つからない場合はfalseを返す
	};

	// iframeの属性を解析・更新する関数
	const updateIframeAttributes = (newWidth, newHeight) => {
		if (!iframeCode || typeof window.DOMParser === 'undefined') {
			return;
		}

		const iframe = parseIframeCode(iframeCode);

		if (iframe) {
			if (newWidth) {
				iframe.setAttribute('width', newWidth);
			}
			if (newHeight) {
				iframe.setAttribute('height', newHeight);
			}

			// 更新後のiframeコードを設定
			setAttributes({
				iframeCode: iframe.outerHTML,
				iframeWidth: newWidth || iframeWidth,
				iframeHeight: newHeight || iframeHeight,
			});
			setTempIframeCode(iframe.outerHTML);
		}
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
						onBlur={() => {
							if (!tempIframeCode) {
								setAttributes({ iframeCode: '' });
								setIsIframe(false);
								return;
							}
							const sanitizedCode =
								sanitizeIframeCode(tempIframeCode);
							setAttributes({ iframeCode: sanitizedCode });
							if (sanitizedCode) {
								extractIframeAttributes(sanitizedCode);
							}

							setIsIframe(!!parseIframeCode(sanitizedCode));
							setTempIframeCode(sanitizedCode);
						}}
						help={__(
							'Please paste the iframe embed code directly. Only iframe tags with allowed URLs (Google Maps, Google Calendar, Google Forms, YouTube、OpenStreetMap, Vimeo) are permitted.',
							'vk-blocks'
						)}
					/>
					{!iframeCode && (
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
					{iframeCode && !sanitizeIframeCode(iframeCode) && (
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
							if (!iframeWidth) {
								extractIframeAttributes(iframeCode);
								return;
							}
							if (/^\d+(px|%)?$/.test(iframeWidth)) {
								updateIframeAttributes(
									iframeWidth,
									iframeHeight
								);
							} else {
								setAttributes({ iframeWidth: '' });
								updateIframeAttributes('', iframeHeight);
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
							if (!iframeHeight) {
								extractIframeAttributes(iframeCode);
								return;
							}
							if (/^\d+(px|%)?$/.test(iframeHeight)) {
								updateIframeAttributes(
									iframeWidth,
									iframeHeight
								);
							} else {
								setAttributes({ iframeHeight: '' });
								updateIframeAttributes(iframeWidth, '');
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
				{iframeCode && (
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
