import { save as save1_130_1, migrate as migrate1_130_1 } from './1.130.1/save';

// 1.130.1 以前: iframe の HTML を iframeCode と本文の両方に保存していた（静的ブロック）。
// legacyPreview は保存済みプレビューの HTML（KSES で空になったものは空文字）を読むための属性。
const blockAttributes = {
	iframeCode: {
		type: 'string',
		default:
			'<iframe src="https://www.google.com/maps/embed?pb=!1m0!3m2!1sen!2sus!4v1609459543842!5m2!1sen!2sus" width="100%" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>',
	},
	iframeWidth: {
		type: 'string',
		default: '100%',
	},
	iframeHeight: {
		type: 'string',
		default: '450px',
	},
	legacyPreview: {
		type: 'string',
		source: 'html',
		selector: '.vk-visual-embed-preview',
	},
};

// 1.130.1 時点の supports。deprecated に supports を書かないとブロックエディターのフックが
// align 属性を足さず、旧ブロックの配置（align）が className 側へ移って失われる。
const blockSupports = {
	html: false,
	className: true,
	align: ['left', 'center', 'right', 'wide', 'full'],
};

const deprecated = [
	{
		attributes: blockAttributes,
		supports: blockSupports,
		migrate: migrate1_130_1,
		save: save1_130_1,
	},
];

export default deprecated;
