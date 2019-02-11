const {__} = wp.i18n; // Import __() from wp.i18n
wp.domReady( function() {
    wp.blocks.registerBlockStyle('core/heading',
        [
            {name: 'vk_heading-regular', label: __('Regular', 'vk-blocks'), isDefault: true},
            {name: 'vk_heading-style-plain', label: __('Plain', 'vk-blocks')},
            {name: 'vk_heading-style-plainNoMargin', label: __('Plain (No margin)', 'vk-blocks')},
            {name: 'vk_heading-style-borderBottomSolidNormal', label: __('Border bottom', 'vk-blocks')},
						{name: 'vk_heading-style-borderBottomSolidHeavy', label: __('Border bottom heavy', 'vk-blocks')},

        ],
    );
} );
