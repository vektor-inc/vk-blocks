import React from 'react';

export class SpacerComponent extends React.Component {

    render() {
        let {
            unit,
            pc,
            tablet,
            mobile,
        } = this.props.attributes;

        return (
            <div className="vk_spacer">
                <div id={'pc'} style={{height: pc + unit}}></div>
                <div id={'tablet'} style={{height: tablet + unit}}></div>
                <div id={'mobile'} style={{height: mobile + unit}}></div>
            </div>
        );
    }
}
