const sectionStyle = (level,color) =>{

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

    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            { curveSectionStyle(level) }
        </svg>
    );
};

export {sectionStyle};