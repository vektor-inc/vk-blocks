import { select } from '@wordpress/data';

export const isParentReusableBlock = (clientId) => {
	const blockEditor = select('core/block-editor');
	const parents = blockEditor?.getBlockParentsByBlockName?.(clientId, [
		'core/block',
		'core/template-part',
	]);
	return Array.isArray(parents) && parents.length ? true : false;
};
