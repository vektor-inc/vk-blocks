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

        let {
            bgColor,
            bgImage,
            bgPosition,
            outerWidth,
            padding_left_and_right,
            padding_top_and_bottom,
            opacity,
            upper_tilt_level,
            lower_tilt_level,
            tiltBgColor,
            dividerType
        } = this.props.attributes;

        let for_ = this.props.for_;
        let classPaddingLR;
        let classPaddingVertical;
        let classBgPosition;
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

        //classBgPositionのクラス切り替え
        if (bgPosition === 'parallax') {
            classBgPosition = ' vk_outer-bgPosition-parallax vk-prlx';
				} else if (bgPosition === 'fixed') {
		        classBgPosition = ' vk_outer-bgPosition-fixed';
        } else {
            classBgPosition = ' vk_outer-bgPosition-normal';
        }

				//classPaddingLRのクラス切り替え
        if(padding_left_and_right === '1'){
            classPaddingLR = ' vk_outer-paddingLR-use';
        } else {
            classPaddingLR = ' vk_outer-paddingLR-none';
        }

        //classPaddingVerticalのクラス切り替え
        if(padding_top_and_bottom === '1'){
            classPaddingVertical = ' vk_outer-paddingVertical-use';
        } else {
            classPaddingVertical = ' vk_outer-paddingVertical-none';
        }

        //上側セクションの傾き切り替え
        if (upper_tilt_level) {
            whichSideUpper = 'upper';
        }

        //下側セクションの傾き切り替え
        if (lower_tilt_level) {
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
                className={ 'vk_outer' + classWidth + classPaddingLR + classPaddingVertical + classBgPosition }
                style={{
                    background: `linear-gradient(${bgColor}, ${bgColor}), url(${bgImage})`,
                }}
            >
                    {
                        componentDivider(upper_tilt_level, tiltBgColor, whichSideUpper,dividerType)
                    }
                <div className={containerClass}>
                    {elm}
                </div>
                {
                    componentDivider(lower_tilt_level, tiltBgColor, whichSideLower,dividerType)
                }
            </div>
        );
    }
}
