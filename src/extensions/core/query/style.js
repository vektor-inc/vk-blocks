/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl, Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ReactComponent as IconSVG } from './icon.svg';

/**
 * Query Block Extension - Add Modified Date Order Option
 *
 * This extension adds a "Modified Date" order option to the WordPress core Query block.
 * It extends the core Query block's orderBy options without duplicating existing ones.
 */

/**
 * Add modified date order option to Query block
 */
const withQueryOrderExtension = createHigherOrderComponent(
	(BlockEdit) => (props) => {
		const { name, attributes, setAttributes } = props;

		// Only apply to core/query block
		if (name !== 'core/query') {
			return <BlockEdit {...props} />;
		}

		const { query } = attributes;
		const { orderBy = 'date', order = 'desc' } = query || {};

		// アイコンスタイルを定義
		const iconStyle = {
			width: '24px',
			height: '24px',
		};

		// セレクトボックスの値を取得
		const getSelectValue = () => {
			if (orderBy === 'modified') {
				return order === 'desc' ? 'modified_desc' : 'modified_asc';
			}
			return '';
		};

		return (
			<>
				<BlockEdit {...props} />
				<InspectorControls>
					<PanelBody
						title={__('VK Query Extension', 'vk-blocks')}
						icon={<Icon icon={IconSVG} style={iconStyle} />}
						initialOpen={false}
					>
						<SelectControl
							label={__('Order by', 'vk-blocks')}
							help={__(
								'This setting will override the standard order setting.',
								'vk-blocks'
							)}
							value={getSelectValue()}
							onChange={(value) => {
								if (value === 'modified_desc') {
									setAttributes({
										query: {
											...query,
											orderBy: 'modified',
											order: 'desc',
										},
									});
								} else if (value === 'modified_asc') {
									setAttributes({
										query: {
											...query,
											orderBy: 'modified',
											order: 'asc',
										},
									});
								} else if (orderBy === 'modified') {
									// Reset to default if modified was selected and user wants to use core options
									setAttributes({
										query: {
											...query,
											orderBy: 'date',
											order: 'desc',
										},
									});
								}
							}}
							options={[
								{
									value: '',
									label: __(
										'Use standard options',
										'vk-blocks'
									),
								},
								{
									value: 'modified_desc',
									label: __(
										'Modified (Newest to oldest)',
										'vk-blocks'
									),
								},
								{
									value: 'modified_asc',
									label: __(
										'Modified (Oldest to newest)',
										'vk-blocks'
									),
								},
							]}
						/>
					</PanelBody>
				</InspectorControls>
			</>
		);
	},
	'withQueryOrderExtension'
);

// Apply the extension to the Query block
addFilter(
	'editor.BlockEdit',
	'vk-blocks/query-order-extension',
	withQueryOrderExtension
);
