import React from "react";

const {__} = wp.i18n; // Import __() from wp.i18n
const {Button} = wp.components;
const {MediaUpload} = wp.editor;
let {RichText} = wp.editor;

export class Component extends React.Component {

    render() {

        const {
            title,
            titleColor,
            content,
            contentColor,
            url,
            buttonType,
            buttonColor,
            buttonText,
            urlType,
            Image,
            ImageBorderColor,
            layout,
        } = this.props.attributes;
        let setAttributes = this.props.setAttributes;
        let for_ = this.props.for_;

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
                                                    className={'vk_pr_content_media_image'}
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
                                        className={'vk_pr_content_media_image'}
                                        src={Image}
                                        alt={__('Upload image', 'vk-blocks')}
                                        style={{border: `1px solid ${ImageBorderColor}`}}
                                    />
                            }
                        </div>
                        <div className="col-sm-6 vk_prContent_col_text">

                            {
                                for_ === 'edit' ?
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
                                onChange={(value) => setAttributes({content: value})}
                                value={content}
                                placeholder={__('Input content.', 'vk-blocks')}
                                style={{color: contentColor}}
                                />
                                    </div>
                                    :
                                    <div>
                                        <RichText.Content
                                            tagName="h3"
                                            value={title}
                                            className={'vk_prContent_title'}
                                            style={{color: titleColor}}
                                        />
                                        <RichText.Content
                                            tagName="p"
                                            value={content}
                                            style={{color: contentColor}}
                                        />
                                    </div>
                            }
                            {
                                buttonType === '1' ?

                                    <div className="vk_prContent_btn">
                                        <a href={url}
                                           className="btn btn-block btn-lg btn-primary"
                                           target={urlType}
                                           style={{backgroundColor: buttonColor,border:`1px solid ${buttonColor}`,color:`#ffffff`}}
                                        >
                                            {for_ === 'edit' ?
                                                <RichText
																										tagName="span"
																										className="vk_prContent_btn_txt"
                                                    onChange={(value) => setAttributes({buttonText: value})}
                                                    value={buttonText}
                                                    placeholder={__('Input button text.', 'vk-blocks')}
                                                />
                                                :
                                                <RichText.Content
																										tagName="span"
																										className="vk_prContent_btn_txt"
                                                    value={buttonText}
                                                />
                                            }
                                        </a>
                                    </div>
                                    :
                                    <div className="vk_prContent_btn">
                                        <a href={url}
                                           className="btn btn-block btn-lg btn-primary btn-ghost"
                                           target={urlType}
                                           style={{backgroundColor: '#fff', border: `1px solid ${buttonColor}`, color:`${buttonColor}`}}
                                        >
                                            {for_ === 'edit' ?
                                                <RichText
                                                    tagName="span"
                                                    className="vk_prContent_btn_txt"
                                                    onChange={(value) => setAttributes({buttonText: value})}
                                                    value={buttonText}
                                                    placeholder={__('Input button text.', 'vk-blocks')}
                                                />
                                                :
                                                <RichText.Content
																										tagName="span"
                                                    className="vk_prContent_btn_txt"
                                                    value={buttonText}
                                                />
                                            }
                                        </a>
                                    </div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
