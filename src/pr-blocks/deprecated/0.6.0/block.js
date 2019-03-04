import React from "react";
const {__} = wp.i18n; // Import __() from wp.i18n
const {RadioControl, PanelBody, Button, BaseControl, CheckboxControl, TextControl} = wp.components;
const {Fragment} = wp.element;
const {RichText, InspectorControls, MediaUpload, ColorPalette} = wp.editor;

function set_attributes(number) {

    var attributes = {};

    for (var i = 1; i <= number; i++) {

        attributes['heading' + i] = {
            type: 'string',
            source: 'html',
            selector: 'h1.vk_prBlocks_item_title-' + i,
        };
        attributes['content' + i] = {
            type: 'string',
            source: 'html',
            selector: 'p.vk_prBlocks_item_summary-' + i,
        };
        attributes['url' + i] = {
            type: 'string',
            default: null,
        };
        attributes['urlOpenType' + i] = {
            type: 'Boolean',
            default: false,
        };
        attributes['icon' + i] = {
            type: 'string',
            default: 'fas fa-file',
        };
        attributes['color' + i] = {
            type: 'string',
            default: '#0693e3',
        };
        attributes['bgType' + i] = {
            type: 'string',
            default: '0',
        };
        attributes['insertImage' + i] = {
            type: 'string',
            default: null,
        };
    }

    return attributes;
}

export const version0_6_0 = [
    {
        attributes: set_attributes(4),
        edit({attributes, setAttributes}) {

            const {
                heading1,
                heading2,
                heading3,
                content1,
                content2,
                content3,
                url1,
                url2,
                url3,
                urlOpenType1,
                urlOpenType2,
                urlOpenType3,
                icon1,
                icon2,
                icon3,
                color1,
                color2,
                color3,
                bgType1,
                bgType2,
                bgType3,
                insertImage1,
                insertImage2,
                insertImage3
            } = attributes;

            return [
                <Fragment>
                    <InspectorControls>

                        <PanelBody title={__('PR Block1 Setting', 'vk-blocks')}>
                            <BaseControl
                                label={__('Link URL:', 'vk-blocks')}
                            >
                                <TextControl
                                    value={url1}
                                    onChange={(value) => setAttributes({url1: value})}
                                />
                                <CheckboxControl
                                    label={__('Open link new tab.', 'vk-blocks')}
                                    checked={urlOpenType1}
                                    onChange={(checked) => setAttributes({urlOpenType1: checked})}
                                />
                            </BaseControl>
                            <BaseControl
                                label={__('Icon 1', 'vk-blocks')}

                            >
                                <TextControl
                                    label={__('Class name of the Font Awesome icon font you want to use:', 'vk-blocks')}
                                    value={icon1}
                                    onChange={(value) => setAttributes({icon1: value})}
                                    placeholder={'fas fa-file'}
                                    help = { <a href={`https://fontawesome.com/icons?d=gallery&m=free`} target={`_blank`}>{__('Font Awesome icon list', 'vk-blocks')}</a> }
                                />
                                <ColorPalette
                                    value={color1}
                                    onChange={(value) => {
                                        if (value){
                                            setAttributes({color1: value})
                                        } else {
                                            setAttributes({color1: '#0693e3'})
                                            setAttributes({bgType1: '0'})
                                        }
                                    }}
                                />
                                <RadioControl
                                    label={__('Icon Background:', 'vk-blocks')}
                                    selected={bgType1}
                                    options={[
                                        {label: __('Solid color', 'vk-blocks'), value: '0'},
                                        {label: __('No background', 'vk-blocks'), value: '1'},
                                    ]}
                                    onChange={(value) => setAttributes({ bgType1: value })}
                                />
                            </BaseControl>
                            <BaseControl
                                label={__('PR Image 1', 'vk-blocks')}
                                help={__('When you have an image. Image is displayed with priority', 'vk-blocks')}
                            >
                                <MediaUpload
                                    onSelect={(value) => setAttributes({insertImage1: value.url})}
                                    type="image"
                                    value={insertImage1}
                                    render={({open}) => (
                                        <Button
                                            onClick={open}
                                            className={insertImage1 ? 'image-button' : 'button button-large'}
                                        >
                                            {!insertImage1 ? __('Select image', 'vk-blocks') :
                                                <img className={'icon-image'} src={insertImage1}
                                                     alt={__('Upload image', 'vk-blocks')}/>}
                                        </Button>
                                    )}
                                />
                            </BaseControl>
                        </PanelBody>
                        <PanelBody title={__('PR Block2 Setting', 'vk-blocks')}>
                            <BaseControl
                                label={__('Link URL:', 'vk-blocks')}
                            >
                                <TextControl
                                    value={url2}
                                    onChange={(value) => setAttributes({url2: value})}
                                />
                                <CheckboxControl
                                    label={__('Open link new tab.', 'vk-blocks')}
                                    checked={urlOpenType2}
                                    onChange={(checked) => setAttributes({urlOpenType2: checked})}
                                />
                            </BaseControl>
                            <BaseControl
                                label={__('Icon 2', 'vk-blocks')}
                            >
                                <TextControl
                                    label={__('Class name of the Font Awesome icon font you want to use:', 'vk-blocks')}
                                    value={icon2}
                                    onChange={(value) => setAttributes({icon2: value})}
                                    placeholder={'fas fa-file'}
                                    help = { <a href={`https://fontawesome.com/icons?d=gallery&m=free`} target={`_blank`}>{__('Font Awesome icon list', 'vk-blocks')}</a> }
                                />
                                <ColorPalette
                                    value={color2}
                                    onChange={(value) => {
                                        if (value){
                                            setAttributes({color2: value})
                                        } else {
                                            setAttributes({color2: '#0693e3'})
                                            setAttributes({bgType2: '0'})
                                        }
                                    }}
                                />
                                <RadioControl
                                    label={__('Icon Background:', 'vk-blocks')}
                                    selected={bgType2}
                                    options={[
                                        {label: __('Solid color', 'vk-blocks'), value: '0'},
                                        {label: __('No background', 'vk-blocks'), value: '1'},
                                    ]}
                                    onChange={(value) => setAttributes({bgType2: value})}
                                />
                            </BaseControl>
                            <BaseControl
                                label={__('PR Image 2', 'vk-blocks')}
                                help={__('When you have an image. Image is displayed with priority.', 'vk-blocks')}
                            >
                                <MediaUpload
                                    onSelect={(value) => setAttributes({insertImage2: value.url})}
                                    type="image"
                                    value={insertImage2}
                                    render={({open}) => (
                                        <Button
                                            onClick={open}
                                            className={insertImage2 ? 'image-button' : 'button button-large'}
                                        >
                                            {!insertImage2 ? __('Select image', 'vk-blocks') :
                                                <img className={'icon-image'} src={insertImage2}
                                                     alt={__('Upload image', 'vk-blocks')}/>}
                                        </Button>
                                    )}
                                />
                            </BaseControl>
                        </PanelBody>
                        <PanelBody title={__('PR Block3 Setting', 'vk-blocks')}>
                            <BaseControl
                                label={__('Link URL:', 'vk-blocks')}
                            >
                                <TextControl
                                    value={url3}
                                    onChange={(value) => setAttributes({url3: value})}
                                />
                                <CheckboxControl
                                    label={__('Open link new tab.', 'vk-blocks')}
                                    checked={urlOpenType3}
                                    onChange={(checked) => setAttributes({urlOpenType3: checked})}
                                />
                            </BaseControl>
                            <BaseControl
                                label={__('Icon 3', 'vk-blocks')}
                            >
                                <TextControl
                                    label={__('Class name of the Font Awesome icon font you want to use:', 'vk-blocks')}
                                    value={icon3}
                                    onChange={(value) => setAttributes({icon3: value})}
                                    placeholder={'fas fa-file'}
                                    help = { <a href={`https://fontawesome.com/icons?d=gallery&m=free`} target={`_blank`}>{__('Font Awesome icon list', 'vk-blocks')}</a> }
                                />
                                <ColorPalette
                                    value={color3}
                                    onChange={(value) => {
                                        if (value){
                                            setAttributes({color3: value})
                                        } else {
                                            setAttributes({color3: '#0693e3'})
                                            setAttributes({bgType3: '0'})
                                        }
                                    }}
                                />
                                <RadioControl
                                    label={__('Icon Background:', 'vk-blocks')}
                                    selected={bgType3}
                                    options={[
                                        {label: __('Solid color', 'vk-blocks'), value: '0'},
                                        {label: __('No background', 'vk-blocks'), value: '1'},
                                    ]}
                                    onChange={(value) => setAttributes({bgType3: value})}
                                />
                            </BaseControl>
                            <BaseControl
                                label={__('PR Image 3', 'vk-blocks')}
                                help={__('When you have an image. Image is displayed with priority.', 'vk-blocks')}
                            >
                                <MediaUpload
                                    onSelect={(value) => setAttributes({insertImage3: value.url})}
                                    type="image"
                                    value={insertImage3}
                                    render={({open}) => (
                                        <Button
                                            onClick={open}
                                            className={insertImage3 ? 'image-button' : 'button button-large'}
                                        >
                                            {!insertImage3 ? __('Select image', 'vk-blocks') :
                                                <img className={'icon-image'} src={insertImage3}
                                                     alt={__('Upload image', 'vk-blocks')}/>}
                                        </Button>
                                    )}
                                />
                            </BaseControl>
                        </PanelBody>
                    </InspectorControls>
                    <article className="vk_prBlocks row">

                        <div className="vk_prBlocks_item col-sm-4">
                            {(() => {

                                if (insertImage1) {

                                    return <div className="vk_prBlocks_item_image"
                                                style={{
                                                    backgroundImage: 'url(' + insertImage1 + ')',
                                                    backgroundRepeat: 'no-repeat 50% center',
                                                    backgroundSize: 'cover'
                                                }}
                                    >
                                        <img
                                            src={insertImage1}
                                            alt=''
                                        />
                                    </div>

                                } else {

                                    if ( bgType1 === '0' ) {
                                        return <div
                                            className="vk_prBlocks_item_icon_outer"
                                            style={{
                                                backgroundColor: color1,
                                                border: `1px solid ${color1}`
                                            }}
                                        ><i className={`${icon1} vk_prBlocks_item_icon`}
                                            style={{color: '#fff'}}>
                                        </i>
                                        </div>
                                    } else {
                                        return <div
                                            className="vk_prBlocks_item_icon_outer"
                                            style={{backgroundColor: 'transparent', border: '1px solid ' + color1}}
                                        ><i className={`${icon1} vk_prBlocks_item_icon`}
                                            style={{color: color1}}>
                                        </i>
                                        </div>
                                    }
                                }
                            })()}
                            <RichText
                                className="vk_prBlocks_item_title vk_prBlocks_item_title-1"
                                tagName="h1"
                                onChange={(value) => setAttributes({heading1: value})}
                                value={heading1}
                                placeholder={__('Input title', 'vk-blocks')}
                            />
                            <RichText
                                className="vk_prBlocks_item_summary vk_prBlocks_item_summary-1"
                                tagName="p"
                                onChange={(value) => setAttributes({content1: value})}
                                value={content1}
                                placeholder={__('Input content', 'vk-blocks')}
                            />
                        </div>

                        <div className="vk_prBlocks_item col-sm-4">
                            {(() => {

                                if (insertImage2) {

                                    return <div className="vk_prBlocks_item_image"
                                                style={{
                                                    backgroundImage: 'url(' + insertImage2 + ')',
                                                    backgroundRepeat: 'no-repeat 50% center',
                                                    backgroundSize: 'cover'
                                                }}
                                    >
                                        <img
                                            src={insertImage2}
                                            alt=''
                                        />
                                    </div>

                                } else {


                                    if (bgType2 === '0') {
                                        return <div
                                            className="vk_prBlocks_item_icon_outer"
                                            style={{
                                                backgroundColor: color2,
                                                border: `1px solid ${color2}`
                                            }}
                                        ><i className={`${icon2} vk_prBlocks_item_icon`}
                                            style={{color: '#fff'}}>
                                        </i>
                                        </div>
                                    } else {
                                        return <div
                                            className="vk_prBlocks_item_icon_outer"
                                            style={{backgroundColor: 'transparent', border: '1px solid ' + color2}}
                                        ><i className={`${icon2} vk_prBlocks_item_icon`}
                                            style={{color: color2}}>
                                        </i>
                                        </div>
                                    }
                                }
                            })()}
                            <RichText
                                className="vk_prBlocks_item_title vk_prBlocks_item_title-2"
                                tagName="h1"
                                onChange={(value) => setAttributes({heading2: value})}
                                value={heading2}
                                placeholder={__('Input title', 'vk-blocks')}
                            />
                            <RichText
                                className="vk_prBlocks_item_summary vk_prBlocks_item_summary-2"
                                tagName="p"
                                onChange={(value) => setAttributes({content2: value})}
                                value={content2}
                                placeholder={__('Input content', 'vk-blocks')}
                            />
                        </div>

                        <div className="vk_prBlocks_item col-sm-4">
                            {(() => {

                                if (insertImage3) {

                                    return <div className="vk_prBlocks_item_image"
                                                style={{
                                                    backgroundImage: 'url(' + insertImage3 + ')',
                                                    backgroundRepeat: 'no-repeat 50% center',
                                                    backgroundSize: 'cover'
                                                }}
                                    >
                                        <img
                                            src={insertImage3}
                                            alt=''
                                        />
                                    </div>

                                } else {


                                    if (bgType3 === '0') {
                                        return <div
                                            className="vk_prBlocks_item_icon_outer"
                                            style={{
                                                backgroundColor: color3,
                                                border: `1px solid ${color3}`
                                            }}
                                        ><i className={`${icon3} vk_prBlocks_item_icon`}
                                            style={{color: '#fff'}}>
                                        </i>
                                        </div>
                                    } else {
                                        return <div
                                            className="vk_prBlocks_item_icon_outer"
                                            style={{backgroundColor: 'transparent', border: '1px solid ' + color3}}
                                        ><i className={`${icon3} vk_prBlocks_item_icon`}
                                            style={{color: color3}}>
                                        </i>
                                        </div>
                                    }
                                }
                            })()}
                            <RichText
                                className="vk_prBlocks_item_title vk_prBlocks_item_title-3"
                                tagName="h1"
                                onChange={(value) => setAttributes({heading3: value})}
                                value={heading3}
                                placeholder={__('Input title', 'vk-blocks')}
                            />
                            <RichText
                                className="vk_prBlocks_item_summary vk_prBlocks_item_summary-3"
                                tagName="p"
                                onChange={(value) => setAttributes({content3: value})}
                                value={content3}
                                placeholder={__('Input content', 'vk-blocks')}
                            />
                        </div>

                    </article>
                </Fragment>
            ];
        },
        save({attributes}) {
            const {
                heading1,
                heading2,
                heading3,
                content1,
                content2,
                content3,
                url1,
                url2,
                url3,
                urlOpenType1,
                urlOpenType2,
                urlOpenType3,
                icon1,
                icon2,
                icon3,
                color1,
                color2,
                color3,
                bgType1,
                bgType2,
                bgType3,
                insertImage1,
                insertImage2,
                insertImage3
            } = attributes;

            return (
                <article className="vk_prBlocks row">

                    <div className="vk_prBlocks_item col-sm-4">
                        <a
                            href={url1}
                            target={urlOpenType1? '_blank':'_self'}
                            className="vk_prBlocks_item_link"
                            rel="noopener noreferrer"
                        >
                            {(() => {

                                if (insertImage1) {

                                    return <div className="vk_prBlocks_item_image"
                                                style={{
                                                    backgroundImage: 'url(' + insertImage1 + ')',
                                                    backgroundRepeat: 'no-repeat 50% center',
                                                    backgroundSize: 'cover'
                                                }}
                                    >
                                        <img
                                            src={insertImage1}
                                            alt=''
                                        />
                                    </div>

                                } else {

                                    if ( ! color1 ){
                                        color1 = '#0693e3';
                                        bgType1 === '0';
                                    }
                                    if (bgType1 === '0') {

                                        return <div
                                            className="vk_prBlocks_item_icon_outer"
                                            style={{
                                                backgroundColor: color1,
                                                border: `1px solid ${color1}`
                                            }}
                                        ><i className={`${icon1} vk_prBlocks_item_icon`}
                                            style={{color: '#fff'}}>
                                        </i>
                                        </div>
                                    } else {
                                        return <div
                                            className="vk_prBlocks_item_icon_outer"
                                            style={{backgroundColor: 'transparent', border: '1px solid ' + color1}}
                                        ><i className={`${icon1} vk_prBlocks_item_icon`}
                                            style={{color: color1}}>
                                        </i>
                                        </div>
                                    }
                                }
                            })()}
                            <RichText.Content
                                className="vk_prBlocks_item_title vk_prBlocks_item_title-1"
                                tagName={'h1'}
                                value={heading1}/>
                            <RichText.Content
                                className="vk_prBlocks_item_summary vk_prBlocks_item_summary-1"
                                tagName={'p'}
                                value={content1}/>
                        </a>
                    </div>
                    <div className="vk_prBlocks_item col-sm-4">
                        <a
                            href={url2}
                            target={urlOpenType2? '_blank':'_self'}
                            className="vk_prBlocks_item_link"
                            rel="noopener noreferrer"
                        >
                            {(() => {

                                if (insertImage2) {

                                    return <div className="vk_prBlocks_item_image"
                                                style={{
                                                    backgroundImage: 'url(' + insertImage2 + ')',
                                                    backgroundRepeat: 'no-repeat 50% center',
                                                    backgroundSize: 'cover'
                                                }}
                                    >
                                        <img
                                            src={insertImage2}
                                            alt=''
                                        />
                                    </div>

                                } else {
                                    if ( ! color2 ){
                                        color2 = '#0693e3';
                                        bgType2 === '0';
                                    }
                                    if (bgType2 === '0') {
                                        return <div
                                            className="vk_prBlocks_item_icon_outer"
                                            style={{
                                                backgroundColor: color2,
                                                border: `1px solid ${color2}`
                                            }}
                                        ><i className={`${icon2} vk_prBlocks_item_icon`}
                                            style={{color: '#fff'}}>
                                        </i>
                                        </div>
                                    } else {
                                        return <div
                                            className="vk_prBlocks_item_icon_outer"
                                            style={{backgroundColor: 'transparent', border: '1px solid ' + color2}}
                                        ><i className={`${icon2} vk_prBlocks_item_icon`}
                                            style={{color: color2}}>
                                        </i>
                                        </div>
                                    }
                                }
                            })()}
                            <RichText.Content
                                className="vk_prBlocks_item_title vk_prBlocks_item_title-2"
                                tagName={'h1'}
                                value={heading2}/>
                            <RichText.Content
                                className="vk_prBlocks_item_summary vk_prBlocks_item_summary-2"
                                tagName={'p'}
                                value={content2}/>
                        </a>
                    </div>

                    <div className="vk_prBlocks_item col-sm-4">
                        <a
                            href={url3}
                            target={urlOpenType3? '_blank':'_self'}
                            className="vk_prBlocks_item_link"
                            rel="noopener noreferrer"
                        >
                            {(() => {

                                if (insertImage3) {

                                    return <div className="vk_prBlocks_item_image"
                                                style={{
                                                    backgroundImage: 'url(' + insertImage3 + ')',
                                                    backgroundRepeat: 'no-repeat 50% center',
                                                    backgroundSize: 'cover'
                                                }}
                                    >
                                        <img
                                            src={insertImage3}
                                            alt=''
                                        />
                                    </div>

                                } else {
                                    if ( ! color3 ){
                                        color3 = '#0693e3';
                                        bgType3 === '0';
                                    }
                                    if (bgType3 === '0') {
                                        return <div
                                            className="vk_prBlocks_item_icon_outer"
                                            style={{
                                                backgroundColor: color3,
                                                border: `1px solid ${color3}`
                                            }}
                                        ><i className={`${icon3} vk_prBlocks_item_icon`}
                                            style={{color: '#fff'}}>
                                        </i>
                                        </div>
                                    } else {
                                        return <div
                                            className="vk_prBlocks_item_icon_outer"
                                            style={{backgroundColor: 'transparent', border: '1px solid ' + color3}}
                                        ><i className={`${icon3} vk_prBlocks_item_icon`}
                                            style={{color: color3}}>
                                        </i>
                                        </div>
                                    }
                                }
                            })()}
                            <RichText.Content
                                className="vk_prBlocks_item_title vk_prBlocks_item_title-3"
                                tagName={'h1'}
                                value={heading3}/>
                            <RichText.Content
                                className="vk_prBlocks_item_summary vk_prBlocks_item_summary-3"
                                tagName={'p'}
                                value={content3}/>
                        </a>
                    </div>
                </article>
            );
        },


    }];