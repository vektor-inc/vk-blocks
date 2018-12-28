import React from 'react';

export class Link extends React.Component {

    render() {

        let buttonColorCustom = this.props.lbColorCustom;
        let buttonColor = this.props.lbColor;
        let buttonType = this.props.lbType;
        let buttonAlign = this.props.lbAlign;
        let buttonSize = this.props.lbSize;
        let buttonUrl = this.props.lbUrl;
        let richText = this.props.lbRichtext;
        let containerClass = '';
        let aClass = '';
        let aStyle = {};

        if (buttonColorCustom) {

            containerClass = `btn-parent custom-btn btn-${buttonAlign}`;
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

            containerClass = `btn-parent custom-btn btn-${buttonAlign}`;

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

        return (
            <div className={containerClass}>
                <a
                    href={buttonUrl}
                    className={aClass}
                    role={'button'}
                    aria-pressed={true}
                    style={aStyle}
                    target={'_blank'}
                >
                    {richText}
                </a>
            </div>
        );
    }
}