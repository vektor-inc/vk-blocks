/**
 * Table block type
 */
import {repeatElm} from "./component";
import {schema} from '../tables/schema';

const { lodash } = window;
const { times } = lodash;

const {__} = wp.i18n; // Import __() from wp.i18n
const {registerBlockType} = wp.blocks; // Import registerBlockType() from wp.blocks
const {RangeControl, PanelBody, BaseControl} = wp.components;
const {Fragment} = wp.element;
const {InspectorControls,InnerBlocks} = wp.editor;
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
registerBlockType('vk-blocks/tr', {
    // Block name. Block names must be string that contains a namespace prefix. Example: my-plugin/my-custom-block.
    title: __('Tr', 'vk-blocks'), // Block title.
    icon: BlockIcon, // Block icon from Dashicons → https://developer.wordpress.org/resource/dashicons/.
    category: 'vk-blocks-cat', // Block category — Group blocks together based on common traits E.g. common, formatting, layout widgets, embed.
    attributes: schema,
    supports: {
        inserter: false,
        reusable: false,
        html: false,
    },

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
            colNum,
            rowNum
        } = attributes;

        /**
         * Get Paragraph to repeat.
         * @param columns
         * @returns {Array}
         */
        const getParagraph = (columns) => {
            return times(columns, () => ['core/paragraph']);
        };


        return (<tr>Thisis {rowNum}</tr>);
        // return (<tr>getParagraph(rowNum)</tr>);
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
            colNum,
            rowNum
        } = attributes;

        return (<td>{repeatElm(colNum, 'save', ['core/paragraph'], getParagraph)}</td>);
    },

    //Please comment out, when you need to use deprecated.
    // deprecated:deprecated
});
