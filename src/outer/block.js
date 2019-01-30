/**
 * outer block type
 *
 */
import React from "react";
import {Component} from "./component";
import {schema} from './schema.js';
import toNumber from "../_helper/to-number";

const {__} = wp.i18n; // Import __() from wp.i18n
const {registerBlockType} = wp.blocks; // Import registerBlockType() from wp.blocks
const {RangeControl, RadioControl, PanelBody, Button, PanelColor, BaseControl,SelectControl} = wp.components;
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
    category: 'vk-blocks-cat-layout', // Block category — Group blocks together based on common traits E.g. common, formatting, layout widgets, embed.
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
            bgColor,
            bgImage,
            outerWidth,
            is_parallax,
            is_padding,
            opacity,
            upper_tilt_level,
            lower_tilt_level,
            tiltBgColor,
            dividerType
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
                            label={__('Width Setting', 'vk-blocks')}
                        >
													<RadioControl
															label={__('Outer width', 'vk-blocks')}
															selected={outerWidth}
															options={[
																	{label: __('Normal', 'vk-blocks'), value: 'normal'},
																	{label: __('Full Wide', 'vk-blocks'), value: 'full'}
															]}
															onChange={(value) => setAttributes({outerWidth: value})}
													/>
                        </BaseControl>

												<BaseControl
                            label={__('Padding Setting', 'vk-blocks')}
                            help=""
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
                            label={__('Background Image', 'vk-blocks')}
                            help=""
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
                            label={__('Divider Setting', 'vk-blocks')}
                        >
                            <SelectControl
                                label={ __( 'Type', 'vk-blocks' ) }
                                value={ dividerType }
                                onChange={ ( value ) => setAttributes( { dividerType: value } ) }
                                options={ [
                                    {
                                        value: 'tilt',
                                        label: __( 'Tilt', 'vk-blocks' ),
                                    },
                                    {
                                        value: 'curve',
                                        label: __( 'Curve', 'vk-blocks' ),
                                    },
                                    {
                                        value: 'wave',
                                        label: __( 'Wave', 'vk-blocks' ),
                                    },
                                    {
                                        value: 'triangle',
                                        label: __( 'Triangle', 'vk-blocks' ),
                                    },
                                ] }
                            />
                            <RangeControl
                                label={ __( 'Upper Divider Level', 'vk-blocks' ) }
                                value={ upper_tilt_level }
                                onChange={ ( value ) => setAttributes( { upper_tilt_level: toNumber( value, -100, 100 ) } ) }
                                min="-100"
                                max="100"
                            />
                            <RangeControl
                                label={ __( 'Lower Divider Level', 'vk-blocks' ) }
                                value={ lower_tilt_level }
                                onChange={ ( value ) => setAttributes( { lower_tilt_level: toNumber( value, -100, 100 ) } ) }
                                min="-100"
                                max="100"
                            />
                            <ColorPalette
                                value={tiltBgColor}
                                onChange={(value) => setAttributes({tiltBgColor: value})}
                            />
                        </BaseControl>
                    </PanelBody>
                </InspectorControls>
                <Component
                    outerWidth={outerWidth}
                    is_padding={is_padding}
                    is_parallax={is_parallax}
                    bgColor={bgColor}
                    opacity={opacity}
                    bgImage={bgImage}
                    upperTilt={upper_tilt_level}
                    lowerTilt={lower_tilt_level}
                    tiltBgColor={tiltBgColor}
                    dividerType={dividerType}
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
            tiltBgColor,
            dividerType
        } = attributes;

        if (vk_blocks_check.is_pro) {

            return (
                <Component
                    outerWidth={outerWidth}
                    is_padding={is_padding}
                    is_parallax={is_parallax}
                    bgColor={bgColor}
                    opacity={opacity}
                    bgImage={bgImage}
                    upperTilt={upper_tilt_level}
                    lowerTilt={lower_tilt_level}
                    tiltBgColor={tiltBgColor}
                    dividerType={dividerType}
                    for_={'save'}/>
            );

        }

    },
});
