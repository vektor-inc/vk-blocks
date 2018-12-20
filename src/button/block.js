/**
 * Button block type
 *
 */

const {__} = wp.i18n; // Import __() from wp.i18n
const {registerBlockType} = wp.blocks; // Import registerBlockType() from wp.blocks
const {RangeControl, RadioControl, PanelBody, Button, BaseControl, CheckboxControl, TextControl} = wp.components;
const {Fragment} = wp.element;
const {RichText, InspectorControls, MediaUpload, ColorPalette} = wp.editor;
const BlockIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="576" height="512" viewBox="0 0 576 512">
        <path d="M506,193.5v125H70v-125H506 M526.4,145.5H49.6c-15.2,0-27.6,12.4-27.6,27.6v165.8c0,15.2,12.4,27.6,27.6,27.6h476.8
		c15.2,0,27.6-12.4,27.6-27.6V173.1C554,157.9,541.6,145.5,526.4,145.5L526.4,145.5z"/>
    </svg>
);

/**
 * Register: a Gutenberg Block.
 *
 * Registers a new block provided a unique name and an object defining its
 * behavior. Once registered, the block is made editor as an option to any
 * editor interface where blocks are implemented.
 *
 * @link https://wordpress.org/gutenberg/handbook/block-api/
 * @param  {string}   name     Block name.
 * @param  {Object}   settings Block settings.
 * @return {?WPBlock}          The block, if it has been successfully
 *                             registered; otherwise `undefined`.
 */
registerBlockType('vk-blocks/button', {
    // Block name. Block names must be string that contains a namespace prefix. Example: my-plugin/my-custom-block.
    title: __('Button', 'vk-blocks'), // Block title.
    icon: BlockIcon, // Block icon from Dashicons → https://developer.wordpress.org/resource/dashicons/.
    category: 'vk-blocks-cat', // Block category — Group blocks together based on common traits E.g. common, formatting, layout widgets, embed.
    attributes: {
        content: {
            source: 'html',
            selector: 'p',
        },
        buttonUrl: {
            type: 'string',
            default: null,
        },
        buttonSize: {
            type: 'string',
            default: 'lg',
        },
        buttonType: {
            type: 'string',
            default: '0',
        },
        buttonColor: {
            type: 'string',
            default: 'primary',
        },
        buttonColorCustom: {
            type: 'string',
            default: null,
        },
        buttonAlign: {
            type: 'string',
            default: 'left',
        }
    },

    /**
     * The edit function describes the structure of your block in the context of the editor.
     * This represents what the editor will render when the block is used.
     *
     * The "edit" property must be a valid function.
     *
     * @link https://wordpress.org/gutenberg/handbook/block-api/block-edit-save/
     */
    edit({attributes, className, setAttributes}) {
        const {
            content,
            buttonUrl,
            buttonSize,
            buttonType,
            buttonColor,
            buttonColorCustom,
            buttonAlign,
        } = attributes;

        return (
            <Fragment>
                <InspectorControls>
                    <PanelBody title={__('Button setting', 'vk-blocks')}>
                        <BaseControl
                            label={__('Link URL:', 'vk-blocks')}
                        >
                            <TextControl
                                value={buttonUrl}
                                onChange={(value) => setAttributes({buttonUrl: value})}
                            />
                        </BaseControl>
                        <RadioControl
                            label={__('Button Size:', 'vk-blocks')}
                            selected={buttonSize}
                            options={[
                                {label: __('Large', 'vk-blocks'), value: 'lg'},
                                {label: __('normal', 'vk-blocks'), value: 'md'},
                                {label: __('Small', 'vk-blocks'), value: 'sm'},
                            ]}
                            onChange={(value) => setAttributes({buttonSize: value})}
                        />
                        <RadioControl
                            label={__('Button Position:', 'vk-blocks')}
                            selected={buttonAlign}
                            options={[
                                {label: __('Left', 'vk-blocks'), value: 'left'},
                                {label: __('Center', 'vk-blocks'), value: 'center'},
                                {label: __('Right', 'vk-blocks'), value: 'right'},
                                {label: __('Block', 'vk-blocks'), value: 'block'},
                            ]}
                            onChange={(value) => setAttributes({buttonAlign: value})}
                        />
                        <RadioControl
                            label={__('Button Style:', 'vk-blocks')}
                            selected={buttonType}
                            options={[
                                {label: __('Solid color', 'vk-blocks'), value: '0'},
                                {label: __('No background', 'vk-blocks'), value: '1'},
                            ]}
                            help={__('If you select "No background", that you need to select a Custom Color.', 'vk-blocks')}
                            onChange={(value) => setAttributes({buttonType: value})}
                        />
                        <RadioControl
                            label={__('Default Color:', 'vk-blocks')}
                            selected={buttonColor}
                            options={[
                                {label: __('Primary', 'vk-blocks'), value: 'primary'},
                                {label: __('Secondary', 'vk-blocks'), value: 'secondary'},
                                {label: __('Success', 'vk-blocks'), value: 'success'},
                                {label: __('Info', 'vk-blocks'), value: 'info'},
                                {label: __('Warning', 'vk-blocks'), value: 'warning'},
                                {label: __('Danger', 'vk-blocks'), value: 'danger'},
                                {label: __('Light', 'vk-blocks'), value: 'light'},
                                {label: __('Dark', 'vk-blocks'), value: 'dark'},
                            ]}
                            onChange={(value) => setAttributes({buttonColor: value})}
                        />
                        <BaseControl
                            label={__('Custom Color:', 'vk-blocks')}
                            help={__('This custom color overrides the default color. If you want to use the default color, click the clear button.', 'vk-blocks')}
                        >
                            <ColorPalette
                                value={buttonColorCustom}
                                onChange={(value) => setAttributes({buttonColorCustom: value})}
                            />
                        </BaseControl>
                    </PanelBody>
                </InspectorControls>
                <div className={buttonColorCustom ? 'vk_button vk_button-colorCustom' : 'vk_button'}>
                    {(() => {
                        if (buttonColorCustom && buttonType === '0') {
                            return <div className={'custom-btn'}>
                                <button type="button"
                                        className={`btn btn-primary btn-${buttonSize} btn-${buttonAlign}`}
                                        style={{
                                            backgroundColor: buttonColorCustom,
                                            border: `1px solid ${buttonColorCustom}`
                                        }}>
                                    <RichText
                                        tagName="p"
                                        className={'vk_button_content'}
                                        onChange={(value) => setAttributes({content: value})}
                                        value={content}
                                        placeholder={__('Input text', 'vk-blocks')}
                                    />
                                </button>
                            </div>;
                        } else if (buttonColorCustom && buttonType === '1') {
                            return <div className={'custom-btn'}>
                                <button type="button"
                                        className={`btn btn-${buttonSize} btn-${buttonAlign}`}
                                        style={{
                                            backgroundColor: 'transparent',
                                            border: '1px solid' + buttonColorCustom,
                                            color: buttonColorCustom
                                        }}
                                >
                                    <RichText
                                        tagName="p"
                                        className={'vk_button_content'}
                                        onChange={(value) => setAttributes({content: value})}
                                        value={content}
                                        placeholder={__('Input text', 'vk-blocks')}
                                    />
                                </button>
                            </div>;
                        } else if (!buttonColorCustom && buttonType === '0') {
                            return <div>
                                <button type="button"
                                        className={`btn btn-${buttonSize} btn-${buttonAlign} btn-${buttonColor}`}>
                                    <RichText
                                        tagName="p"
                                        className={'vk_button_content'}
                                        onChange={(value) => setAttributes({content: value})}
                                        value={content}
                                        placeholder={__('Input text', 'vk-blocks')}
                                    />
                                </button>
                            </div>;
                        } else if (!buttonColorCustom && buttonType === '1') {
                            return <div>
                                <button type="button"
                                        className={`btn btn-${buttonSize} btn-${buttonAlign} btn-outline-${buttonColor}`}
                                        style={{backgroundColor: +'transparent'}}
                                >
                                    <RichText
                                        tagName="p"
                                        className={'vk_button_content'}
                                        onChange={(value) => setAttributes({content: value})}
                                        value={content}
                                        placeholder={__('Input text', 'vk-blocks')}
                                    />
                                </button>
                            </div>;
                        }
                    })()}
                </div>
            </Fragment>
        );
    },

    /**
     * The save function defin className }> which the different attributes should be combined
     * into the final markup, which is then serialized by Gutenberg into post_content.
     *
     * The "save" property must be specified and must be a valid function.
     *
     * @link https://wordpress.org/gutenberg/handbook/block-api/block-edit-save/
     */
    save({attributes, className}) {
        const {
            content,
            buttonUrl,
            buttonSize,
            buttonType,
            buttonColor,
            buttonColorCustom,
            buttonAlign,
        } = attributes;

        return (
            <div className={buttonColorCustom ? 'vk_button vk_button-colorCustom' : 'vk_button'}>
                {(() => {
                    if (buttonColorCustom && buttonType === '0') {
                        return <button type="button"
                                       className={`btn btn-primary custom-btn btn-${buttonSize} btn-${buttonAlign}`}
                                       style={{
                                           backgroundColor: buttonColorCustom,
                                           border: `1px solid ${buttonColorCustom}`
                                       }}
                                       onClick={`window.open("${buttonUrl}")`}
                        >
                            <RichText.Content
                                tagName="p"
                                className={'vk_button_content'}
                                value={content}
                            />
                        </button>;
                    } else if (buttonColorCustom && buttonType === '1') {
                        return <button type="button"
                                       className={`btn custom-btn btn-${buttonSize} btn-${buttonAlign}`}
                                       style={{
                                           backgroundColor: 'transparent',
                                           border: '1px solid' + buttonColorCustom,
                                           color: buttonColorCustom
                                       }}
                                       onClick={`window.open("${buttonUrl}")`}
                        >
                            <RichText.Content
                                tagName="p"
                                className={'vk_button_content'}
                                value={content}
                            />
                        </button>;
                    } else if (!buttonColorCustom && buttonType === '0') {
                        return <button type="button"
                                       className={`btn btn-${buttonSize} btn-${buttonAlign} btn-${buttonColor}`}
                                       onClick={`window.open("${buttonUrl}")`}
                        >
                            <RichText.Content
                                tagName="p"
                                className={'vk_button_content'}
                                value={content}
                            />
                        </button>;
                    } else if (!buttonColorCustom && buttonType === '1') {
                        return <button type="button"
                                       className={`btn btn-${buttonSize} btn-${buttonAlign} btn-outline-${buttonColor}`}
                                       style={{backgroundColor: +'transparent'}}
                                       onClick={`window.open("${buttonUrl}")`}
                        >
                            <RichText.Content
                                tagName="p"
                                className={'vk_button_content'}
                                value={content}
                            />
                        </button>;
                    }
                })()}
            </div>
        );
    },
});
