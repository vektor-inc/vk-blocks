import React from "react";

const {__} = wp.i18n; // Import __() from wp.i18n

class TableOfContents extends React.Component {

    /**
     * Get hTag's NodeList included in target class's element.
     * @param targetClass
     * @returns {*} NodeListOf<Element> or false
     */
    getDom(targetClass) {
        let editor = document.getElementsByClassName(targetClass);
        if (!editor) {
            return false;
        } else {
            return editor[0].querySelectorAll("h1, h2, h3, h4, h5, h6");
        }
    }

    /**
     * Get array of hTag's innerText and tagName.
     * @returns {Array}
     */
    getHtagsInEditor() {

        let nodeList_raw = this.getDom('edit-post-visual-editor');
        let nodeList = Array.from(nodeList_raw);

        let sourceOfTocHtml = [];

        nodeList.forEach(function (item, index) {

            sourceOfTocHtml[index] = {
                'tagName': nodeList[index]['tagName'],
                'innerText': nodeList[index]['innerText']
            }
        });

        return sourceOfTocHtml;
    };

    render() {

        let {
            style,
            source,
            className
        } = this.props.attributes;
        let for_ = this.props.for_;

        return (
            <div className={className + ' vk_table-of-contents'}>
                <div className={'vk_table-of-contents_title'}>{__('Table of Contents', 'vk-blocks')}</div>
                <ul className={'vk_table-of-contents_list'}>
                    {source.map((data,index) => {

                        switch (data.tagName) {
                            case 'H2':
                                return <li className={'vk_table-of-contents_list_item'}>
                                    <a href=""
                                       className={'vk_table-of-contents-list_item_link'}>{data.innerText}</a>
                                </li>;
                            case 'H3':
                                return <ul>
                                    <li><a href="">{data.innerText}</a></li>
                                </ul>;
                            case 'H4':
                                return <ul>
                                    <ul>
                                        <li><a href="">{data.innerText}</a></li>
                                    </ul>
                                </ul>;
                            case 'H5':
                                return <ul>
                                    <ul>
                                        <ul>
                                            <li><a href="">{data.innerText}</a></li>
                                        </ul>
                                    </ul>
                                </ul>;
                            case 'H6':
                                return <ul>
                                    <ul>
                                        <ul>
                                            <ul>
                                                <li><a href="">{data.innerText}</a></li>
                                            </ul>
                                        </ul>
                                    </ul>
                                </ul>;
                        }
                    })}
                </ul>
            </div>
        );
    }
}

export default TableOfContents;
