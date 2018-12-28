/**
 * Pr-Content block type
 *
 */
const {__} = wp.i18n; // Import __() from wp.i18n
const {registerBlockType} = wp.blocks; // Import registerBlockType() from wp.blocks
const {RangeControl, RadioControl, PanelBody, Button, BaseControl, CheckboxControl, TextControl} = wp.components;
const {Fragment} = wp.element;
const {RichText, InspectorControls, MediaUpload, ColorPalette} = wp.editor;
const BlockIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="576" height="512" viewBox="0 0 576 512">
        <path
            d="M544 450.583c0 22.75 13.014 42.454 32 52.092v7.969c-5.313 0.727-10.736 1.112-16.25 1.112-34.004 0-64.674-14.264-86.361-37.132-13.111 3.491-27.001 5.376-41.389 5.376-79.529 0-144-57.308-144-128s64.471-128 144-128c79.529 0 144 57.308 144 128 0 27.674-9.882 53.296-26.678 74.233-3.412 7.412-5.322 15.656-5.322 24.35zM115.339 110.593c-33.107 26.899-51.339 61.492-51.339 97.407 0 20.149 5.594 39.689 16.626 58.075 11.376 18.96 28.491 36.293 49.494 50.126 15.178 9.996 25.39 25.974 28.088 43.947 0.9 5.992 1.464 12.044 1.685 18.062 3.735-3.097 7.375-6.423 10.94-9.988 12.077-12.076 28.39-18.745 45.251-18.745 2.684 0 5.381 0.168 8.078 0.512 10.474 1.331 21.172 2.008 31.797 2.010v64c-13.564-0.001-26.877-0.869-39.871-2.521-54.989 54.989-120.625 64.85-184.088 66.298v-13.458c34.268-16.789 64-47.37 64-82.318 0-4.877-0.379-9.665-1.082-14.348-57.898-38.132-94.918-96.377-94.918-161.652 0-114.875 114.615-208 256-208 139.229 0 252.496 90.307 255.918 202.76-20.548-9.158-42.92-14.711-66.131-16.289-5.765-28.034-22.701-54.408-49.126-75.878-17.661-14.349-38.458-25.695-61.814-33.722-24.853-8.54-51.38-12.871-78.847-12.871s-53.994 4.331-78.847 12.871c-23.356 8.027-44.153 19.372-61.814 33.722z"/>
    </svg>
);

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
            default: '0',
        },
        buttonColor: {
            type: 'string',
            default: 'blue',
        },
        buttonText: {
            type: 'string',
            default: null,
        },
        urlType: {
            type: 'string',
            default: null,
        },
        Image: {
            type: 'string',
            default: null,
        },
        layout: {
            type: 'string',
            default: null,
        },
        bgColor: {
            type: 'string',
            default: null,
        },
        bgImage: {
            type: 'string',
            default: null,
        },
        overlayColor: {
            type: 'string',
            default: null,
        },
        overlayOpacity: {
            type: 'string',
            default: null,
        },
        marginTop: {
            type: 'string',
            default: null,
        },
        marginBotton: {
            type: 'string',
            default: null,
        },
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
            bgColor,
            bgImage,
            overlayColor,
            overlayOpacity,
            marginTop,
            marginBotton,
        } = attributes;

        return (
            <Fragment>
                <InspectorControls>
                    <PanelBody title={__('PR Content setting', 'vk-blocks')}>
                        <BaseControl
                            label={__('Content Setting', 'vk-blocks')}
                            help={__('When you have an image. Image is displayed with priority', 'vk-blocks')}
                        >
                            <ColorPalette
                                value={titleColor}
                                onChange={(value) => setAttributes({titleColor: value})}
                            />
                            <ColorPalette
                                value={contentColor}
                                onChange={(value) => setAttributes({contentColor: value})}
                            />
                        </BaseControl>
                        <BaseControl
                            label={__('Button Setting', 'vk-blocks')}
                        >
                            <TextControl
                                value={url}
                                onChange={(value) => setAttributes({url: value})}
                                placeholder={'https://vektor-inc.co.jp/'}
                            />
                            <TextControl
                                value={buttonText}
                                onChange={(value) => setAttributes({buttonText: value})}
                                placeholder={'Read More'}
                            />
                            <RadioControl
                                label={__('URL Type', 'vk-blocks')}
                                help={__('Please select the from below.', 'vk-blocks')}
                                selected={urlType}
                                options={[
                                    {label: __('Open url in new window', 'vk-blocks'), value: '_blank'},
                                    {label: __('Open url in current window', 'vk-blocks'), value: '_self'}
                                ]}
                                onChange={(value) => setAttributes({urlType: value})}
                            />
                            <RadioControl
                                label={__('Button Type', 'vk-blocks')}
                                help={__('Please select the from below.', 'vk-blocks')}
                                selected={buttonType}
                                options={[
                                    {label: __('Solid', 'vk-blocks'), value: '0'},
                                    {label: __('Ghost', 'vk-blocks'), value: '1'}
                                ]}
                                onChange={(value) => setAttributes({buttonType: value})}
                            />
                            <ColorPalette
                                value={buttonColor}
                                onChange={(value) => setAttributes({buttonColor: value})}
                            />
                        </BaseControl>
                        <BaseControl
                            label={__('Image Setting', 'vk-blocks')}
                            help={__('When you have an image. Image is displayed with priority', 'vk-blocks')}
                        >
                            <ColorPalette
                                value={ImageBorderColor}
                                onChange={(value) => setAttributes({ImageBorderColor: value})}
                            />
                            <RadioControl
                                label={__('Layout', 'vk-blocks')}
                                help={__('Please select the type of pr_content_.', 'vk-blocks')}
                                selected={layout}
                                options={[
                                    {label: __('Right', 'vk-blocks'), value: 'right'},
                                    {label: __('Left', 'vk-blocks'), value: 'left'}
                                ]}
                                onChange={(value) => setAttributes({layout: value})}
                            />
                        </BaseControl>
                        <BaseControl
                            label={__('Background Setting', 'vk-blocks')}
                            help={__('When you have an image. Image is displayed with priority', 'vk-blocks')}
                        >
                            <ColorPalette
                                value={bgColor}
                                onChange={(value) => setAttributes({bgColor: value})}
                            />
                            <MediaUpload
                                onSelect={(value) => setAttributes({bgImage: value.url})}
                                type="image"
                                value={bgImage}
                                render={({open}) => (
                                    <Button
                                        onClick={open}
                                        className={bgImage ? 'image-button' : 'button button-large'}
                                    >
                                        {!bgImage ? __('Select image', 'vk-blocks') :
                                            <img className={'icon-image'} src={bgImage}
                                                 alt={__('Upload image', 'vk-blocks')}/>}
                                    </Button>
                                )}
                            />
                            <ColorPalette
                                value={overlayColor}
                                onChange={(value) => setAttributes({overlayColor: value})}
                            />
                            <TextControl
                                value={overlayOpacity}
                                onChange={(value) => setAttributes({overlayOpacity: value})}
                                placeholder={'overlayOpacity'}
                            />
                        </BaseControl>
                        <BaseControl
                            label={__('Layout:', 'vk-blocks')}
                        >
                            <TextControl
                                value={marginTop}
                                onChange={(value) => setAttributes({marginTop: value})}
                            />
                            <TextControl
                                value={marginBotton}
                                onChange={(value) => setAttributes({marginBotton: value})}
                            />
                        </BaseControl>
                    </PanelBody>
                </InspectorControls>
                <div className="widget widget_vk_widget_pr_content">
                    <div className="pr-content vk-prlx">
                        <div className="container">


                            <div className="row left">
                                <div className="col-sm-6 pr-content-col-img">
                                    <MediaUpload
                                        onSelect={(value) => setAttributes({Image: value.sizes.full.url})}
                                        type=" image"
                                        className={'vk_balloon_icon_image'}
                                        value={Image}
                                        render={({open}) => (
                                            <Button
                                                onClick={open}
                                                className={Image ? 'image-button' : 'button button-large'}
                                            >
                                                {!Image ? __('Select image', 'vk-blocks') :
                                                    <img className={'vk_balloon_icon_image'} src={Image}
                                                         alt={__('Upload image', 'vk-blocks')}/>}
                                            </Button>
                                        )}
                                    />
                                </div>
                                <div className="col-sm-6 pr-content-col-text">
                                    <RichText
                                        tagName="h3"
                                        className={'pr-content-title'}
                                        onChange={(value) => setAttributes({title: value})}
                                        value={title}
                                        placeholder={__('Input text', 'vk-blocks')}
                                        style={{color: titleColor}}
                                    />
                                    <RichText
                                        tagName="p"
                                        onChange={(value) => setAttributes({content: value})}
                                        value={content}
                                        placeholder={__('Input text', 'vk-blocks')}
                                        style={{color: contentColor}}
                                    />

                                    {
                                        buttonType == '0' ?

                                            <div className="pr-content-btn">
                                                <a href={url}
                                                   className="btn btn-block btn-lg btn-primary"
                                                   target={urlType}>{buttonText}
                                                    style={{backgroundColor: buttonColor}}
                                                </a>
                                            </div>
                                            :
                                            <div className="pr-content-btn">
                                                <a href={url}
                                                   className="btn btn-block btn-lg btn-primary"
                                                   target={urlType}>{buttonText}
                                                    style={{backgroundColor: '#fff', border:`1px solid ${buttonColor}`}}
                                                </a>
                                            </div>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
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
            bgColor,
            bgImage,
            overlayColor,
            overlayOpacity,
            marginTop,
            marginBotton,
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
