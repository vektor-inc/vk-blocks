import React from 'react';
const { lodash } = window;
const { times } = lodash;
const {InnerBlocks} = wp.editor;

export class Component extends React.Component {

    render() {

        const {
            colNum,
        } = this.props.attributes;
        let for_ = this.props.for_;
        const ALLOWED_BLOCKS = ['vk-blocks/td'];

        /**
         * Get Block to repeat.
         * @param colNum
         * @returns {Array}
         */
        const getColsTemplate = (colNum) => {
            return times(colNum, () => ["vk-blocks/td"]);
        };


        /**
         * Switch Element type for Editor or View.
         * @param colNum
         * @returns {*}
         */
        const switchViewEdit = (colNum) => {

            //エディタとビューの切り替え
            if (for_ === 'edit') {
                return <tr><InnerBlocks
                    template={getColsTemplate(colNum)}
                    templateLock="all"
                    ALLOWED_BLOCKS={ALLOWED_BLOCKS}
                /></tr>;
            } else if ('save') {
                return <tr><InnerBlocks.Content
                    template={getColsTemplate(colNum)}
                    templateLock="all"
                    ALLOWED_BLOCKS={ALLOWED_BLOCKS}
                /></tr>;
            }
        };

        /**
         * Add Col indicated by RangeControl Number.
         * @param colNum
         * @returns {string}
         */
        const addCol = (colNum) => {

            let returnElm = '';
            for (let i = 0; i < colNum; i++) {
                returnElm = switchViewEdit(colNum);
            }
            return returnElm;
        };



        return (addCol(colNum));
    }
}
