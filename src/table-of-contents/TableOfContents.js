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

    render(){

        let {
            style,
            source
        } = this.props.attributes;
        let for_ = this.props.for_;

        return (
            <div>
                <ul>
                    {source.map((data) => {

                        switch (data.tagName) {
                            case 'H2':
                                return <li>{data.innerText}</li>;
                            case 'H3':
                                return <ul><li>{data.innerText}</li></ul>;
                            case 'H4':
                                return <ul><ul><li>{data.innerText}</li></ul></ul>;
                            case 'H5':
                                return <ul><ul><ul><li>{data.innerText}</li></ul></ul></ul>;
                            case 'H6':
                                return <ul><ul><ul><ul><li>{data.innerText}</li></ul></ul></ul></ul>;
                        }
                    })}
                </ul>
            </div>
        );
    }
}

export default TableOfContents;
