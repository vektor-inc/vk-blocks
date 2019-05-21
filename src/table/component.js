import React from 'react';

const { lodash } = window;
const { times } = lodash;
const {InnerBlocks} = wp.editor;

/**
 * Returns the layouts configuration for a given number of columns.
 *
 * @param {number} columns Number of columns.
 *
 * @return {Object[]} Columns layout configuration.
 */

export default class Component extends React.Component {

    render() {

        const {
            colNum,
            rowNum
        } = this.props.attributes;
        let for_ = this.props.for_;
        let content;
        const ALLOWED_BLOCKS = ['core/paragraph'];

        /**
         * Get Block to repeat.
         * @param columns
         * @returns {Array}
         */
        const getColumnsTemplate = (columns) => {
            return times(columns, () => ["core/paragraph"]);
        };

        /**
         * Switch Element type for Editor or View.
         * @param colNum
         * @returns {*}
         */
        const switchViewEdit = (colNum) => {
            //エディタとビューの切り替え
            if (for_ === 'edit') {
                return content = <InnerBlocks
                    template={getColumnsTemplate(colNum)}
                    templateLock="all"
                    ALLOWED_BLOCKS={ALLOWED_BLOCKS}
                />
            } else if ('save') {
                return content = <InnerBlocks.Content
                    template={getColumnsTemplate(colNum)}
                    templateLock="all"
                    ALLOWED_BLOCKS={ALLOWED_BLOCKS}
                />
            }
        };


        /**
         * Repeat Element to render
         * @param repeatNum
         * @param callback
         * @returns {string}
         */
        const repeatElm = (repeatNum, callback) => {

            let returnElm = '';
            for (let i = 0; i < repeatNum; i++) {
                returnElm = callback(repeatNum);
            }
            return returnElm;
        };

        /**
         * Add column indicated by RangeControl Number.
         * @param colNum
         * @returns {string}
         */
        const addColumn = (colNum) => {

            let returnElm = '';
            for (let i = 0; i < colNum; i++) {
                returnElm = switchViewEdit(colNum);
            }
            return returnElm;
        };

        const addRow = (rowNum, colNum) => {
            repeatElm(colNum)
        };


        return(repeatElm(colNum,switchViewEdit));

        // return (
        //     <table>
        //         <tbody>
        //         <tr>
        //             <th scope="col">Name</th>
        //             <th scope="col">HEX</th>
        //             <th scope="col">HSLa</th>
        //             <th scope="col">RGBa</th>
        //         </tr>
        //         <tr>
        //             <th scope="row">Teal</th>
        //             <td><code>#51F6F6</code></td>
        //             <td><code>hsla(180, 90%, 64%, 1)</code></td>
        //             <td><code>rgba(81, 246, 246, 1)</code></td>
        //         </tr>
        //         <tr>
        //             <th scope="row">Goldenrod</th>
        //             <td><code>#F6BC57</code></td>
        //             <td><code>hsla(38, 90%, 65%, 1)</code></td>
        //             <td><code>rgba(246, 188, 87, 1)</code></td>
        //         </tr>
        //         </tbody>
        //     </table>);
    }
}
