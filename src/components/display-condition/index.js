import { __, sprintf } from '@wordpress/i18n';
import {
	RangeControl,
	PanelBody,
	BaseControl,
	SelectControl,
	CheckboxControl,
	ButtonGroup,
	Button,
	TextControl,
	FormTokenField,
} from '@wordpress/components';
import { useState, useEffect, useMemo } from '@wordpress/element';
// Load VK Blocks Utils
import { useTaxonomies } from '@vkblocks/utils/hooks';
import { fixBrokenUnicode } from '@vkblocks/utils/depModules';

// Load VK Blocks Compornents
import { AdvancedCheckboxControl } from '@vkblocks/components/advanced-checkbox-control';

export function DisplayCondition(props) {
	const { attributes, setAttributes, postTypesProps, termsByTaxonomyName } =
		props;
	const {
		numberPosts,
		isCheckedPostType,
		taxQueryRelation,
		isCheckedTerms,
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

	const saveStatePostTypes = (slug) => {
		let newPostTypeData = [...isCheckedPostTypeData];
		let newTermsData = [...isCheckedTermsData];
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
				});
			});
		}
		setIsCheckedPostTypeData(newPostTypeData);
		setIsCheckedTermsData(newTermsData);
		setAttributes({
			isCheckedPostType: JSON.stringify(newPostTypeData),
			isCheckedTerms: JSON.stringify(newTermsData),
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

	const termFormTokenFields = filteredTaxonomies
		.filter((taxonomy) => {
			return !taxonomy.hierarchical && termsByTaxonomyName[taxonomy.slug];
		})
		.map((taxonomy) => {
			const termsMapByName = termsByTaxonomyName[taxonomy.slug].reduce(
				(acc, term) => {
					return {
						...acc,
						[term.name]: term,
					};
				},
				{}
			);

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
					label={sprintf(
						// translators: Filter by %s
						__('Filter by %s', 'vk-blocks'),
						taxonomy.labels.name
					)}
					value={isCheckedTermsData
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
						const replacedIsCheckedTermsData =
							replaceIsCheckedTermData(
								taxonomy.slug,
								isCheckedTermsData,
								termIds
							);
						setIsCheckedTermsData(replacedIsCheckedTermsData);
						setAttributes({
							isCheckedTerms: JSON.stringify(
								replacedIsCheckedTermsData
							),
						});
					}}
				></FormTokenField>
			) : null;
		}, taxonomies);

	// taxonomiesCheckBox ////////////////////////////////////////////////////////
	// key を BaseControlのlabelに代入。valueの配列をmapでAdvancedCheckboxControlに渡す
	const taxonomiesCheckBox = filteredTaxonomies
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
					label={sprintf(
						// translators: Filter by %s
						__('Filter by %s', 'vk-blocks'),
						taxonomy.labels.name
					)}
					id={`vk_postList-terms`}
					key={index}
				>
					<AdvancedCheckboxControl
						schema={'isCheckedTerms'}
						rawData={taxonomiesProps}
						checkedData={isCheckedTermsData}
						saveState={saveStateTerms}
						removeState={removeStateTerms} // チェック解除時の処理を追加
						{...props}
					/>
				</BaseControl>
			);
		}, termsByTaxonomyName);

	// `offset`が空の場合に0に設定する
	useEffect(() => {
		if (offset === undefined || offset === null || offset === '') {
			setAttributes({ offset: 0 });
		}
	}, [offset]);

	useEffect(() => {
		setAttributes({
			isCheckedPostType: JSON.stringify(isCheckedPostTypeData),
			isCheckedTerms: JSON.stringify(isCheckedTermsData),
		});
	}, [isCheckedPostTypeData, isCheckedTermsData]);

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
			<ButtonGroup className={`mb-3`}>
				<Button
					isSmall
					isPrimary={taxQueryRelation === 'OR'}
					isSecondary={taxQueryRelation !== 'OR'}
					onClick={() => setAttributes({ taxQueryRelation: 'OR' })}
				>
					{__('OR ( Whichever apply )', 'vk-blocks')}
				</Button>
				<Button
					isSmall
					isPrimary={taxQueryRelation === 'AND'}
					isSecondary={taxQueryRelation !== 'AND'}
					onClick={() => setAttributes({ taxQueryRelation: 'AND' })}
				>
					{__('AND ( All apply )', 'vk-blocks')}
				</Button>
			</ButtonGroup>
			{taxonomiesCheckBox}
			{termFormTokenFields}
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
							label: __('Modefied Date', 'vk-blocks'),
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
				<CheckboxControl
					label={__('Ignore this post', 'vk-blocks')}
					checked={selfIgnore}
					onChange={(v) => setAttributes({ selfIgnore: v })}
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
