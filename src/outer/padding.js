import React from 'react';

const {InnerBlocks} = wp.editor;

export class Padding extends React.Component {

    render() {

        let is_padding = this.props.is_padding;
        let is_parallax = this.props.is_parallax;
        let outerWidth = this.props.outerWidth;
        let bgColor = this.props.bgColor;
        let bgImage = this.props.bgImage;
        let for_ = this.props.for_;
        let padding;
        let parallax;
        let classWidth;
        let elm;
        let containerClass;

				//幅のクラス切り替え
        classWidth = ` vk_outer-width-${outerWidth}`;

        //parallaxのクラス切り替え
        if (is_parallax === '1') {
            parallax = ' vk_outer-parallax';
        } else {
            parallax = ' vk_outer-parallax-none';
        }

        //paddingのクラス切り替え
        if(is_padding === '1'){
            padding = ' vk_outer-padding';
        }else {
            padding = ' vk_outer-padding-none';
        }

        //編集画面とサイト上の切り替え
        if(for_ === 'edit'){
            elm = <InnerBlocks/>;
        }else if('save'){
            elm = <InnerBlocks.Content/>;
            containerClass = 'vk_outer_container';
        }

        return (
            <div
                className={'vk_outer' + classWidth + parallax + padding}
                style={{backgroundColor: bgColor, backgroundImage: `url(${bgImage})`}}
            >
                <div
                    className={containerClass}>
                {elm}
                </div>
            </div>
        );
    }
}
