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
        const ALLOWED_BLOCKS = ['vk-blocks/table'];

        /**
         * Get Block to repeat.
         * @param columns
         * @returns {Array}
         */
        const getColumn = (columns) => {
            return times(columns, () => ["vk-blocks/table"]);
        };

        /**
         * Switch Element type for Editor or View.
         * @param colNum
         * @param callback
         * @returns {*}
         */
        const switchViewEdit = (colNum, callback) => {
            //エディタとビューの切り替え
            if (for_ === 'edit') {
                return content = <InnerBlocks
                    template={callback(colNum)}
                    templateLock="all"
                    ALLOWED_BLOCKS={ALLOWED_BLOCKS}
                />
            } else if ('save') {
                return content = <InnerBlocks.Content
                    template={callback(colNum)}
                    templateLock="all"
                    ALLOWED_BLOCKS={ALLOWED_BLOCKS}
                />
            }
        };

        /**
         * Add Element indicated by repeatNum.
         * @param repeatNum
         * @param callback
         * @returns {string}
         */
        const repeatElm = (repeatNum, callback) => {

            let returnElm = '';
            for (let i = 0; i < repeatNum; i++) {
                returnElm = switchViewEdit(repeatNum, callback);
            }
            return returnElm;
        };

        const addRow = (rowNum, colNum, callback = repeatElm) => {

            return <tr>{callback(colNum, getColumn)}</tr>;

        };

        return (
            <table>
                <tbody>
                {addRow(rowNum, colNum)}
                </tbody>
            </table>
        );
    }
}
