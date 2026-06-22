/**
 * navigation block extension
 *
 * Add an option to display the menu item description on the core/navigation block.
 * core/navigation ブロックにメニュー項目の説明を表示するオプションを追加する拡張。
 */
import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { InspectorControls } from '@wordpress/block-editor';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { VkPanelIcon } from '@vkblocks/components/vk-icon';

// トグル ON 時にブロックの最外殻へ付与するブロック単位クラス
// Block-scoped class added to the block wrapper when the toggle is ON.
export const VK_NAV_SHOW_DESCRIPTION_CLASS = 'vk-navigation-show-description';

const isNavigationBlock = (name) => name === 'core/navigation';

/**
 * Add the inspector control (PanelBody + ToggleControl) to the
 * core/navigation block.
 *
 * core/navigation ブロックにインスペクター（PanelBody + ToggleControl）を追加する。
 */
export const enhanceNavigationBlock = createHigherOrderComponent(
	(BlockEdit) => {
		return (props) => {
			const { attributes, setAttributes } = props;
			const { showDescription } = attributes;

			if (!isNavigationBlock(props.name) || !props.isSelected) {
				return <BlockEdit {...props} />;
			}

			return (
				<>
					<BlockEdit {...props} />
					<InspectorControls>
						<PanelBody
							title={__('Menu Item Description', 'vk-blocks')}
							icon={<VkPanelIcon isActive={showDescription} />}
							initialOpen={false}
						>
							<ToggleControl
								label={__(
									'Show menu item description',
									'vk-blocks'
								)}
								checked={!!showDescription}
								onChange={(checked) => {
									setAttributes({ showDescription: checked });
								}}
								help={__(
									'When enabled, the description set for each menu item is displayed. Depending on your theme, the description may be shown regardless of this setting.',
									'vk-blocks'
								)}
							/>
						</PanelBody>
					</InspectorControls>
				</>
			);
		};
	},
	'addVkNavigationShowDescriptionControl'
);

/**
 * Add the block-scoped class to the editor block wrapper so that the
 * description preview works inside the editor as well.
 *
 * エディタープレビューでも説明が表示されるよう、ブロックの最外殻へ
 * ブロック単位クラスを付与する。
 */
export const addNavigationEditorClass = createHigherOrderComponent(
	(BlockListBlock) => {
		return (props) => {
			const { name, attributes } = props;

			if (!isNavigationBlock(name) || !attributes?.showDescription) {
				return <BlockListBlock {...props} />;
			}

			// 既存の wrapperProps.className を保持しつつブロック単位クラスを追加。
			// classnames が falsy 値を無視するため null/undefined でも安全。
			const wrapperProps = {
				...props.wrapperProps,
				className: classnames(
					props.wrapperProps?.className,
					VK_NAV_SHOW_DESCRIPTION_CLASS
				),
			};

			return <BlockListBlock {...props} wrapperProps={wrapperProps} />;
		};
	},
	'addVkNavigationShowDescriptionEditorClass'
);

/**
 * Extend the core/navigation block with the showDescription attribute.
 *
 * Only the attribute registration is handled here. The inspector control is
 * added separately via the `editor.BlockEdit` filter, because wrapping
 * `settings.edit` does not render the panel for core/navigation.
 *
 * showDescription 属性の登録のみを担う。インスペクターは別途
 * `editor.BlockEdit` フィルタで追加する。core/navigation では
 * `settings.edit` のラップではパネルが描画されないため。
 *
 * @param {Object} settings Block settings.
 * @param {string} name     Block name.
 * @return {Object} Modified settings.
 */
const extendNavigationBlock = (settings, name) => {
	if (!isNavigationBlock(name)) {
		return settings;
	}

	return {
		...settings,
		attributes: {
			...settings.attributes,
			showDescription: {
				type: 'boolean',
				default: false,
			},
		},
	};
};

addFilter(
	'blocks.registerBlockType',
	'vk-blocks/extend-navigation-block',
	extendNavigationBlock
);

addFilter(
	'editor.BlockEdit',
	'vk-blocks/navigation-show-description',
	enhanceNavigationBlock
);

addFilter(
	'editor.BlockListBlock',
	'vk-blocks/navigation-editor-class',
	addNavigationEditorClass
);
