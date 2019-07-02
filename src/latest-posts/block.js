/**
 * latest-posts block type
 *
 */
import React from "react";
import addCheckBox from './checkbox';
import {schema} from './schema.js';

const {__} = wp.i18n; // Import __() from wp.i18n
const {registerBlockType} = wp.blocks; // Import registerBlockType() from wp.blocks
const {RangeControl, PanelBody, BaseControl, SelectControl} = wp.components;
const {Fragment} = wp.element;
const {InspectorControls} = wp.editor;
const BlockIcon = 'arrow-down';
const {withSelect, subscribe, select, dispatch} = wp.data;
const {ServerSideRender} = wp.components;

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

        return {
            postTypes: select('core').getPostTypes(),
        };

    })(({postTypes, className, attributes, setAttributes, clientId}) => {

        const {
            numberPosts,
            layout,
            isCheckedPostType,
            isCheckedTaxonomy,
            taxonomyOfCheckedPT
        } = attributes;

        let argsPostTypes = {
            name: 'postTypes',
            data: postTypes,
            returnArray: JSON.parse(isCheckedPostType),
            setAttributes: setAttributes
        };

        console.log(isCheckedPostType);


        /**
         * Get checked post-types in real time. Return the array of checked post-types.
         * @returns {Array}
         */
        const geCheckedPostTypes = () => {

            let checkedPostType = select("core/block-editor").getBlockAttributes(clientId);
            let checkedObj = JSON.parse(checkedPostType.isCheckedPostType);
            let checkedKey = Object.keys(checkedObj);
            let checkedValue = Object.values(checkedObj);
            let searchedPostTypes = select("core").getPostTypes();
            let resultPostTypes = [];

            if (0 < checkedKey.length) {

                searchedPostTypes.forEach(tax => {

                    let index = isValueInArray(checkedKey, tax.slug);

                    if (index === -1) {
                        // ... (合致した要素がなかった場合)
                    } else {

                        let key = checkedKey[index];
                        let value = checkedValue[index];

                        if (value) {
                            resultPostTypes.push(key)
                        }
                    }
                });
            }
            return resultPostTypes;
        };












        let argsTaxonomy = {
            name: 'taxonomy',
            data: JSON.parse(taxonomyOfCheckedPT),
            returnArray: JSON.parse(isCheckedTaxonomy),
            setAttributes: setAttributes
        };

        /**
         * Check array is empty or not. If array is empty return true;
         * @returns {Boolean}
         */
        const isArrayEmpty = (array) => {
            return array === [];
        };

        /**
         * Check value is in the array or not. If the value exists in array, return index;
         * @returns {Number}
         */
        const isValueInArray = (array,value) =>{
            return array.findIndex(item => item === value);
        };


        /**
         * Get taxonomies of checked post-types in real time. Return array of taxonomies.
         * @returns {Array}
         */
        const getTaxonomiesFromPostType = (targetPostTypes) => {

            let resultTaxonomies = [];

            if (targetPostTypes && !isArrayEmpty(targetPostTypes)) {

                targetPostTypes.forEach(tax => {

                    let postType = select("core").getPostType(tax);

                    let taxonomies = postType.taxonomies;

                    if (taxonomies && !isArrayEmpty(taxonomies)) {

                        taxonomies.forEach(tax => {

                            let index = isValueInArray(resultTaxonomies, tax);
                            if (index === -1) {
                                resultTaxonomies.push(tax);
                            }
                        });
                    }
                });
            }

            return resultTaxonomies;
        };

        /**
         * Return TaxonomiesList by array{taxonomyName : [slug1,slug2,...]}.
         * @param result
         * @param tax
         */
        const getTaxonomiesList = (result = {}, tax) => {

            let taxonomiesList = select('core').getEntityRecords('taxonomy', tax);
            let temp = [];
            taxonomiesList.forEach(value => {

                temp.push(value.slug);
            });

            result[tax] = temp;
        };

        subscribe(() => {
            let formatArray = {}
            let checkedPostTypes = geCheckedPostTypes();
            let TaxonomiesOfCheckedPostTypes = getTaxonomiesFromPostType(checkedPostTypes);

            TaxonomiesOfCheckedPostTypes.forEach(tax => {

                getTaxonomiesList(formatArray, tax);
            });

            setAttributes({taxonomyOfCheckedPT: JSON.stringify(formatArray)})
        });

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
                            {(() => {
                                if (!isArrayEmpty(argsTaxonomy)) {
                                    addCheckBox(argsTaxonomy)
                                }
                            })()}
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
