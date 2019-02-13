/**
 * heading block type
 *
 */
import React from "react";
import {schema} from './schema';
import HeadingToolbar from './heading-toolbar';

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
        const {level, title, subText, titleColor, subTextColor, titleSize, subTextSize, titleStyle} = attributes;
        const tagName = 'h' + level;

        let setTitleFontSize = (newLevel) => {

            setAttributes({level: newLevel});

            switch (newLevel) {
                case 1:
                    setAttributes({titleSize: 36});
                    break;
                case 2:
                    setAttributes({titleSize: 24});
                    break;
                case 3:
                    setAttributes({titleSize: 24});
                    break;
                case 4:
                    setAttributes({titleSize: 20});
                    break;
                case 5:
                    setAttributes({titleSize: 18});
                    break;
                case 6:
                    setAttributes({titleSize: 16});
                    break;
            }
        };

        return (
            <Fragment>
                <BlockControls>
                    <HeadingToolbar minLevel={2} maxLevel={5} selectedLevel={level} onChange={setTitleFontSize}/>
                </BlockControls>
                <InspectorControls>
                    <PanelBody title={ __( 'Heading Settings', 'vk-blocks' ) }>
                        <p>{ __( 'Level', 'vk-blocks' ) }</p>
                        <HeadingToolbar minLevel={1} maxLevel={7} selectedLevel={level} onChange={setTitleFontSize}/>
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
                    <PanelBody title={ __( 'Sub Text Settings', 'vk-blocks' ) }>
                        <ColorPalette
                            value={subTextColor}
                            onChange={(value) => setAttributes({subTextColor: value})}
                        />
                        <RangeControl
                            value={subTextSize}
                            onChange={(value) => {setAttributes({subTextSize: value});
                            }}
                        />
                    </PanelBody>
                    <PanelBody title={__('Style Settings', 'vk-blocks')}>
                        <RadioControl
                            label={__('Button Position:', 'vk-blocks')}
                            selected={titleStyle}
                            options={[
                                {label: __('Default', 'vk-blocks'), value: 'default'},
                                {label: __('Plane', 'vk-blocks'), value: 'plane'}
                            ]}
                            onChange={(value) => setAttributes({titleStyle: value})}
                        />
                    </PanelBody>
                </InspectorControls>
                <div className={`vk_heading vk_heading-style-${titleStyle}`}>
                    <RichText
                        tagName={tagName}
                        value={title}
                        onChange={(value) => setAttributes({title: value})}
                        style={{color: titleColor, fontSize: titleSize + 'px'}}
                        className={`vk_heading_title-style-${titleStyle}`}
                        placeholder={__('Input title…', 'vk-blocks')}
                    />
                    <RichText
                        tagName={'p'}
                        value={subText}
                        onChange={(value) => setAttributes({subText: value})}
                        style={{color: subTextColor,fontSize: subTextSize + 'px'}}
                        className={`vk_heading_subtext-style-${titleStyle}`}
                        placeholder={__('Input sub text…', 'vk-blocks')}
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
        const {level, title, subText, titleColor, subTextColor, titleSize, subTextSize, titleStyle} = attributes;
        const tagName = 'h' + level;

        return (
            <div className={`vk_heading vk_heading-style-${titleStyle}`}>
                <RichText.Content
                    tagName={tagName}
                    value={title}
                    style={{color: titleColor, fontSize: titleSize + 'px'}}
                    className={`vk_heading_title-style-${titleStyle}`}
                />
                <RichText.Content
                    tagName={'p'}
                    value={subText}
                    style={{color: subTextColor,fontSize: subTextSize + 'px'}}
                    className={`vk_heading_subtext-style-${titleStyle}`}
                />
            </div>
        );
    },
});