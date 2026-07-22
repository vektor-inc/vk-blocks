import { VKBButton } from './component';
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { isHexColor } from '@vkblocks/utils/is-hex-color';
import { toPresetSpacingVar } from '@vkblocks/utils/to-preset-spacing-var';

export default function save(props) {
	const { attributes } = props;
	const {
		content,
		subCaption,
		buttonUrl,
		buttonTarget,
		relAttribute,
		linkToPost,
		buttonSize,
		buttonType,
		buttonEffect,
		buttonColor,
		buttonTextColorCustom,
		buttonColorCustom,
		buttonHoverBgColorCustom,
		buttonHoverTextColorCustom,
		buttonAlign,
		buttonWidthMobile,
		buttonWidthTablet,
		buttonWidth,
		outerGap,
		fontAwesomeIconBefore,
		fontAwesomeIconAfter,
		iconSizeBefore,
		iconSizeAfter,
		inlineStyle,
		borderRadius,
		blockId,
		fontSizeValue,
	} = attributes;

	const effectiveUrl = linkToPost ? '' : buttonUrl;

	let containerClass = '';
	// カスタムカラーの場合 またはアウターにギャップが指定されている場合 またはホバー色が指定されている場合
	if (
		(buttonColorCustom !== undefined && isHexColor(buttonColorCustom)) ||
		(buttonTextColorCustom !== undefined &&
			isHexColor(buttonTextColorCustom)) ||
		outerGap ||
		(buttonHoverBgColorCustom !== undefined &&
			buttonHoverBgColorCustom !== '') ||
		(buttonHoverTextColorCustom !== undefined &&
			buttonHoverTextColorCustom !== '')
	) {
		containerClass = `vk_button vk_button-color-custom vk_button-${blockId}`;
	} else {
		containerClass = `vk_button vk_button-color-custom`;
	}

	if (buttonWidthMobile || buttonWidthTablet || buttonWidth) {
		// 横並びボタンで幅が指定されている
		if (buttonWidthMobile) {
			containerClass += ` vk_button-width-mobile-${buttonWidthMobile}`;
		}
		if (buttonWidthTablet) {
			containerClass += ` vk_button-width-tablet-${buttonWidthTablet}`;
		}
		if (buttonWidth) {
			containerClass += ` vk_button-width-${buttonWidth}`;
		}
	} else {
		containerClass += ` vk_button-align-${buttonAlign}`;
	}

	// エフェクト
	if (buttonEffect !== '') {
		containerClass += ` is-style-${buttonEffect}`;
	}

	// コア spacing.padding は useBlockProps.save が wrapper (.vk_button) の
	// インライン style に自動注入するが、ボタンの「内側余白」というユーザー期待は
	// <a> 自体の padding なので、wrapper 側の padding 系プロパティを取り除き、
	// 同じ値を <a> 側に転写する。
	// プリセット値 (var:preset|spacing|XX) は toPresetSpacingVar で var() に変換する。
	// useBlockProps.save will inject the core spacing.padding as inline style on the
	// wrapper (.vk_button), but users expect the inner padding of the <a>. So we
	// strip the padding properties from the wrapper style and forward them onto <a>.
	const spacingPadding = attributes?.style?.spacing?.padding;
	const hasSpacingPadding =
		spacingPadding &&
		(spacingPadding.top ||
			spacingPadding.right ||
			spacingPadding.bottom ||
			spacingPadding.left);

	const blockProps = useBlockProps.save({
		className: containerClass,
	});

	if (hasSpacingPadding && blockProps.style) {
		// 既存ユーザー（padding 未設定）の出力は完全不変にするため、
		// 設定がある時だけ wrapper 側 padding を取り除く。
		// Strip the wrapper padding only when the user actually set one,
		// so that the existing output stays byte-identical for legacy blocks.
		const {
			paddingTop: _pt,
			paddingRight: _pr,
			paddingBottom: _pb,
			paddingLeft: _pl,
			...restWrapperStyle
		} = blockProps.style;
		blockProps.style = restWrapperStyle;
	}

	// inlineStyleからborderRadius・コアpaddingを含む新しいスタイルオブジェクトを構築
	const btnInlineStyle = { ...inlineStyle };
	if (borderRadius) {
		btnInlineStyle.borderRadius = borderRadius;
	}
	if (hasSpacingPadding) {
		if (spacingPadding.top) {
			btnInlineStyle.paddingTop = toPresetSpacingVar(spacingPadding.top);
		}
		if (spacingPadding.right) {
			btnInlineStyle.paddingRight = toPresetSpacingVar(
				spacingPadding.right
			);
		}
		if (spacingPadding.bottom) {
			btnInlineStyle.paddingBottom = toPresetSpacingVar(
				spacingPadding.bottom
			);
		}
		if (spacingPadding.left) {
			btnInlineStyle.paddingLeft = toPresetSpacingVar(
				spacingPadding.left
			);
		}
	}

	return (
		<div {...blockProps}>
			<VKBButton
				lbTextColorCustom={buttonTextColorCustom}
				lbColorCustom={buttonColorCustom}
				lbColor={buttonColor}
				lbType={buttonType}
				lbAlign={buttonAlign}
				lbSize={buttonSize}
				lbUrl={effectiveUrl}
				lbTarget={buttonTarget}
				lbLinkToPost={linkToPost}
				lbRelAttribute={relAttribute}
				lbFontAwesomeIconBefore={fontAwesomeIconBefore}
				lbFontAwesomeIconAfter={fontAwesomeIconAfter}
				lbIconSizeBefore={iconSizeBefore}
				lbIconSizeAfter={iconSizeAfter}
				lbsubCaption={subCaption}
				lbFontSizeValue={fontSizeValue}
				inlineStyle={btnInlineStyle}
				lbRichtext={
					<RichText.Content
						tagName={'span'}
						className={'vk_button_link_txt'}
						value={content}
					/>
				}
			/>
		</div>
	);
}
