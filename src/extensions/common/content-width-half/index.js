/**
 * Content width half extension
 */
import { useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import { PanelBody, ToggleControl, Icon } from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { createHigherOrderComponent } from '@wordpress/compose';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { ReactComponent as IconSVG } from './icon.svg';

const TARGET_BLOCKS = ['core/column'];
const HALF_CLASS = 'is-vk-content-width-half';

const addAttribute = (settings) => {
	if (!TARGET_BLOCKS.includes(settings.name)) {
		return settings;
	}

	return {
		...settings,
		attributes: {
			...settings.attributes,
			contentWidthHalf: {
				type: 'boolean',
				default: false,
			},
		},
	};
};

addFilter(
	'blocks.registerBlockType',
	'vk-blocks/content-width-half/add-attribute',
	addAttribute
);

const withContentWidthHalfControls = createHigherOrderComponent((BlockEdit) => {
	return (props) => {
		const { name, attributes, setAttributes, isSelected, clientId } = props;

		if (!TARGET_BLOCKS.includes(name)) {
			return <BlockEdit {...props} />;
		}

		const { className, contentWidthHalf } = attributes;
		// PHP から渡された vk_blocks_params.has_theme_json（テーマに theme.json があるかどうか）を、安全に参照したうえで、結果を必ず真偽値として変数 hasThemeJson に入れる
		const hasThemeJson = !!window?.vk_blocks_params?.has_theme_json;
		const isTwoColumnLayout = useSelect(
			(select) => {
				const { getBlockRootClientId, getBlock } =
					select('core/block-editor');
				const parentClientId = getBlockRootClientId(clientId);

				if (!parentClientId) {
					return false;
				}

				const parentBlock = getBlock(parentClientId);

				if (!parentBlock || parentBlock.name !== 'core/columns') {
					return false;
				}

				const columnBlocks =
					parentBlock.innerBlocks?.filter(
						(block) => block.name === 'core/column'
					) ?? [];

				return columnBlocks.length === 2;
			},
			[clientId]
		);
		const iconStyle = {
			width: '24px',
			height: '24px',
			...(contentWidthHalf && {
				color: '#fff',
				background: '#1e1e1e',
			}),
		};

		useEffect(() => {
			const classList =
				typeof className === 'string'
					? className.split(' ').filter((item) => item)
					: [];
			const hasHalfClass = classList.includes(HALF_CLASS);

			if (hasHalfClass !== !!contentWidthHalf) {
				setAttributes({ contentWidthHalf: hasHalfClass });
			}
		}, [className, contentWidthHalf, setAttributes]);

		useEffect(() => {
			const classList =
				typeof className === 'string'
					? className.split(' ').filter((item) => item)
					: [];
			const hasHalfClass = classList.includes(HALF_CLASS);

			if (!isTwoColumnLayout && (contentWidthHalf || hasHalfClass)) {
				const updatedClassName =
					classnames(
						classList.filter((item) => item !== HALF_CLASS)
					) || undefined;

				setAttributes({
					className: updatedClassName,
					contentWidthHalf: false,
				});
			}
		}, [className, contentWidthHalf, isTwoColumnLayout, setAttributes]);

		const toggleContentWidthHalf = (checked) => {
			const baseClassList =
				typeof className === 'string'
					? className.split(' ').filter((item) => item)
					: [];
			const trimmedClassList = baseClassList.filter(
				(item) => item !== HALF_CLASS
			);
			const updatedClassName =
				classnames(trimmedClassList, {
					[HALF_CLASS]: checked,
				}) || undefined;

			setAttributes({
				className: updatedClassName,
				contentWidthHalf: checked,
			});
		};

		const shouldShowPanel = isSelected && hasThemeJson && isTwoColumnLayout;

		return (
			<>
				<BlockEdit {...props} />
				{shouldShowPanel && (
					<InspectorControls>
						<PanelBody
							title={__('Layout Extension', 'vk-blocks')}
							icon={<Icon icon={IconSVG} style={iconStyle} />}
							initialOpen={false}
						>
							<ToggleControl
								label={__('Half Content Width', 'vk-blocks')}
								help={__(
									'When the screen size is 782px or more, the maximum width of the inner block is half of the content width. Below 782px, the horizontal padding is removed.',
									'vk-blocks'
								)}
								checked={!!contentWidthHalf}
								onChange={toggleContentWidthHalf}
							/>
						</PanelBody>
					</InspectorControls>
				)}
			</>
		);
	};
}, 'withContentWidthHalfControls');

addFilter(
	'editor.BlockEdit',
	'vk-blocks/content-width-half/with-controls',
	withContentWidthHalfControls
);
