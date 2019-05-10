import React from 'react';
const {RichText} = wp.editor;
const {__} = wp.i18n; // Import __() from wp.i18n


export default class NewComponent extends React.Component {

    render() {
        let {
            vk_staff_text_name,
            vk_staff_text_caption,
            vk_staff_text_position,
            vk_staff_text_profileTitle,
            vk_staff_text_profileText,
            vk_staff_photo_image
        } = this.props.attributes;
        let setAttributes = this.props.setAttributes;
        let className = this.props.className;
        let for_ = this.props.for_;

        return (
            <div className={`${className} vk_staff`}>
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
                    {/*<img className="vk_staff_photo_image" src="https://www.vektor-inc.co.jp/images/photo_ishikawa.jpg"*/}
                    {/*alt="石川栄和">*/}
                </div>
            </div>
        );
    }
}
