import React from 'react';

export class Link extends React.Component {

    render() {

        let buttonColorCustom = this.props.lbColorCustom;
        let buttonColor = this.props.lbColor;
        let buttonType = this.props.lbType;
        let buttonAlign = this.props.lbAlign;
        let buttonSize = this.props.lbSize;
        let buttonUrl = this.props.lbUrl;
        let buttonTarget = this.props.lbTarget;
        let fontAwesomeIconBefore = this.props.lbFontAwesomeIconBefore;
        let fontAwesomeIconAfter = this.props.lbFontAwesomeIconAfter;
        let richText = this.props.lbRichtext;
        let containerClass = '';
        let aClass = '';
        let aStyle = {};
        let iconBefore = '';
        let iconAfter = '';

        if (buttonColorCustom) {

            aClass = `btn btn-primary btn-${buttonSize} active`;

            if (buttonType === '0') {

                aStyle = {
                    backgroundColor: buttonColorCustom,
                    border: `1px solid ${buttonColorCustom}`
                };
            } else if (buttonType === '1') {
                aStyle = {
                    backgroundColor: 'transparent',
                    border: '1px solid' + buttonColorCustom,
                    color: buttonColorCustom
                };
            }

        } else if (!buttonColorCustom) {

            if (buttonType === '0') {
                aClass = `btn btn-${buttonSize} btn-${buttonColor} active`;
                aStyle = {
                    backgroundColor: buttonColorCustom,
                    border: `1px solid ${buttonColorCustom}`
                };
            } else if (buttonType === '1') {
                aClass = `btn btn-${buttonSize} btn-outline-${buttonColor} active`;
                aStyle = {backgroundColor: +'transparent'};
            }

        }

        if ( buttonAlign === 'block' ){
        	aClass = `${aClass} btn-block`;
        }

        if (fontAwesomeIconBefore) {
            iconBefore = <i className={`${fontAwesomeIconBefore} before`}></i> ;
        }
        if (fontAwesomeIconAfter) {
            iconAfter = <i className={`${fontAwesomeIconAfter} after`}></i>;
        }

        return (
                <a
                    href={buttonUrl}
                    className={aClass}
                    role={'button'}
                    aria-pressed={true}
                    style={aStyle}
                    target={buttonTarget? '_blank':null}
                >
                    {iconBefore}
                    {richText}
                    {iconAfter}

                </a>
        );
    }
}
