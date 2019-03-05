/**
 * Pr-Content block type
 *
 */

import React from "react";
import {schema} from './schema';
import {Component} from "./component";

const {__} = wp.i18n; // Import __() from wp.i18n
const {Fragment} = wp.element;

export const deprecated = [
    {

        attributes: schema,

        save({attributes}) {

            return (
                <Component
                    attributes={attributes}
                    for_={'save'}
                />
            );
        },
    }
];