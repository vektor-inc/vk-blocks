import ReactDOMServer from 'react-dom/server';

const {__} = wp.i18n; // Import __() from wp.i18n

class TableOfContents {

    /**
     * Get hTag's NodeList included in target class's element.
     * @param targetClass
     * @returns {*} NodeListOf<Element> or false
     */
    getDom(targetClass) {
        let editor = document.getElementsByClassName(targetClass);
        if (editor[0] === undefined) {
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

        if(nodeList_raw === undefined){
            return false;
        }

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
     * Return Html of Toc block.
     * @param source
     * @param style
     * @param className
     * @returns {*}
     */
    returnHtml(source, style, className) {

        if (!className) {
            className = '';
        } else {
            className = className + ' ';
        }

        let listClassName = 'vk_tableOfContents_list_item';

        let returnHtml = <div className={className + 'vk_tableOfContents' + style}>
            <div className={'vk_tableOfContents_title'}>{__('Table of Contents', 'vk-blocks')}</div>
            <ul className={'vk_tableOfContents_list' + style}>
                {source.map((data) => {

                    let baseClass = 'vk_tableOfContents_list_item';

                    let level = data.tagName.replace( /H/g , '' ) ;
                    return <li className={`${baseClass} ${baseClass}-h-${level}`}>
                            <a href="" className={`${baseClass}_link`}>
                                {data.innerText}
                            </a>
                        </li>;
                })}
            </ul>
        </div>;

        return ReactDOMServer.renderToString(returnHtml);
    }
}

export default TableOfContents;
