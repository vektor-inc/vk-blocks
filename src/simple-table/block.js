/**
 * Simple Table block type
 */
import {Component} from "./component";
import {schema} from './schema';
import React from "react";

const {__} = wp.i18n; // Import __() from wp.i18n
const {registerBlockType} = wp.blocks; // Import registerBlockType() from wp.blocks
const {RangeControl, PanelBody, BaseControl} = wp.components;
const {Fragment} = wp.element;
const {InspectorControls} = wp.editor;
const {select, dispatch} = wp.data;
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
registerBlockType('vk-blocks/simple-table', {
    // Block name. Block names must be string that contains a namespace prefix. Example: my-plugin/my-custom-block.
    title: __('Simple Table', 'vk-blocks'), // Block title.
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

    edit({child, className, attributes, setAttributes}) {
        const {
            colNum,
            rowNum
        } = attributes;

        const updateChildBlockAttributesRow = (value) => {

            setAttributes({rowNum: value});

        };

        return (
            <Fragment>
                <InspectorControls>
                    <PanelBody title={__('Simple Table Setting', 'vk-blocks')}>
                        <BaseControl label={__('Row Number', 'vk-blocks')}>
                            <RangeControl
                                value={rowNum}
                                min={0}
                                max={10}
                                onChange={updateChildBlockAttributesRow}
                            />
                        </BaseControl>
                    </PanelBody>
                </InspectorControls>
                {
                    vk_blocks_check.is_pro
                        ?
                        <div className={`${className} vk_simpleTable vk_simpleTable-edit wp-block-table `}>
                            <table>
                                <Component
                                    attributes={attributes}
                                    for_={'edit'}
                                />
                            </table>
                        </div>
                        :
                        <div>{__('This block is only for users who bought Lightning Pro.', 'vk-blocks')}</div>
                }
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
        {
            if (vk_blocks_check.is_pro) {

                return (<div className={`vk_simpleTable vk_simpleTable-view wp-block-table`}>
                        <table>
                            <Component
                                attributes={attributes}
                                for_={'save'}
                            />
                        </table>
                    </div>
                );
            }
        }
    },

    //Please comment out, when you need to use deprecated.
    // deprecated:deprecated
});
