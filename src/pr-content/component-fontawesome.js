import React from 'react';

export class Fontawesome extends React.Component {

    render() {
        let {
            buttonText,
            fontAwesomeIconBefore,
            fontAwesomeIconAfter,
        } = this.props.attributes;

        let iconBefore = '';
        let iconAfter = '';


        if (fontAwesomeIconBefore) {
            iconBefore = <i className={`${fontAwesomeIconBefore} vk_button_link_before`}></i> ;
        }
        if (fontAwesomeIconAfter) {
            iconAfter = <i className={`${fontAwesomeIconAfter} vk_button_link_after`}></i>;
        }

        return (
                <div>
                    {iconBefore}
                    <span className="vk_prContent_btn_txt">{buttonText}</span>
                    {iconAfter}
                </div>
        );
    }
}
