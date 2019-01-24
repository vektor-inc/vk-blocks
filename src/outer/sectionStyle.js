const sectionStyle = (level,color,whichSide) =>{

    let sectionPaddingUpper;
    let sectionPaddingLower;

    const tiltSectionStyle = (level) => {

        if (level > 0) {
            return <path
                d={`m0,${100 - level} L100,100 L0,100 z`}
                strokeWidth="0"
                fill={color}
            />
        } else if (level < 0) {

            //絶対値に変換
            const absLevel = Math.abs(level);

            return <path
                d={`m100,${100 - absLevel} L0,100 L100,100 z`}
                strokeWidth="0"
                fill={color}
            />
        }
    };

    const curveSectionStyle = (level) => {
        if (level > 0) {

            return <path
                d={ `m0,${ 100 - level } q50,${ level * 2 },100,0 V100 L0,100 z` }
                strokeWidth="0"
                fill={color}
            />
        } else if (level < 0) {

            //絶対値に変換
            const absLevel = Math.abs(level);

            return <path
                d={ `m0,${ absLevel } q50,${ level * 2 },100,0 V100 L0,100 z` }
                strokeWidth="0"
                fill={color}
            />
        }
    };

    //Paddingの条件分岐を追加
    let type = 'tilt';
    if (type === 'tilt') {
        sectionPaddingUpper = Math.abs(level);
        sectionPaddingLower = Math.abs(level);
    }

    //upper-paddingを追加
    if (whichSide === 'upper') {
        return (
            <div
                className={'vk_outer_border_style-upper'}
                style={{paddingBottom: sectionPaddingUpper + `px`}}
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {tiltSectionStyle(level)}
                </svg>
            </div>

        );
    //lower-paddingを追加
    } else if (whichSide === 'lower') {
        return (

            <div
                className={'vk_outer_border_style-lower'}
                style={{paddingTop: sectionPaddingLower + `px`}}
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {tiltSectionStyle(level)}
                </svg>
            </div>
        )
    }
};

export {sectionStyle};