// import WordPress Scripts
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	SelectControl,
	ToggleControl,
	TextControl,
} from '@wordpress/components';
import ServerSideRender from '@wordpress/server-side-render';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';

// 正規表現を定数として定義
const TITLE_TAG_REGEX = /^(h[2-6]).*/;
const CLASS_NAME_REGEX = /[^a-zA-Z0-9-_ ]/g;

export default function AncestorPageListEdit(props) {
	const { attributes, setAttributes } = props;
	const {
		ancestorTitleDisplay,
		ancestorTitleTagName,
		ancestorTitleClassName,
		ancestorTitleLink,
		displayHasChildOnly,
		hiddenGrandChild,
	} = attributes;

	const blockProps = useBlockProps();

	// タイトルタグのバリデーション関数
	const validateTitleTag = (value) => {
		const matches = value?.match(TITLE_TAG_REGEX);
		return matches ? matches[1] : 'h4'; // デフォルト値を設定
	};

	// クラス名のサニタイズ関数
	const sanitizeClassName = (value) => {
		return value?.replace(CLASS_NAME_REGEX, '') || '';
	};

	// useEffectを使ってレンダリング後にstateを更新
	useEffect(() => {
		const validatedTag = validateTitleTag(ancestorTitleTagName);
		const sanitizedValue = sanitizeClassName(ancestorTitleClassName);
		const updates = {};
		if (validatedTag !== ancestorTitleTagName) {
			updates.ancestorTitleTagName = validatedTag;
		}
		if (sanitizedValue !== ancestorTitleClassName) {
			updates.ancestorTitleClassName = sanitizedValue;
		}
		if (Object.keys(updates).length > 0) {
			setAttributes(updates);
		}
	}, [ancestorTitleTagName, ancestorTitleClassName]);

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={__('Ancestor Page List Setting', 'vk-blocks')}
				>
					<ToggleControl
						label={__('Display Ancestor Page Title', 'vk-blocks')}
						checked={ancestorTitleDisplay}
						onChange={(checked) =>
							setAttributes({ ancestorTitleDisplay: checked })
						}
					/>
					<SelectControl
						label={__('Ancestor title tag', 'vk-blocks')}
						value={ancestorTitleTagName}
						onChange={(value) => {
							setAttributes({
								ancestorTitleTagName: validateTitleTag(value),
							});
						}}
						options={[
							{
								value: 'h2',
								label: __('h2', 'vk-blocks'),
							},
							{
								value: 'h3',
								label: __('h3', 'vk-blocks'),
							},
							{
								value: 'h4',
								label: __('h4', 'vk-blocks'),
							},
							{
								value: 'h5',
								label: __('h5', 'vk-blocks'),
							},
							{
								value: 'h6',
								label: __('h6', 'vk-blocks'),
							},
						]}
					/>
					<TextControl
						label={__(
							'Ancestor page title class name',
							'vk-blocks'
						)}
						value={ancestorTitleClassName || ''}
						className={`mt-0 mb-3`}
						onChange={(value) => {
							setAttributes({
								ancestorTitleClassName:
									sanitizeClassName(value),
							});
						}}
					/>
					<ToggleControl
						label={__(
							'Add link to ancestor page title',
							'vk-blocks'
						)}
						checked={ancestorTitleLink}
						onChange={(checked) =>
							setAttributes({ ancestorTitleLink: checked })
						}
					/>
					<hr />
					<ToggleControl
						label={__(
							'If there is no child page, the block itself is not displayed',
							'vk-blocks'
						)}
						checked={displayHasChildOnly}
						onChange={(checked) =>
							setAttributes({ displayHasChildOnly: checked })
						}
					/>
					<ToggleControl
						label={__(
							"Don't display inactive grand child pages",
							'vk-blocks'
						)}
						checked={hiddenGrandChild}
						onChange={(checked) =>
							setAttributes({ hiddenGrandChild: checked })
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div {...blockProps}>
				<ServerSideRender
					block="vk-blocks/ancestor-page-list"
					attributes={attributes}
				/>
			</div>
		</>
	);
}
