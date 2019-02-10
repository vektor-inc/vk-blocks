/**
 * spacer block type
 *
 */
import React from "react";
import {schema} from './schema';
import {SpacerComponent} from "./component";

const {__} = wp.i18n; // Import __() from wp.i18n
const {registerBlockType} = wp.blocks; // Import registerBlockType() from wp.blocks
const {RangeControl, PanelBody, BaseControl,SelectControl} = wp.components;
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
registerBlockType('vk-blocks/spacer', {
    // Block name. Block names must be string that contains a namespace prefix. Example: my-plugin/my-custom-block.
    title: __('Spacer', 'vk-blocks'), // Block title.
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
    edit({attributes, setAttributes}) {
        const {
            unit,
            pc,
            tablet,
            mobile,
        } = attributes;

        return (
            <Fragment>
                <InspectorControls>
                    <PanelBody>
                        <SelectControl
                            label={__('Unit Type', 'vk-blocks')}
                            value={unit}
                            onChange={(value) => setAttributes({unit: value})}
                            options={[
                                {
                                    value: 'px',
                                    label: __('px', 'vk-blocks'),
                                },
                                {
                                    value: 'em',
                                    label: __('em', 'vk-blocks'),
                                },
                                {
                                    value: 'vw',
                                    label: __('vw', 'vk-blocks'),
                                }
                            ]}
                        />
                        <BaseControl label={__('Height for each device.', 'vk-blocks')}>
                            <RangeControl
                                label={__('PC', 'vk-blocks')}
                                value={pc}
                                onChange={(value) => setAttributes({pc: value})}
                            />
                            <RangeControl
                                label={__('Tablet', 'vk-blocks')}
                                value={tablet}
                                onChange={(value) => setAttributes({tablet: value})}
                            />
                            <RangeControl
                                label={__('Mobile', 'vk-blocks')}
                                value={mobile}
                                onChange={(value) => setAttributes({mobile: value})}
                            />
                        </BaseControl>
                    </PanelBody>
                </InspectorControls>
                <SpacerComponent attributes={attributes}/>
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
            <SpacerComponent attributes={attributes}/>
        );
    },

    //Please comment out, when you need to use deprecated.
    // deprecated:deprecated
});
