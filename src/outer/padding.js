import React from 'react';
const {InnerBlocks} = wp.editor;

export class Padding extends React.Component {

    render() {

        let is_padding = this.props.is_padding;
        let bgColor = this.props.bgColor;
        let bgImage = this.props.bgImage;
        let style = '';

        if(is_padding === '1'){
            style =  'vk_outer vk_outer-padding';
        }else {
            style =  'vk_outer vk_outer-padding-none';
        }

        return (
            <div
                className={style}
                style={{backgroundColor :bgColor, backgroundImage:`url(${bgImage})`}}
            >
                <InnerBlocks/>
            </div>
        );
    }
}
