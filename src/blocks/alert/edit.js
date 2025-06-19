import { __ } from '@wordpress/i18n';
import { PanelBody, SelectControl, BaseControl } from '@wordpress/components';
import {
	InspectorControls,
	InnerBlocks,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import { FontAwesome } from '@vkblocks/utils/font-awesome-new';
import parse from 'html-react-parser';

export default function AlertEdit(props) {
	const { attributes, setAttributes } = props;
	const { style, icon, iconText, mobileIconPosition } = attributes;
	const iconFamily = vkFontAwesome.iconFamily; // eslint-disable-line no-undef

	const blockProps = useBlockProps({
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
					<RichText
						tagName="span"
						placeholder={__('Icon Text', 'vk-blocks')}
						value={iconText}
						onChange={(value) => setAttributes({ iconText: value })}
					/>
				</div>
			</div>
		);
	}

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Style Settings', 'vk-blocks')}>
					<BaseControl
						label={__('Alert Style', 'vk-blocks')}
						id={`vk_alert-style`}
					>
						<SelectControl
							value={style}
							onChange={(value) =>
								setAttributes({ style: value })
							}
							options={[
								{
									label: __('Success', 'vk-blocks'),
									value: 'success',
								},
								{
									label: __('Info', 'vk-blocks'),
									value: 'info',
								},
								{
									label: __('Warning', 'vk-blocks'),
									value: 'warning',
								},
								{
									label: __('Danger', 'vk-blocks'),
									value: 'danger',
								},
							]}
						/>
					</BaseControl>
					<BaseControl
						label={
							__('Icon', 'vk-blocks') + ' ( ' + iconFamily + ' )'
						}
						id={`vk_alert-icon`}
					>
						<FontAwesome attributeName={'icon'} {...props} />
					</BaseControl>
					{icon && (
						<BaseControl
							label={__('Mobile Icon Position', 'vk-blocks')}
							id={`vk_alert-mobile-icon-position`}
						>
							<SelectControl
								value={mobileIconPosition}
								onChange={(value) =>
									setAttributes({ mobileIconPosition: value })
								}
								options={[
									{
										label: __(
											'Left (Default)',
											'vk-blocks'
										),
										value: 'left',
									},
									{
										label: __('Top', 'vk-blocks'),
										value: 'top',
									},
								]}
							/>
						</BaseControl>
					)}
				</PanelBody>
			</InspectorControls>
			<div {...blockProps}>
				{alertIcon}
				<div className="vk_alert_content">
					<InnerBlocks />
				</div>
			</div>
		</>
	);
}
