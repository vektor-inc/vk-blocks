import {
	RichText,
	InspectorControls,
	useBlockProps,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { RadioControl, PanelBody } from '@wordpress/components';
import { AdvancedMediaUpload } from '@vkblocks/components/advanced-media-upload';

export default function FlowEdit({ attributes, setAttributes, clientId }) {
	const { heading, content, arrowFlag } = attributes;
	const blockProps = useBlockProps({
		className: `${arrowFlag} vk_flow`,
	});

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Display of arrow', 'vk-blocks')}>
					<RadioControl
						selected={arrowFlag}
						options={[
							{
								label: __('Arrow display', 'vk-blocks'),
								value: 'vk_flow-arrow-on',
							},
							{
								label: __('Arrow hidden', 'vk-blocks'),
								value: 'vk_flow-arrow-off',
							},
						]}
						onChange={(value) =>
							setAttributes({ arrowFlag: value })
						}
					/>
				</PanelBody>
			</InspectorControls>

			<div {...blockProps}>
				<div className={'vk_flow_frame'}>
					<dl className={'vk_flow_frame_text'}>
						<RichText
							key={`${clientId}2`}
							tagName="dt"
							className={'vk_flow_frame_text_title'}
							onChange={(value) =>
								setAttributes({ heading: value })
							}
							value={heading}
							placeholder={__('Input title', 'vk-blocks')}
						/>
						<RichText
							key={`${clientId}3`}
							tagName="dd"
							className={'vk_flow_frame_text_content'}
							onChange={(value) =>
								setAttributes({ content: value })
							}
							value={content}
							placeholder={__('Input content', 'vk-blocks')}
						/>
					</dl>
					<div className={'vk_flow_frame_image'}>
						<AdvancedMediaUpload
							schema={'insertImage'}
							altSchema={'insertImageAlt'}
							showPlaceholder={false}
							setAttributes={setAttributes}
							attributes={attributes}
						/>
					</div>
				</div>
				{arrowFlag === 'vk_flow-arrow-on' && (
					<div className={'vk_flow_frame_arrow'}></div>
				)}
			</div>
		</>
	);
}
