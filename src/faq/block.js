/**
 * Faq block type
 *
 */
const {__} = wp.i18n; // Import __() from wp.i18n
const {registerBlockType} = wp.blocks; // Import registerBlockType() from wp.blocks
const {RichText} = wp.editor;
const BlockIcon = 'editor-help';

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
registerBlockType('vk-blocks/faq', {
    // Block name. Block names must be string that contains a namespace prefix. Example: my-plugin/my-custom-block.
    title: __('FAQ', 'vk-blocks'), // Block title.
    icon: BlockIcon, // Block icon from Dashicons → https://developer.wordpress.org/resource/dashicons/.
    category: 'vk-blocks-cat', // Block category — Group blocks together based on common traits E.g. common, formatting, layout widgets, embed.
    attributes: {
        heading: {
            type: 'string',
            source: 'html',
            selector: 'dt',
        },
        content: {
            type: 'string',
            source: 'html',
            selector: 'dd',
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
            content
        } = attributes;

        return (
            <dl className={'veu_qaItem'}>
                <RichText
                    tagName="dt"
                    onChange={(value) => setAttributes({heading: value})}
                    value={heading}
                    placeholder={__('Please enter a question.', 'vk-blocks') }
                />
                <RichText
                    tagName="dd"
                    onChange={(value) => setAttributes({content: value})}
                    value={content}
                    placeholder={__('Please enter a answer.', 'vk-blocks') }
                />
            </dl>
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
    save({attributes}) {
        const {
            heading,
            content
        } = attributes;

        return (
            <dl className={'veu_qaItem'}>
                <RichText.Content
                    tagName="dt"
                    value={heading}
                />
                <RichText.Content
                    tagName="dd"
                    value={content}
                />
            </dl>
        );
    },
});
