import { useSelect } from '@wordpress/data';

export const usePostTypes = () => {
	return useSelect((select) => {
		return select('core').getPostTypes({ per_page: -1 }) || [];
	}, []);
};

export const usePostType = (postType) => {
	return useSelect(
		(select) => {
			return select('core').getPostType(postType) || {};
		},
		[postType]
	);
};

export const useTaxonomies = () => {
	return useSelect((select) => {
		return select('core').getTaxonomies({ per_page: -1 }) || [];
	}, []);
};

export const usePostTypeTaxonomies = (postType) => {
	return useSelect(
		(select) => {
			return (select('core').getTaxonomies() || []).filter((taxonomy) => {
				const postTypeTaxonomies = postType.taxonomies || [];
				return postTypeTaxonomies.includes(taxonomy.slug);
			});
		},
		[postType]
	);
};

export const useTermsGroupbyTaxnomy = (taxonomies) => {
	return useSelect(
		(select) => {
			const obj = {};
			for (const taxonomy of taxonomies) {
				obj[taxonomy.rest_base] =
					select('core').getEntityRecords('taxonomy', taxonomy.slug, {
						per_page: -1,
					}) || [];
			}
			return obj;
		},
		[taxonomies]
	);
};

export const usePosts = (postType, query) => {
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

export const useCurrentPostId = () => {
	return useSelect((select) => {
		return select('core/editor').getCurrentPostId();
	});
};

export const useCurrentPostType = () => {
	return useSelect((select) => {
		return select('core/editor').getCurrentPostType();
	});
};

export const useCurrentBlocks = () => {
	return useSelect((select) => {
		return select('core/block-editor').getBlocks();
	});
};

export const useBlocksByName = (blockName) =>
	// eslint-disable-next-line no-shadow
	useSelect((select) => {
		const { getBlocks } = select('core/block-editor');
		return getBlocks().filter((block) => block.name === blockName);
	}, []);
