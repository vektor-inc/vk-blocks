export const schema = {
    title: {
        type: 'string',
        source: 'html',
        selector: 'h1,h2,h3,h4,h5,h6',
        default: '',
    },
    titleColor: {
        type: 'string',
        default: '#000000',
    },
		subText: {
        source: 'html',
        selector: 'p',
        default: '',
    },
    subTextColor: {
        type: 'string',
        default: '#000000',
    },
    titleSize: {
        type: 'number',
        default: 2.6,
    },
    titleMarginBottom: {
        type: 'number',
    },
    subTextSize: {
        type: 'number',
        default: 1.8,
    },
    level: {
        type: 'number',
        default: 2,
    },
		align: {
        type: 'string',
    },
    titleStyle: {
        type: 'string',
        default: 'default',
    },
		outerMarginBottom: {
        type: 'number',
    },
};
