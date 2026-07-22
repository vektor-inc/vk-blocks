import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	BaseControl,
	SelectControl,
	Button,
	ToolbarGroup,
	ToolbarButton,
} from '@wordpress/components';
import {
	InspectorControls,
	useBlockProps,
	BlockControls,
} from '@wordpress/block-editor';
import ServerSideRender from '@wordpress/server-side-render';
import { useSelect } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';
import { pencil } from '@wordpress/icons';

// usePosts は本ブロック専用のためローカル定義
const usePosts = (postType, query) => {
	return useSelect(
		(select) => {
			return (
				select('core').getEntityRecords(
					'postType',
					postType.slug,
					query
				) || []
			);
		},
		[postType, query]
	);
};

const getPageLabel = (page) => {
	let label = page.title.rendered;
	if (page.status === 'private') {
		label += ` (${__('Private', 'vk-blocks')})`;
	}
	if (page.password) {
		label += ` (${__('Password Protected', 'vk-blocks')})`;
	}
	return label;
};

const getPagesSelect = (pages, currentTargetPost) => {
	const defaultSelect = [
		{
			label: __('Unspecified', 'vk-blocks'),
			value: -1,
		},
	];

	// 選択リストから非公開・パスワード保護のページを除外する（現在選択中のページは除く）
	const availablePages = pages.filter(
		(page) =>
			(page.status === 'publish' && !page.password) ||
			page.id === currentTargetPost
	);

	// 利用可能なページから選択オプションを作成する
	const pagesSelect = availablePages.map((page) => ({
		label:
			page.status === 'private' || page.password
				? getPageLabel(page)
				: page.title.rendered,
		value: page.id,
	}));

	return defaultSelect.concat(pagesSelect);
};

export default function PageContentEdit({ attributes, setAttributes }) {
	const { TargetPost } = attributes;
	const hasTargetPost = TargetPost !== -1;
	const editButtonLabel = __('Edit this area', 'vk-blocks');
	const toolbarEditButtonLabel = hasTargetPost
		? editButtonLabel
		: __('Select a page first to edit this area', 'vk-blocks');

	// 対象固定ページの編集画面を新規タブで開く
	const openTargetPostEdit = () => {
		if (!hasTargetPost) {
			return;
		}

		const url = addQueryArgs('post.php', {
			post: TargetPost,
			action: 'edit',
		});
		window.open(url, `vk-page-content-edit-${TargetPost}`);
	};

	const pages = usePosts(
		{ slug: 'page' },
		{ per_page: -1, status: 'private,publish' }
	);

	const pagesSelect = getPagesSelect(pages, TargetPost);

	let editContent;
	if (TargetPost === -1) {
		editContent = (
			<div className="alert alert-warning text-center">
				{__(
					'Because no post is selected, The block Will not render',
					'vk-blocks'
				)}
			</div>
		);
	} else {
		editContent = (
			<ServerSideRender
				block="vk-blocks/page-content"
				attributes={attributes}
			/>
		);
	}

	const blockProps = useBlockProps();

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						icon={pencil}
						label={toolbarEditButtonLabel}
						showTooltip={true}
						disabled={!hasTargetPost}
						accessibleWhenDisabled
						onClick={openTargetPostEdit}
					/>
				</ToolbarGroup>
			</BlockControls>
			<InspectorControls>
				<PanelBody
					title={__('Page Setting', 'vk-blocks')}
					initialOpen={true}
				>
					<BaseControl id={'vb-call-01'}>
						<SelectControl
							label={__('Select Page', 'vk-blocks')}
							value={TargetPost}
							options={pagesSelect}
							onChange={(value) =>
								setAttributes({
									TargetPost: parseInt(value, 10),
								})
							}
						/>
					</BaseControl>
					<Button
						className="mt-2"
						variant="secondary"
						icon={pencil}
						aria-label={toolbarEditButtonLabel}
						disabled={!hasTargetPost}
						accessibleWhenDisabled
						onClick={openTargetPostEdit}
					>
						{editButtonLabel}
					</Button>
				</PanelBody>
			</InspectorControls>
			<div {...blockProps}>{editContent}</div>
		</>
	);
}
