import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import parse from 'html-react-parser';
import { isHexColor } from '@vkblocks/utils/is-hex-color';
import { sanitizeSlug } from '@vkblocks/utils/sanitizeSlug';
import { fixBrokenUnicode } from '@vkblocks/utils/fixBrokenUnicode';

export class VKBIcon extends Component {
	render() {
		let fontAwesomeIcon = this.props.lbFontAwesomeIcon;
		if (fontAwesomeIcon) {
			fontAwesomeIcon = fixBrokenUnicode(fontAwesomeIcon);
		}
		const iconSize = this.props.lbSize;
		const iconSizeUnit = this.props.lbSizeUnit;
		const iconMargin = this.props.lbMargin;
		const iconMarginUnit = this.props.lbMarginUnit;
		const iconRadius = this.props.lbRadius;
		const iconAlign = this.props.lbAlign;
		const iconType = this.props.lbType;
		const iconColor = this.props.lbColor;
		const iconFontColor = this.props.lbFontColor;
		const iconUrl = this.props.lbUrl;
		const iconTarget = this.props.lbTarget;
		const relAttribute = this.props.lbRelAttribute;
		const linkDescription = this.props.lbLinkDescription;
		const linkToPost = this.props.lbLinkToPost;

		// outer & align
		let outerClass = 'vk_icon_frame';
		if (iconAlign === 'center') {
			outerClass += ' text-center';
		} else if (iconAlign === 'right') {
			outerClass += ' text-right';
		}

		// color style
		let borderClass = 'vk_icon_border';
		let borderStyle = {};

		if (iconType === '0') {
			// Solid color
			if (
				iconColor !== 'undefined' &&
				iconColor !== null &&
				iconColor !== undefined
			) {
				// Solid color
				borderClass += ` has-background`;

				if (iconColor === 'inherit') {
					// inherit color
					borderStyle = {
						backgroundColor: 'currentColor',
					};
				} else if (isHexColor(iconColor)) {
					// custom color
					borderStyle = {
						backgroundColor: `${iconColor}`,
					};
				} else {
					// palette color
					borderClass += ` has-${sanitizeSlug(iconColor)}-background-color`;
				}
			}
		} else {
			if (
				iconColor !== 'undefined' &&
				iconColor !== null &&
				iconColor !== undefined
			) {
				borderClass += ` has-text-color`;

				if (iconColor === 'inherit') {
					// inherit color
					borderStyle = {
						color: 'currentColor',
					};
				} else if (isHexColor(iconColor)) {
					// custom color
					borderStyle = {
						color: `${iconColor}`,
					};
				} else {
					// palette color
					borderClass += ` has-${sanitizeSlug(iconColor)}-color`;
				}
			}

			if (iconType === '1') {
				// Icon & Frame
				outerClass += ' is-style-outline';
			} else {
				// icon only
				outerClass += ' is-style-noline';
			}
		}

		// margin
		if (
			!(
				iconSize === 36 &&
				iconSizeUnit === 'px' &&
				iconMargin === 22 &&
				iconMarginUnit === 'px'
			)
		) {
			borderStyle.width =
				'calc(' +
				(iconSize + iconSizeUnit) +
				' + ' +
				(iconMargin * 2 + iconMarginUnit) +
				')';
			borderStyle.height = borderStyle.width;
		}

		// border radius
		if (iconRadius !== 50) {
			borderStyle.borderRadius = iconRadius + `%`;
		}

		// icon font
		let faIconTag = '';
		if (fontAwesomeIcon) {
			fontAwesomeIcon = fontAwesomeIcon.replace(/ fas/g, 'fas');

			// font size
			let fontStyle = ``;
			let fontClass = ` vk_icon_font `;
			if (!(iconSize === 36 && iconSizeUnit === 'px')) {
				fontStyle = ` font-size:${iconSize}${iconSizeUnit};`;
			}

			// icon color
			if (
				iconFontColor !== 'undefined' &&
				iconFontColor !== null &&
				iconFontColor !== undefined
			) {
				if (isHexColor(iconFontColor)) {
					// custom color
					fontStyle += ` color:${iconFontColor};`;
				} else {
					// palette color
					fontClass += ` has-text-color has-${sanitizeSlug(iconFontColor)}-color `;
				}
			}

			// add class and inline css (join with space to preserve fa-rotate-*, fa-flip-* etc.)
			const faIconFragment = fontAwesomeIcon.split(' ');
			faIconFragment[0] = faIconFragment[0] + ` style="${fontStyle};"`;
			faIconFragment[1] = ' ' + faIconFragment[1] + fontClass;
			faIconTag = faIconFragment.join(' ');
		}

		const blockContent = (
			<>
				<div className={borderClass} style={borderStyle}>
					{parse(faIconTag)}
				</div>
			</>
		);

		let blockContentWrapper = '';
		const hasLink = !!iconUrl || !!linkToPost;
		if (hasLink) {
			blockContentWrapper = (
				/* eslint-disable-next-line jsx-a11y/anchor-is-valid -- linkToPost: href replaced server-side with permalink */
				<a
					href={linkToPost ? '#' : iconUrl}
					className="vk_icon_link"
					{...(linkToPost ? { 'data-vk-link-to-post': '1' } : {})}
					{...(iconTarget ? { target: '_blank' } : {})}
					{...(relAttribute ? { rel: relAttribute } : {})}
				>
					<span className="screen-reader-text">
						{linkDescription
							? linkDescription
							: __('Icon link', 'vk-blocks')}
					</span>
					{blockContent}
				</a>
			);
		} else {
			blockContentWrapper = blockContent;
		}

		return (
			<>
				<div className={outerClass}>{blockContentWrapper}</div>
			</>
		);
	}
}
