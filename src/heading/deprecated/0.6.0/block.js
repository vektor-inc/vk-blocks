/**
 * heading block type
 *
 */
import React from "react";
import {schema} from './schema';
import HeadingToolbar from './heading-toolbar';



    /**
     * The edit function describes the structure of your block in the context of the editor.
     * This represents what the editor will render when the block is used.
     *
     * The "edit" property must be a valid function.
     *
     * @link https://wordpress.org/gutenberg/handbook/block-api/block-edit-save/
     */
    edit({attributes, setAttributes}) {
        const {level, align, title, titleColor, titleSize, subText, subTextFlag, subTextColor, subTextSize, titleStyle, titleMarginBottom, outerMarginBottom} = attributes;
        const tagName = 'h' + level;

        let setTitleFontSize = (newLevel) => {

            setAttributes({level: newLevel});

            switch (newLevel) {
                case 1:
                    setAttributes({titleSize: 3.6});
                    break;
                case 2:
                    setAttributes({titleSize: 2.8});
                    break;
                case 3:
                    setAttributes({titleSize: 2.2});
                    break;
                case 4:
                    setAttributes({titleSize: 2.0});
                    break;
                case 5:
                    setAttributes({titleSize: 1.8});
                    break;
                case 6:
                    setAttributes({titleSize: 1.6});
                    break;
            }
        };

        return (
            <Fragment>
                <BlockControls>
                    <HeadingToolbar minLevel={2} maxLevel={5} selectedLevel={level} onChange={setTitleFontSize}/>
                </BlockControls>
                <InspectorControls>
                    <PanelBody title={__('Style Settings', 'vk-blocks')}>
                        <SelectControl
                            label={__('Heading style', 'vk-blocks')}
                            value={titleStyle}
                            onChange={(value) => setAttributes({titleStyle: value})}
                            options={[
                                {label: __('Default', 'vk-blocks'), value: 'default'},
                                {label: __('Plain', 'vk-blocks'), value: 'plain'}
                            ]}
                        />
                        <label>{__('Margin bottom size (rem)', 'vk-blocks')}</label>
                        <RangeControl
                            value={outerMarginBottom}
                            onChange={(value) => {setAttributes({outerMarginBottom: value});
                            }}
                            min={-1}
                            max={8}
                            step={0.1}
                        />
                    </PanelBody>
                    <PanelBody title={ __( 'Heading Settings', 'vk-blocks' ) }>
                        <label>{ __( 'Level', 'vk-blocks' ) }</label>
                        <HeadingToolbar minLevel={1} maxLevel={7} selectedLevel={level} onChange={setTitleFontSize}/>
                        <p>{ __( 'Text Alignment' ) }</p>
                        <AlignmentToolbar
                          value={ align }
                          onChange={ ( value ) => {
                            setAttributes( { align: value } );
                          } }
                        />
                        <label>{__('Text size (rem)', 'vk-blocks')}</label>
                        <RangeControl
                            value={titleSize}
                            onChange={(value) => {setAttributes({titleSize: value});
                            }}
                            min={0.5}
                            max={4}
                            step={0.1}
                        />
                        <label>{__('Heading margin bottom size (rem)', 'vk-blocks')}</label>
                        <RangeControl
                            value={titleMarginBottom}
                            onChange={(value) => {setAttributes({titleMarginBottom: value});
                            }}
                            min={-1}
                            max={3}
                            step={0.1}
                        />
                        <ColorPalette
                            value={titleColor}
                            onChange={(value) => setAttributes({titleColor: value})}
                        />
                    </PanelBody>
                    <PanelBody title={ __( 'Sub Text Settings', 'vk-blocks' ) }>
                        <RadioControl
                            label={__('Position', 'vk-blocks')}
                            selected={subTextFlag}
                            options={[
                                {label: __('Display', 'vk-blocks'), value: 'on'},
                                {label: __('Hide', 'vk-blocks'), value: 'off'},
                            ]}
                            onChange={(value) => setAttributes({subTextFlag: value})}
                        />
                      <label>{__('Text size (rem)', 'vk-blocks')}</label>
                      <RangeControl
                          value={subTextSize}
                          onChange={(value) => {setAttributes({subTextSize: value});
                          }}
                          min={0.5}
                          max={3}
                          step={0.1}
                      />
                      <ColorPalette
                          value={subTextColor}
                          onChange={(value) => setAttributes({subTextColor: value})}
                      />
                    </PanelBody>
                </InspectorControls>

                <div
                  className = {`vk_heading vk_heading-style-${titleStyle}`}
                  style={ { marginBottom: outerMarginBottom + `rem` } }
                >
                    <RichText
                        tagName={tagName}
                        value={title}
                        onChange={(value) => setAttributes({title: value})}
                        style={ { color: titleColor, fontSize: titleSize + 'rem',textAlign: align,marginBottom:titleMarginBottom + 'rem' } }
                        className={`vk_heading_title vk_heading_title-style-${titleStyle}`}
                        placeholder={__('Input title…', 'vk-blocks')}
                    />
                    {
                        // サブテキスト
                        (() => {
                            if (subTextFlag === 'on') {
                                return (
                                    <RichText
                                        tagName={'p'}
                                        value={subText}
                                        onChange={(value) => setAttributes({subText: value})}
                                        style={{color: subTextColor, fontSize: subTextSize + 'rem', textAlign: align}}
                                        className={`vk_heading_subtext vk_heading_subtext-style-${titleStyle}`}
                                        placeholder={__('Input sub text…', 'vk-blocks')}
                                    />
                                );
                            }
                        })()
                    }
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
        const { level, align, title, titleColor, titleSize, subText,subTextFlag, subTextColor, subTextSize, titleStyle,titleMarginBottom,outerMarginBottom } = attributes;
        const tagName = 'h' + level;

        return (
            <div
              className = {`vk_heading vk_heading-style-${titleStyle}`}
              style={ { marginBottom: outerMarginBottom + `rem` } }
            >
                <RichText.Content
                    tagName={tagName}
                    value={title}
                    style={ { color: titleColor, fontSize: titleSize + 'rem',textAlign: align,marginBottom:titleMarginBottom + 'rem' } }
                    className={`vk_heading_title vk_heading_title-style-${titleStyle}`}
                />
                {
                    // サブテキスト
                    (() => {
                        if (subTextFlag === 'on') {
                            return (
                                <RichText.Content
                                    tagName={'p'}
                                    value={subText}
                                    style={{color: subTextColor, fontSize: subTextSize + 'rem', textAlign: align}}
                                    className={`vk_heading_subtext vk_heading_subtext-style-${titleStyle}`}
                                />
                            );
                        }
                    })()
                }
            </div>
        );
    },
});
