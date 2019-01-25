const componentDivider = (level, color, whichSide, dividerType) =>{

    let sectionPadding;
    let sectionClass;
    let lenderDivider;

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

            return <path
                d={ `m0,100 q50,${ level * 2},100,0 V100 L0,100 z` }
                strokeWidth="0"
                fill={color}
            />
        }
    };

    const waveSectionStyle = (level) => {

        if (level > 0) {

            return (
                <path
                    d={ `m0,${ 100 - ( level / 2 ) } q20,${ level },40,0 t40,0 t40,0 V100 L0,100 z` }
                    strokeWidth="0"
                    fill={ color }
                />
            );
        } else if (level < 0) {

            return (
                <path
                    d={ `m0,${ ( level / 2 ) + 100 } q20,${ level },40,0 t40,0 t40,0 V100 L0,100 z` }
                    strokeWidth="0"
                    fill={ color }
                />
            );
        }

    };

    const triangleSectionStyle = (level) => {

        const absLevel = Math.abs(level);
        const DivideAbs4 = absLevel / 4;

        if (level > 0) {

            return (
                <path
                    d={`m0,100 h${50 - DivideAbs4} l${DivideAbs4},-${absLevel} l${DivideAbs4},${absLevel} h${DivideAbs4} v100 h-100 z`}
                    strokeWidth="0"
                    fill={color}
                />);
        } else if (level < 0) {

            return (
                <path
                    d={`m0,${100 - absLevel} h${50 - DivideAbs4} l${DivideAbs4},${absLevel} l${DivideAbs4},-${absLevel} h${50 - DivideAbs4} v${absLevel + 1} h-100 z`}
                    strokeWidth="0"
                    fill={color}
                />);
        }
    };
    //Paddingの条件分岐を追加
    if (dividerType === 'tilt') {

        sectionPadding = Math.abs(level);
        lenderDivider = tiltSectionStyle(level);

    }else if(dividerType === 'curve') {

        if (level > 0) {
            sectionPadding = Math.abs(level);
        } else if (level < 0) {
            sectionPadding = Math.abs(level) * 2;
        }
        lenderDivider = curveSectionStyle(level);

    }else if(dividerType === 'wave'){

        sectionPadding = Math.abs(level);
        lenderDivider = waveSectionStyle(level);

    }else if(dividerType === 'triangle'){

        sectionPadding = Math.abs(level);
        lenderDivider = triangleSectionStyle(level);

    }

    //classにdividerTypeを追加
    sectionClass = dividerType;

    //upper-paddingを追加
    if (whichSide === 'upper') {
        return (
            <div
                className={`vk_outer_section-upper vk_outer_section-${sectionClass}`}
                style={{paddingBottom: sectionPadding + `px`}}
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {lenderDivider}
                </svg>
            </div>

        );
    //lower-paddingを追加
    } else if (whichSide === 'lower') {
        return (

            <div
                className={`vk_outer_section-lower vk_outer_section-${sectionClass}`}
                style={{paddingTop: sectionPadding + `px`}}
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {lenderDivider}
                </svg>
            </div>
        )
    }
};

export {componentDivider};