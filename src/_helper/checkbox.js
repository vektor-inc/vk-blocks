'use strict';
import React from "react";

const {CheckboxControl} = wp.components;

const addCheckBox = (checkBoxData, parseIsChecked,setAttributes) => {

    if (!checkBoxData) {
        return false
    }

    let checkBoxes = [];

    for (let i in checkBoxData) {

        let checkBoxDataSlug = checkBoxData[i].slug;

        checkBoxes.push(
            <CheckboxControl
                label={checkBoxDataSlug}
                checked={parseIsChecked[checkBoxDataSlug]}
                onChange={
                    (value) => {
                        parseIsChecked[checkBoxDataSlug] = value;
                        setAttributes({isCheckedPostType: JSON.stringify(parseIsChecked)});
                    }
                }
            />);
    }
    return (
        <ul>
            {checkBoxes}
        </ul>
    );
};

export default addCheckBox;
