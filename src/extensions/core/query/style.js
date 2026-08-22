/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	ToggleControl,
	Notice,
} from '@wordpress/components';
import { registerBlockVariation } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import apiFetch from '@wordpress/api-fetch';
import { select, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { VkPanelIcon } from '@vkblocks/components/vk-icon';

const RELATED_POSTS_QUERY_TYPE = 'relatedPosts';

/**
 * Structural Site Editor entities (templates, template parts, navigation)
 * are not real content; core/editor's getCurrentPostType()/getCurrentPostId()
 * report the entity itself (e.g. postId "themeSlug//templateSlug", not a
 * number) while editing them, so callers must not treat those as a post.
 * サイトエディタの構造的エンティティ（テンプレート等）は実コンテンツではない。
 * 編集中は core/editor の getCurrentPostType()/getCurrentPostId() がその
 * エンティティ自身を返す（postId も数値ではなく "テーマ//テンプレート" 形式の
 * 文字列になる）ため、投稿として扱ってはならない。
 */
const NON_CONTENT_ENTITY_POST_TYPES = [
	'wp_template',
	'wp_template_part',
	'wp_navigation',
];

/**
 * Attach the edited post ID to related-posts REST previews (request-time only).
 * 関連記事 REST プレビューへ編集中投稿 ID をリクエスト時だけ付与する。
 */
apiFetch.use((options, next) => {
	if (typeof options?.path !== 'string') {
		return next(options);
	}
	if (
		!options.path.includes(
			`vkBlocksProQueryType=${RELATED_POSTS_QUERY_TYPE}`
		) ||
		options.path.includes('vkBlocksProRelatedPostId=')
	) {
		return next(options);
	}

	let postId;
	try {
		const editor = select('core/editor');
		// Editing a template/template-part directly (no post-in-progress):
		// skip getCurrentPostId(), which would return the entity's own
		// string ID and fail the REST integer param validation (400).
		// テンプレート等を直接編集中は投稿が存在しないため getCurrentPostId()
		// を使わない（エンティティ自身の文字列IDが返り、REST の integer 型
		// バリデーションで 400 になるため）。
		if (
			!NON_CONTENT_ENTITY_POST_TYPES.includes(
				editor?.getCurrentPostType?.()
			)
		) {
			postId = editor?.getCurrentPostId?.();
		}
	} catch (e) {
		// editor store may be unavailable outside the post editor.
	}
	if (!postId) {
		try {
			postId = select('core/edit-site')?.getEditedPostContext?.()?.postId;
		} catch (e) {
			// ignore
		}
	}
	if (!postId) {
		return next(options);
	}

	const separator = options.path.includes('?') ? '&' : '?';
	return next({
		...options,
		path: `${options.path}${separator}vkBlocksProRelatedPostId=${postId}`,
	});
});

/**
 * Whether related-posts mode is on (vkBlocksProQueryType).
 * Matches PHP vk_blocks_is_related_posts_query_loop.
 * 関連記事モード判定（PHP 側と同じ）。
 *
 * @param {Object} blockAttributes Block attributes.
 * @return {boolean} True when related-posts mode is active.
 */
const isRelatedPostsQueryAttributes = (blockAttributes) =>
	blockAttributes?.query?.vkBlocksProQueryType === RELATED_POSTS_QUERY_TYPE;

/**
 * Hidden variation for allowedControls only. Title stays "Query Loop" so the
 * block is never renamed; no icon / description / attributes (avoids sticky ON).
 * allowedControls 絞り込み専用。タイトルはクエリーループのまま。
 */
registerBlockVariation('core/query', {
	name: 'vk-blocks-related-posts',
	// Intentionally no text domain: reuse WordPress core's "Query Loop"
	// translation so this hidden variation title always matches the core block.
	// テキストドメインは意図的に付けない。コアの「Query Loop」翻訳を流用し、
	// 隠しバリエーションのタイトルをコアのブロック名と常に一致させるため。
	title: __('Query Loop'),
	// postCount + order (tiebreak). Other controls hide in related mode.
	// 件数と並び順（tiebreak）のみ。関連元は現在の投稿に固定。
	allowedControls: ['postCount', 'order'],
	scope: [],
	isActive: (blockAttributes) =>
		isRelatedPostsQueryAttributes(blockAttributes),
});

/**
 * VK Query Extension panel: related-posts toggle + modified-date order.
 * 「VK クエリー拡張」: 関連記事トグルと更新日順。
 */
const withQueryOrderExtension = createHigherOrderComponent(
	(BlockEdit) => (props) => {
		const { name, attributes, setAttributes } = props;

		if (name !== 'core/query') {
			return <BlockEdit {...props} />;
		}

		const { query } = attributes;
		const { orderBy = 'date', order = 'desc' } = query || {};
		const isRelatedPostsQuery = isRelatedPostsQueryAttributes(attributes);

		// Disable (gray out) only when the edited entity is clearly not a post.
		// Site editor / unknown context stays enabled; help text covers the caveat.
		// 編集中が post 以外と分かるときだけ無効化（グレー）。テンプレ等は有効のまま。
		const editedPostType = useSelect((sel) => {
			// Site Editor: templates preview a sample post via edited-post
			// context. core/editor's getCurrentPostType() would return the
			// template's own type (e.g. wp_template), not the previewed
			// post's type, so prefer the preview context here.
			// サイトエディタはテンプレート内でサンプル投稿をプレビューする。
			// core/editor の getCurrentPostType() はテンプレート自身の型
			// （wp_template 等）を返してしまうため、プレビュー中の投稿の型を
			// 優先して使う。
			try {
				const templateContext =
					sel('core/edit-site')?.getEditedPostContext?.();
				if (templateContext?.postType) {
					return templateContext.postType;
				}
			} catch (e) {
				// edit-site store may be unavailable outside the site editor.
			}
			try {
				const currentPostType =
					sel('core/editor')?.getCurrentPostType?.();
				// Structural entities (templates, template parts, nav) are not
				// real content types; treat them as unknown rather than
				// unsupported so template editing does not get blocked.
				// テンプレート等の構造的エンティティは実コンテンツの投稿タイプ
				// ではないため「不明」扱いにし、テンプレ編集を誤遮断しない。
				if (
					currentPostType &&
					!NON_CONTENT_ENTITY_POST_TYPES.includes(currentPostType)
				) {
					return currentPostType;
				}
			} catch (e) {
				// editor store may be unavailable outside the post editor.
			}
			return null;
		}, []);
		const isUnsupportedPostType =
			typeof editedPostType === 'string' && editedPostType !== 'post';
		// Keep the control usable to turn OFF if it was already on.
		// 既に ON のときは OFF に戻せるようにする。
		const isRelatedPostsToggleDisabled =
			isUnsupportedPostType && !isRelatedPostsQuery;

		// Each sentence is wrapped in its own __() (one sentence per call).
		// 翻訳関数は1文につき1つ（1関数=1文ルール）。
		// When disabled, drop the toggle help and explain via the warning Notice
		// below so the reason reaches assistive tech without focusing the control.
		// disabled 時はトグルの help を外し、下の warning Notice で理由を伝える
		// （フォーカス非依存で AT に届くようにするため）。
		const relatedPostsHelp = isRelatedPostsToggleDisabled
			? undefined
			: __(
					'Related posts are matched by the tags on the current post.',
					'vk-blocks'
				) +
				' ' +
				__(
					'The list may be empty on pages or other post types, or until a new post is saved.',
					'vk-blocks'
				);

		/**
		 * Switch data source only (keep layout / perPage / order).
		 * ON: inherit=false (required for build_query_vars_from_query_block).
		 * OFF: clear vkBlocksProQueryType, then restore inherit.
		 * データソースだけ切替。ON 時 inherit=false。
		 * OFF 時はフラグを消し、inherit を復元する。
		 *
		 * vkBlocksProHadInherit / vkBlocksProInheritBackup are stored on the query
		 * attribute on purpose so OFF can restore the original inherit even after a
		 * reload; they persist in saved content but are harmless (unknown query keys
		 * are ignored on the front end). Moving them to useRef breaks that restore.
		 * これらの退避キーは意図的に query 属性へ保存する（リロード後も OFF で元の
		 * inherit を復元するため）。保存内容に残るが無害。useRef 化は復元を壊す。
		 *
		 * @param {boolean} nextIsOn Whether related posts mode is being enabled.
		 */
		const toggleRelatedPosts = (nextIsOn) => {
			const nextQuery = { ...(query || {}) };
			const nextAttributes = { query: nextQuery };
			const inheritBackupKey = 'vkBlocksProInheritBackup';
			const inheritHadKey = 'vkBlocksProHadInherit';

			if (nextIsOn) {
				nextQuery.vkBlocksProQueryType = RELATED_POSTS_QUERY_TYPE;
				// Remember inherit only on first switch into related mode.
				// 関連モードへ入る初回だけ inherit を退避する。
				if (
					!Object.prototype.hasOwnProperty.call(
						nextQuery,
						inheritHadKey
					)
				) {
					const hadInherit = Object.prototype.hasOwnProperty.call(
						nextQuery,
						'inherit'
					);
					nextQuery[inheritHadKey] = hadInherit;
					nextQuery[inheritBackupKey] = hadInherit
						? nextQuery.inherit
						: undefined;
				}
				nextQuery.inherit = false;
			} else {
				delete nextQuery.vkBlocksProQueryType;
				if (
					Object.prototype.hasOwnProperty.call(
						nextQuery,
						inheritHadKey
					)
				) {
					const hadInherit = nextQuery[inheritHadKey];
					const backup = nextQuery[inheritBackupKey];
					delete nextQuery[inheritHadKey];
					delete nextQuery[inheritBackupKey];
					if (hadInherit) {
						nextQuery.inherit = backup;
					} else {
						delete nextQuery.inherit;
					}
				}
			}

			setAttributes(nextAttributes);
			// ON: the Notice rendered while related mode is on announces itself on
			// mount, so calling speak() here would double-announce to screen readers.
			// OFF: no Notice is rendered, so announce the change here.
			// ON時は Notice が mount 時に自動読み上げするため speak しない（重複回避）。
			// OFF時は Notice が無いのでここで通知する。
			if (!nextIsOn) {
				speak(__('Related posts turned off.', 'vk-blocks'), 'polite');
			}
		};

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
						icon={
							<VkPanelIcon
								isActive={
									isRelatedPostsQuery ||
									orderBy === 'modified'
								}
							/>
						}
						initialOpen={isRelatedPostsQuery}
					>
						<ToggleControl
							label={__('Show related posts', 'vk-blocks')}
							help={relatedPostsHelp}
							checked={isRelatedPostsQuery}
							disabled={isRelatedPostsToggleDisabled}
							onChange={toggleRelatedPosts}
						/>
						{isRelatedPostsToggleDisabled && (
							<Notice status="warning" isDismissible={false}>
								{__(
									'Related posts are unavailable for this content type.',
									'vk-blocks'
								) +
									' ' +
									__(
										'Switch to editing a post that has tags to use this feature.',
										'vk-blocks'
									)}
							</Notice>
						)}
						{isRelatedPostsQuery && (
							<Notice status="info" isDismissible={false}>
								{__(
									'Related posts are ranked by how many tags each post shares with the post you are editing, showing the most related first.',
									'vk-blocks'
								) +
									' ' +
									__(
										'Order settings only affect posts that share the same number of tags.',
										'vk-blocks'
									) +
									' ' +
									__(
										'Use the "Items per page" setting to change how many related posts appear.',
										'vk-blocks'
									)}
							</Notice>
						)}
						<SelectControl
							label={__('Order by', 'vk-blocks')}
							help={
								isRelatedPostsQuery
									? __(
											'Order for posts that share the same number of tags.',
											'vk-blocks'
										)
									: __(
											'This setting will override the standard order setting.',
											'vk-blocks'
										)
							}
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

addFilter(
	'editor.BlockEdit',
	'vk-blocks/query-order-extension',
	withQueryOrderExtension
);
