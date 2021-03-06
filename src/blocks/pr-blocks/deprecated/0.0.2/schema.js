export default function setAttributes(number) {
	const attributes = {};

	for (let i = 1; i <= number; i++) {
		attributes['heading' + i] = {
			type: 'string',
			source: 'html',
			selector: 'h3.vk_prBlocks_item_title-' + i,
		};
		attributes['content' + i] = {
			type: 'string',
			source: 'html',
			selector: 'p.vk_prBlocks_item_summary-' + i,
		};
		attributes['url' + i] = {
			type: 'string',
			default: null,
		};
		attributes['urlOpenType' + i] = {
			type: 'Boolean',
			default: false,
		};
		attributes['icon' + i] = {
			type: 'string',
			default: 'fas fa-file',
		};
		attributes['color' + i] = {
			type: 'string',
			default: '#0693e3',
		};
		attributes['bgType' + i] = {
			type: 'string',
			default: '0',
		};
		attributes['insertImage' + i] = {
			type: 'string',
			default: null,
		};
	}

	return attributes;
}
