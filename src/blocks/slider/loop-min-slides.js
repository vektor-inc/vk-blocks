/**
 * Swiper の loopFix と同じロジックで最小必要スライド数を算出する。
 * centeredSlides=true かつ slidesPerView が偶数のとき Swiper は内部で +1 するため
 * 必要枚数が増加する (例: slidesPerView=2 → 内部w=3 → 最小5枚)。
 *
 * @param {number}  spv        slidesPerView
 * @param {number}  spg        slidesPerGroup (must be a positive integer)
 * @param {boolean} isCentered centeredSlides
 * @return {number} minimum slide count required for loop mode
 */
export const getMinSlidesForLoop = (spv, spg, isCentered) => {
	const parsedSpv = Number(spv);
	const normalizedSpv = Math.max(
		1,
		Number.isFinite(parsedSpv) ? parsedSpv : 1
	);
	const parsedSpg = Number(spg);
	const normalizedSpg = Math.max(
		1,
		Number.isFinite(parsedSpg) ? Math.floor(parsedSpg) : 1
	);

	let w = Math.ceil(normalizedSpv);
	if (isCentered && w % 2 === 0) {
		w += 1;
	}
	let y = isCentered
		? Math.max(normalizedSpg, Math.ceil(w / 2))
		: normalizedSpg;
	if (y % normalizedSpg !== 0) {
		y += normalizedSpg - (y % normalizedSpg);
	}
	return w + y;
};
