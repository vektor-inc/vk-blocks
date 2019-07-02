'use strict';
import React from "react";

const {CheckboxControl} = wp.components;

/**
 *
 * @param checkBoxes
 * @param dataSlug
 * @param returnArray
 * @param setAttributes
 * @returns {*}
 */
const renderPostTypes = (checkBoxes, dataSlug, returnArray, setAttributes) => {
    return (checkBoxes.push(
        <CheckboxControl
            label={dataSlug}
            checked={returnArray.some(item => item === dataSlug)}
            onChange={(value) => {
                    if(value){
                        returnArray.push(dataSlug);
                    }else {
                        returnArray = returnArray.filter(elm => elm !== dataSlug);
                    }
                    setAttributes({isCheckedPostType: JSON.stringify(returnArray)});
                }
            }
        />));
};

const renderTaxonomy = (taxType, checkBoxes, dataSlug, returnArray, setAttributes) => {

    return (checkBoxes.push(
        <CheckboxControl
            label={dataSlug}
            checked={returnArray[dataSlug]}
            onChange={
                (value) => {
                    returnArray[taxType].push([dataSlug,value]);
                    setAttributes({isCheckedTaxonomy: JSON.stringify(returnArray)});
                }
            }
        />));
};


/**
 *
 * @param args
 * @returns {*}
 */
const addCheckBox = (args) => {

    if (!args.data) {
        return false
    }

    const name = args.name;
    const data = args.data;
    const returnArray = args.returnArray;
    const setAttributes = args.setAttributes;
    const checkBoxes = [];

    for (let type in data) {

        let dataSlug = data[type].slug;

        switch (name) {
            case 'postTypes':
                renderPostTypes(checkBoxes, dataSlug, returnArray, setAttributes);
                break;

            case 'taxonomy':
                data[type].forEach(dataSlug => renderTaxonomy(type, checkBoxes, dataSlug, returnArray, setAttributes));
                break;

            default:
        }
    }
    return (
        <ul>
            {checkBoxes}
        </ul>
    );
};

export default addCheckBox;
