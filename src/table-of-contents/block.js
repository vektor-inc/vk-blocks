/**
 * table-of-contents block type
 *
 */
import React from "react";
import {schema} from './schema';
import TableOfContents from './TableOfContents';

const {__} = wp.i18n; // Import __() from wp.i18n
const {registerBlockType} = wp.blocks; // Import registerBlockType() from wp.blocks
const {ServerSideRender, PanelBody, SelectControl,BaseControl} = wp.components;
const {Fragment} = wp.element;
const {RichText, InspectorControls, MediaUpload, ColorPalette} = wp.editor;
const BlockIcon = 'arrow-down';

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
registerBlockType('vk-blocks/table-of-contents', {
    // Block name. Block names must be string that contains a namespace prefix. Example: my-plugin/my-custom-block.
    title: __('Table of Contents', 'vk-blocks'), // Block title.
    icon: BlockIcon, // Block icon from Dashicons → https://developer.wordpress.org/resource/dashicons/.
    category: 'vk-blocks-cat', // Block category — Group blocks together based on common traits E.g. common, formatting, layout widgets, embed.
    attributes: schema,

    /**
     * The edit function describes the structure of your block in the context of the editor.
     * This represents what the editor will render when the block is used.
     *
     * The "edit" property must be a valid function.
     *
     * @link https://wordpress.org/gutenberg/handbook/block-api/block-edit-save/
     */
    edit({attributes, setAttributes, className,}) {
        const {
            style,
        } = attributes;

        const toc = new TableOfContents();
        let source = toc.getHtagsInEditor();
        let html = toc.returnHtml(source, style, className);
        setAttributes({renderHtml: html});

        return (
            <Fragment>
                <InspectorControls>
                    <PanelBody>
                        <BaseControl
                            label={__('Style', 'vk-blocks')}
                            help={__('When you add heading tags after you insert Table of Contents block, please click this block again. Then this block will generate the preview again.', 'vk-blocks')}
                        >
                            <SelectControl
                                value={style}
                                onChange={(value) => setAttributes({style: value})}
                                options={[
                                    {
                                        value: 'default',
                                        label: __('Default', 'vk-blocks'),
                                    },
                                    {
                                        value: 'stripe',
                                        label: __('Stripe', 'vk-blocks'),
                                    }
                                ]}
                            />
                        </BaseControl>
                    </PanelBody>
                </InspectorControls>
                <ServerSideRender
                    block='vk-blocks/table-of-contents'
                        attributes={attributes}
                    />
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
    save() {
        return null;
    },

});
