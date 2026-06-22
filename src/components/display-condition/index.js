import { __, sprintf } from '@wordpress/i18n';
import {
	RangeControl,
	PanelBody,
	BaseControl,
	SelectControl,
	CheckboxControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	TextControl,
	FormTokenField,
} from '@wordpress/components';
import { useState, useEffect, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
// useTaxonomies はこのコンポーネント専用のためローカル定義
const useTaxonomies = () => {
	return useSelect((select) => {
		return select('core').getTaxonomies({ per_page: -1 }) || [];
	}, []);
};
import { fixBrokenUnicode } from '@vkblocks/utils/fixBrokenUnicode';

// Load VK Blocks Compornents
import { AdvancedCheckboxControl } from '@vkblocks/components/advanced-checkbox-control';
import { PostExclusionControl } from '@vkblocks/components/post-exclusion-control';

export function DisplayCondition(props) {
	const { attributes, setAttributes, postTypesProps, termsByTaxonomyName } =
		props;
	const {
		numberPosts,
		isCheckedPostType,
		taxQueryRelation,
		isCheckedTerms,
		exclusionTerms,
		offset,
		targetPeriod,
		order,
		orderby,
		selfIgnore,
		pagedlock,
		stickyPosts,
	} = attributes;

	// 以前の値を切り替え
	useEffect(() => {
		if (targetPeriod === undefined) {
			setAttributes({ targetPeriod: 'all' });
		}
	}, [targetPeriod, setAttributes]);

	const [isCheckedTermsData, setIsCheckedTermsData] = useState(
		JSON.parse(fixBrokenUnicode(isCheckedTerms))
	);
	const [isCheckedPostTypeData, setIsCheckedPostTypeData] = useState(
		JSON.parse(fixBrokenUnicode(isCheckedPostType))
	);
	// 除外するタームの選択状態 / Selection state of terms to exclude.
	const [isExcludedTermsData, setIsExcludedTermsData] = useState(
		JSON.parse(fixBrokenUnicode(exclusionTerms || '[]'))
	);

	const postTypeToTaxonomyMap = {};
	const taxonomies = useTaxonomies();

	taxonomies.forEach((taxonomy) => {
		taxonomy.types.forEach((postType) => {
			if (!postTypeToTaxonomyMap[postType]) {
				postTypeToTaxonomyMap[postType] = [];
			}
			postTypeToTaxonomyMap[postType].push(taxonomy.slug);
		});
	});

	const saveStateTerms = (termId) => {
		if (!isCheckedTermsData.includes(termId)) {
			const updatedTerms = [...isCheckedTermsData, termId];
			setIsCheckedTermsData(updatedTerms);
			setAttributes({ isCheckedTerms: JSON.stringify(updatedTerms) });
		}
	};

	const removeStateTerms = (termId) => {
		const newTermsData = isCheckedTermsData.filter((id) => id !== termId);
		setIsCheckedTermsData(newTermsData);
		setAttributes({
			isCheckedTerms: JSON.stringify(newTermsData),
		});
	};

	// 除外タームの追加 / Add an exclusion term.
	const saveStateExcludedTerms = (termId) => {
		if (!isExcludedTermsData.includes(termId)) {
			const updatedTerms = [...isExcludedTermsData, termId];
			setIsExcludedTermsData(updatedTerms);
			setAttributes({ exclusionTerms: JSON.stringify(updatedTerms) });
		}
	};

	// 除外タームの削除 / Remove an exclusion term.
	const removeStateExcludedTerms = (termId) => {
		const newTermsData = isExcludedTermsData.filter((id) => id !== termId);
		setIsExcludedTermsData(newTermsData);
		setAttributes({
			exclusionTerms: JSON.stringify(newTermsData),
		});
	};

	const saveStatePostTypes = (slug) => {
		let newPostTypeData = [...isCheckedPostTypeData];
		let newTermsData = [...isCheckedTermsData];
		// 除外タームも絞り込みタームと同様にクリーンアップする
		// Clean up the excluded terms in the same way as the filter terms.
		let newExcludedTermsData = [...isExcludedTermsData];
		if (!newPostTypeData.includes(slug)) {
			newPostTypeData.push(slug);
		} else {
			newPostTypeData = newPostTypeData.filter((type) => type !== slug);
			const postTypeTaxonomies = postTypeToTaxonomyMap[slug] || [];
			postTypeTaxonomies.forEach((taxonomy) => {
				const terms = termsByTaxonomyName[taxonomy] || [];
				terms.forEach((term) => {
					newTermsData = newTermsData.filter(
						(id) => id !== term.term_id
					);
					// 解除した投稿タイプのタクソノミーに属するタームを除外設定からも除く
					// Also drop terms of the deselected post type's taxonomies from the exclusion settings.
					newExcludedTermsData = newExcludedTermsData.filter(
						(id) => id !== term.term_id
					);
				});
			});
		}
		setIsCheckedPostTypeData(newPostTypeData);
		setIsCheckedTermsData(newTermsData);
		setIsExcludedTermsData(newExcludedTermsData);
		setAttributes({
			isCheckedPostType: JSON.stringify(newPostTypeData),
			isCheckedTerms: JSON.stringify(newTermsData),
			exclusionTerms: JSON.stringify(newExcludedTermsData),
		});
	};

	// メディアと再利用ブロックを除外
	const filteredPostTypesProps = useMemo(() => {
		return postTypesProps.filter(
			(postType) =>
				'attachment' !== postType.slug && 'wp_block' !== postType.slug
		);
	}, [postTypesProps]);

	const replaceIsCheckedTermData = (taxonomyRestbase, termIds, newIds) => {
		const removedTermIds = termIds.filter((termId) => {
			let find = false;
			termsByTaxonomyName[taxonomyRestbase].forEach((term) => {
				if (term.term_id === termId) {
					find = true;
				}
			});
			return !find;
		});
		return removedTermIds.concat(newIds);
	};

	const getTaxonomiesByPostType = (postType) => {
		return taxonomies.filter((taxonomy) => {
			return (
				taxonomy.types.includes(postType) &&
				termsByTaxonomyName[taxonomy.slug]?.length
			);
		});
	};

	// termFormTokenFields ////////////////////////////////////////////////////////
	// Tag Filter
	const selectedPostTypes = isCheckedPostTypeData;
	const filteredTaxonomies = selectedPostTypes.flatMap((postType) =>
		getTaxonomiesByPostType(postType)
	);

	// 絞り込み用・除外用で共通のターム選択UIを生成するファクトリ。
	// state / schema / ラベル / ハンドラのみが異なるため、共通化して重複と乖離リスクを排除する。
	// Factory that builds the shared term-selection UI for both the filter and the exclusion.
	// Only the state / schema / label / handlers differ, so this is centralized to avoid duplication and divergence.
	const buildTermFields = ({
		checkedData,
		setCheckedData,
		schema,
		labelFormat,
		saveState,
		removeState,
		baseControlId,
	}) => {
		// 非階層タクソノミー（タグ等）→ FormTokenField / Non-hierarchical taxonomies ( tags etc. ) -> FormTokenField.
		const tokenFields = filteredTaxonomies
			.filter((taxonomy) => {
				return (
					!taxonomy.hierarchical && termsByTaxonomyName[taxonomy.slug]
				);
			})
			.map((taxonomy) => {
				const termsMapByName = termsByTaxonomyName[
					taxonomy.slug
				].reduce((acc, term) => {
					return {
						...acc,
						[term.name]: term,
					};
				}, {});

				const termsMapById = termsByTaxonomyName[taxonomy.slug].reduce(
					(acc, term) => {
						return {
							...acc,
							[term.term_id]: term,
						};
					},
					{}
				);

				const termNames = termsByTaxonomyName[taxonomy.slug].map(
					(term) => term.name
				);

				return termsByTaxonomyName[taxonomy.slug] &&
					termsByTaxonomyName[taxonomy.slug]?.length > 0 ? (
					<FormTokenField
						key={taxonomy.slug}
						label={sprintf(labelFormat, taxonomy.labels.name)}
						value={checkedData
							.filter((termId) => {
								return termId in termsMapById;
							})
							.map((termId) => {
								return termsMapById[termId].name;
							})}
						suggestions={termNames}
						onChange={(newTerms) => {
							const termIds = newTerms.map((termName) => {
								return termsMapByName[termName].term_id;
							});
							const replacedTermsData = replaceIsCheckedTermData(
								taxonomy.slug,
								checkedData,
								termIds
							);
							setCheckedData(replacedTermsData);
							setAttributes({
								[schema]: JSON.stringify(replacedTermsData),
							});
						}}
					></FormTokenField>
				) : null;
			}, taxonomies);

		// 階層タクソノミー（カテゴリー等）→ チェックボックス / Hierarchical taxonomies ( categories etc. ) -> checkboxes.
		const checkBoxes = filteredTaxonomies
			.filter((taxonomy) => {
				return (
					taxonomy.hierarchical === true &&
					termsByTaxonomyName[taxonomy.slug]?.length
				);
			})
			.map(function (taxonomy, index) {
				const taxonomiesProps = (
					termsByTaxonomyName[taxonomy.slug] || []
				).map((term) => {
					return {
						label: term.name,
						slug: term.term_id,
					};
				});

				return (
					<BaseControl
						label={sprintf(labelFormat, taxonomy.labels.name)}
						id={baseControlId}
						key={index}
					>
						<AdvancedCheckboxControl
							schema={schema}
							rawData={taxonomiesProps}
							checkedData={checkedData}
							saveState={saveState}
							removeState={removeState}
							{...props}
						/>
					</BaseControl>
				);
			}, termsByTaxonomyName);

		return { tokenFields, checkBoxes };
	};

	// 絞り込み（include）用のターム選択UI / Term-selection UI for the filter ( include ).
	const { tokenFields: termFormTokenFields, checkBoxes: taxonomiesCheckBox } =
		buildTermFields({
			checkedData: isCheckedTermsData,
			setCheckedData: setIsCheckedTermsData,
			schema: 'isCheckedTerms',
			// translators: Filter by %s
			labelFormat: __('Filter by %s', 'vk-blocks'),
			saveState: saveStateTerms,
			removeState: removeStateTerms,
			baseControlId: 'vk_postList-terms',
		});

	// 除外（exclude）用のターム選択UI / Term-selection UI for the exclusion ( exclude ).
	const {
		tokenFields: excludedTermFormTokenFields,
		checkBoxes: excludedTaxonomiesCheckBox,
	} = buildTermFields({
		checkedData: isExcludedTermsData,
		setCheckedData: setIsExcludedTermsData,
		schema: 'exclusionTerms',
		// translators: Exclude by %s
		labelFormat: __('Exclude by %s', 'vk-blocks'),
		saveState: saveStateExcludedTerms,
		removeState: removeStateExcludedTerms,
		baseControlId: 'vk_postList-excludeTerms',
	});

	// `offset`が空の場合に0に設定する
	useEffect(() => {
		if (offset === undefined || offset === null || offset === '') {
			setAttributes({ offset: 0 });
		}
	}, [offset]);

	// state を属性へ再同期する安全網。
	// AdvancedCheckboxControl の onChange は saveState/removeState 直後に
	// 古いクロージャの checkedData で属性を上書きするため、属性が1操作分遅れる。
	// state 変化時に毎回 state から属性を再同期して、このズレを打ち消す。
	// Safety net that re-syncs the state into the attributes.
	// AdvancedCheckboxControl's onChange overwrites the attributes with a stale
	// checkedData closure right after saveState/removeState, so the attributes lag
	// one operation behind. Re-syncing from state on every change cancels this lag.
	useEffect(() => {
		setAttributes({
			isCheckedPostType: JSON.stringify(isCheckedPostTypeData),
			isCheckedTerms: JSON.stringify(isCheckedTermsData),
			exclusionTerms: JSON.stringify(isExcludedTermsData),
		});
	}, [isCheckedPostTypeData, isCheckedTermsData, isExcludedTermsData]);

	return (
		<PanelBody
			title={__('Display conditions', 'vk-blocks')}
			initialOpen={false}
		>
			<BaseControl
				label={__('Filter by PostTypes', 'vk-blocks')}
				id={`vk_postList-postTypes`}
			>
				<AdvancedCheckboxControl
					schema={'isCheckedPostType'}
					rawData={filteredPostTypesProps}
					checkedData={isCheckedPostTypeData}
					setAttributes={setAttributes}
					saveState={saveStatePostTypes}
					removeState={removeStateTerms}
					{...props}
				/>
			</BaseControl>
			<hr />
			<h4 className={`mt-0 mb-2`}>
				{__('Taxonomy filter condition', 'vk-blocks')}
			</h4>
			<ToggleGroupControl
				value={taxQueryRelation}
				onChange={(value) => setAttributes({ taxQueryRelation: value })}
				isBlock
				className="mb-3"
			>
				<ToggleGroupControlOption
					value="OR"
					label={__('OR ( Whichever apply )', 'vk-blocks')}
				/>
				<ToggleGroupControlOption
					value="AND"
					label={__('AND ( All apply )', 'vk-blocks')}
				/>
			</ToggleGroupControl>

			{taxonomiesCheckBox}
			{termFormTokenFields}
			<BaseControl
				label={__('Filter by Date', 'vk-blocks')}
				id={`vk_postList-dateFilter`}
			>
				<SelectControl
					label={__('Period of Time', 'vk-blocks')}
					value={targetPeriod}
					onChange={(value) => setAttributes({ targetPeriod: value })}
					options={[
						{
							value: 'all',
							label: __('Whole Period', 'vk-blocks'),
						},
						{
							value: 'within-year',
							label: __('Within a year', 'vk-blocks'),
						},
						{
							value: 'from-today',
							label: __('From Today', 'vk-blocks'),
						},
						{
							value: 'from-now',
							label: __('From Now', 'vk-blocks'),
						},
						{
							value: 'from-tomorrow',
							label: __('From Tomorrow', 'vk-blocks'),
						},
					]}
				/>
				<p>
					{__(
						'* If you choose a future period, you will need to customize it so that future posts will be published immediately.',
						'vk-blocks'
					)}
				</p>
			</BaseControl>
			<hr />
			<h4 className={`mt-0 mb-2`}>
				{__('Exclusion settings', 'vk-blocks')}
			</h4>
			{excludedTaxonomiesCheckBox}
			{excludedTermFormTokenFields}
			<PostExclusionControl
				attributes={attributes}
				setAttributes={setAttributes}
				selectedPostTypes={isCheckedPostTypeData}
			/>
			<BaseControl>
				<CheckboxControl
					label={__('Ignore this post', 'vk-blocks')}
					checked={selfIgnore}
					onChange={(v) => setAttributes({ selfIgnore: v })}
				/>
			</BaseControl>
			<hr />
			<BaseControl
				label={__('Number of Posts', 'vk-blocks')}
				id={`vk_postList-numberPosts`}
			>
				<RangeControl
					value={numberPosts}
					onChange={(value) => setAttributes({ numberPosts: value })}
					min="1"
					max="100"
				/>
			</BaseControl>
			<BaseControl
				label={__('Order', 'vk-blocks')}
				id={`vk_postList-order`}
			>
				<SelectControl
					value={order}
					onChange={(v) => setAttributes({ order: v })}
					options={[
						{
							value: 'ASC',
							label: __('ASC', 'vk-blocks'),
						},
						{
							value: 'DESC',
							label: __('DESC', 'vk-blocks'),
						},
					]}
				/>
			</BaseControl>
			<BaseControl
				label={__('Order by', 'vk-blocks')}
				id={`vk_postList-orderBy`}
			>
				<SelectControl
					value={orderby}
					onChange={(v) => setAttributes({ orderby: v })}
					options={[
						{
							value: 'date',
							label: __('Published Date', 'vk-blocks'),
						},
						{
							value: 'modified',
							label: __('Modified Date', 'vk-blocks'),
						},
						{
							value: 'title',
							label: __('Title', 'vk-blocks'),
						},
						{
							value: 'rand',
							label: __('Random', 'vk-blocks'),
						},
					]}
				/>
			</BaseControl>
			<BaseControl
				label={__('offset', 'vk-blocks')}
				id={`vk_postList-offset`}
			>
				<TextControl
					value={offset}
					onChange={(v) =>
						setAttributes({
							offset: v === '' ? 0 : parseInt(v, 10),
						})
					}
					type="number"
					min="0"
				/>
			</BaseControl>
			<BaseControl>
				<CheckboxControl
					label={__(
						'Display from the first post always',
						'vk-blocks'
					)}
					checked={pagedlock}
					onChange={(v) => setAttributes({ pagedlock: v })}
					help={__(
						'Display from the first post even on pages beyond the second page.',
						'vk-blocks'
					)}
				/>
			</BaseControl>
			<BaseControl>
				<SelectControl
					label={__('Sticky Posts', 'vk-blocks')}
					value={stickyPosts}
					options={[
						{
							label: __('Include', 'vk-blocks'),
							value: 'include',
						},
						{
							label: __('Exclude', 'vk-blocks'),
							value: 'exclude',
						},
						{ label: __('Only', 'vk-blocks'), value: 'only' },
					]}
					onChange={(value) => {
						setAttributes({ stickyPosts: value });
						if (value === 'include') {
							setAttributes({ stickyPosts: false });
						}
					}}
					help={__(
						'Sticky posts always appear first, regardless of their publish date.',
						'vk-blocks'
					)}
				/>
			</BaseControl>
		</PanelBody>
	);
}
