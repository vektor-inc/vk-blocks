class TableOfContents {

    constructor(ajaxurl, nonce) {
        this.nonce = nonce;
        this._ajaxurl = ajaxurl;
    }

    /**
     *  Get Gutenberg's editor content elements.
     * @returns {Element}
     */
    getEditorElm() {
        let editor = document.getElementsByClassName('edit-post-visual-editor');
        return editor[0];
    }

    /**
     * Get H*tag in editor and return array of html.
     * @returns {Array}
     */
    getHtagsInEditor() {

        let nodeList = this.getEditorElm().querySelectorAll("h1, h2, h3, h4, h5, h6");
        return Array.from(nodeList);
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

}

export default TableOfContents;
