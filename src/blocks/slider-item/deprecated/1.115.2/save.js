/**
 * External dependencies
 */
import classnames from 'classnames';
import { sanitizeSlug } from '@vkblocks/utils/sanitizeSlug';

/* eslint camelcase: 0 */
import { __ } from '@wordpress/i18n';
import { InnerBlocks } from '@wordpress/block-editor';
import GenerateBgImage from './GenerateBgImage';
import { isHexColor } from '@vkblocks/utils/is-hex-color';
const prefix = 'vk_slider_item';

const toLegacyPresetSpacingVar = (value) => {
	if (typeof value !== 'string') {
		return value;
	}
	if (value.startsWith('var(--wp--preset--spacing--')) {
		return value.replace(
			/^var\(--wp--preset--spacing--(.+)\)$/,
			'var:preset|spacing|$1'
		);
	}
	return value;
};

export default function save(props) {
	const { attributes } = props;
	const {
		verticalAlignment,
		bgColor,
		opacity,
		padding_left_and_right,
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

	let classPaddingLR;
	let containerClass;

	const spacingPaddingLeft = toLegacyPresetSpacingVar(
		style?.spacing?.padding?.left
	);
	const spacingPaddingRight = toLegacyPresetSpacingVar(
		style?.spacing?.padding?.right
	);

	// classPaddingLRのクラス切り替え
	classPaddingLR = '';
	let paddingValue = '';

	if (spacingPaddingLeft || spacingPaddingRight || contentWidth) {
		// コア spacing がある場合はそれを優先
		paddingValue = spacingPaddingLeft || spacingPaddingRight || '';
		if (contentWidth) {
			classPaddingLR = ` is-layout-constrained`;
		}
	} else if (padding_left_and_right === '0') {
		classPaddingLR = ` is-layout-constrained`;
		paddingValue = '0';
	} else if (padding_left_and_right === '1') {
		classPaddingLR = ` ${prefix}-paddingLR-use`;
		paddingValue = '4em';
	} else if (padding_left_and_right === '2') {
		classPaddingLR = ` ${prefix}-paddingLR-zero`;
		paddingValue = '0';
	}

	if (classPaddingLR === ` is-layout-constrained`) {
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
		paddingLeft: paddingValue,
		paddingRight: paddingValue,
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
					: __( 'Slider item link', 'vk-blocks' )}
			</span>
		</a>
	);

	const spacingPaddingTop = toLegacyPresetSpacingVar(
		style?.spacing?.padding?.top
	);
	const spacingPaddingBottom = toLegacyPresetSpacingVar(
		style?.spacing?.padding?.bottom
	);

	const blockProps = {
		className: `wp-block-vk-blocks-slider-item vk_slider_item swiper-slide vk_valign-${verticalAlignment} ${prefix}-${blockId} ${classPaddingLR} ${prefix}-paddingVertical-none`,
		style: {
			paddingTop: spacingPaddingTop,
			paddingRight: paddingValue || spacingPaddingRight,
			paddingBottom: spacingPaddingBottom,
			paddingLeft: paddingValue || spacingPaddingLeft,
		},
	};
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
