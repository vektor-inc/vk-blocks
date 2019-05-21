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
            colNum
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

        return (addColumn(colNum));
    }
}
