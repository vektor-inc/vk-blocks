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
            checked={returnArray[dataSlug]}
            onChange={
                (value) => {
                    returnArray[dataSlug] = value;
                    setAttributes({isCheckedPostType: JSON.stringify(returnArray)});
                }
            }
        />));
};

const renderCategory = (checkBoxes, dataSlug, returnArray, setAttributes) => {
    return (checkBoxes.push(
        <CheckboxControl
            label={dataSlug}
            checked={returnArray[dataSlug]}
            onChange={
                (value) => {
                    returnArray[dataSlug] = value;
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

    for (let i in data) {

        let dataSlug = data[i].slug;

        switch (name) {
            case 'postTypes':
                renderPostTypes(checkBoxes, dataSlug, returnArray, setAttributes);
                break;

            case 'taxonomy':
                renderCategory(checkBoxes, dataSlug, returnArray, setAttributes);
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
