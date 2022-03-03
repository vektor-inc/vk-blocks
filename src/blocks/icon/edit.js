import { __ } from '@wordpress/i18n';
import { VKBIcon } from './component';
import { FontAwesome } from '@vkblocks/utils/font-awesome-new';
import {
	PanelBody,
	BaseControl,
	TextControl,
	CheckboxControl,
	RangeControl,
	ButtonGroup,
	Button,
	SelectControl,
} from '@wordpress/components';
import {
	InspectorControls,
	useBlockProps,
	BlockControls,
	BlockAlignmentControl,
} from '@wordpress/block-editor';
import { select } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

import { AdvancedColorPalette } from '@vkblocks/components/advanced-color-palette';

export default function IconEdit(props) {
	const { attributes, setAttributes, clientId } = props;
	let {
		faIcon,
		iconSize,
		iconSizeUnit,
		iconMargin,
		iconMarginUnit,
		iconRadius,
		iconAlign,
		iconType,
		iconColor,
		iconUrl,
		iconTarget,
	} = attributes;

	// eslint-disable-next-line no-undef
	const iconFamily = vkFontAwesome.iconFamily;

	/**
	 * 親ブロックが vk-blocks/icon-outer かどうか判定
	 */
	const parent = select('core/block-editor').getBlockParentsByBlockName(
		clientId,
		['vk-blocks/icon-outer']
	);

	/**
	 * 親ブロックが vk-blocks/icon-outer でなければ設定項目を追加
	 */
	let commonBlockControl = '';
	if (!parent.length) {
		commonBlockControl = (
			<BlockControls group="block">
				<BlockAlignmentControl
					value={iconAlign}
					onChange={(value) => {
						setAttributes({ iconAlign: value });
					}}
					controls={['left', 'center', 'right']}
				/>
			</BlockControls>
		);
	}

	/**
	 * 親ブロックが vk-blocks/icon-outer でなければ設定項目を追加
	 */
	let commonInspectorControls = '';
	if (!parent.length) {
		commonInspectorControls = (
			<>
				<p className={`mt-0 mb-2`}>{__('Size', 'vk-blocks')}</p>
				<div className="vk_icon_custombox">
					<TextControl
						className={`vk_icon_custombox_number`}
						value={iconSize}
						onChange={(value) =>
							setAttributes({ iconSize: parseInt(value) })
						}
						type={'number'}
					/>
					<SelectControl
						className={`vk_icon_custombox_unit`}
						value={iconSizeUnit}
						onChange={(value) => {
							setAttributes({ iconSizeUnit: value });
						}}
						options={[
							{
								value: 'px',
								label: __('px', 'vk-blocks'),
							},
							{
								value: 'em',
								label: __('em', 'vk-blocks'),
							},
							{
								value: 'rem',
								label: __('rem', 'vk-blocks'),
							},
							{
								value: 'vw',
								label: __('vw', 'vk-blocks'),
							},
						]}
					/>
					<Button
						className="vk_icon_custombox_reset"
						isSmall
						isSecondary
						onClick={() => {
							setAttributes({ iconSize: 36 });
							setAttributes({ iconSizeUnit: 'px' });
						}}
					>
						{__('Reset')}
					</Button>
				</div>
				<p className={`mt-0 mb-2`}>{__('Margin', 'vk-blocks')}</p>
				<div className="vk_icon_custombox">
					<TextControl
						className={`vk_icon_custombox_number`}
						value={iconMargin}
						onChange={(value) =>
							setAttributes({ iconMargin: parseInt(value) })
						}
						type={'number'}
					/>
					<SelectControl
						className={`vk_icon_custombox_unit`}
						value={iconMarginUnit}
						onChange={(value) => {
							setAttributes({ iconMarginUnit: value });
						}}
						options={[
							{
								value: 'px',
								label: __('px', 'vk-blocks'),
							},
							{
								value: 'em',
								label: __('em', 'vk-blocks'),
							},
							{
								value: 'rem',
								label: __('rem', 'vk-blocks'),
							},
							{
								value: 'vw',
								label: __('vw', 'vk-blocks'),
							},
						]}
					/>
					<Button
						className="vk_icon_custombox_reset"
						isSmall
						isSecondary
						onClick={() => {
							setAttributes({ iconMargin: 22 });
							setAttributes({ iconMarginUnit: 'px' });
						}}
					>
						{__('Reset')}
					</Button>
				</div>
				<BaseControl
					label={__('Border radius', 'vk-blocks')}
					id={`vk_icon-radius`}
				>
					<RangeControl
						value={iconRadius}
						onChange={(value) =>
							setAttributes({
								iconRadius: value !== undefined ? value : 50,
							})
						}
						min={0}
						max={50}
						allowReset={true}
					/>
				</BaseControl>
				<p className={`mt-0 mb-2`}>{__('Style', 'vk-blocks')}</p>
				<ButtonGroup className={`mb-3`}>
					<Button
						isSmall
						isPrimary={iconType === '0'}
						isSecondary={iconType !== '0'}
						onClick={() => setAttributes({ iconType: '0' })}
					>
						{__('Solid color', 'vk-blocks')}
					</Button>
					<Button
						isSmall
						isPrimary={iconType === '1'}
						isSecondary={iconType !== '1'}
						onClick={() => setAttributes({ iconType: '1' })}
					>
						{__('Icon & Frame', 'vk-blocks')}
					</Button>
					<Button
						isSmall
						isPrimary={iconType === '2'}
						isSecondary={iconType !== '2'}
						onClick={() => setAttributes({ iconType: '2' })}
					>
						{__('Icon only', 'vk-blocks')}
					</Button>
				</ButtonGroup>
			</>
		);
	}

	if (faIcon && !faIcon.match(/<i/)) {
		faIcon = `<i class="${faIcon}"></i>`;
	}

	// コンソールエラー回避のため useEffect を使用（実行タイミングの問題）
	useEffect(() => {
		// containerClass 互換設定
		if (iconColor === 'undefined') {
			setAttributes({ iconColor: undefined });
		}
	}, [clientId]);

	const blockProps = useBlockProps({
		className: `vk_icon`,
	});

	return (
		<>
			{commonBlockControl}
			<InspectorControls>
				<PanelBody title={__('Icon Setting', 'vk-blocks')}>
					<BaseControl
						label={
							__('Icon', 'vk-blocks') + ' ( ' + iconFamily + ' )'
						}
						id={`vk_icon-font`}
					>
						<FontAwesome attributeName={'faIcon'} {...props} />
					</BaseControl>
					{commonInspectorControls}
					<TextControl
						label={__('Link URL', 'vk-blocks')}
						value={iconUrl}
						onChange={(value) => setAttributes({ iconUrl: value })}
					/>
					<CheckboxControl
						label={__('Open link new tab.', 'vk-blocks')}
						checked={iconTarget}
						onChange={(checked) => {
							setAttributes({ iconTarget: checked });
						}}
					/>
				</PanelBody>
				<PanelBody title={__('Color', 'vk-blocks')}>
					<BaseControl>
						<AdvancedColorPalette schema={'iconColor'} {...props} />
					</BaseControl>
				</PanelBody>
			</InspectorControls>
			<div {...blockProps}>
				<VKBIcon
					lbFontAwesomeIcon={faIcon}
					lbSize={iconSize}
					lbSizeUnit={iconSizeUnit}
					lbMargin={iconMargin}
					lbMarginUnit={iconMarginUnit}
					lbRadius={iconRadius}
					lbAlign={iconAlign}
					lbType={iconType}
					lbColor={iconColor}
				/>
			</div>
		</>
	);
}
