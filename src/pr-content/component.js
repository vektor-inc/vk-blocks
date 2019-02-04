import React from "react";
import {Fontawesome} from "./component-fontawesome";

const {__} = wp.i18n; // Import __() from wp.i18n
const {Button} = wp.components;
const {MediaUpload} = wp.editor;
let {RichText} = wp.editor;

export class Component extends React.Component {

    render() {

        const attributes = this.props.attributes;
        const {
            title,
            titleColor,
            content,
            contentColor,
            url,
            buttonType,
						buttonColor,
            buttonColorCustom,
            buttonText,
            buttonTarget,
            Image,
            ImageBorderColor,
            layout,
            fontAwesomeIconBefore,
            fontAwesomeIconAfter
        } = attributes;
        let setAttributes = this.props.setAttributes;
        let for_ = this.props.for_;
				let containerClass = '';
				let aClass = '';
				let aStyle = {};

				containerClass = 'vk_button';
				aClass = `vk_button_link vk_brContent_btn btn btn-block btn-lg`;

				if (buttonColorCustom) {
						containerClass = '${containerClass} vk_button_color-custom';
            aClass = `${aClass} btn-primary`;

            // 塗り
            if (buttonType === '0') {
                aStyle = {
                    backgroundColor: buttonColorCustom,
                    border: `1px solid ${buttonColorCustom}`
                };
            // 塗りなし
            } else if (buttonType === '1') {
                aStyle = {
                    backgroundColor: 'transparent',
                    border: '1px solid ' + buttonColorCustom,
                    color: buttonColorCustom
                };
            }

				// カスタムカラーじゃない場合
        } else if (!buttonColorCustom) {

            // 塗り
            if (buttonType === '0') {
                aClass = `${aClass} btn-${buttonColor}`;
                aStyle = null;
            // 塗りなし
            } else if (buttonType === '1') {
                aClass = `${aClass} btn-outline-${buttonColor}`;
                aStyle = null;
            }

        }

        return (
            <div className="vk_prContent">
                <div className="vk_prContent_container">
                    <div className={`row ${layout}`}>
                        <div className="col-sm-6 vk_prContent_col_img">
                            {for_ === 'edit' ?
                                <MediaUpload
                                    onSelect={(value) => setAttributes({Image: value.sizes.full.url})}
                                    type=" image"
                                    value={Image}
                                    render={({open}) => (
                                        <Button
                                            onClick={open}
                                            className={Image ? 'image-button' : 'button button-large'}
                                        >
                                            {!Image ? __('Select image', 'vk-blocks') :
                                                <img
                                                    className={'vk_prContent_media_image'}
                                                    src={Image}
                                                    alt={__('Upload image', 'vk-blocks')}
                                                    style={{border:`1px solid ${ImageBorderColor}`}}
                                                />}
                                        </Button>
                                    )}
                                />
                                :
                                !Image ? __('Select image', 'vk-blocks') :
                                    <img
                                        className={'vk_prContent_media_image'}
                                        src={Image}
                                        alt={__('Upload image', 'vk-blocks')}
                                        style={{border: `1px solid ${ImageBorderColor}`}}
                                    />
                            }
                        </div>
                        <div className="col-sm-6 vk_prContent_col_text">
                            {
                                (() => {
                                    if (for_ === 'edit') {
                                        return (
                                            <div>
                                                <RichText
                                                    tagName="h3"
                                                    className={'vk_prContent_title'}
                                                    onChange={(value) => setAttributes({title: value})}
                                                    value={title}
                                                    placeholder={__('Input title.', 'vk-blocks')}
                                                    style={{color: titleColor}}
                                                />
                                                < RichText
                                                    tagName="p"
																										className={'vk_prContent_text'}
                                                    onChange={(value) => setAttributes({content: value})}
                                                    value={content}
                                                    placeholder={__('Input content.', 'vk-blocks')}
                                                    style={{color: contentColor}}
                                                />
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div>
                                                <RichText.Content
                                                    tagName="h3"
                                                    value={title}
                                                    className={'vk_prContent_title'}
                                                    style={{color: titleColor}}
                                                />
                                                <RichText.Content
                                                    tagName="p"
																										className={'vk_prContent_text'}
                                                    value={content}
                                                    style={{color: contentColor}}
                                                />
                                            </div>);
                                    }
                                })()
                            }
                            {

                                //ボタンテキストが入力されるとボタンを表示。
                                (() => {
                                    if (buttonText !== '' && buttonText !== undefined ) {
                                        return (
																					<div className={containerClass}>
                                            <a href={url}
                                               className={aClass}
                                               target={buttonTarget? '_blank':null}
                                               style={aStyle}
                                            >
                                                <Fontawesome
                                                    attributes={attributes}
                                                />
                                            </a>
																					</div>
                                        );
                                    }
                                })()
                            }
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
