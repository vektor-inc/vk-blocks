class TableOfContents {

    constructor(ajaxurl, nonce) {
        this.nonce = nonce;
        this._ajaxurl = ajaxurl;
    }

    /**
     * Get H*tag in editor and return array of html.
     * @returns {Array}
     */
    getHtagsInEditor() {
        let editor = document.getElementsByClassName('edit-post-visual-editor');
        let nodeList = editor[0].querySelectorAll("h1, h2, h3, h4, h5, h6");
        return Array.from(nodeList);
    };

    /**
     * Create Table of Contents Html.
     * @param hTagList
     * @returns {string} html list of hTag text.
     */
    createTocHtml(hTagList) {
        let render = '<ul>';

        hTagList.forEach(function (hTag) {

            if (hTag.innerText) {
                render += '<li>' + hTag.innerText + '</li>';
            }
        });
        render += '</ul>';

        return (render);
    }


}

export default TableOfContents;
