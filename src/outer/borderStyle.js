export default function borderStyle( level, color ) {


    function render_path(level) {
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
    }

    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            { render_path(level) }
        </svg>
    );
}