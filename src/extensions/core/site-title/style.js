/**
 * site-title block extension
 *
 * Add an option to output the site title wrapper as <div> only on pages
 * other than the front page. The setting panel only appears while the
 * block's heading level is set to <h1>, since the option only makes sense
 * for that tag.
 * フロントページ以外のみサイトタイトルの最外殻を <div> として出力するオプションを追加する拡張。
 * この設定は <h1> タグのときのみ意味を持つため、ブロックの見出しレベルが <h1> のときだけ
 * 設定パネルを表示する。
 */
import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { InspectorControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { VkPanelIcon } from '@vkblocks/components/vk-icon';

const isSiteTitleBlock = (name) => name === 'core/site-title';

export const enhanceSiteTitleBlock = createHigherOrderComponent((BlockEdit) => {
	return (props) => {
		const { attributes, setAttributes } = props;
		const { isFrontPageH1, level } = attributes;

		if (!isSiteTitleBlock(props.name) || !props.isSelected || level !== 1) {
			return <BlockEdit {...props} />;
		}

		return (
			<>
				<BlockEdit {...props} />
				<InspectorControls>
					<PanelBody
						title={__('Site Title Tag Setting', 'vk-blocks')}
						icon={<VkPanelIcon isActive={isFrontPageH1} />}
						initialOpen={false}
					>
						<ToggleControl
							label={__(
								'Limit <h1> tag to the front page',
								'vk-blocks'
							)}
							checked={!!isFrontPageH1}
							onChange={(checked) => {
								setAttributes({ isFrontPageH1: checked });
							}}
							help={
								<>
									{__(
										'When enabled, this site title keeps the <h1> tag on the front page.',
										'vk-blocks'
									)}{' '}
									{__(
										'On other pages it is output as <div> instead.',
										'vk-blocks'
									)}{' '}
									{__(
										'Use this only when another heading, such as the post or page title, is already output as <h1> on those other pages.',
										'vk-blocks'
									)}
								</>
							}
						/>
					</PanelBody>
				</InspectorControls>
			</>
		);
	};
}, 'addVkSiteTitleFrontPageH1Control');

/**
 * Extend the core/site-title block with the isFrontPageH1 attribute and
 * inspector control.
 *
 * @param {Object} settings Block settings.
 * @param {string} name     Block name.
 * @return {Object} Modified settings.
 */
const extendSiteTitleBlock = (settings, name) => {
	if (!isSiteTitleBlock(name)) {
		return settings;
	}

	return {
		...settings,
		attributes: {
			...settings.attributes,
			isFrontPageH1: {
				type: 'boolean',
				default: false,
			},
		},
		edit: enhanceSiteTitleBlock(settings.edit),
	};
};

addFilter(
	'blocks.registerBlockType',
	'vk-blocks/extend-site-title-block',
	extendSiteTitleBlock
);
