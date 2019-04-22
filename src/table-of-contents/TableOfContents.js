import React from "react";

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

    //in viewDom
    //out html collection
    getHtagsInView() {
        let nodeList_raw = this.getDom('entry-content');
        console.log(nodeList_raw);
        return nodeList_raw;
    }

    //in html collection
    //out html collection  | id to href
    // appendTocBlock(html) {
    //
    //     let blockElm = document.getElementsByClassName('vk_table-of-contents');
    //
    //     if (!blockElm[0]) {
    //         return
    //     }
    //
    //     let blockElmChildren = blockElm[0].children;
    //
    //     for (let i = 0; i < blockElmChildren.length; i++) {
    //
    //         if (blockElmChildren[i].tagName === "UL") {
    //
    //             blockElm[0].removeChild(blockElmChildren[i]);
    //         }
    //
    //     }
    //
    //     blockElm[0].appendChild(html);
    //
    //     return blockElm;
    // }


    render() {

        let {
            style,
            source
        } = this.props.attributes;
        let for_ = this.props.for_;

        return (
            <div>
                <div>Table of Contents</div>
                <ul>
                    {source.map((data,index) => {

                        switch (data.tagName) {
                            case 'H2':
                                return <li><a href={`#vk-htags-${index}`}>{data.innerText}</a></li>;
                            case 'H3':
                                return <ul>
                                    <li><a href={`#vk-htags-${index}`}>{data.innerText}</a></li>
                                </ul>;
                            case 'H4':
                                return <ul>
                                    <ul>
                                        <li><a href={`#vk-htags-${index}`}>{data.innerText}</a></li>
                                    </ul>
                                </ul>;
                            case 'H5':
                                return <ul>
                                    <ul>
                                        <ul>
                                            <li><a href={`#vk-htags-${index}`}>{data.innerText}</a></li>
                                        </ul>
                                    </ul>
                                </ul>;
                            case 'H6':
                                return <ul>
                                    <ul>
                                        <ul>
                                            <ul>
                                                <li><a href={`#vk-htags-${index}`}>{data.innerText}</a></li>
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
