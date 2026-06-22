import { save as save1_79_0, migrate as migrate1_79_0 } from './1.79.0/save';

const blockAttributes = {
	style: {
		type: 'string',
		default: 'info',
	},
	content: {
		type: 'string',
		source: 'html',
		selector: 'p',
	},
};

/*
// v1.80.0 アイコン設定の追加に伴う属性の追加
const blockAttributes2 = {
	...blockAttributes,
	icon: {
		type: 'string',
		default: '',
	},
	iconText: {
		type: 'string',
		default: '',
	},
	// v1.105.0 モバイルアイコン位置設定の追加に伴う属性の追加
	mobileIconPosition: {
		type: 'string',
		default: 'left',
	},
}
*/

const deprecated = [
	{
		attributes: blockAttributes,
		migrate: migrate1_79_0,
		save: save1_79_0,
	},
];
export default deprecated;
