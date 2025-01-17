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

export default function EmbedCodeEdit({ attributes, setAttributes }) {
	const { iframeCode, iframeWidth, iframeHeight } = attributes;

	const blockProps = useBlockProps({
		className: 'vk-visual-embed',
	});

	// iframeの属性を解析して幅と高さを取得
	const extractIframeAttributes = (code) => {
		if (typeof window.DOMParser === 'undefined') {
			return false;
		}

		const parser = new window.DOMParser();
		const doc = parser.parseFromString(code, 'text/html');
		const iframe = doc.querySelector('iframe');

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

		const parser = new window.DOMParser();
		const doc = parser.parseFromString(iframeCode, 'text/html');
		const iframe = doc.querySelector('iframe');

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
		}
	};

	// iframeタグが存在するかをチェック
	const isIframe = iframeCode && extractIframeAttributes(iframeCode);

	return (
		<div {...blockProps}>
			<BlockControls />
			<InspectorControls>
				<PanelBody title={__('Embed Code Settings', 'vk-blocks')}>
					<TextareaControl
						label={__('Embed Code', 'vk-blocks')}
						value={iframeCode}
						onChange={(newCode) => {
							setAttributes({ iframeCode: newCode });
							extractIframeAttributes(newCode);
						}}
						help={__(
							'Please paste the iframe embed code directly. (e.g., Google Maps)',
							'vk-blocks'
						)}
					/>
					<TextControl
						label={__('Iframe Width', 'vk-blocks')}
						value={iframeWidth}
						onChange={(newWidth) =>
							updateIframeAttributes(newWidth, iframeHeight)
						}
						disabled={!isIframe}
					/>
					<TextControl
						label={__('Iframe Height', 'vk-blocks')}
						value={iframeHeight}
						onChange={(newHeight) =>
							updateIframeAttributes(iframeWidth, newHeight)
						}
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
