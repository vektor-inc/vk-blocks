/**
 * columns-style block type
 *
 */
import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import {
	PanelBody,
	ToggleControl,
	Icon,
	ToolbarGroup,
} from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { InspectorControls, BlockControls } from '@wordpress/block-editor';
import classnames from 'classnames';
import LinkToolbar from '@vkblocks/components/link-toolbar';

/**
 * Internal dependencies
 */
import { ReactComponent as IconSVG } from './icon.svg';

const isColumnsBlock = (name) => name === 'core/columns';
const isColumnBlock = (name) => name === 'core/column';

export const enhanceColumnBlock = createHigherOrderComponent((BlockEdit) => {
	return (props) => {
		const { attributes, setAttributes } = props;
		const { reverse, className, linkUrl, linkTarget } = attributes;

		if (isColumnsBlock(props.name) && props.isSelected) {
			// カラムの方向設定
			// アイコン設定
			let iconStyle = {
				width: '24px',
				height: '24px',
			};

			if (reverse) {
				iconStyle = {
					...iconStyle,
					color: '#fff',
					background: '#1e1e1e',
				};
			}

			return (
				<>
					<BlockEdit {...props} />
					<InspectorControls>
						<PanelBody
							title={__('Column Direction', 'vk-blocks')}
							icon={<Icon icon={IconSVG} style={iconStyle} />}
							initialOpen={false}
						>
							<ToggleControl
								label={__('Reverse', 'vk-blocks')}
								checked={reverse}
								onChange={(checked) => {
									// 既存のクラス名
									const existClass = className
										? className.split(' ')
										: [];
									let newClassNameArray = [];
									if (existClass) {
										// いったん削除
										newClassNameArray = existClass.filter(
											(item) => {
												return !item.match(
													/is-vk-row-reverse/
												);
											}
										);
									}

									// reverse クラスを付与
									const rereverseClass = [
										{
											'is-vk-row-reverse': checked,
										},
									];
									newClassNameArray = classnames(
										newClassNameArray,
										rereverseClass
									);

									setAttributes({
										className: newClassNameArray,
										reverse: checked,
									});
								}}
							/>
						</PanelBody>
					</InspectorControls>
				</>
			);
		} else if (isColumnBlock(props.name) && props.isSelected) {
			// カラムのリンク設定
			return (
				<>
					<BlockEdit {...props} />
					<BlockControls>
						<ToolbarGroup>
							<LinkToolbar
								linkUrl={linkUrl}
								setLinkUrl={(url) =>
									setAttributes({ linkUrl: url })
								}
								linkTarget={linkTarget}
								setLinkTarget={(target) =>
									setAttributes({ linkTarget: target })
								}
							/>
						</ToolbarGroup>
					</BlockControls>
				</>
			);
		}

		return <BlockEdit {...props} />;
	};
}, 'addMyCustomBlockControls');

const extendColumnBlock = (settings, name) => {
	if (!isColumnBlock(name) && !isColumnsBlock(name)) {
		return settings;
	}

	if (isColumnsBlock(settings.name)) {
		settings.attributes = {
			...settings.attributes,
			reverse: {
				type: 'boolean',
				default: false,
			},
		};
	}

	if (isColumnBlock(settings.name)) {
		settings.attributes = {
			...settings.attributes,
			linkUrl: {
				type: 'string',
				default: '',
			},
			linkTarget: {
				type: 'string',
				default: '_self',
			},
		};
	}

	return {
		...settings,
		attributes: {
			...settings.attributes,
		},

		edit: enhanceColumnBlock(settings.edit),
		save: (props) => {
			const { attributes } = props;
			const { linkUrl, linkTarget } = attributes;
			const saveElement = settings.save(props);

			if (!linkUrl) {
				return saveElement;
			}

			const relAttribute =
				linkTarget === '_blank' ? 'noopener noreferrer' : 'noopener';

			return (
				<div {...saveElement.props}>
					<a
						href={linkUrl}
						target={linkTarget}
						rel={relAttribute}
						aria-label={__('Column link', 'vk-blocks')}
						className="wp-block-column-vk-link"
					></a>
					{saveElement.props.children}
				</div>
			);
		},
	};
};

addFilter(
	'blocks.registerBlockType',
	'custom/extend-cover-block',
	extendColumnBlock
);
