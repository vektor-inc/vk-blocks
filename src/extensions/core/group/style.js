/**
 * group-style block type
 *
 * @package
 */
import { convertColorClass } from '@vkblocks/utils/color-code-to-class.js';
import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import { PanelBody, ToolbarGroup } from '@wordpress/components';
import {
	InspectorControls,
	ColorPalette,
	BlockControls,
	useBlockProps,
	InnerBlocks,
} from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import LinkToolbar from '@vkblocks/components/link-toolbar';
import deprecated from './deprecated/index';
/**
 * Check if the block type is valid for customization.
 *
 * @param {string} name The name of the block type.
 * @return {boolean} Whether the block type is valid.
 */
const isValidBlockType = (name) => {
	const validBlockTypes = ['core/group'];
	return validBlockTypes.includes(name);
};

/**
 * Add custom attributes to the block settings.
 *
 * @param {Object} settings The block settings.
 * @return {Object} The modified block settings.
 */
export const addAttribute = (settings) => {
	if (isValidBlockType(settings.name)) {
		settings.attributes = {
			...settings.attributes,
			color: {
				type: 'string',
				default: '',
			},
			linkUrl: {
				type: 'string',
				default: '',
			},
			linkTarget: {
				type: 'string',
				default: '',
			},
			relAttribute: {
				type: 'string',
				default: '',
			},
			linkDescription: {
				type: 'string',
				default: '',
			},
			tagName: {
				type: 'string',
				default: 'div',
			},
		};
	}
	return settings;
};
addFilter('blocks.registerBlockType', 'vk-blocks/group-style', addAttribute);

/**
 * Add custom controls to the block edit interface.
 *
 * @param {Function} BlockEdit The block edit component.
 * @return {Function} The modified block edit component.
 */
export const addBlockControl = createHigherOrderComponent((BlockEdit) => {
	let activeColor = '';

	return (props) => {
		if (isValidBlockType(props.name) && props.isSelected) {
			if (props.attributes.color) {
				activeColor = props.attributes.color;
			} else {
				activeColor = '#fffd6b';
			}

			return (
				<>
					<BlockEdit {...props} />
					<BlockControls>
						<ToolbarGroup>
							<LinkToolbar
								linkUrl={props.attributes.linkUrl}
								setLinkUrl={(url) =>
									props.setAttributes({ linkUrl: url })
								}
								linkTarget={props.attributes.linkTarget}
								setLinkTarget={(target) =>
									props.setAttributes({ linkTarget: target })
								}
								relAttribute={props.attributes.relAttribute}
								setRelAttribute={(rel) =>
									props.setAttributes({ relAttribute: rel })
								}
								linkDescription={
									props.attributes.linkDescription
								}
								setLinkDescription={(description) =>
									props.setAttributes({
										linkDescription: description,
									})
								}
							/>
						</ToolbarGroup>
					</BlockControls>
					<InspectorControls>
						<PanelBody
							title={__('Border Color', 'vk-blocks')}
							initialOpen={false}
							className="group-border-color-controle"
						>
							<p className="font-size-11px alert alert-danger">
								{__(
									'Because of the theme that enabled theme.json become can specify the color from border panel that, specification from here is deprecated.',
									'vk-blocks'
								)}
							</p>
							<ColorPalette
								value={activeColor}
								disableCustomColors={true}
								onChange={(newColor) => {
									let newClassName =
										convertColorClass(newColor);

									if (props.attributes.className) {
										let inputClassName =
											props.attributes.className;

										inputClassName =
											inputClassName.split(' ');

										const filterClassName =
											inputClassName.filter(
												function (name) {
													return (
														-1 ===
														name.indexOf('vk-has-')
													);
												}
											);

										filterClassName.push(newClassName);

										newClassName =
											filterClassName.join(' ');
									}

									activeColor = newColor;
									props.setAttributes({
										className: newClassName,
										color: newColor,
									});
								}}
							/>
						</PanelBody>
					</InspectorControls>
				</>
			);
		}
		return <BlockEdit {...props} />;
	};
}, 'addMyCustomBlockControls');

addFilter('editor.BlockEdit', 'vk-blocks/group-style', addBlockControl);

/**
 * Define the save function for the group block, including link settings.
 *
 * @param {Object} props The block properties.
 * @return {JSX.Element} The saved content.
 */
const save = (props) => {
	const { attributes } = props;
	const {
		linkUrl,
		linkTarget,
		relAttribute,
		linkDescription,
		className = '',
		tagName: CustomTag = 'div',
	} = attributes;

	// Use block properties, setting className to include has-link if linkUrl is present
	const blockProps = useBlockProps.save({
		className: linkUrl ? `${className} has-link` : className,
	});

	// Determine rel attribute based on linkTarget

	// Extract prefix for custom link class
	const prefix = 'wp-block-group';

	return (
		<CustomTag {...blockProps}>
			<InnerBlocks.Content />
			{linkUrl && (
				<a
					href={linkUrl}
					{...(linkTarget ? { target: linkTarget } : {})}
					{...(relAttribute ? { rel: relAttribute } : {})}
					className={`${prefix}-vk-link`}
				>
					<span className="screen-reader-text">
						{linkDescription
							? linkDescription
							: __('Group link', 'vk-blocks')}
					</span>
				</a>
			)}
		</CustomTag>
	);
};

// Support for existing group blocks and version management
import { assign } from 'lodash';

/**
 * Override block settings to include custom save function and attributes.
 *
 * @param {Object} settings          The block settings.
 * @param {string} name              The block name.
 * @param {Object} currentDeprecated
 * @return {Object} The modified block settings.
 */
const overrideBlockSettings = (settings, name, currentDeprecated) => {
	if (name !== 'core/group') {
		return settings;
	}

	// layout の値を取得
	const layoutValue =
		settings.supports && 'layout' in settings.supports
			? settings.supports.layout
			: {};

	let newSettings = assign({}, settings, {
		supports: {
			...settings.supports,
			layout: layoutValue,
		},
	});

	// deprecated は currentDeprecated === null のときだけマージする
	if (currentDeprecated === null) {
		const newDeprecated = [...(settings.deprecated || [])];
		const sorted = [...(Array.isArray(deprecated) ? deprecated : [])].sort(
			(a, b) =>
				(b.targetVersion || newDeprecated.length) -
				(a.targetVersion || newDeprecated.length)
		);
		sorted.forEach((item) => {
			const index = item.targetVersion || newDeprecated.length;
			const copy = { ...item };
			delete copy.targetVersion;
			newDeprecated.splice(index, 0, copy);
		});
		newSettings = {
			...newSettings,
			deprecated: newDeprecated,
			save,
		};
	}

	newSettings.attributes = {
		...(newSettings.attributes || {}),
		linkUrl: { type: 'string', default: '' },
		linkTarget: { type: 'string', default: '' },
		relAttribute: { type: 'string', default: '' },
		linkDescription: { type: 'string', default: '' },
		tagName: { type: 'string', default: 'div' },
	};

	return newSettings;
};

addFilter(
	'blocks.registerBlockType',
	'vk-blocks/group-save',
	overrideBlockSettings
);
