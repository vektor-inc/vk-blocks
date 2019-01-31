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
		<g>
			<path d="M69.5,42.2c-2,0-4.1,0.2-6.3,0.7v29.5c1.9,0.3,3.9,0.4,6.3,0.4c6,0,10.7-1.4,13.9-4.2c3.2-2.8,4.9-6.7,4.9-11.8
				C88.3,47.1,82,42.2,69.5,42.2z"/>
		</g>
		<g>
			<path d="M70.6,42.2c-2,0-4.1,0.2-6.3,0.7l-2.8,29.5c1.8,0.3,3.9,0.4,6.2,0.4c6,0,10.8-1.4,14.3-4.2c3.5-2.8,5.5-6.7,6-11.8
				C88.9,47.1,83.1,42.2,70.6,42.2z"/>
			<path d="M222.1,68.6c-3.9,0-6.9,1.5-8.9,4.4c-2,2.9-3.4,7.9-4.1,15.1c-0.7,7.1-0.3,12.2,1.2,15.1c1.5,2.9,4.2,4.4,8.1,4.4
				s6.9-1.5,8.9-4.4c2-2.9,3.4-7.9,4.1-15.1c0.7-7.1,0.3-12.2-1.2-15.1C228.7,70.1,226,68.6,222.1,68.6z"/>
			<path d="M278.4,1.5H8.2c-3.5,0-6.4,2.9-6.4,6.4v131.3c0,3.5,2.9,6.4,6.4,6.4h270.2c3.5,0,6.4-2.9,6.4-6.4V7.9
				C284.7,4.4,281.9,1.5,278.4,1.5z M113.8,55.4c-1.2,12.3-5.6,21.7-13.3,28c-7.7,6.3-18.4,9.5-32,9.5c-3.6,0-6.6-0.1-9-0.4l-3,31.7
				H29.4l9.6-100.8c9.8-1.4,20-2.1,30.8-2.1C101.3,21.4,116,32.7,113.8,55.4z M179.3,71.4h-2.8c-8.5,0-15.6,2.3-21.3,6.9
				c-5.7,4.6-8.8,10.4-9.5,17.4l-2.7,28.5h-27.1l6.9-72.3h26.4l-1.3,13.9h0.3C155.9,56.6,166,52,178.3,52h2.8L179.3,71.4z
				 M257.8,88.1c-1.1,11.8-5.3,21-12.5,27.6c-7.2,6.6-16.7,9.9-28.6,9.9c-11.9,0-20.8-3.3-26.7-9.9c-5.9-6.6-8.4-15.8-7.2-27.6
				c1.1-11.8,5.3-21,12.5-27.6c7.2-6.6,16.7-9.9,28.6-9.9c11.9,0,20.8,3.3,26.7,9.9C256.5,67.1,258.9,76.3,257.8,88.1z"/>
		</g>
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
