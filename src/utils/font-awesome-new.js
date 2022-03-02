import { __ } from '@wordpress/i18n';
import { BaseControl, RadioControl, TextControl } from '@wordpress/components';

import AdvancedPopOverControl from '@vkblocks/components/advanced-popover-control';

export const FontAwesome = (props) => {
	const { attributeName, attributes, setAttributes } = props;
	// eslint-disable-next-line no-undef
	const iconsUrl = vkFontAwesome.iconsUrl;
	// eslint-disable-next-line no-undef
	const iconFamily = vkFontAwesome.iconFamily;

	const render = (
		<>
			<BaseControl
				className={'components-base-control__label'}
				id={`vk_fa_icon_list`}
				label={__('Icon', 'vk-blocks') + ' ( ' + iconFamily + ' ) '}
			>
				<RadioControl
					className={'vk_icon_list'}
					selected={attributes[attributeName]}
					options={[
						{
							label: <i className="fas fa-arrow-right"></i>,
							value: '<i class="fas fa-arrow-right"></i>',
						},
						{
							label: <i className="fas fa-arrow-down"></i>,
							value: '<i class="fas fa-arrow-down"></i>',
						},
						{
							label: <i className="fas fa-arrow-left"></i>,
							value: '<i class="fas fa-arrow-left"></i>',
						},
						{
							label: (
								<i className="fas fa-arrow-circle-right"></i>
							),
							value: '<i class="fas fa-arrow-circle-right"></i>',
						},
						{
							label: <i className="fas fa-arrow-circle-down"></i>,
							value: '<i class="fas fa-arrow-circle-down"></i>',
						},
						{
							label: <i className="fas fa-arrow-circle-left"></i>,
							value: '<i class="fas fa-arrow-circle-left"></i>',
						},
						{
							label: (
								<i className="far fa-arrow-alt-circle-right"></i>
							),
							value: '<i class="far fa-arrow-alt-circle-right"></i>',
						},
						{
							label: (
								<i className="far fa-arrow-alt-circle-down"></i>
							),
							value: '<i class="far fa-arrow-alt-circle-down"></i>',
						},
						{
							label: (
								<i className="far fa-arrow-alt-circle-left"></i>
							),
							value: '<i class="far fa-arrow-alt-circle-left"></i>',
						},
						{
							label: (
								<i className="fas fa-external-link-square-alt"></i>
							),
							value: '<i class="fas fa-external-link-square-alt"></i>',
						},
						{
							label: <i className="fas fa-external-link-alt"></i>,
							value: '<i class="fas fa-external-link-alt"></i>',
						},
						{
							label: <i className="fas fa-download"></i>,
							value: '<i class="fas fa-download"></i>',
						},

						{
							label: (
								<i className="fas fa-exclamation-triangle"></i>
							),
							value: '<i class="fas fa-exclamation-triangle"></i>',
						},
						{
							label: (
								<i className="fas fa-exclamation-circle"></i>
							),
							value: '<i class="fas fa-exclamation-circle"></i>',
						},
						{
							label: <i className="fas fa-exclamation"></i>,
							value: '<i class="fas fa-exclamation"></i>',
						},
						{
							label: <i className="fas fa-question"></i>,
							value: '<i class="fas fa-question"></i>',
						},
						{
							label: <i className="fas fa-question-circle"></i>,
							value: '<i class="fas fa-question-circle"></i>',
						},
						{
							label: <i className="fas fa-info-circle"></i>,
							value: '<i class="fas fa-info-circle"></i>',
						},
						{
							label: <i className="fas fa-info"></i>,
							value: '<i class="fas fa-info"></i>',
						},
						{
							label: <i className="fas fa-check"></i>,
							value: '<i class="fas fa-check"></i>',
						},
						{
							label: <i className="fas fa-check-square"></i>,
							value: '<i class="fas fa-check-square"></i>',
						},
						{
							label: <i className="fas fa-check-circle"></i>,
							value: '<i class="fas fa-check-circle"></i>',
						},
						{
							label: <i className="fas fa-phone"></i>,
							value: '<i class="fas fa-phone"></i>',
						},
						{
							label: <i className="fas fa-phone-square"></i>,
							value: '<i class="fas fa-phone-square"></i>',
						},
						{
							label: <i className="fas fa-mobile-alt"></i>,
							value: '<i class="fas fa-mobile-alt"></i>',
						},
						{
							label: <i className="far fa-envelope"></i>,
							value: '<i class="far fa-envelope"></i>',
						},
						{
							label: <i className="fas fa-user"></i>,
							value: '<i class="fas fa-user"></i>',
						},
						{
							label: <i className="fas fa-users"></i>,
							value: '<i class="fas fa-users"></i>',
						},
						{
							label: <i className="far fa-file-alt"></i>,
							value: '<i class="far fa-file-alt"></i>',
						},
						{
							label: <i className="fas fa-file-alt"></i>,
							value: '<i class="fas fa-file-alt"></i>',
						},
						{
							label: <i className="fas fa-file"></i>,
							value: '<i class="fas fa-file"></i>',
						},
						{
							label: <i className="fas fa-file-pdf"></i>,
							value: '<i class="fas fa-file-pdf"></i>',
						},

						{
							label: <i className="fas fa-building"></i>,
							value: '<i class="fas fa-building"></i>',
						},
						{
							label: <i className="fab fa-twitter"></i>,
							value: '<i class="fab fa-twitter"></i>',
						},
						{
							label: <i className="fab fa-facebook-square"></i>,
							value: '<i class="fab fa-facebook-square"></i>',
						},
						{
							label: <i className="fab fa-line"></i>,
							value: '<i class="fab fa-line"></i>',
						},
					]}
					onChange={(value) =>
						setAttributes({ [attributeName]: value })
					}
				/>
			</BaseControl>
			<hr></hr>
			<p className="mt-1">
				{__(
					"If you want to use an icon other than the ones listed above, you can use any of the icons from Font Awesome's icon list Please select a tag and enter it.",
					'vk-blocks'
				)}
				<br />
				{__(
					'Ex) <i class="fas fa-arrow-circle-right"></i>',
					'vk-blocks'
				)}
				<br />
				<a href={iconsUrl} target={`_blank`}>
					{__('Font Awesome icon list', 'vk-blocks')}
				</a>
			</p>
		</>
	);

	return (
		<>
			<TextControl
				value={attributes[attributeName]}
				onChange={(value) => setAttributes({ [attributeName]: value })}
				placeholder={'<i class="fas fa-arrow-circle-right"></i>'}
				className="mb-0"
			/>
			<AdvancedPopOverControl
				label={__('Select Icon', 'vk-blocks')}
				renderComp={render}
				setAttributes={setAttributes}
			/>
		</>
	);
};
