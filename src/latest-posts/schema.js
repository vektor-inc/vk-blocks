export const schema = {
    layout: {
        type: 'string',
        default: 'image_1st',
    },
    // columnLg: {
    //   type: 'number',
    //   default: 3,
    // },
    numberPosts: {
        type: 'number',
        default: 3,
    },
    isCheckedPostType: {
        type: 'string',
        default: '[]'
    },
    coreTerms: {
        type: 'string',
        default: '[]'
    },
    isCheckedTerms: {
        type: 'string',
        default: '{}'
    }
};