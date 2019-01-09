/**
 * Pr-Content block type
 *
 */
import "./import.js";
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
registerBlockType('vk-blocks/pr-content', {
    // Block name. Block names must be string that contains a namespace prefix. Example: my-plugin/my-custom-block.
    title: __('PR Content', 'vk-blocks'), // Block title.
    icon: BlockIcon, // Block icon from Dashicons → https://developer.wordpress.org/resource/dashicons/.
    category: 'vk-blocks-cat', // Block category — Group blocks together based on common traits E.g. common, formatting, layout widgets, embed.
    attributes: {
        title: {
            source: 'html',
            selector: 'h1',
        },
        titleColor: {
            type: 'string',
        },
        content: {
            source: 'html',
            selector: 'p',
        },
        contentColor: {
            type: 'string',
        },
        url: {
            type: 'string',
            default: null,
        },
        buttonType: {
            type: 'string',
            default: '1',
        },
        buttonColor: {
            type: 'string',
            default: 'blue',
        },
        buttonText: {
            source: 'html',
            selector: 'p',
        },
        urlType: {
            type: 'string',
            default: null,
        },
        Image: {
            type: 'string',
            default: null,
        },
        ImageBorderColor: {
            type: 'string',
            default: null,
        },
        layout: {
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
    edit: function ({attributes, className, setAttributes}) {
        const {
            title,
            titleColor,
            content,
            contentColor,
            url,
            buttonType,
            buttonColor,
            buttonText,
            urlType,
            Image,
            ImageBorderColor,
            layout,
        } = attributes;
        return (
            <Fragment>
                <InspectorControls>
                    <PanelBody title={__('Color Setting', 'vk-blocks')}>
                        <BaseControl label={__('Title Color', 'vk-blocks')}>
                            <ColorPalette
                                value={titleColor}
                                onChange={(value) => setAttributes({titleColor: value})}
                            />
                        </BaseControl>
                        <BaseControl label={__('Content Color', 'vk-blocks')}>
                            <ColorPalette
                                value={contentColor}
                                onChange={(value) => setAttributes({contentColor: value})}
                            />
                        </BaseControl>
                        <BaseControl label={__('Button Color', 'vk-blocks')}>
                            <ColorPalette
                                value={buttonColor}
                                onChange={(value) => setAttributes({buttonColor: value})}
                            />
                        </BaseControl>
                        <BaseControl
                            label={__('Image Border Color', 'vk-blocks')}
                        >
                            <ColorPalette
                                value={ImageBorderColor}
                                onChange={(value) => setAttributes({ImageBorderColor: value})}
                            />
                        </BaseControl>
                    </PanelBody>
                    <PanelBody title={__('Button Setting', 'vk-blocks')}>
                        <BaseControl
                            label={__('Button Url', 'vk-blocks')}
                        >
                            <TextControl
                                value={url}
                                onChange={(value) => setAttributes({url: value})}
                                placeholder={'https://vektor-inc.co.jp/'}
                            />
                        </BaseControl>
                        <BaseControl label={__('URL Type', 'vk-blocks')}>
                            <RadioControl
                                selected={urlType}
                                options={[
                                    {label: __('Open url in new window', 'vk-blocks'), value: '_blank'},
                                    {label: __('Open url in current window', 'vk-blocks'), value: '_self'}
                                ]}
                                onChange={(value) => setAttributes({urlType: value})}
                            />
                        </BaseControl>
                        <BaseControl label={__('Button Type', 'vk-blocks')}>
                            <RadioControl
                                selected={buttonType}
                                options={[
                                    {label: __('Solid', 'vk-blocks'), value: '1'},
                                    {label: __('Ghost', 'vk-blocks'), value: '0'}
                                ]}
                                onChange={(value) => setAttributes({buttonType: value})}
                            />

                        </BaseControl>
                        </PanelBody>
                    <PanelBody title={__('Layout Setting', 'vk-blocks')}>
                            <RadioControl
                                label={__('Layout Type', 'vk-blocks')}
                                selected={layout}
                                options={[
                                    {label: __('Right', 'vk-blocks'), value: 'right'},
                                    {label: __('Left', 'vk-blocks'), value: 'left'}
                                ]}
                                onChange={(value) => setAttributes({layout: value})}
                            />
                    </PanelBody>
                </InspectorControls>
            </Fragment>
        );
    },


    /**
     * The save function defin className }> which the different attributes should be combined
     * into the final markup, which is then serialized by Gutenberg into post_content.
     *
     * The " save" property must be specified and must be a valid function.
     *
     * @link https://wordpress.org/gutenberg/handbook/block-api/block-edit-save/
     */
    save({attributes, className}) {
        const {
            title,
            titleColor,
            content,
            contentColor,
            url,
            buttonType,
            buttonColor,
            buttonText,
            urlType,
            Image,
            layout,
        } = attributes;

        return (
            <div>
                {/*<div className={'vk_pr_content__icon'}>*/}
                    {/*{IconImage ?*/}
                        {/*<figure>*/}
                            {/*<img*/}
                                {/*className={'vk_pr_content__icon_image'}*/}
                                {/*src={IconImage}*/}
                                {/*alt=''*/}
                            {/*/>*/}
                            {/*<RichText.Content*/}
                {/*tagName=" figcaption"*/}
                                {/*className={'vk_pr_content__icon_name'}*/}
                                {/*value={pr_content_Name}*/}
                            {/*/>*/}
                        {/*</figure> : ''}*/}
                {/*</div>*/}
                {/*<RichText.Content*/}
                    {/*className={'vk_pr_content__content'}*/}
                    {/*style={{background: pr_content_BgColor, border: pr_content_BgColor}}*/}
                {/*tagName=" p"*/}
                    {/*value={content}*/}
                {/*/>*/}
            </div>
        );
    },
});
