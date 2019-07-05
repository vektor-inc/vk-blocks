'use strict';
const {CheckboxControl} = wp.components;

/**
 *
 * @param args
 * @returns {*}
 */
const addCheckBox = (args) => {

    if (!args.originData) {
        return false
    }

    const name = args.name;
    const originData = args.originData;
    const checkedData = args.checkedData;
    const setAttributes = args.setAttributes;
    const reactDomToRender = [];

    //投げるデータによりiは,数字やオブジェクトに変わる。
    for (let i in originData) {

        switch (name) {
            case 'postTypes':
                renderPostTypes(reactDomToRender, originData[i].slug, checkedData, setAttributes);
                break;

            case 'taxonomy':
                renderTaxonomy(reactDomToRender, i, originData[i], checkedData, setAttributes);
                break;
        }
    }
    return (
        <ul>
            {reactDomToRender}
        </ul>
    );
};

export default addCheckBox;

/**
 *
 * @param reactDomToRender
 * @param slug
 * @param checkedData
 * @param setAttributes
 * @returns {*}
 */
const renderPostTypes = (reactDomToRender, slug, checkedData, setAttributes) => {

    if (!Array.isArray(checkedData)) {
        return false
    }
    if (checkedData)
        return (reactDomToRender.push(
            <CheckboxControl
                label={slug}
                checked={checkedData.some(item => item === slug)}
                onChange={async (value) => {
                    if (value) {
                        checkedData.push(slug);
                    } else {
                        checkedData = checkedData.filter(elm => elm !== slug);
                    }
                    setAttributes({isCheckedPostType: JSON.stringify(checkedData)});
                }}
            />));
};

const renderTaxonomy = (reactDomToRender, tax, slug, checkedData, setAttributes) => {

    let term = slug[0];

    if (checkedData[tax] === undefined) {
        checkedData[tax] = [];
    }

    return (reactDomToRender.push(
        <CheckboxControl
            label={term}
            checked={checkedData[tax].some(termItem => termItem === term)}
            onChange={(value) => {
                if (value) {
                    checkedData[tax].push(term);
                } else {
                    checkedData[tax] = checkedData[tax].filter(elm => elm !== term);
                }
                setAttributes({isCheckedTerms: JSON.stringify(checkedData)});
            }}
        />));
};
