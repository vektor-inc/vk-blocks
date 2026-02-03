/**
 * External dependencies
 */
import classnames from 'classnames';
import { sanitizeSlug } from '@vkblocks/utils/sanitizeSlug';

/* eslint camelcase: 0 */
import { __ } from '@wordpress/i18n';
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import GenerateBgImage from './GenerateBgImage';
import { isHexColor } from '@vkblocks/utils/is-hex-color';
import { toPresetSpacingVar } from '@vkblocks/utils/to-preset-spacing-var';
const prefix = 'vk_slider_item';

export default function save(props) {
	const { attributes } = props;
	const {
		verticalAlignment,
		bgColor,
		opacity,
		style,
		bgImageMobile,
		bgImageTablet,
		bgImage,
		linkUrl,
		linkTarget,
		relAttribute,
		linkDescription,
		contentWidth,
		blockId,
	} = attributes;

	const spacingPaddingLeft = style?.spacing?.padding?.left;
	const spacingPaddingRight = style?.spacing?.padding?.right;
	const spacingPaddingLeftVar = toPresetSpacingVar(spacingPaddingLeft);
	const spacingPaddingRightVar = toPresetSpacingVar(spacingPaddingRight);

	// classPaddingLRのクラス切り替え
	let classPaddingLR = '';

	if (contentWidth) {
		classPaddingLR += `is-layout-constrained`;
	}
	if (!spacingPaddingLeft && !spacingPaddingRight) {
		classPaddingLR += ` ${prefix}-paddingLR-use`;
	}

	let containerClass = '';
	if (contentWidth) {
		containerClass = `${prefix}_container container`;
	} else {
		containerClass = `${prefix}_container`;
	}

	const opacityClass = opacity && opacity * 10;
	const bgAreaClasses = classnames('vk_slider_item-background-area', {
		[`has-background`]: bgColor !== undefined,
		[`has-${sanitizeSlug(bgColor)}-background-color`]:
			bgColor !== undefined && !isHexColor(bgColor),
		[`has-background-dim`]: opacity !== undefined,
		[`has-background-dim-${opacityClass}`]: opacityClass !== undefined,
	});

	const bgAreaStyles = {
		backgroundColor: isHexColor(bgColor) ? bgColor : undefined,
		paddingLeft: spacingPaddingLeftVar,
		paddingRight: spacingPaddingRightVar,
	};

	const GetBgImage = (
		<>
			{(bgImage || bgImageTablet || bgImageMobile) && (
				<GenerateBgImage prefix={prefix} blockId={blockId} {...props} />
			)}
			<div className={bgAreaClasses} style={bgAreaStyles}></div>
		</>
	);

	const GetLinkUrl = (
		<a
			href={linkUrl}
			{...(linkTarget ? { target: linkTarget } : {})}
			{...(relAttribute ? { rel: relAttribute } : {})}
			className={`${prefix}-link`}
		>
			<span className="screen-reader-text">
				{linkDescription
					? linkDescription
					: __('Slider item link', 'vk-blocks')}
			</span>
		</a>
	);

	const blockProps = useBlockProps.save({
		className: `vk_slider_item swiper-slide vk_valign-${verticalAlignment} ${prefix}-${blockId} ${classPaddingLR} ${prefix}-paddingVertical-none`,
		style: {
			paddingLeft: spacingPaddingLeftVar,
			paddingRight: spacingPaddingRightVar,
		},
	});
	return (
		<div {...blockProps}>
			{linkUrl && GetLinkUrl}
			{GetBgImage}
			<div className={containerClass}>
				<InnerBlocks.Content />
			</div>
		</div>
	);
}
