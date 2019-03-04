import React from "react";
import {ComponentDeprecated} from "./component-deprecated";

const {RadioControl, PanelBody, BaseControl, CheckboxControl, TextControl} = wp.components;
const {Fragment} = wp.element;
const {InspectorControls, ColorPalette} = wp.editor;

export const deprecated = [
    {
        attributes: {
            title: {
                source: 'html',
                selector: '.vk_prContent_colTxt_title',
            },
            titleColor: {
                type: 'string',
            },
            content: {
                source: 'html',
                selector: '.vk_prContent_colTxt_text',
            },
            contentColor: {
                type: 'string',
            },
            url: {
                type: 'string',
                default: null,
            },
            buttonType: {
                type: 'string',
                default: '0',
            },
            buttonColor: {
                type: 'string',
                default: 'primary',
            },
            buttonColorCustom: {
                type: 'string',
                default: null,
            },
            buttonText: {
                source: 'html',
                selector: '.vk_button_link_txt',
                default: '',
            },
            buttonTarget: {
                type: 'Boolean',
                default: false,
            },
            Image: {
                type: 'string',
                default: null,
            },
            ImageBorderColor: {
                type: 'string',
                default: null,
            },
            layout: {
                type: 'string',
                default: 'left',
            },
            fontAwesomeIconBefore: {
                type: 'string',
            },
            fontAwesomeIconAfter: {
                type: 'string',
            }
        },

        edit: function ({attributes, className, setAttributes}) {
            const {
                titleColor,
                contentColor,
                url,
                buttonType,
                buttonColor,
                buttonColorCustom,
                buttonText,
                buttonTarget,
                ImageBorderColor,
                layout,
                fontAwesomeIconBefore,
                fontAwesomeIconAfter
            } = attributes;
            return (
                <Fragment>
                    <InspectorControls>
                        <PanelBody title={__('Color Setting', 'vk-blocks')}>
                            <BaseControl label={__('Title Color', 'vk-blocks')}>
                                <ColorPalette
                                    value={titleColor}
                                    onChange={(value) => setAttributes({titleColor: value})}
                                />
                            </BaseControl>
                            <BaseControl label={__('Content Color', 'vk-blocks')}>
                                <ColorPalette
                                    value={contentColor}
                                    onChange={(value) => setAttributes({contentColor: value})}
                                />
                            </BaseControl>
                            <BaseControl
                                label={__('Image Border Color', 'vk-blocks')}
                            >
                                <ColorPalette
                                    value={ImageBorderColor}
                                    onChange={(value) => setAttributes({ImageBorderColor: value})}
                                />
                            </BaseControl>
                        </PanelBody>
                        <PanelBody title={__('Button Setting', 'vk-blocks')}>
                            <BaseControl
                                label={__('Button Text', 'vk-blocks')}
                            >
                                <TextControl
                                    value={buttonText}
                                    onChange={(value) => setAttributes({buttonText: value})}
                                    placeholder={'Input button text.'}
                                />
                            </BaseControl>
                            <BaseControl
                                label={__('Link URL', 'vk-blocks')}
                            >
                                <TextControl
                                    value={url}
                                    onChange={(value) => setAttributes({url: value})}
                                    placeholder={'https://vektor-inc.co.jp/'}
                                />
                            </BaseControl>
                            <CheckboxControl
                                label={__('Open link new tab.', 'vk-blocks')}
                                checked={buttonTarget}
                                onChange={(checked) => setAttributes({buttonTarget: checked})}
                            />
                            <BaseControl label={__('Button Type', 'vk-blocks')}>
                                <RadioControl
                                    selected={buttonType}
                                    options={[
                                        {label: __('Solid', 'vk-blocks'), value: '0'},
                                        {label: __('Ghost', 'vk-blocks'), value: '1'}
                                    ]}
                                    onChange={(value) => setAttributes({buttonType: value})}
                                />
                            </BaseControl>
                            <RadioControl
                                label={__('Default Color:', 'vk-blocks')}
                                selected={buttonColor}
                                options={[
                                    {label: __('Primary', 'vk-blocks'), value: 'primary'},
                                    {label: __('Secondary', 'vk-blocks'), value: 'secondary'},
                                    {label: __('Success', 'vk-blocks'), value: 'success'},
                                    {label: __('Info', 'vk-blocks'), value: 'info'},
                                    {label: __('Warning', 'vk-blocks'), value: 'warning'},
                                    {label: __('Danger', 'vk-blocks'), value: 'danger'},
                                    {label: __('Light', 'vk-blocks'), value: 'light'},
                                    {label: __('Dark', 'vk-blocks'), value: 'dark'},
                                ]}
                                onChange={(value) => setAttributes({buttonColor: value})}
                            />
                            <BaseControl label={__('Button Color', 'vk-blocks')}>
                                <ColorPalette
                                    value={buttonColorCustom}
                                    onChange={(value) => setAttributes({buttonColorCustom: value})}
                                />
                            </BaseControl>
                            <BaseControl
                                label={__('Font Awesome:', 'vk-blocks')}
                                help={<a href={`https://fontawesome.com/icons?d=gallery&m=free`}
                                         target={`_blank`}>{__('Font Awesome icon list', 'vk-blocks')}</a>}
                            >
                                <TextControl
                                    label={__('Before text', 'vk-blocks')}
                                    help={__('Enter Font Awesome Class.This icon will appear before text. Ex) fas fa-arrow-circle-right', 'vk-blocks')}
                                    value={fontAwesomeIconBefore}
                                    onChange={(value) => setAttributes({fontAwesomeIconBefore: value})}
                                    placeholder={'fas fa-arrow-circle-right'}
                                />
                                <TextControl
                                    label={__('After text', 'vk-blocks')}
                                    help={__('Enter Font Awesome Class.This icon will appear after text. Ex) fas fa-external-link-alt', 'vk-blocks')}
                                    value={fontAwesomeIconAfter}
                                    onChange={(value) => setAttributes({fontAwesomeIconAfter: value})}
                                    placeholder={'fas fa-external-link-alt'}
                                />
                            </BaseControl>
                        </PanelBody>
                        <PanelBody title={__('Layout Setting', 'vk-blocks')}>
                            <RadioControl
                                label={__('Layout Type', 'vk-blocks')}
                                selected={layout}
                                options={[
                                    {label: __('Right', 'vk-blocks'), value: 'right'},
                                    {label: __('Left', 'vk-blocks'), value: 'left'}
                                ]}
                                onChange={(value) => setAttributes({layout: value})}
                            />
                        </PanelBody>
                    </InspectorControls>
                    <ComponentDeprecated
                        attributes={attributes}
                        setAttributes={setAttributes}
                        for_={'edit'}
                    />
                </Fragment>
            );
        },


        /**
         * The save function defin className }> which the different attributes should be combined
         * into the final markup, which is then serialized by Gutenberg into post_content.
         *
         * The " save" property must be specified and must be a valid function.
         *
         * @link https://wordpress.org/gutenberg/handbook/block-api/block-edit-save/
         */
        save({attributes, className}) {

            return (
                <ComponentDeprecated
                    attributes={attributes}
                    for_={'save'}
                />
            );
        },
    }
];
