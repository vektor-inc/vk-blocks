import { useState, useEffect } from 'react';
import {
	ToolbarButton,
	Dropdown,
	CheckboxControl,
	Button,
	Tooltip,
	TextControl,
	RadioControl,
} from '@wordpress/components';
import { URLInput } from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import { link, linkOff, keyboardReturn, globe, copy } from '@wordpress/icons';

// コアの LinkControl と同じ __preview 系クラス・構造に合わせる（WP仕様に準拠）
const LinkPreview = ({
	linkUrl,
	linkTitle,
	icon,
	linkTarget,
	onRemove,
	onCopy,
	relAttribute,
	linkDescription,
}) => {
	const displayURL =
		linkUrl.startsWith('http://') ||
		linkUrl.startsWith('https://') ||
		linkUrl.startsWith('tel:') ||
		linkUrl.startsWith('mailto:')
			? linkUrl
			: 'http://' + linkUrl;
	const isUrlTitle = linkTitle === linkUrl;

	return (
		<div
			role="group"
			aria-label={__('Manage link', 'vk-blocks')}
			className={`block-editor-link-control__preview is-current is-rich is-preview${isUrlTitle ? ' is-url-title' : ''}`}
		>
			<div
				className="block-editor-link-control__link-information"
				role="figure"
				aria-label={__('Link information', 'vk-blocks')}
			>
				<div className="block-editor-link-control__preview-icon">
					{icon}
				</div>
				<div className="block-editor-link-control__preview-details">
					<a
						className="components-external-link block-editor-link-control__preview-title"
						href={displayURL}
						target={linkTarget}
						rel={relAttribute}
						{...(linkDescription
							? { 'aria-label': linkDescription }
							: {})}
					>
						{linkTitle}
					</a>
					<span className="block-editor-link-control__preview-info">
						{linkUrl}
					</span>
				</div>
			</div>
			<Tooltip text={__('Deleting Link', 'vk-blocks')}>
				<Button
					icon={linkOff}
					label={__('Deleting Link', 'vk-blocks')}
					onClick={onRemove}
					size="compact"
					className="has-icon"
				/>
			</Tooltip>
			<Tooltip
				text={sprintf(
					// translators: %s is the link URL
					__('Copy link: %s', 'vk-blocks'),
					linkUrl
				)}
			>
				<Button
					icon={copy}
					label={__('Copy link', 'vk-blocks')}
					onClick={() => onCopy(linkUrl)}
					size="compact"
					className="has-icon"
				/>
			</Tooltip>
		</div>
	);
};

const LinkToolbar = (props) => {
	const {
		linkUrl,
		setLinkUrl,
		linkTarget,
		setLinkTarget,
		linkDescription,
		setLinkDescription,
		relAttribute,
		setRelAttribute,
		// クエリループ内での「投稿へのリンク」用（任意）
		isDescendentOfQueryLoop,
		linkToPost,
		setLinkToPost,
	} = props;
	const [isOpen, setIsOpen] = useState(false);
	const [linkTitle, setLinkTitle] = useState('');
	const [icon, setIcon] = useState(null);
	const [isSnackbarVisible, setSnackbarVisible] = useState(false);
	const [isSubmitDisabled, setSubmitDisabled] = useState(true);
	const [ariaMessage, setAriaMessage] = useState('');

	useEffect(() => {
		if (linkUrl) {
			const formattedUrl = formatUrl(linkUrl);
			const isExternalLink =
				!formattedUrl.startsWith(window.location.origin) &&
				!formattedUrl.startsWith('#'); // 外部リンクかどうか判定

			// 外部リンクの場合はプレビュー（タイトル取得）をスキップする
			if (!isExternalLink) {
				const fetchTitle = function (url) {
					if (url.startsWith('#')) {
						return Promise.resolve(url); // アンカーリンクの場合はそのまま返す
					}
					return fetch(url, { method: 'GET' })
						.then((response) => response.text())
						.then((text) => {
							const titleMatch = text.match(
								/<title>(.*?)<\/title>/i
							);
							return titleMatch ? titleMatch[1] : url;
						})
						.catch(() => {
							return url;
						});
				};

				fetchTitle(formattedUrl).then((title) => {
					setLinkTitle(title);
				});
			} else {
				// 外部リンクの場合はそのままリンクURLをタイトルとして設定する
				setLinkTitle(formattedUrl);
			}

			// アイコン設定
			if (isExternalLink) {
				setIcon(globe); // 外部リンクの場合は地球アイコン
			} else if (formattedUrl.startsWith('#')) {
				setIcon(globe); // アンカーリンクにも地球アイコンを使用
			} else {
				try {
					const domain = new URL(formattedUrl).origin;
					const faviconUrl = `${domain}/favicon.ico`;
					setIcon(<img src={faviconUrl} alt="" />);
				} catch {
					setIcon(link); // URLが無効な場合はリンクアイコンを使用
				}
			}
		}
	}, [linkUrl]);

	useEffect(() => {
		setSubmitDisabled(!linkUrl || linkUrl.trim() === '');
	}, [linkUrl]);

	const handleToggle = () => {
		if (!isOpen) {
			setIsOpen(true);
		} else if (linkUrl === '') {
			setIsOpen(false);
		}
	};

	const handleRemove = () => {
		setLinkUrl('');
		setLinkTarget('');
		if (typeof setLinkToPost === 'function') {
			setLinkToPost(false);
		}
		setIsOpen(false);
	};

	// クエリループ内で「投稿へのリンク」か「URLを指定」のどちらか（2択）
	const showLinkDestinationChoice =
		isDescendentOfQueryLoop &&
		linkToPost !== undefined &&
		typeof setLinkToPost === 'function';
	const isLinkToPostMode = !!linkToPost;

	// ブロックがクエリループ外に移ったら「投稿へのリンク」を解除する
	useEffect(() => {
		if (
			!showLinkDestinationChoice &&
			linkToPost &&
			typeof setLinkToPost === 'function'
		) {
			setLinkToPost(false);
		}
	}, [showLinkDestinationChoice, linkToPost, setLinkToPost]);

	// リンクが設定されているか（ツールバーアイコンの反転・is-pressed に使用）
	const hasLink =
		!!linkToPost ||
		!!(linkUrl && typeof linkUrl === 'string' && linkUrl.trim() !== '');

	const handleCopy = function (url) {
		const formattedUrl = url.startsWith('#') ? url : formatUrl(url);
		if (typeof window !== 'undefined' && window.navigator.clipboard) {
			window.navigator.clipboard
				.writeText(formattedUrl)
				.then(() => {
					setAriaMessage(
						__('Link copied to clipboard.', 'vk-blocks')
					);
					setSnackbarVisible(true);
					setTimeout(() => setSnackbarVisible(false), 3000);
				})
				.catch(() => {
					// console.error('Failed to copy: ', error);
				});
		} else {
			// Clipboard API がサポートされていない場合のフォールバック
			const textArea = document.createElement('textarea');
			textArea.value = formattedUrl;
			document.body.appendChild(textArea);
			textArea.focus();
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
			setAriaMessage(__('Link copied to clipboard.', 'vk-blocks'));
			setSnackbarVisible(true);
			setTimeout(() => setSnackbarVisible(false), 3000);
		}
	};

	// URLのフォーマット関数を更新
	const formatUrl = (url) => {
		// 絶対パス・相対パス・アンカーリンクであればそのまま返す
		if (
			url.startsWith('http://') ||
			url.startsWith('https://') ||
			url.startsWith('/') ||
			url.startsWith('#') ||
			url.startsWith('tel:') ||
			url.startsWith('mailto:') ||
			url === ''
		) {
			return url;
		}
		// その他のリンクは http:// を付加する
		return 'http://' + url;
	};

	const handleSubmit = () => {
		if (linkUrl) {
			setLinkUrl(formatUrl(linkUrl));
		}
	};

	const handleRelChange = (type, checked) => {
		const rel = relAttribute ? relAttribute.split(' ') : [];
		if (checked) {
			rel.push(type);
		} else {
			const index = rel.indexOf(type);
			if (index !== -1) {
				rel.splice(index, 1);
			}
		}
		setRelAttribute(rel.join(' '));
	};

	return (
		<>
			<Dropdown
				popoverProps={{ placement: 'bottom-start' }}
				renderToggle={({ isOpen, onToggle }) => {
					const setLink = () => {
						if (isOpen) {
							// 開いている状態でクリック＝「Unlink」→ リンクを解除して閉じる
							handleRemove();
							onToggle();
						} else {
							handleToggle();
							onToggle();
						}
					};
					return (
						<ToolbarButton
							aria-expanded={isOpen}
							icon={isOpen ? linkOff : link}
							isActive={hasLink}
							label={
								isOpen
									? __('Unlink', 'vk-blocks')
									: __('Input Link URL', 'vk-blocks')
							}
							onClick={setLink}
							className={`vk-block-editor-link-toolbar-button ${hasLink ? 'is-pressed' : ''}`}
						/>
					);
				}}
				renderContent={({ onClose }) => (
					<div className="vk-block-editor-link-toolbar-popover block-editor-link-control">
						{showLinkDestinationChoice && (
							<div className="vk-block-editor-link-destination-choice">
								<RadioControl
									label={__('Link destination', 'vk-blocks')}
									selected={isLinkToPostMode ? 'post' : 'url'}
									options={[
										{
											label: __(
												'Link to post',
												'vk-blocks'
											),
											value: 'post',
										},
										{
											label: __(
												'Specify URL',
												'vk-blocks'
											),
											value: 'url',
										},
									]}
									onChange={(value) =>
										setLinkToPost(value === 'post')
									}
								/>
							</div>
						)}
						{!isLinkToPostMode && linkUrl && (
							<LinkPreview
								linkUrl={formatUrl(linkUrl)}
								linkTitle={linkTitle}
								icon={icon}
								linkTarget={linkTarget}
								onRemove={handleRemove}
								onCopy={handleCopy}
							/>
						)}
						<form
							className="vk-block-editor-link-toolbar-form"
							onSubmit={(e) => {
								e.preventDefault();
								handleSubmit();
								onClose();
							}}
						>
							{(!showLinkDestinationChoice ||
								!isLinkToPostMode) && (
								<div className="vk-block-editor-link-toolbar-section vk-block-editor-link-toolbar-section-url">
									<div className="vk-block-editor-url-input-wrapper">
										<URLInput
											__nextHasNoMarginBottom
											value={linkUrl}
											onChange={(value) =>
												setLinkUrl(value)
											}
										/>
										<Button
											icon={keyboardReturn}
											label={__('Submit', 'vk-blocks')}
											type="submit"
											disabled={isSubmitDisabled}
										/>
									</div>
								</div>
							)}
							<div className="vk-block-editor-link-toolbar-section vk-block-editor-link-toolbar-section-options">
								<CheckboxControl
									label={__('Open link new tab', 'vk-blocks')}
									checked={linkTarget === '_blank'}
									onChange={(checked) =>
										setLinkTarget(checked ? '_blank' : '')
									}
								/>
								{relAttribute !== undefined &&
									typeof setRelAttribute === 'function' && (
										<>
											<CheckboxControl
												label={__(
													'Add noreferrer',
													'vk-blocks'
												)}
												checked={
													relAttribute.includes(
														'noreferrer'
													) || false
												}
												onChange={(checked) =>
													handleRelChange(
														'noreferrer',
														checked
													)
												}
											/>
											<CheckboxControl
												label={__(
													'Add nofollow',
													'vk-blocks'
												)}
												checked={
													relAttribute.includes(
														'nofollow'
													) || false
												}
												onChange={(checked) =>
													handleRelChange(
														'nofollow',
														checked
													)
												}
											/>
										</>
									)}
							</div>
							{!isLinkToPostMode &&
								linkDescription !== undefined &&
								typeof setLinkDescription === 'function' && (
									<div className="vk-block-editor-link-toolbar-section vk-block-editor-link-toolbar-section-description">
										<TextControl
											label={__(
												'Accessibility link description',
												'vk-blocks'
											)}
											value={linkDescription}
											onChange={(value) =>
												setLinkDescription(value)
											}
										/>
									</div>
								)}
						</form>
					</div>
				)}
			/>
			{isSnackbarVisible && (
				<div
					aria-live="polite"
					style={{
						position: 'fixed',
						bottom: '-3.5rem',
						right: '0',
						zIndex: 9999,
						background: '#000',
						color: '#fff',
						padding: '10px',
						borderRadius: '4px',
						fontSize: '12px',
						lineHeight: '1.2',
					}}
				>
					{__('Link copied to clipboard.', 'vk-blocks')}
				</div>
			)}
			<div
				aria-live="polite"
				style={{
					position: 'absolute',
					width: '1px',
					height: '1px',
					margin: '-1px',
					padding: '0',
					overflow: 'hidden',
					clip: 'rect(0,0,0,0)',
					border: '0',
				}}
			>
				{ariaMessage}
			</div>
		</>
	);
};

export default LinkToolbar;
