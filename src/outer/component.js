import React from 'react';
import {componentDivider} from './component-divider';

const {InnerBlocks} = wp.editor;

//hexカラーコード定義をrgbaに変換
function hex2rgba (hex, alpha) {

    // ロングバージョンの場合（例：#FF0000）
    let r = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    let c = null;
    if (r) {
        c = r.slice(1,4).map(function(x) { return parseInt(x, 16) })
    }
    // ショートバージョンの場合（例：#F00）
    r = hex.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
    if (r) {
        c = r.slice(1,4).map(function(x) { return 0x11 * parseInt(x, 16) })
    }
    // 該当しない場合は、nullを返す.
    if (!c) {
        return null
    }
    return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`
}

export class Component extends React.Component {

    render() {

        let is_padding = this.props.is_padding;
        let is_parallax = this.props.is_parallax;
        let outerWidth = this.props.outerWidth;
        let bgColor = this.props.bgColor;
        let opacity = this.props.opacity;
        let bgImage = this.props.bgImage;
        let upperTiltLevel = this.props.upperTilt;
        let lowerTiltLevel = this.props.lowerTilt;
        let tiltBgColor = this.props.tiltBgColor;
        let dividerType = this.props.dividerType;
        let for_ = this.props.for_;
        let padding;
        let parallax;
        let classWidth;
        let elm;
        let containerClass;
        let whichSideUpper;
        let whichSideLower;

        //幅のクラス切り替え
        classWidth = ` vk_outer-width-${outerWidth}`;

        //hexからrgbaに変換
        if(bgColor){
            bgColor = hex2rgba(bgColor,opacity);
        }else {
            //背景色をクリアした時は、白に変更
            bgColor = hex2rgba('#fff',opacity);
        }

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

        //上側セクションの傾き切り替え
        if (upperTiltLevel) {
            whichSideUpper = 'upper';
        }

        //下側セクションの傾き切り替え
        if (lowerTiltLevel) {
            whichSideLower = 'lower';
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
                className={'vk_outer' + classWidth + padding + parallax}
                style={{
                    background: `linear-gradient(${bgColor}, ${bgColor}), url(${bgImage})`,
                }}
            >
                    {
                        componentDivider(upperTiltLevel, tiltBgColor, whichSideUpper,dividerType)
                    }
                <div className={containerClass}>
                    {elm}
                </div>
                {
                    componentDivider(lowerTiltLevel, tiltBgColor, whichSideLower,dividerType)
                }
            </div>
        );
    }
}