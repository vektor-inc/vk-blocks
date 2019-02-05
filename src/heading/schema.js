export const schema = {
    content: {
        type: 'string',
        source: 'html',
        selector: 'h1,h2,h3,h4,h5,h6',
        default: '',
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
    },
};
