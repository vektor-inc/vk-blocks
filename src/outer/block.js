/**
 * outer block type
 *
 */
import React from "react";
import {Padding} from "./padding";
import toNumber from "../../../snow-monkey-blocks/src/js/helper/to-number";

const {__} = wp.i18n; // Import __() from wp.i18n
const {registerBlockType} = wp.blocks; // Import registerBlockType() from wp.blocks
const {RangeControl, RadioControl, PanelBody, Button, PanelColor, BaseControl} = wp.components;
const {Fragment} = wp.element;
const {RichText, InspectorControls, MediaUpload, ColorPalette, InnerBlocks} = wp.editor;
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
registerBlockType('vk-blocks/outer', {
    // Block name. Block names must be string that contains a namespace prefix. Example: my-plugin/my-custom-block.
    title: __('Outer', 'vk-blocks'), // Block title.
    icon: BlockIcon, // Block icon from Dashicons → https://developer.wordpress.org/resource/dashicons/.
    category: 'vk-blocks-cat', // Block category — Group blocks together based on common traits E.g. common, formatting, layout widgets, embed.
    attributes: {
        bgColor: {
            type: 'string',
            default: '#f3f4f5',
        },
        bgImage: {
            type: 'string',
            default: null,
        },
				outerWidth:{
            type: 'string',
            default: 'normal',
        },
        is_parallax:{
            type: 'string',
            default: '0',
        },
        is_padding: {
            type: 'string',
            default: '1',
        },
        opacity: {
            type: 'number',
            default: 0.5,
        },
        upper_tilt_level: {
            type: 'number',
            default: 0,
        },
        lower_tilt_level: {
            type: 'number',
            default: 0,
        },
        tiltBgColor: {
            type: 'string',
            default: '#fff',
        },
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
        const {
            bgColor,
            bgImage,
            outerWidth,
            is_parallax,
            is_padding,
            opacity,
            upper_tilt_level,
            lower_tilt_level,
            tiltBgColor
        } = attributes;

        return (
            <Fragment>
                <InspectorControls>
                    <PanelBody title={__('Background Setting', 'vk-blocks')}>
                        <BaseControl
                            label={__('Color Setting', 'vk-blocks')}
                            help={__('Color will overcome background image. If you want to display image, clear background color or set opacity 0.', 'vk-blocks')}
                        >
                            <ColorPalette
                                value={bgColor}
                                onChange={(value) => setAttributes({bgColor: value})}
                            />
                        </BaseControl>
                        <BaseControl
                            label={__('Opacity Setting', 'vk-blocks')}
                        >
                            <RangeControl
                                value={opacity}
                                onChange={(value) => {setAttributes({opacity: value});
                                }}
                                min={0}
                                max={1}
                                step={0.1}
                            />
                        </BaseControl>
                        <BaseControl
                            label={__('Background Setting', 'vk-blocks')}
                            help={__('When you have an image. Image is displayed with priority', 'vk-blocks')}
                        >
                            <MediaUpload
                                onSelect={(value) => setAttributes({bgImage: value.url})}
                                type="image"
                                value={bgImage}
                                render={({open}) => (
                                    <Button
                                        onClick={open}
                                        className={bgImage ? 'image-button' : 'button button-large'}
                                    >
                                        {!bgImage ? __('Select image', 'vk-blocks') :
                                            <img className={'icon-image'} src={bgImage}
                                                 alt={__('Upload image', 'vk-blocks')}/>}
                                    </Button>
                                )}
                            />
														<RadioControl
                                label={__('Outer width', 'vk-blocks')}
                                selected={outerWidth}
                                options={[
                                    {label: __('Normal', 'vk-blocks'), value: 'normal'},
                                    {label: __('Full Wide', 'vk-blocks'), value: 'full'}
                                ]}
                                onChange={(value) => setAttributes({outerWidth: value})}
                            />
                            <RadioControl
                                label={__('Parallax', 'vk-blocks')}
                                selected={is_parallax}
                                options={[
                                    {label: __('ON', 'vk-blocks'), value: '1'},
                                    {label: __('OFF', 'vk-blocks'), value: '0'}
                                ]}
                                onChange={(value) => setAttributes({is_parallax: value})}
                            />
                        </BaseControl>
                        <BaseControl
                            label={__('Background Setting', 'vk-blocks')}
                            help={__('When you have an image. Image is displayed with priority', 'vk-blocks')}
                        >
                            <RadioControl
                                label={__('Padding', 'vk-blocks')}
                                selected={is_padding}
                                options={[
                                    {label: __('Use default padding', 'vk-blocks'), value: '1'},
                                    {label: __('Do not use default padding.', 'vk-blocks'), value: '0'}
                                ]}
                                onChange={(value) => setAttributes({is_padding: value})}
                            />
                        </BaseControl>
                        <BaseControl
                            label={__('Background Tilt Setting', 'vk-blocks')}
                        >
                            <RangeControl
                                label={ __( 'Upper Tilt Level', 'vk-blocks' ) }
                                value={ upper_tilt_level }
                                onChange={ ( value ) => setAttributes( { upper_tilt_level: toNumber( value, 0, 100 ) } ) }
                                min="0"
                                max="100"
                            />
                            <RangeControl
                                label={ __( 'Lower Tilt Level', 'vk-blocks' ) }
                                value={ lower_tilt_level }
                                onChange={ ( value ) => setAttributes( { lower_tilt_level: toNumber( value, 0, 100 ) } ) }
                                min="0"
                                max="100"
                            />
                            <ColorPalette
                                value={tiltBgColor}
                                onChange={(value) => setAttributes({tiltBgColor: value})}
                            />
                        </BaseControl>
                    </PanelBody>
                </InspectorControls>
                <Padding
                    outerWidth={outerWidth}
                    is_padding={is_padding}
                    is_parallax={is_parallax}
                    bgColor={bgColor}
                    opacity={opacity}
                    bgImage={bgImage}
                    upperTilt={upper_tilt_level}
                    lowerTilt={lower_tilt_level}
                    tiltBgColor={tiltBgColor}
                    for_={'edit'}/>
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
            bgColor,
            bgImage,
            outerWidth,
            is_parallax,
            is_padding,
            opacity,
            upper_tilt_level,
            lower_tilt_level,
            tiltBgColor
        } = attributes;

        return (
            <Padding
                outerWidth={outerWidth}
                is_padding={is_padding}
                is_parallax={is_parallax}
                bgColor={bgColor}
                opacity={opacity}
                bgImage={bgImage}
                upperTilt={upper_tilt_level}
                lowerTilt={lower_tilt_level}
                tiltBgColor={tiltBgColor}
                for_={'save'}/>
        );
    },
});
