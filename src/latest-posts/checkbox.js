'use strict';
import React from "react";

const {CheckboxControl} = wp.components;
const {withSelect, subscribe, select, dispatch} = wp.data;


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
                console.log("taxonomy");
                renderTaxonomy(reactDomToRender, originData[i], checkedData, setAttributes);
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
                    await setAttributes({isCheckedPostType: JSON.stringify(checkedData)});
                    const taxList = getTaxonomyFromPostType(checkedData);
                    const termsList = getTermsFromTaxonomy(taxList);
                    setAttributes({coreTerms: JSON.stringify(termsList)});
                }}
            />));
};

const renderTaxonomy = (reactDomToRender, slug, checkedData, setAttributes) => {

    let term = slug[0];
    console.log(checkedData);

    return (reactDomToRender.push(
        <CheckboxControl
            label={term}
            checked={checkedData.some(item => item === term)}
            onChange={(value) => {
                if (value) {
                    checkedData.push(term);
                } else {
                    checkedData = checkedData.filter(elm => elm !== term);
                }
                console.log(checkedData);
                setAttributes({isCheckedPostType: JSON.stringify(checkedData)});
            }
            }
        />));
};

/**
 * Get Taxonomies of checked postType. Return array of taxonomies.
 * @param isCheckedPostType
 * @returns {boolean|*[]}
 */
const getTaxonomyFromPostType = (isCheckedPostType) => {

    let returnTaxonomies = [];
    isCheckedPostType.forEach(postType => {

        let pt = select("core").getPostType(postType);
        let taxonomies = pt.taxonomies;

        taxonomies.forEach(item => {
            returnTaxonomies.push(item);
        });
    });

    //重複を削除
    returnTaxonomies = returnTaxonomies.filter((x, i, self) => self.indexOf(x) === i);
    return returnTaxonomies;
};

/**
 * Get terms of given taxonomies. Return terms as `{taxonomySlug:[terms], ...}` format.
 * @param taxList
 * @returns {boolean|{}}
 */
const getTermsFromTaxonomy = (taxList) => {

    if (!taxList) {
        return false;
    }

    let returnTerms = {};

    taxList.forEach(tax => {

        let terms = [];
        let taxData = select('core').getEntityRecords('taxonomy', tax);
        let returnTermsKey = Object.keys(returnTerms);

        if (taxData !== null) {

            if (!returnTermsKey.includes(tax)) {

                taxData.forEach(term => {
                    terms.push(term.slug);
                    returnTerms[term.taxonomy] = terms;
                })
            } else {

                delete returnTerms[tax];
            }
        }
    });

    return returnTerms;
};
