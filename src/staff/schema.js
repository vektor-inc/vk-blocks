export const schema = {
    vk_staff_text_name: {
        type: 'string',
        source: 'html',
        selector: 'h2',
    },
    vk_staff_text_caption: {
        type: 'string',
        source: 'html',
        selector: 'p.vk_staff_text_caption',
    },
    vk_staff_text_position: {
        type: 'string',
        source: 'html',
        selector: 'p.vk_staff_text_position',
    },
    vk_staff_text_profileTitle: {
        type: 'string',
        source: 'html',
        selector: 'h3',
    },
    vk_staff_text_profileText: {
        type: 'string',
        source: 'html',
        selector: 'p.vk_staff_text_profileText',
    },
    vk_staff_photo_image: {
        type: 'string',
        default: '',
    },
    vk_staff_photo_image_alt: {
        type: 'string',
        default: 'Profile Picture',
    },
    vk_staff_layout: {
        type: 'string',
        default: 'default',
    }
};
