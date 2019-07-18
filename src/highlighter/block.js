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
        class: 'class'
    },
    edit(props) {
        const {value, isActive, onChange} = props;
        const onToggle = () => onChange(
            toggleFormat(value, {type: name})
        );

        // let activeColor;
        // // 設定したカラーパレーットを読み込む
        // const colorSet = select('core/editor').getEditorSettings().colors;
        //
        // // 使用しているカラーを選択する
        // if (isActive) {
        //     const activeFormat = getActiveFormat(value, type);
        //     activeColor = activeFormat.attributes.data;
        // }

        return (
            <Fragment>
                {/*<InspectorControls>*/}
                {/*    <PanelColorSettings*/}
                {/*        title={__('Highlighter', 'vk-blocks')}*/}
                {/*        initialOpen={false}*/}
                {/*        colorSettings={[*/}
                {/*            {*/}
                {/*                value: activeColor,*/}
                {/*                onChange: (color) => {*/}
                {/*                    if (color) {*/}
                {/*                        // 選択しているカラーを取得*/}
                {/*                        const colorObject = getColorObjectByColorValue(colorSet, color);*/}
                {/*                        onChange(applyFormat(value, {*/}
                {/*                            type: {name},*/}
                {/*                            attributes: {*/}
                {/*                                data: color,*/}
                {/*                                class: `has-${colorObject.slug}`*/}
                {/*                            }*/}
                {/*                        }));*/}
                {/*                        return*/}
                {/*                    }*/}
                {/*                    onChange(removeFormat(value, type))*/}
                {/*                },*/}
                {/*                label: '選択色'*/}
                {/*            }*/}
                {/*        ]}*/}
                {/*    />*/}
                {/*</InspectorControls>*/}
                <RichTextToolbarButton
                    icon={BlockIcon}
                    title={__('Highlighter', 'vk-blocks')}
                    onClick={onToggle}
                    isActive={isActive}
                />
            </Fragment>
        );
    },
});
