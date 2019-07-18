/**
 * highlighter block type
 *
 */

const {__} = wp.i18n; // Import __() from wp.i18n
const {registerFormatType, toggleFormat, applyFormat, removeFormat, getActiveFormat} = window.wp.richText;
const {RichTextToolbarButton, RichTextShortcut, InspectorControls, ColorPalette, PanelColorSettings, getColorObjectByColorValue} = wp.editor;
const {RangeControl, RadioControl, PanelBody, Button, PanelColor, BaseControl} = wp.components;
const {Fragment} = wp.element;
const {
    select
} = wp.data;
const name = 'vk-blocks/highlighter';
const BlockIcon = 'arrow-down';


registerFormatType(name, {
    title: __('Highlighter', 'vk-blocks'),
    tagName: 'span',
    className: 'vk_highlighter',
    attributes: {
        data: 'data-color',
        style: 'style',
    },
    edit(props) {
        const {value, isActive, onChange} = props;
        const onToggle = () => onChange(
            toggleFormat( value, {
                type: name,
                attributes: {
                    // style: 'text-decoration: underline;',
                    style: `background: linear-gradient(transparent 60%,rgba(255,253,107,.7) 0);`,
                },
            } )
        );

        let activeColor;
        // // 設定したカラーパレーットを読み込む
        // const colorSet = select('core/editor').getEditorSettings().colors;

        // 使用しているカラーを選択する
        if (isActive) {
            const activeFormat = getActiveFormat(value, name);
            activeColor = activeFormat.attributes.data;
        }

        return (
            <Fragment>
                <InspectorControls>
                    <PanelColorSettings
                        title={__('Highlighter', 'vk-blocks')}
                        initialOpen={true}
                        colorSettings={[
                            {
                                value: activeColor,
                                onChange: (color) => {

                                    console.log(color);
                                    if (color) {
                                        // 選択しているカラーを取得
                                        // const colorObject = getColorObjectByColorValue(colorSet, color);
                                        onChange(applyFormat(value, {
                                            name,
                                            attributes: {
                                                data: color,
                                                // style: `background: linear-gradient(transparent 60%,rgba(255,253,107,.7) 0);`,
                                                // class: `has-${color.slug}`
                                            }
                                        }));
                                        return
                                    }
                                    onChange(removeFormat(value, name))
                                },
                                label: __('Selected Color', 'vk-blocks')
                            }
                        ]}
                    />
                </InspectorControls>
                <RichTextShortcut
                    type="primary"
                    character="h"
                    onUse={ onToggle }
                />
                <RichTextToolbarButton
                    icon={BlockIcon}
                    title={__('Highlighter', 'vk-blocks')}
                    onClick={onToggle}
                    isActive={isActive}
                    shortcutType="primary"
                    shortcutCharacter="h"
                />
            </Fragment>
        );
    },
});
