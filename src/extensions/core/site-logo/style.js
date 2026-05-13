/**
 * site-logo block extension
 *
 * Add an option to output the site logo wrapper as <h1> only on the front page.
 * フロントページのみサイトロゴの最外殻を <h1> として出力するオプションを追加する拡張。
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

const isSiteLogoBlock = (name) => name === 'core/site-logo';

export const enhanceSiteLogoBlock = createHigherOrderComponent((BlockEdit) => {
	return (props) => {
		const { attributes, setAttributes } = props;
		const { isFrontPageH1 } = attributes;

		if (!isSiteLogoBlock(props.name) || !props.isSelected) {
			return <BlockEdit {...props} />;
		}

		return (
			<>
				<BlockEdit {...props} />
				<InspectorControls>
					<PanelBody
						title={__('Site Logo Tag Setting', 'vk-blocks')}
						icon={<VkPanelIcon isActive={isFrontPageH1} />}
						initialOpen={false}
					>
						<ToggleControl
							label={__(
								'Use <h1> tag on the front page',
								'vk-blocks'
							)}
							checked={!!isFrontPageH1}
							onChange={(checked) => {
								setAttributes({ isFrontPageH1: checked });
							}}
							help={__(
								'When enabled, this site logo is output as <h1> only on the front page. On other pages it is output as <div>.',
								'vk-blocks'
							)}
						/>
					</PanelBody>
				</InspectorControls>
			</>
		);
	};
}, 'addVkSiteLogoFrontPageH1Control');

/**
 * Extend the core/site-logo block with the isFrontPageH1 attribute and
 * inspector control.
 *
 * @param {Object} settings Block settings.
 * @param {string} name     Block name.
 * @return {Object} Modified settings.
 */
const extendSiteLogoBlock = (settings, name) => {
	if (!isSiteLogoBlock(name)) {
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
		edit: enhanceSiteLogoBlock(settings.edit),
	};
};

addFilter(
	'blocks.registerBlockType',
	'vk-blocks/extend-site-logo-block',
	extendSiteLogoBlock
);
