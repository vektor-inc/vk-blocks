export const schema = {
    layout: {
        type: 'string',
        default: 'image_1st',
    },
    numberPosts: {
        type: 'number',
        default: 3,
    },
    // isChecked:{
    //     type: 'boolean',
    //     default:true,
    // }
    isChecked:{
        type: 'array',
        default:[true]
    }
};

