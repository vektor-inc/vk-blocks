/**
 * staff block type
 *
 */
import React from "react";
import NewComponent from "./component";
import {schema} from './schema';
// import {deprecated} from './deprecated/block';

const {__} = wp.i18n; // Import __() from wp.i18n
const {registerBlockType} = wp.blocks; // Import registerBlockType() from wp.blocks
const {TextControl, PanelBody, BaseControl} = wp.components;
const {Fragment} = wp.element;
const {InspectorControls} = wp.editor;
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
registerBlockType('vk-blocks/staff', {
    // Block name. Block names must be string that contains a namespace prefix. Example: my-plugin/my-custom-block.
    title: __('staff', 'vk-blocks'), // Block title.
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
    edit({attributes, setAttributes, className}) {
        const {
            vk_staff_photo_image_alt
        } = attributes;

        return (
            <Fragment>
                <InspectorControls>
                    <PanelBody title={__('Staff Block Setting', 'vk-blocks')}>
                        <TextControl
                            label={__('Alt text', 'vk-blocks')}
                            help={__('Set the alt text for profile image', 'vk-blocks')}
                            value={vk_staff_photo_image_alt}
                            onChange={(value) => setAttributes({vk_staff_photo_image_alt:value})}
                        />
                    </PanelBody>
                </InspectorControls>
                <div className="vk_staff">
                    <NewComponent
                        attributes={attributes}
                        setAttributes={setAttributes}
                        className={className}
                        for_={'edit'}
                    />
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
    save({attributes}) {

        return (
            <div className="vk_staff">
                <div>Front</div>
                <NewComponent
                    attributes={attributes}
                    for_={'save'}
                />
            </div>
        );
    },

    //Please comment out, when you need to use deprecated.
    // deprecated:deprecated
});
