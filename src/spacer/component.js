import React from 'react';
import MediaQuery from 'react-responsive';

export class SpacerComponent extends React.Component {

    render() {
        let {
            unit,
            pc,
            tablet,
            mobile,
        } = this.props.attributes;

        return (
            <div>
                {/*768px以上*/}
                <MediaQuery query="(min-width: 768px)">
                    <div style={{height: pc + unit, background: 'purple'}}></div>
                </MediaQuery>
                {/*768px以下、576px以上*/}
                <MediaQuery query="(max-width: 768px)">
                    <MediaQuery query="(min-width: 576px)">
                        <div style={{height: tablet + unit, background: 'blue'}}></div>
                    </MediaQuery>
                </MediaQuery>
                {/*576px以下*/}
                <MediaQuery query="(max-width: 576px)">
                    <div style={{height: mobile + unit, background: 'red'}}></div>
                </MediaQuery>
            </div>
        );
    }
}
