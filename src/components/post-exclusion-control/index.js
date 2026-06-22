import { __, sprintf } from '@wordpress/i18n';
import { BaseControl, FormTokenField } from '@wordpress/components';
import { useState, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { useDebounce } from '@wordpress/compose';
import { fixBrokenUnicode } from '@vkblocks/utils/fixBrokenUnicode';

/**
 * 投稿IDで除外する投稿を選択するコンポーネント。
 * 選択中の投稿タイプを対象にタイトル検索し、FormTokenField で除外する投稿を選択する。
 * Component for selecting posts to exclude by post ID.
 * Searches posts by title within the selected post types and lets the user pick posts to exclude via FormTokenField.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes        ブロックの属性 / Block attributes.
 * @param {Function} props.setAttributes     属性更新関数 / Setter for attributes.
 * @param {string[]} props.selectedPostTypes 選択中の投稿タイプ slug の配列 / Array of selected post type slugs.
 * @return {JSX.Element} FormTokenField
 */
export function PostExclusionControl({
	attributes,
	setAttributes,
	selectedPostTypes,
}) {
	const { exclusionPosts } = attributes;

	// 除外対象として保存済みの投稿ID配列 / Array of post ids saved as exclusion targets.
	const selectedIds = useMemo(() => {
		try {
			const parsed = JSON.parse(fixBrokenUnicode(exclusionPosts || '[]'));
			return Array.isArray(parsed) ? parsed : [];
		} catch (e) {
			return [];
		}
	}, [exclusionPosts]);

	// 検索キーワード（FormTokenField への入力値）/ Search keyword ( input value of FormTokenField ).
	const [search, setSearch] = useState('');
	// 入力のたびに getEntityRecords が発火しないよう、検索キーワードの更新をデバウンスする。
	// Debounce the search keyword update so getEntityRecords does not fire on every keystroke.
	const debouncedSetSearch = useDebounce(setSearch, 300);

	// 検索対象の投稿タイプ（未選択時は post を既定とする）/ Post types to search ( fall back to post when none selected ).
	const postTypes = useMemo(() => {
		return selectedPostTypes && selectedPostTypes.length
			? selectedPostTypes
			: ['post'];
	}, [selectedPostTypes]);

	// 検索キーワードに一致する投稿（候補表示用）/ Posts matching the search keyword ( for suggestions ).
	const suggestionPosts = useSelect(
		(select) => {
			const { getEntityRecords } = select('core');
			let results = [];
			postTypes.forEach((postType) => {
				const records = getEntityRecords('postType', postType, {
					per_page: 20,
					search: search || undefined,
					_fields: 'id,title',
				});
				if (records) {
					results = results.concat(records);
				}
			});
			return results;
		},
		[search, postTypes]
	);

	// 保存済み投稿IDからトークン表示用のタイトルを解決 / Resolve titles for selected ids to display as tokens.
	const selectedPosts = useSelect(
		(select) => {
			if (!selectedIds.length) {
				return [];
			}
			const { getEntityRecords } = select('core');
			let results = [];
			// WP REST API の per_page 上限(100)を超えるとリクエストが弾かれ
			// タイトルが解決できなくなるため、選択IDを100件ずつに分割して取得する。
			// Split selected ids into chunks of 100 to respect the WP REST API
			// per_page cap ( requests over the cap fail and titles go unresolved ).
			const chunkSize = 100;
			const idChunks = [];
			for (let i = 0; i < selectedIds.length; i += chunkSize) {
				idChunks.push(selectedIds.slice(i, i + chunkSize));
			}
			postTypes.forEach((postType) => {
				idChunks.forEach((chunk) => {
					const records = getEntityRecords('postType', postType, {
						per_page: chunk.length,
						include: chunk,
						_fields: 'id,title',
					});
					if (records) {
						results = results.concat(records);
					}
				});
			});
			return results;
		},
		[selectedIds, postTypes]
	);

	// 投稿をトークンのラベル文字列に変換（タイトル重複に備えて #ID を付与）/ Convert a post into a token label ( append #ID to avoid duplicate titles ).
	const makeLabel = (post) => {
		const title =
			post.title && post.title.rendered
				? post.title.rendered
				: __('(no title)', 'vk-blocks');
		return `${title} (#${post.id})`;
	};

	// ラベル ⇔ ID の対応表を作成 / Build label <-> id maps.
	const labelToId = {};
	const idToLabel = {};
	[...suggestionPosts, ...selectedPosts].forEach((post) => {
		const label = makeLabel(post);
		labelToId[label] = post.id;
		idToLabel[post.id] = label;
	});

	// 表示用トークン（タイトル未解決の場合は #ID で表示）/ Tokens to display ( fall back to #ID when the title is not resolved yet ).
	const value = selectedIds.map((id) => idToLabel[id] || `#${id}`);
	const suggestions = suggestionPosts.map(makeLabel);

	return (
		// BaseControl でラップして他の設定項目と余白を揃え、検索対象の補足説明(help)を表示する。
		// FormTokenField 自体は help プロップ非対応のため、help は BaseControl 側に持たせる。
		// Wrap with BaseControl to match the spacing of other controls and to show the search-target help text.
		// FormTokenField itself does not support the help prop, so help is placed on BaseControl.
		<BaseControl
			id="vk_postList-excludePosts"
			help={sprintf(
				// translators: search target post types
				__('Search target: %s', 'vk-blocks'),
				postTypes.join(', ')
			)}
		>
			<FormTokenField
				label={__('Exclude by Article', 'vk-blocks')}
				value={value}
				suggestions={suggestions}
				onInputChange={(input) => debouncedSetSearch(input)}
				onChange={(tokens) => {
					const ids = tokens
						.map((token) => {
							// 候補から選択された場合はラベルからIDを引く / Look up the id from the label when picked from suggestions.
							if (labelToId[token] !== undefined) {
								return labelToId[token];
							}
							// 既存トークン（#ID 形式）はIDを抽出 / Extract the id from an existing token ( #ID format ).
							const matched = String(token).match(/#(\d+)/);
							if (matched) {
								return parseInt(matched[1], 10);
							}
							return null;
						})
						.filter((id) => id !== null);
					setAttributes({ exclusionPosts: JSON.stringify(ids) });
				}}
				__experimentalExpandOnFocus
				__experimentalShowHowTo={false}
			/>
		</BaseControl>
	);
}
