/**
 * cover-style block type
 *
 * @package
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { BlockControls } from '@wordpress/block-editor';
import { ToolbarGroup } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import LinkToolbar from '@vkblocks/components/link-toolbar';
import { __ } from '@wordpress/i18n';

// コアの Cover ブロックかどうかを判定
const isCoverBlock = (name) => name === 'core/cover';

// Cover ブロックを拡張する HOC
const enhanceCoverBlock = createHigherOrderComponent((BlockEdit) => {
	return (props) => {
		if (!isCoverBlock(props.name)) {
			return <BlockEdit {...props} />;
		}

		const {
			attributes: {
				linkUrl,
				linkTarget,
				relAttribute,
				linkDescription,
				linkToPost,
			},
			setAttributes,
			context,
		} = props;

		const isDescendentOfQueryLoop =
			typeof context?.queryId === 'number' &&
			Number.isFinite(context?.queryId);

		return (
			<Fragment>
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
							relAttribute={relAttribute}
							setRelAttribute={(rel) =>
								setAttributes({ relAttribute: rel })
							}
							linkDescription={linkDescription}
							setLinkDescription={(description) =>
								setAttributes({ linkDescription: description })
							}
							isDescendentOfQueryLoop={isDescendentOfQueryLoop}
							linkToPost={linkToPost}
							setLinkToPost={(checked) =>
								setAttributes({ linkToPost: !!checked })
							}
						/>
					</ToolbarGroup>
				</BlockControls>
			</Fragment>
		);
	};
}, 'enhanceCoverBlock');

const extendCoverBlock = (settings, name) => {
	if (!isCoverBlock(name)) {
		return settings;
	}

	const save = (props) => {
		const { attributes } = props;
		const {
			linkUrl,
			linkTarget,
			relAttribute,
			linkDescription,
			linkToPost,
		} = attributes;

		// 元のブロックの `save` を取得
		const saveElement = settings.save(props);

		const hasLink = linkUrl || linkToPost;
		const effectiveUrl = linkToPost ? '' : linkUrl;

		if (!saveElement || !hasLink) {
			return saveElement;
		}

		const existingClassName = saveElement.props.className || '';
		const classNameWithLink = `${existingClassName} has-link`.trim();
		const existingStyle = saveElement.props.style || {};

		return (
			<div className={classNameWithLink} style={existingStyle}>
				{saveElement.props.children}
				<a
					href={effectiveUrl}
					{...(linkToPost ? { 'data-vk-link-to-post': '1' } : {})}
					{...(linkTarget ? { target: linkTarget } : {})}
					{...(relAttribute ? { rel: relAttribute } : {})}
					className="wp-block-cover-vk-link"
				>
					<span className="screen-reader-text">
						{linkDescription
							? linkDescription
							: __('Cover link', 'vk-blocks')}
					</span>
				</a>
			</div>
		);
	};

	return {
		...settings,
		attributes: {
			...settings.attributes,
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
			linkToPost: {
				type: 'boolean',
				default: false,
			},
		},
		usesContext: [
			...(settings.usesContext || []),
			'postId',
			'postType',
			'queryId',
		],
		edit: enhanceCoverBlock(settings.edit),
		save, // 修正した `save` を適用
	};
};

addFilter(
	'blocks.registerBlockType',
	'custom/extend-cover-block',
	extendCoverBlock
);
