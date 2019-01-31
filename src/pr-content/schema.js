export const schema = {
	title: {
		source: 'html',
			selector: '.vk_prContent_title',
	},
	titleColor: {
		type: 'string',
	},
	content: {
		source: 'html',
			selector: 'p',
	},
	contentColor: {
		type: 'string',
	},
	url: {
		type: 'string',
	default: null,
	},
	buttonType: {
		type: 'string',
	default: '1',
	},
	buttonColor: {
		type: 'string',
	default: 'blue',
	},
	buttonText: {
		source: 'html',
			selector: '.vk_prContent_btn_txt',
		default: '',
	},
	urlType: {
		type: 'string',
	default: '_blank',
	},
	Image: {
		type: 'string',
	default: null,
	},
	ImageBorderColor: {
		type: 'string',
	default: null,
	},
	layout: {
		type: 'string',
	default: 'left',
	},
	fontAwesomeIconBefore:{
		type: 'string',
	},
	fontAwesomeIconAfter:{
		type: 'string',
	}
};
