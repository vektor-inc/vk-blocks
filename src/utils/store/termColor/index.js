/**
 * WordPress dependencies
 */
import { createReduxStore, register } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

const DEFAULT_STATE = {};

const store = createReduxStore('vk-blocks/term-color', {
	reducer(state = DEFAULT_STATE, action) {
		switch (action.type) {
			case 'SET_TERM_COLORS':
				return {
					...state,
					[action.postId]: {
						...(state[action.postId] || {}),
						[action.taxonomy]: {
							values: action.values, // termIdごとの色情報
							isLoading: false,
						},
					},
				};
			case 'SET_IS_LOADING':
				const currentTaxonomyState =
					state[action.postId]?.[action.taxonomy] || {};
				return {
					...state,
					[action.postId]: {
						...(state[action.postId] || {}),
						[action.taxonomy]: {
							...currentTaxonomyState,
							isLoading: action.isLoading,
						},
					},
				};
		}
		return state;
	},

	actions: {
		/**
		 * Action that sets the color for terms within a post's taxonomy.
		 *
		 * @param {Object} payload          The action payload containing the terms color information.
		 * @param {number} payload.postId   The ID of the post.
		 * @param {string} payload.taxonomy The taxonomy to which the terms belong.
		 * @param {Object} payload.values   An object containing term IDs as keys and color information as values.
		 * @return {Object} Action object.
		 */
		setTermColors(payload) {
			return {
				type: 'SET_TERM_COLORS',
				...payload,
			};
		},

		/**
		 * Action that sets the loading state for a specific taxonomy within a post.
		 *
		 * @param {Object}  payload           The action payload containing the loading state information.
		 * @param {number}  payload.postId    The ID of the post.
		 * @param {string}  payload.taxonomy  The taxonomy to which the terms belong.
		 * @param {boolean} payload.isLoading The loading state to set (true or false).
		 * @return {Object} Action object.
		 */
		setIsLoading(payload) {
			return {
				type: 'SET_IS_LOADING',
				...payload,
			};
		},
	},

	selectors: {
		/**
		 * Retrieves color information for terms within a given post and taxonomy.
		 * Always returns termID-based color information, regardless of display count.
		 *
		 * @param {Object} state                             Current state of the store.
		 * @param {number} postId                            Post ID to retrieve color information for.
		 * @param {string} [taxonomy='__VK_TAXONOMY_AUTO__'] Optional taxonomy name.
		 * @return {Object} Term colors object and loading state.
		 */
		getTermColors(state, postId, taxonomy = '__VK_TAXONOMY_AUTO__') {
			const postInfo = state[postId];
			if (!postInfo || !postInfo[taxonomy]?.values) {
				return {
					values: {},
					isLoading: true,
				};
			}
			return {
				values: postInfo[taxonomy].values,
				isLoading: postInfo[taxonomy].isLoading,
			};
		},
	},

	resolvers: {
		/**
		 * Fetches and sets term color information for a post, with an optional specified taxonomy.
		 * Always fetches all terms and stores them by termID for consistent access.
		 *
		 * @param {number} postId                            Post ID for retrieving term color information.
		 * @param {string} [taxonomy='__VK_TAXONOMY_AUTO__'] Optional taxonomy name.
		 * @return {Function} Thunk action for updating store with term color information and loading state.
		 */
		getTermColors(postId, taxonomy = '__VK_TAXONOMY_AUTO__') {
			return async ({ dispatch }) => {
				const setLoadingState = (isLoading) =>
					dispatch.setIsLoading({ postId, taxonomy, isLoading });

				setLoadingState(true);

				try {
					const fetchData = { post_id: postId };
					if ('__VK_TAXONOMY_AUTO__' !== taxonomy) {
						fetchData.taxonomy = taxonomy;
					}

					const res = await apiFetch({
						path: 'vk-blocks/v1/get_post_multiple_terms_info',
						method: 'POST',
						data: fetchData,
					});

					// termIdごとに整形
					const values = res.reduce((acc, term) => {
						acc[term.term_id] = term;
						return acc;
					}, {});

					dispatch.setTermColors({ postId, taxonomy, values });
				} catch (error) {
					// APIエラーが発生した場合は空の結果を設定
					dispatch.setTermColors({ postId, taxonomy, values: {} });
				} finally {
					setLoadingState(false);
				}
			};
		},
	},
});

register(store);
