import React from 'react';

const {__} = wp.i18n; // Import __() from wp.i18n
const {RichText, MediaUpload} = wp.editor;
const {Button} = wp.components;

export default class NewComponent extends React.Component {

    render() {
        let {
            vk_staff_text_name,
            vk_staff_text_caption,
            vk_staff_text_position,
            vk_staff_text_profileTitle,
            vk_staff_text_profileText,
            vk_staff_photo_image,
            vk_staff_photo_image_alt
        } = this.props.attributes;
        let setAttributes = this.props.setAttributes;
        let className = this.props.className;
        let for_ = this.props.for_;
        let returnELm = '';

        if (for_ === 'edit') {

            returnELm = <div className={`${className} vk_staff`}>
                <div className={`vk_staff_text`}>
                    <RichText
                        tagName="h2"
                        className={ 'vk_staff_text_name' }
                        onChange={ ( value ) => setAttributes( { vk_staff_text_name: value } ) }
                        value={ vk_staff_text_name }
                        placeholder={__('Taro Yamada', 'vk-blocks') }
                    />
                    <RichText
                        tagName="p"
                        className={ 'vk_staff_text_caption' }
                        onChange={ ( value ) => setAttributes( { vk_staff_text_caption: value } ) }
                        value={ vk_staff_text_caption }
                        placeholder={__('Caption', 'vk-blocks') }
                    />
                    <RichText
                        tagName="p"
                        className={ 'vk_staff_text_position' }
                        onChange={ ( value ) => setAttributes( { vk_staff_text_position: value } ) }
                        value={ vk_staff_text_position }
                        placeholder={__('Vektor,Inc. CEO', 'vk-blocks') }
                    />
                    <RichText
                        tagName="h3"
                        className={ 'vk_staff_text_profileTitle' }
                        onChange={ ( value ) => setAttributes( { vk_staff_text_profileTitle: value } ) }
                        value={ vk_staff_text_profileTitle }
                        placeholder={__('Profile', 'vk-blocks') }
                    />
                    <RichText
                        tagName="p"
                        className={ 'vk_staff_text_profileText' }
                        onChange={ ( value ) => setAttributes( { vk_staff_text_profileText: value } ) }
                        value={ vk_staff_text_profileText }
                        placeholder={__('ProfileText', 'vk-blocks') }
                    />
                </div>
                <div className={`vk_staff_photo`}>
                    <MediaUpload
                        onSelect={(value) => setAttributes({vk_staff_photo_image: value.sizes.full.url})}
                        type="image"
                        className={'vk_staff_photo_image'}
                        value={vk_staff_photo_image}
                        render={({open}) => (
                            <Button
                                onClick={open}
                                className={vk_staff_photo_image ? 'image-button' : 'button button-large'}
                            >
                                {!vk_staff_photo_image ? __('Select image', 'vk-blocks') :
                                    <img className={'vk_balloon_icon_image'} src={vk_staff_photo_image}
                                         alt={__(vk_staff_photo_image_alt, 'vk-blocks')}/>}
                            </Button>
                        )}
                    />
                </div>
            </div>;
        } else if (for_ === 'save') {

            returnELm = <div className={`${className} vk_staff`}>
                <div className={`vk_staff_text`}>
                    <RichText.content
                        tagName="h2"
                        className={'vk_staff_text_name'}
                        onChange={(value) => setAttributes({vk_staff_text_name: value})}
                        value={vk_staff_text_name}
                        placeholder={__('Taro Yamada', 'vk-blocks')}
                    />
                    <RichText.content
                        tagName="p"
                        className={'vk_staff_text_caption'}
                        onChange={(value) => setAttributes({vk_staff_text_caption: value})}
                        value={vk_staff_text_caption}
                        placeholder={__('Caption', 'vk-blocks')}
                    />
                    <RichText.content
                        tagName="p"
                        className={'vk_staff_text_position'}
                        onChange={(value) => setAttributes({vk_staff_text_position: value})}
                        value={vk_staff_text_position}
                        placeholder={__('Vektor,Inc. CEO', 'vk-blocks')}
                    />
                    <RichText.content
                        tagName="h3"
                        className={'vk_staff_text_profileTitle'}
                        onChange={(value) => setAttributes({vk_staff_text_profileTitle: value})}
                        value={vk_staff_text_profileTitle}
                        placeholder={__('Profile', 'vk-blocks')}
                    />
                    <RichText.content
                        tagName="p"
                        className={'vk_staff_text_profileText'}
                        onChange={(value) => setAttributes({vk_staff_text_profileText: value})}
                        value={vk_staff_text_profileText}
                        placeholder={__('ProfileText', 'vk-blocks')}
                    />
                </div>
                <div className={`vk_staff_photo`}>
                    {!vk_staff_photo_image ? __('Select image', 'vk-blocks') :
                        <img className={'vk_balloon_icon_image'} src={vk_staff_photo_image}
                             alt={__(vk_staff_photo_image_alt, 'vk-blocks')}/>})}
                    />
                </div>
            </div>;
        }
        return (returnELm);
    }
}
