import React from 'react';

const {__} = wp.i18n; // Import __() from wp.i18n
const {RichText, MediaUpload} = wp.editor;
const {Button} = wp.components;

export class NewComponent extends React.Component {

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
                        placeholder={__('Your Name', 'vk-blocks') }
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
                        placeholder={__('Job title', 'vk-blocks') }
                    />
                    <RichText
                        tagName="h3"
                        className={ 'vk_staff_text_profileTitle' }
                        onChange={ ( value ) => setAttributes( { vk_staff_text_profileTitle: value } ) }
                        value={ vk_staff_text_profileTitle }
                        placeholder={__('Profile Title', 'vk-blocks') }
                    />
                    <RichText
                        tagName="p"
                        className={ 'vk_staff_text_profileText' }
                        onChange={ ( value ) => setAttributes( { vk_staff_text_profileText: value } ) }
                        value={ vk_staff_text_profileText }
                        placeholder={__('Profile Content', 'vk-blocks') }
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
                                    <img className={'vk_staff_photo_image'} src={vk_staff_photo_image}
                                         alt={__(vk_staff_photo_image_alt, 'vk-blocks')}/>}
                            </Button>
                        )}
                    />
                </div>
            </div>;

        } else if (for_ === 'save') {

            returnELm = <div className={`${className} vk_staff`}>
                <div className={`vk_staff_text`}>
                    <RichText.Content
                        tagName="h2"
                        className={'vk_staff_text_name'}
                        value={vk_staff_text_name}/>
                    <RichText.Content
                        tagName="p"
                        className={'vk_staff_text_caption'}
                        value={vk_staff_text_caption}
                    />
                    <RichText.Content
                        tagName="p"
                        className={'vk_staff_text_position'}
                        value={vk_staff_text_position}
                    />
                    <RichText.Content
                        tagName="h3"
                        className={'vk_staff_text_profileTitle'}
                        value={vk_staff_text_profileTitle}
                    />
                    <RichText.Content
                        tagName="p"
                        className={'vk_staff_text_profileText'}
                        value={vk_staff_text_profileText}
                    />
                </div>
                {vk_staff_photo_image ?
                    <div className={`vk_staff_photo`}>
                                <img className={'vk_staff_photo_image'} src={vk_staff_photo_image} alt={
                                    vk_staff_photo_image_alt ? __(vk_staff_photo_image_alt, 'vk-blocks')
                                        :
                                        ""
                                }/>
                    </div>
                    : ''
                }
            </div>;
        }
        return (returnELm);
    }
}
