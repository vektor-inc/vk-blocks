import React from "react";
import {ComponentDeprecated} from "./component-deprecated";

export const deprecated = [
	{
		attributes: {
			content: {
				source: 'html',
				selector: 'span',
			},
			buttonUrl: {
				type: 'string',
				default: null,
			}
		},

		save({attributes}) {
			const {
				content,
				buttonUrl,
			} = attributes;

			return (
				<div className={"vk_your-block-slug"}>
					<ComponentDeprecated
						attributes={attributes}
						for_={'save'}
					/>
				</div>
			);
		},
	}
];
