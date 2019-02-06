const {__} = wp.i18n; // Import __() from wp.i18n
wp.domReady( function() {
    wp.blocks.registerBlockStyle('core/heading',
        [
            {name: 'vk_heading-regular', label: __('Regular', 'vk-blocks'), isDefault: true},
            {name: 'vk_heading-stripes', label: __('Stripes', 'vk-blocks')},
        ],
    );
} );