export default function borderStyle( level, color ) {
    color = color ? color : '#f1f1f1';

    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
                d={ `m0,${ 100 - level } L100,100 L0,100 z` }
                strokeWidth="0"
                fill={ '#fff' }
            />
        </svg>
    );
}