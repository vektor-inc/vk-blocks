export const schema = {
    title: {
        type: 'string',
        source: 'html',
        selector: 'h1,h2,h3,h4,h5,h6',
        default: '',
    },
    subText: {
        type: 'string',
        source: 'html',
        selector: 'p',
        default: '',
    },
    titleColor: {
        type: 'string',
        default: '#000000',
    },
    subTextColor: {
        type: 'string',
        default: '#000000',
    },
    level: {
        type: 'number',
        default: 2,
    },
    align: {
        type: 'string',
    },
    placeholder: {
        type: 'string',
    }
};
