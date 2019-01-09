import "./import.js";

export class PrContent extends React.Component {

    render() {

        let layout = this.props.layout;
        let Image = this.props.Image;
        let titleColor = this.props.titleColor;
        let contentColor = this.props.contentColor;
        let urlType = this.props.urlType;
        let buttonText = this.props.buttonText;

        return (
            <div className="vk_pr-content">
                <div className="vk_pr-content_container">
                    <div className={`row ${layout}`}>
                        <div className="col-sm-6 vk_pr-content_col_img">
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
                        </div>
                        <div className="col-sm-6 vk_pr-content_col_text">
                            <RichText
                                tagName="h3"
                                className={'vk_pr-content_title'}
                                onChange={(value) => setAttributes({title: value})}
                                value={title}
                                placeholder={__('Input title.', 'vk-blocks')}
                                style={{color: titleColor}}
                            />
                            <RichText
                                tagName="p"
                                onChange={(value) => setAttributes({content: value})}
                                value={content}
                                placeholder={__('Input content.', 'vk-blocks')}
                                style={{color: contentColor}}
                            />
                            {
                                buttonType === '1' ?

                                    <div className="vk_pr-content_btn">
                                        <a href={url}
                                           className="btn btn-block btn-lg btn-primary"
                                           target={urlType}
                                           style={{backgroundColor: buttonColor,border:`1px solid ${buttonColor}`}}
                                        >
                                            <RichText
                                                tagName="p"
                                                onChange={(value) => setAttributes({buttonText: value})}
                                                value={buttonText}
                                                placeholder={__('Input button text.', 'vk-blocks')}
                                            />
                                        </a>
                                    </div>
                                    :
                                    <div className="vk_pr-content_btn">
                                        <a href={url}
                                           className="btn btn-block btn-lg btn-primary btn-ghost"
                                           target={urlType}
                                           style={{backgroundColor: '#fff', border: `1px solid ${buttonColor}`, color:`${buttonColor}`}}
                                        >
                                            <RichText
                                                tagName="p"
                                                onChange={(value) => setAttributes({buttonText: value})}
                                                value={buttonText}
                                                placeholder={__('Input button text.', 'vk-blocks')}
                                            />
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
