import React from 'react';

const {__} = wp.i18n; // Import __() from wp.i18n
const {RichText} = wp.editor;

export class ComponentBlock extends React.Component {

    render() {

        let setAttributes = this.props.setAttributes;
        let {
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
        } = this.props.attributes;
        let for_ = this.props.for_;
        let blockNum = this.props.blockNum - 1;

        const heading = [heading1, heading2, heading3];
        const content = [content1, content2, content3];
        const url = [url1, url2, url3];
        const urlOpenType = [urlOpenType1, urlOpenType2, urlOpenType3];
        const icon = [icon1, icon2, icon3];
        const color = [color1, color2, color3];
        const bgType = [bgType1, bgType2, bgType3];
        const insertImage = [insertImage1, insertImage2, insertImage3];

        let richTextH1Save = '';
        let richTextPSave = '';


        let drawElement = (() => {

            if (insertImage[blockNum]) {

                return <div className="vk_prBlocks_item_image"
                            style={{
                                backgroundImage: `url(${insertImage[blockNum]})`,
                                backgroundRepeat: 'no-repeat 50% center',
                                backgroundSize: 'cover'
                            }}
                >
                    <img
                        src={insertImage[blockNum]}
                        alt=''
                    />
                </div>

            } else {

                if (!color[blockNum]) {
                    color[blockNum] = '#0693e3';
                }
                if (bgType[blockNum] === '0') {

                    return <div
                        className="vk_prBlocks_item_icon_outer"
                        style={{
                            backgroundColor: color[blockNum],
                            border: `1px solid ${color[blockNum]}`
                        }}
                    ><i className={`${icon[blockNum]} vk_prBlocks_item_icon`}
                        style={{color: '#fff'}}>
                    </i>
                    </div>
                } else {
                    return <div
                        className="vk_prBlocks_item_icon_outer"
                        style={{backgroundColor: 'transparent', border: '1px solid ' + color[blockNum]}}
                    ><i className={`${icon[blockNum]} vk_prBlocks_item_icon`}
                        style={{color: color[blockNum]}}>
                    </i>
                    </div>
                }
            }
        })();


        //編集画面とフロント側の切り替え
        if (for_ === 'edit') {

            if (blockNum === 0) {

                richTextH1Save = <RichText
                    className="vk_prBlocks_item_title vk_prBlocks_item_title-0"
                    tagName={'h1'}
                    onChange={(value) => setAttributes({heading1: value})}
                    value={heading1}
                    placeholder={__('Input Title', 'vk-blocks')}
                />;
                richTextPSave = <RichText
                    className="vk_prBlocks_item_summary vk_prBlocks_item_summary-0"
                    tagName={'p'}
                    onChange={(value) => setAttributes({content1: value})}
                    value={content1}
                    placeholder={__('Input Content', 'vk-blocks')}
                />;

            } else if (blockNum === 1) {

                richTextH1Save = <RichText
                    className="vk_prBlocks_item_title vk_prBlocks_item_title-1"
                    tagName={'h1'}
                    onChange={(value) => setAttributes({heading2: value})}
                    value={heading2}
                    placeholder={__('Input Title', 'vk-blocks')}
                />;
                richTextPSave = <RichText
                    className="vk_prBlocks_item_summary vk_prBlocks_item_summary-1"
                    tagName={'p'}
                    onChange={(value) => setAttributes({content2: value})}
                    value={content2}
                    placeholder={__('Input Content', 'vk-blocks')}
                />;

            } else if (blockNum === 2) {
                richTextH1Save = <RichText
                    className="vk_prBlocks_item_title vk_prBlocks_item_title-2"
                    tagName={'h1'}
                    onChange={(value) => setAttributes({heading3: value})}
                    value={heading3}
                    placeholder={__('Input Title', 'vk-blocks')}
                />;
                richTextPSave = <RichText
                    className="vk_prBlocks_item_summary vk_prBlocks_item_summary-2"
                    tagName={'p'}
                    onChange={(value) => setAttributes({content3: value})}
                    value={content3}
                    placeholder={__('Input Content', 'vk-blocks')}
                />;
            }

        } else if (for_ === 'save') {

            richTextH1Save = <RichText.Content
                className={`vk_prBlocks_item_title vk_prBlocks_item_title-${blockNum}`}
                tagName={'h1'}
                value={heading[blockNum]}/>;
            richTextPSave = <RichText.Content
                className={`vk_prBlocks_item_summary vk_prBlocks_item_summary-${blockNum}`}
                tagName={'p'}
                value={content[blockNum]}/>;
        }


        // aタグ判定
        if (url[blockNum]) {
            return (
                <div>
                    <a href={url[blockNum]} className="vk_prBlocks_item_link"
                       target={urlOpenType[blockNum] ? '_blank' : '_self'} rel="noopener noreferrer">
                        {drawElement}
                        {richTextH1Save}
                        {richTextPSave}
                    </a>
                </div>
            );
        } else {
            return (
                <div>
                    {drawElement}
                    {richTextH1Save}
                    {richTextPSave}
                </div>
            );
        }


    }
}
