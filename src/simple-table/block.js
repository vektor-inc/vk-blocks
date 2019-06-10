/**
 * Simple Table block type
 */
import {Component} from "./component";
import {schema} from './schema';
import React from "react";

const {__} = wp.i18n; // Import __() from wp.i18n
const {registerBlockType} = wp.blocks; // Import registerBlockType() from wp.blocks
const {RangeControl, PanelBody, BaseControl,CheckboxControl} = wp.components;
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
            rowNum,
            styleStriped,
            layoutInMobile
        } = attributes;

        const updateChildBlockAttributesRow = (value) => {

            setAttributes({rowNum: value});

        };

        if (styleStriped) {
            className = className + ' table-striped';
        }

        if (layoutInMobile) {
            className = className + ' vk_simpleTable-col-mobile1';
        }

        return (
            <Fragment>
                <InspectorControls>
                    <PanelBody title={__('Simple Table Setting', 'vk-blocks')}>
                        <BaseControl label={__('Row Number', 'vk-blocks')}>
                            <RangeControl
                                value={rowNum}
                                min={0}
                                max={20}
                                onChange={updateChildBlockAttributesRow}
                            />
                        </BaseControl>
                    </PanelBody>
                </InspectorControls>
                <InspectorControls>
                    <PanelBody title={__('Styles', 'vk-blocks')}>
                        <CheckboxControl
                            label={__('Set the stripe', 'vk-blocks')}
                            checked={styleStriped}
                            onChange={(checked) => setAttributes({styleStriped: checked})}
                        />
                    </PanelBody>
                </InspectorControls>
                <InspectorControls>
                    <PanelBody title={__('Setting layout in mobile', 'vk-blocks')}>
                        <CheckboxControl
                            label={__('Enable one column', 'vk-blocks')}
                            checked={layoutInMobile}
                            onChange={(checked) => setAttributes({layoutInMobile: checked})}
                        />
                    </PanelBody>
                </InspectorControls>
                {
                    vk_blocks_check.is_pro
                        ?
                        <table className={`${className} vk_simpleTable table vk_simpleTable-edit wp-block-table `}>
                        <tbody>
                            <Component
                                attributes={attributes}
                                for_={'edit'}
                            />
                        </tbody>
                        </table>
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
        const {
            styleStriped,
            layoutInMobile
        } = attributes;

        let containerClass = 'vk_simpleTable vk_simpleTable-view wp-block-table';

        if (styleStriped) {
            containerClass = containerClass + ' table-striped';
        }

        if (layoutInMobile) {
            containerClass = containerClass + ' vk_simpleTable-col-mobile1';
        }

        {
            if (vk_blocks_check.is_pro) {

                return (<table className={containerClass}>
                          <tbody>
                          <Component
                              attributes={attributes}
                              for_={'save'}
                          />
                          </tbody>
                        </table>
                );
            }
        }
    },

    //Please comment out, when you need to use deprecated.
    // deprecated:deprecated
});
