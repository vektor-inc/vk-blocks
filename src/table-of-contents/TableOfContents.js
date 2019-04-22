import React from "react";
class TableOfContents extends React.Component {

    /**
     *  Get Gutenberg's editor content elements.
     * @returns {Element}
     */
    getEditorElm() {
        let editor = document.getElementsByClassName('edit-post-visual-editor');
        return editor[0];
    }

    /**
     * Get H*tag in editor and return array of innerText and tagName.
     * @returns {Array}
     */
    getHtagsInEditor() {

        let nodeList_raw = this.getEditorElm().querySelectorAll("h1, h2, h3, h4, h5, h6");
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

    /**
     * Create Table of Contents Html.
     * @param hTagList
     * @returns {HTMLElement} html list of hTag text.
     */
    createTocHtml(hTagList) {

        let ul = document.createElement("ul");

        for (let i = 0; i < hTagList.length; i++) {

            let li = document.createElement("li");

            if (hTagList[i].innerText) {

                li.innerText = hTagList[i].innerText;
                ul.appendChild(li);
            }

        }

        return ul;
    }

    appendTocBlock(html) {

        let blockElm = document.getElementsByClassName('vk_table-of-contents');

        if (!blockElm[0]) {
            return
        }

        let blockElmChildren = blockElm[0].children;

        for (let i = 0; i < blockElmChildren.length; i++) {

            if(blockElmChildren[i].tagName === "UL"){

                blockElm[0].removeChild(blockElmChildren[i]);
            }

        }

        blockElm[0].appendChild(html);

        return blockElm;
    }

    render(){

        let {
            style
        } = this.props.attributes;
        let for_ = this.props.for_;

        return(<div>hello</div>);

    }
}

export default TableOfContents;

