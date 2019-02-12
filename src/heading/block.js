/**
 * heading block type
 *
 */
import React from "react";
import HeadingToolbar from './heading-toolbar';
import {schema} from './schema';

// import YourComponent from "./component.js";
const {__} = wp.i18n; // Import __() from wp.i18n
const {registerBlockType,createBlock} = wp.blocks; // Import registerBlockType() from wp.blocks
const {RangeControl, RadioControl, PanelBody, Button, PanelColor} = wp.components;
const {Fragment} = wp.element;
const {RichText, InspectorControls, MediaUpload, ColorPalette,BlockControls,Toolbar} = wp.editor;
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
registerBlockType('vk-blocks/heading', {
    // Block name. Block names must be string that contains a namespace prefix. Example: my-plugin/my-custom-block.
    title: __('Heading', 'vk-blocks'), // Block title.
    icon: BlockIcon, // Block icon from Dashicons → https://developer.wordpress.org/resource/dashicons/.
    category: 'vk-blocks-cat', // Block category — Group blocks together based on common traits E.g. common, formatting, layout widgets, embed.
    attributes: schema,
    supports : {
        className: false,
        anchor: true,
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
        const {title, subText,titleColor,subTextColor,titleSize,subTextSize,level,} = attributes;
        const tagName = 'h' + level;

        return (
            <Fragment>
                <BlockControls>
                    <HeadingToolbar minLevel={ 2 } maxLevel={ 5 } selectedLevel={ level } onChange={ ( newLevel ) => setAttributes( { level: newLevel } ) } />
                </BlockControls>
                <InspectorControls>
                    <PanelBody title={ __( 'Heading Settings' ) }>
                        <p>{ __( 'Level' ) }</p>
                        <HeadingToolbar minLevel={ 1 } maxLevel={ 7 } selectedLevel={ level } onChange={ ( newLevel ) => setAttributes( { level: newLevel } ) } />
                        <ColorPalette
                            value={titleColor}
                            onChange={(value) => setAttributes({titleColor: value})}
                        />
                        <RangeControl
                            value={titleSize}
                            onChange={(value) => {setAttributes({titleSize: value});
                            }}
                        />
                    </PanelBody>
                    <PanelBody title={ __( 'Sub Text Settings' ) }>
                        <ColorPalette
                            value={subTextColor}
                            onChange={(value) => setAttributes({subTextColor: value})}
                        />
                    </PanelBody>
                </InspectorControls>
                <div className={`vk_heading vk_heading-style-`}>
                    <RichText
                    tagName={tagName}
                    value={title}
                    onChange={(value) => setAttributes({title: value})}
                    style={{color:titleColor, fontSize:titleSize+'px'}}
                    className={`vk_heading_title-style-`}
                    placeholder={ __( 'Input title…' ) }
                />
                <RichText
                    tagName={'p'}
                    value={subText}
                    onChange={(value) => setAttributes({subText: value})}
                    style={{color:subTextColor}}
                    className={`vk_heading_subtext-style-`}
                    placeholder={ __( 'Input sub text…' ) }
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
        const {title, level} = attributes;
        const tagName = 'h' + level;

        return (
            <RichText.Content
                tagName={tagName}
                value={title}
            />
        );
    },
});
