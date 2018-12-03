/**
 * Flow block type
 *
 */
const {__} = wp.i18n; // Import __() from wp.i18n
const {registerBlockType} = wp.blocks; // Import registerBlockType() from wp.blocks
const {RangeControl, RadioControl, PanelBody, Button, BaseControl, CheckboxControl, TextControl} = wp.components;
const {Fragment} = wp.element;
const {RichText, InspectorControls, MediaUpload, ColorPalette} = wp.editor;
const BlockIcon = 'arrow-down';

/**
 * Register: aa Gutenberg Block.
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
registerBlockType('vk-blocks/pr', {
    // Block name. Block names must be string that contains a namespace prefix. Example: my-plugin/my-custom-block.
    title: __('PR Block', 'vk-blocks'), // Block title.
    icon: BlockIcon, // Block icon from Dashicons → https://developer.wordpress.org/resource/dashicons/.
    category: 'vk-blocks-cat', // Block category — Group blocks together based on common traits E.g. common, formatting, layout widgets, embed.
    attributes: {
        heading: {
            type: 'string',
            source: 'html',
            selector: 'h1',
        },
        content: {
            type: 'string',
            source: 'html',
            selector: 'p',
        },
        url: {
            type: 'string',
            default: null,
        },
        urlOpenType: {
            type: 'Boolean',
            default: false,
        },
        icon: {
            type: 'string',
            default: 'fa-file',
        },
        color: {
            type: 'string',
            default: '#0693e3',
        },
        bgType: {
            type: 'string',
            default: '0',
        },
        insertImage: {
            type: 'string',
            default: null,
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
    edit({attributes, setAttributes}) {
        const {
            heading,
            content,
            url,
            urlOpenType,
            icon,
            color,
            bgType,
            insertImage
        } = attributes;

        return [
            <Fragment>
                <InspectorControls>
                    <PanelBody title={__('PR Block1 Setting', 'vk-blocks')}>
                        <BaseControl
                            label={__('Link URL:', 'vk-blocks')}
                        >
                            <TextControl
                                value={url}
                                onChange={(value) => setAttributes({url: value})}
                            />
                            <CheckboxControl
                                label={__('Open link new tab.', 'vk-blocks')}
                                checked={urlOpenType}
                                onChange={(checked) => setAttributes({urlOpenType: checked})}
                            />
                        </BaseControl>
                        <BaseControl
                            label={__('Icon 1', 'vk-blocks')}
                        >
                            <TextControl
                                label={__('Class name of the icon font you want to use:', 'vk-blocks')}
                                value={icon}
                                onChange={(value) => setAttributes({icon: value})}
                                placeholder={__('fa-file', 'vk-blocks')}
                            />
                            <ColorPalette
                                value={color}
                                onChange={(value) => setAttributes({color: value})}
                            />
                            <RadioControl
                                label={__('Icon Background:', 'vk-blocks')}
                                selected={bgType}
                                options={[
                                    {label: __('Solid color', 'vk-blocks'), value: '0'},
                                    {label: __('No background', 'vk-blocks'), value: '1'},
                                ]}
                                onChange={(value) => setAttributes({bgType: value})}
                            />
                        </BaseControl>
                        <BaseControl
                            label={__('PR Image 1', 'vk-blocks')}
                            help={__('When you have an image. Image is displayed with priority', 'vk-blocks')}
                        >
                            <MediaUpload
                                onSelect={(value) => setAttributes({insertImage: value.url})}
                                type="image"
                                value={insertImage}
                                render={({open}) => (
                                    <Button
                                        onClick={open}
                                        className={insertImage ? 'image-button' : 'button button-large'}
                                    >
                                        {!insertImage ? __('Select image', 'vk-blocks') :
                                            <img className={'icon-image'} src={insertImage}
                                                 alt={__('Upload image', 'vk-blocks')}/>}
                                    </Button>
                                )}
                            />
                        </BaseControl>
                    </PanelBody>
                </InspectorControls>
                <article className="veu_prBlocks prBlocks row">
                    <div className="prBlock col-sm-4">
                        {(() => {

                            if (insertImage) {

                                return <div className="prBlock_image"
                                            style={{
                                                backgroundImage: 'url(' + insertImage + ')',
                                                backgroundRepeat: 'no-repeat 50% center',
                                                backgroundSize: 'cover'
                                            }}
                                >
                                    <img
                                        src={insertImage}
                                        alt=''
                                    />
                                </div>

                            } else {

                                if (bgType === '0') {
                                    return <div
                                        className="prBlock_icon_outer"
                                        style={{
                                            backgroundColor: color,
                                            border: `1px solid ${color}`
                                        }}
                                    ><i className={`fa fas fab far ${icon} font_icon prBlock_icon`}
                                        style={{color: '#fff'}}>
                                    </i>
                                    </div>
                                } else {
                                    return <div
                                        className="prBlock_icon_outer"
                                        style={{backgroundColor: 'transparent', border: '1px solid' + color}}
                                    ><i className={`fa fas fab far ${icon} font_icon prBlock_icon`}
                                        style={{color: color}}>
                                    </i>
                                    </div>
                                }
                            }
                        })()}
                        <RichText
                            className="prBlock_title"
                            tagName="h1"
                            onChange={(value) => setAttributes({heading: value})}
                            value={heading}
                            placeholder={__('Input title', 'vk-blocks')}
                        />
                        <RichText
                            className="prBlock_summary"
                            tagName="p"
                            onChange={(value) => setAttributes({content: value})}
                            value={content}
                            placeholder={__('Input content', 'vk-blocks')}
                        />
                        {/*</a>*/}
                    </div>
                </article>
            </Fragment>
        ];
    },

    /**
     * The save function defin className }> which the different attributes should be combined
     * into the final markup, which is then serialized by Gutenberg into post_content.
     *
     * The "save" property must be specified and must be a valid function.
     *
     * @link https://wordpress.org/gutenberg/handbook/block-api/block-edit-save/
     */
    save({attributes}) {
        const {
            heading,
            content,
            url,
            urlOpenType,
            icon,
            color,
            bgType,
            insertImage
        } = attributes;

        return (
            <article className="veu_prBlocks prBlocks row">
                <div className="prBlock col-sm-4">
                    <a
                        href={url}
                        target={urlOpenType? '_blank':'_self'}
                    >
                        {(() => {

                            if (insertImage) {

                                return <div className="prBlock_image"
                                            style={{
                                                backgroundImage: 'url(' + insertImage + ')',
                                                backgroundRepeat: 'no-repeat 50% center',
                                                backgroundSize: 'cover'
                                            }}
                                >
                                    <img
                                        src={insertImage}
                                        alt=''
                                    />
                                </div>

                            } else {

                                if (bgType === '0') {
                                    return <div
                                        className="prBlock_icon_outer"
                                        style={{
                                            backgroundColor: color,
                                            border: `1px solid ${color}`
                                        }}
                                    ><i className={`fa fas fab far ${icon} font_icon prBlock_icon`}
                                        style={{color: '#fff'}}>
                                    </i>
                                    </div>
                                } else {
                                    return <div
                                        className="prBlock_icon_outer"
                                        style={{backgroundColor: 'transparent', border: '1px solid' + color}}
                                    ><i className={`fa fas fab far ${icon} font_icon prBlock_icon`}
                                        style={{color: color}}>
                                    </i>
                                    </div>
                                }
                            }
                        })()}
                        <RichText.Content
                            className="prBlock_title"
                            tagName={'h1'}
                            value={heading}/>
                        <RichText.Content
                            className="prBlock_summary"
                            tagName={'p'}
                            value={content}/>
                    </a>
                </div>
            </article>
        );
    },
});