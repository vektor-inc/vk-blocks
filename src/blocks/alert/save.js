import { InnerBlocks, useBlockProps, RichText } from '@wordpress/block-editor';
import parse from 'html-react-parser';

export default function save({ attributes }) {
	const { style, icon, iconText, mobileIconPosition } = attributes;

	const blockProps = useBlockProps.save({
		className: `vk_alert alert alert-${style} ${icon ? 'has-alert-icon' : ''} ${
			mobileIconPosition === 'top' ? 'mobile-icon-top' : ''
		}`,
	});

	let alertIcon = '';
	if (icon !== '' && icon !== undefined) {
		alertIcon = (
			<div className="vk_alert_icon">
				<div className="vk_alert_icon_icon">{parse(icon)}</div>
				<div className="vk_alert_icon_text">
					<RichText.Content tagName="span" value={iconText} />
				</div>
			</div>
		);
	}

	return (
		<div {...blockProps}>
			{alertIcon}
			<div className="vk_alert_content">
				<InnerBlocks.Content />
			</div>
		</div>
	);
}
