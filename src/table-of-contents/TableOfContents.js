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

        let bootstrapUL = ' list-group';
        let bootstrapLi = ' list-group-item';
        let h = '-h';

        let returnHtml = <div className={className + 'vk_table-of-contents' + style}>
            <div className={'vk_table-of-contents_title'}>{__('Table of Contents', 'vk-blocks')}</div>
            <ul className={'vk_table-of-contents_list' + bootstrapUL + style}>
                {source.map((data, index) => {

                    let baseClass = 'vk_table-of-contents_list_';

                    switch (data.tagName) {
                        case 'H2':
                            return <li className={baseClass + 'item' + h + '2' + bootstrapLi}>
                                <a href="" className={baseClass + 'item_link'}>
                                    {data.innerText}
                                </a>
                            </li>;

                        case 'H3':
                            return <ul>
                                <li className={baseClass + 'item' + h + '3' + bootstrapLi}>
                                    <a href="" className={baseClass + 'item_link'}>
                                        {data.innerText}
                                    </a>
                                </li>
                            </ul>;
                        case 'H4':
                            return <ul>
                                <ul>
                                    <li className={baseClass + 'item' + h + '4' + bootstrapLi}>
                                        <a href="" className={baseClass + 'item_link'}>
                                            {data.innerText}
                                        </a>
                                    </li>
                                </ul>
                            </ul>;
                        case 'H5':
                            return <ul>
                                <ul>
                                    <ul>
                                        <li className={baseClass + 'item' + h + '5' + bootstrapLi}>
                                            <a href="" className={baseClass + 'item_link'}>
                                                {data.innerText}
                                            </a>
                                        </li>
                                    </ul>
                                </ul>
                            </ul>;
                        case 'H6':
                            return <ul>
                                <ul>
                                    <ul>
                                        <ul>
                                            <li className={baseClass + 'item' + h + '6' + bootstrapLi}>
                                                <a href="" className={baseClass + 'item_link'}>
                                                    {data.innerText}
                                                </a>
                                            </li>
                                        </ul>
                                    </ul>
                                </ul>
                            </ul>;
                    }
                })}
            </ul>
        </div>;

        return ReactDOMServer.renderToString(returnHtml);
    }
}

export default TableOfContents;
