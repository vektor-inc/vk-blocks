/**
 * latest-posts block type
 *
 */
import React from "react";
import addCheckBox from '../_helper/checkbox';
import {schema} from './schema.js';

const {__} = wp.i18n; // Import __() from wp.i18n
const {registerBlockType} = wp.blocks; // Import registerBlockType() from wp.blocks
const {RangeControl, PanelBody, BaseControl, SelectControl} = wp.components;
const {Fragment} = wp.element;
const {InspectorControls} = wp.editor;
const BlockIcon = 'arrow-down';
const {withSelect} = wp.data;
const {ServerSideRender} = wp.components;

const getTaxonomySlugs = (taxonomies) => {

    if (!taxonomies) {
        return false
    }

    let slugs = [];
    for (let i = 0; i <= taxonomies.length - 1; i++) {
        slugs.push(taxonomies[i].slug);
    }
    return slugs;
};

const setUpTaxonomyData = (taxonomies, slugs, select) => {

    let Taxonomy = [];

    for (let i = 0; i <= slugs.length - 1; i++) {
        let tax = (select('core').getEntityRecords('taxonomy', taxonomies[i].slug));

        if (tax != null) {

            for (let i = 0; i <= tax.length - 1; i++) {

                if (tax[i].slug != null) {

                    Taxonomy[tax[i].slug] = {
                        name: tax[i].name,
                        slug: tax[i].slug,
                        taxonomyType: tax[i].taxonomy,
                    }
                }
            }
        }
    }

    return Taxonomy;
};

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
registerBlockType('vk-blocks/latest-posts', {
    // Block name. Block names must be string that contains a namespace prefix. Example: my-plugin/my-custom-block.
    title: __('Latest Posts', 'vk-blocks'), // Block title.
    icon: BlockIcon, // Block icon from Dashicons → https://developer.wordpress.org/resource/dashicons/.
    category: 'vk-blocks-cat', // Block category —s Group blocks together based on common traits E.g. common, formatting, layout widgets, embed.
    attributes: schema,

    /**
     * The edit function describes the structure of your block in the context of the editor.
     * This represents what the editor will render when the block is used.
     *
     * The "edit" property must be a valid function.
     *
     * @link https://wordpress.org/gutenberg/handbook/block-api/block-edit-save/
     */

    edit: withSelect((select) => {

        let taxonomies = select('core').getTaxonomies();
        let slugs = getTaxonomySlugs(taxonomies);
        let taxonomyData = setUpTaxonomyData(taxonomies, slugs, select);

        return {
            coreData: {
                postTypes: select('core').getPostTypes(),
                category: taxonomyData,
            }
        };

    })(({coreData, className, attributes, setAttributes}) => {

        const {
            numberPosts,
            layout,
            isCheckedPostType,
            isCheckedTaxonomy
        } = attributes;


        let argsPostTypes = {
            name: 'postTypes',
            data: coreData.postTypes,
            returnArray: JSON.parse(isCheckedPostType),
            setAttributes: setAttributes
        };

        let argsCategory = {
            name: 'category',
            data: coreData.category,
            returnArray: JSON.parse(isCheckedTaxonomy),
            setAttributes: setAttributes
        };

        return (
            <Fragment>
                <InspectorControls>
                    <PanelBody title={__('Latest Posts Setting', 'vk-blocks')}>
                        <BaseControl
                            label={__('Layout', 'vk-blocks')}
                        >
                            <SelectControl
                                value={layout}
                                onChange={(value) => setAttributes({layout: value})}
                                options={[
                                    {
                                        value: 'image_1st',
                                        label: __('image_1st', 'vk-blocks'),
                                    },
                                    {
                                        value: 'image_2st',
                                        label: __('image_2st', 'vk-blocks'),
                                    },
                                ]}
                            />
                        </BaseControl>
                        <BaseControl
                            label={__('Number of Posts', 'vk-blocks')}
                        >
                            <RangeControl
                                value={numberPosts}
                                onChange={(value) => setAttributes({numberPosts: value})}
                                min="1"
                                max="10"
                            />
                        </BaseControl>
                        <BaseControl
                            label={__('Filter by PostTypes', 'vk-blocks')}
                        >
                            {
                                addCheckBox(argsPostTypes)
                            }
                        </BaseControl>
                        <BaseControl
                            label={__('Filter by Taxonomy', 'vk-blocks')}
                        >
                            {
                                addCheckBox(argsCategory)
                            }
                        </BaseControl>
                    </PanelBody>
                </InspectorControls>
                <div>
                    <ServerSideRender
                        block="vk-blocks/latest-posts"
                        attributes={attributes}
                    />
                </div>
            </Fragment>
        )
    }),

    /**
     * The save function define className }> which the different attributes should be combined
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
