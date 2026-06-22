/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	TextControl,
	PanelBody,
	RadioControl,
	BaseControl,
	SelectControl,
	Button,
} from '@wordpress/components';
import {
	InspectorControls,
	useBlockProps,
	RichText,
	MediaUpload,
} from '@wordpress/block-editor';
import { isHexColor } from '@vkblocks/utils/is-hex-color';
import { sanitizeSlug } from '@vkblocks/utils/sanitizeSlug';
import { AdvancedColorPalette } from '@vkblocks/components/advanced-color-palette';

export default function StaffEdit(props) {
	const { attributes, setAttributes, className, clientId } = props;
	// id生成
	const vkStaffNameColorId = `vk_staff_name-color-${clientId}`;
	const vkStaffCaptionColorId = `vk_staff_caption-color-${clientId}`;
	const vkStaffPositionColorId = `vk_staff_position-color-${clientId}`;
	const vkStaffProfileTitleColorId = `vk_staff_profileTitle-color-${clientId}`;
	const vkStaffProfileTextColorId = `vk_staff_profileText-color-${clientId}`;
	const {
		vk_staff_layout,
		vk_staff_nameColor,
		vk_staff_captionColor,
		vk_staff_positionColor,
		vk_staff_profileTitleColor,
		vk_staff_profileTextColor,
		vk_staff_photo_image_alt,
		vk_staff_photoBorder,
		vk_staff_text_name,
		vk_staff_text_caption,
		vk_staff_text_role,
		vk_staff_text_profileTitle,
		vk_staff_text_profileText,
		vk_staff_photo_image,
		vk_staff_fontFamily,
	} = attributes;

	const classes = classnames('vk_staff', {
		[className]: !!className,
		[`vk_staff-layout-${vk_staff_layout}`]: !!vk_staff_layout,
	});

	const blockProps = useBlockProps({
		className: classes,
	});

	// 画像の線のクラスとimgタグの親タグのクラス名を生成.
	const imgBorderClassName = classnames('vk_staff_photo', {
		[`vk_staff_photo-border-${vk_staff_photoBorder}`]:
			!!vk_staff_photoBorder,
	});

	let staffTextClassName = classnames;
	if (vk_staff_fontFamily === '1') {
		staffTextClassName = classnames(
			'vk_staff_text',
			staffTextClassName,
			'vk_staff-headingFont-serif'
		);
	} else {
		staffTextClassName = classnames('vk_staff_text', staffTextClassName);
	}

	let staffNameColorInlineStyle = {};
	let staffTextNameClassName = '';
	if (vk_staff_nameColor !== undefined) {
		staffTextNameClassName += ` has-text-color`;
		if (isHexColor(vk_staff_nameColor)) {
			staffNameColorInlineStyle = { color: `${vk_staff_nameColor}` };
		} else {
			staffTextNameClassName += ` has-${sanitizeSlug(vk_staff_nameColor)}-color`;
		}
	}

	let staffCaptionColorInlineStyle = {};
	let staffCaptionClassName = '';
	if (vk_staff_captionColor !== undefined) {
		staffCaptionClassName += ` has-text-color`;
		if (isHexColor(vk_staff_captionColor)) {
			staffCaptionColorInlineStyle = {
				color: `${vk_staff_captionColor}`,
			};
		} else {
			staffCaptionClassName += ` has-${sanitizeSlug(vk_staff_captionColor)}-color`;
		}
	}

	let staffPositionColorInlineStyle = {};
	let staffPositionClassName = '';
	if (vk_staff_positionColor !== undefined) {
		staffPositionClassName += ` has-text-color`;
		if (isHexColor(vk_staff_positionColor)) {
			staffPositionColorInlineStyle = {
				color: `${vk_staff_positionColor}`,
			};
		} else {
			staffPositionClassName += ` has-${sanitizeSlug(vk_staff_positionColor)}-color`;
		}
	}

	let staffProfileTitleColorInlineStyle = {};
	let staffProfileTitleClassName = '';
	if (vk_staff_profileTitleColor !== undefined) {
		staffProfileTitleClassName += ` has-text-color`;
		if (isHexColor(vk_staff_profileTitleColor)) {
			staffProfileTitleColorInlineStyle = {
				color: `${vk_staff_profileTitleColor}`,
			};
		} else {
			staffProfileTitleClassName += ` has-${sanitizeSlug(vk_staff_profileTitleColor)}-color`;
		}
	}

	let staffProfileTextColorInlineStyle = {};
	let staffProfileTextClassName = '';
	if (vk_staff_profileTextColor !== undefined) {
		staffProfileTextClassName += ` has-text-color`;
		if (isHexColor(vk_staff_profileTextColor)) {
			staffProfileTextColorInlineStyle = {
				color: `${vk_staff_profileTextColor}`,
			};
		} else {
			staffProfileTextClassName += ` has-${sanitizeSlug(vk_staff_profileTextColor)}-color`;
		}
	}

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Layout', 'vk-blocks')}>
					<SelectControl
						value={vk_staff_layout}
						onChange={(value) =>
							setAttributes({ vk_staff_layout: value })
						}
						options={[
							{
								value: 'default',
								label: __('Default', 'vk-blocks'),
							},
							{
								value: 'imageLeft',
								label: __('Image left', 'vk-blocks'),
							},
						]}
					/>
				</PanelBody>
				<PanelBody title={__('Image border', 'vk-blocks')}>
					<SelectControl
						value={vk_staff_photoBorder}
						onChange={(value) =>
							setAttributes({ vk_staff_photoBorder: value })
						}
						options={[
							{
								value: 'default',
								label: __('Default', 'vk-blocks'),
							},
							{
								value: 'none',
								label: __('None', 'vk-blocks'),
							},
						]}
					/>
				</PanelBody>
				<PanelBody title={__('Alt text', 'vk-blocks')}>
					<BaseControl
						help={__(
							'Set the alt text for profile image',
							'vk-blocks'
						)}
					>
						<TextControl
							value={vk_staff_photo_image_alt}
							onChange={(value) =>
								setAttributes({
									vk_staff_photo_image_alt: value,
								})
							}
						/>
					</BaseControl>
				</PanelBody>
				<PanelBody title={__('Color', 'vk-blocks')}>
					<BaseControl
						id={vkStaffNameColorId}
						label={__('Staff name', 'vk-blocks')}
					>
						<AdvancedColorPalette
							id={vkStaffNameColorId}
							schema={'vk_staff_nameColor'}
							{...props}
						/>
					</BaseControl>
					<BaseControl
						id={vkStaffCaptionColorId}
						label={__('Name caption', 'vk-blocks')}
					>
						<AdvancedColorPalette
							id={vkStaffCaptionColorId}
							schema={'vk_staff_captionColor'}
							{...props}
						/>
					</BaseControl>
					<BaseControl
						id={vkStaffPositionColorId}
						label={__('Role position', 'vk-blocks')}
					>
						<AdvancedColorPalette
							id={vkStaffPositionColorId}
							schema={'vk_staff_positionColor'}
							{...props}
						/>
					</BaseControl>
					<BaseControl
						id={vkStaffProfileTitleColorId}
						label={__('Profile title', 'vk-blocks')}
					>
						<AdvancedColorPalette
							id={vkStaffProfileTitleColorId}
							schema={'vk_staff_profileTitleColor'}
							{...props}
						/>
					</BaseControl>
					<BaseControl
						id={vkStaffProfileTextColorId}
						label={__('Profile text', 'vk-blocks')}
					>
						<AdvancedColorPalette
							id={vkStaffProfileTextColorId}
							schema={'vk_staff_profileTextColor'}
							{...props}
						/>
					</BaseControl>
				</PanelBody>
				<PanelBody title={__('Heading Font', 'vk-blocks')}>
					<RadioControl
						label={__('Font', 'vk-blocks')}
						selected={vk_staff_fontFamily}
						options={[
							{
								label: __('Unspecified', 'vk-blocks'),
								value: '0',
							},
							{
								label: __('minchoBody', 'vk-blocks'),
								value: '1',
							},
						]}
						onChange={(value) =>
							setAttributes({ vk_staff_fontFamily: value })
						}
					/>
				</PanelBody>
			</InspectorControls>

			<div {...blockProps}>
				<div className={staffTextClassName}>
					<RichText
						tagName="h3"
						className={
							`vk_staff_text_name` + staffTextNameClassName
						}
						style={staffNameColorInlineStyle}
						onChange={(value) =>
							setAttributes({ vk_staff_text_name: value })
						}
						value={vk_staff_text_name}
						placeholder={__('Your Name', 'vk-blocks')}
					/>
					<RichText
						tagName="p"
						className={
							`vk_staff_text_caption` + staffCaptionClassName
						}
						style={staffCaptionColorInlineStyle}
						onChange={(value) =>
							setAttributes({ vk_staff_text_caption: value })
						}
						value={vk_staff_text_caption}
						placeholder={__('Caption', 'vk-blocks')}
					/>
					<RichText
						tagName="p"
						className={
							`vk_staff_text_role` + staffPositionClassName
						}
						style={staffPositionColorInlineStyle}
						onChange={(value) =>
							setAttributes({ vk_staff_text_role: value })
						}
						value={vk_staff_text_role}
						placeholder={__('Role position', 'vk-blocks')}
					/>
					<RichText
						tagName="h4"
						className={
							`vk_staff_text_profileTitle` +
							staffProfileTitleClassName
						}
						style={staffProfileTitleColorInlineStyle}
						onChange={(value) =>
							setAttributes({ vk_staff_text_profileTitle: value })
						}
						value={vk_staff_text_profileTitle}
						placeholder={__('Profile title', 'vk-blocks')}
					/>
					<RichText
						tagName="p"
						className={
							`vk_staff_text_profileText` +
							staffProfileTextClassName
						}
						style={staffProfileTextColorInlineStyle}
						onChange={(value) =>
							setAttributes({
								vk_staff_text_profileText: value,
							})
						}
						value={vk_staff_text_profileText}
						placeholder={__('Profile text', 'vk-blocks')}
					/>
				</div>
				<div className={imgBorderClassName}>
					<MediaUpload
						onSelect={(value) =>
							setAttributes({
								vk_staff_photo_image: value.sizes.full.url,
							})
						}
						type="image"
						value={vk_staff_photo_image}
						render={({ open }) => (
							<Button
								onClick={open}
								className={
									vk_staff_photo_image
										? 'image-button'
										: 'button button-large'
								}
							>
								{!vk_staff_photo_image ? (
									__('Select image', 'vk-blocks')
								) : (
									<img
										className={`vk_staff_photo_image`}
										src={vk_staff_photo_image}
										alt={vk_staff_photo_image_alt}
									/>
								)}
							</Button>
						)}
					/>
				</div>
			</div>
		</>
	);
}
