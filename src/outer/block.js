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
	<path d="M288,381c50.7,0,92-41.3,92-92s-41.3-92-92-92s-92,41.3-92,92S237.3,381,288,381z M288,227c34.2,0,62,27.8,62,62
		s-27.8,62-62,62s-62-27.8-62-62S253.8,227,288,227z"/>
	<polygon points="273,342 303,342 303,304 341,304 341,274 303,274 303,236 273,236 273,274 235,274 235,304 273,304 "/>
	<path d="M1.8,155.5v267h572.5v-267H1.8z M544.2,392.5H31.8v-207h512.5L544.2,392.5L544.2,392.5z"/>
	<g>
		<path d="M39.8,10.3c-13.3,0-25.7,0.9-37.6,2.6L2,136.9h33.3l0.1-39c3,0.4,6.7,0.5,11.1,0.5c16.7,0,29.5-3.9,38.3-11.7
			c8.7-7.7,13.1-19.3,13.1-34.4C98,24.3,78.6,10.4,39.8,10.3z M62,68.5c-3.6,3.4-9.2,5.2-16.6,5.2c-0.6,0-1.1,0-1.6,0
			c-0.2,0-0.4,0-0.6,0c-2.8,0-5.4-0.1-7.7-0.5l0-22l-1.3-14.3c2.6-0.6,5.2-0.9,7.7-0.9c0.2,0,0.5,0,0.7,0c0.2,0,0.4,0,0.7,0
			c13.6,0,21.1,4.7,22.7,14c0.3,1.2,0.6,2.6,0.7,4C67.2,60.2,65.6,65,62,68.5z"/>
		<path d="M141.3,65H141l0-17.1h-32.5l-0.2,88.9h33.3l0.1-35c0.1-8.6,3.2-15.7,9.7-21.4c6.5-5.7,14.9-8.5,25.4-8.5h3.4l0-23.9h-3.4
			C161.7,48.1,149.8,53.7,141.3,65z"/>
		<path d="M266.7,58.5c-8-8.1-19.3-12.2-34-12.2c-14.6,0-25.9,4.1-34,12.2c-8.1,8.1-12.2,19.4-12.2,33.9c-0.1,14.5,4,25.8,12,33.9
			c8,8.1,19.3,12.2,34,12.2c14.6,0,25.9-4.1,34-12.2c8.1-8.1,12.2-19.4,12.2-33.9C278.7,78,274.7,66.6,266.7,58.5z M246.2,92.5
			c0,8.9-1.2,15-3.3,18.6c-2.1,3.6-5.6,5.4-10.4,5.4s-8.3-1.8-10.5-5.4c-2.2-3.6-3.3-9.8-3.2-18.6c0-8.9,1.2-15,3.3-18.6
			c2.1-3.6,5.6-5.4,10.4-5.4c4.8,0,8.3,1.8,10.5,5.4S246.3,83.7,246.2,92.5z"/>
	</g>
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
