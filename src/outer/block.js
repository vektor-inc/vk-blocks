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
const BlockIcon = (
	<svg xmlns="http://www.w3.org/2000/svg" width="576" height="512" viewBox="0 0 576 512">
	<path d="M288,348c50.7,0,92-41.3,92-92s-41.3-92-92-92s-92,41.3-92,92S237.3,348,288,348z M288,194c34.2,0,62,27.8,62,62
		s-27.8,62-62,62s-62-27.8-62-62S253.8,194,288,194z"/>
	<polygon points="273,303 303,303 303,265 341,265 341,235 303,235 303,197 273,197 273,235 235,235 235,265 273,265 "/>
	<path d="M1.8,122.5v267h572.5v-267H1.8z M544.2,359.5H31.8v-207h512.5L544.2,359.5L544.2,359.5z"/>
	<path d="M26,63.7c-0.8,0-1.6,0.1-2.3,0.2v8.7c0.8,0.1,1.6,0.2,2.3,0.2c1.8,0,3.2-0.4,4.1-1.2c1-0.8,1.5-2,1.5-3.5
		C31.6,65.2,29.7,63.7,26,63.7z"/>
	<path d="M65.2,70.9c-1.2,0-2.2,0.5-2.8,1.4c-0.6,0.9-0.9,2.4-0.9,4.5s0.3,3.5,0.9,4.5c0.6,0.9,1.5,1.4,2.8,1.4
		c1.2,0,2.2-0.5,2.8-1.4c0.6-0.9,0.9-2.4,0.9-4.5s-0.3-3.5-0.9-4.5C67.4,71.4,66.4,70.9,65.2,70.9z"/>
	<path d="M42.9,31.1c-22.8,0-41.2,18.5-41.2,41.2c0,22.8,18.5,41.2,41.2,41.2c22.8,0,41.2-18.5,41.2-41.2
		C84.1,49.6,65.6,31.1,42.9,31.1z M34.7,75c-1.8,1.7-4.6,2.5-8.1,2.5c-0.9,0-1.9,0-3-0.1v9.1h-6.2v-27c2.6-0.4,5.3-0.6,8.2-0.6
		c7.9,0,11.9,3,11.9,8.9C37.5,70.9,36.6,73.4,34.7,75z M54.3,71.6h-0.7c-2.4,0-4.3,0.6-5.7,1.8c-1.4,1.2-2,2.8-2,4.8v8.2h-6.2V67.1h6
		v3.7h0.1c0.8-1.2,2-2.1,3.3-2.7c1.4-0.7,2.9-1,4.5-1h0.7C54.3,67.1,54.3,71.6,54.3,71.6z M65.2,86.8c-3.1,0-5.5-0.9-7.2-2.6
		s-2.6-4.2-2.6-7.4c0-3.2,0.9-5.6,2.6-7.4s4.1-2.6,7.2-2.6s5.5,0.9,7.2,2.6c1.7,1.8,2.6,4.2,2.6,7.4c0,3.2-0.9,5.6-2.6,7.4
		S68.3,86.8,65.2,86.8z"/>
	</svg>
);

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
                {
                    vk_blocks_check.is_pro
                        ?
                        <Component
                            attributes={attributes}
                            for_={'edit'}/>
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

                return (
                    <Component
                        attributes={attributes}
                        for_={'save'}/>
                );

            }
        }

    },
});
