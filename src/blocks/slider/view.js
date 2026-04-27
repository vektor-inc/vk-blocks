/* global Swiper */
document.defaultView.addEventListener('load', function () {
	// //data-vkb-slider属性のNodeを取得
	let sliderNodeList = document.querySelectorAll('[data-vkb-slider]');
	// 配列に変換。
	sliderNodeList = Array.from(sliderNodeList);

	// ズームアニメーション用のCSS生成関数
	const generateZoomAnimationCss = (attributes, sliderId) => {
		const {
			zoomAnimation,
			zoomInitialScale,
			zoomFinalScale,
			autoPlayDelay,
			speed,
		} = attributes;

		let css = '';

		if (zoomAnimation) {
			// ズーム用のセレクターは ::before 専用にして、親要素への副作用を防ぐ
			const zoomSelector = `.vk_slider_${sliderId}`;

			css += `
.vk_slider_${sliderId} .vk_slider_item.swiper-slide-active::before,
.vk_slider_${sliderId} .vk_slider_item.swiper-slide-duplicate-active::before {
	content: "";
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-size: cover;
	background-position: center;
	background-image: var(--vk-slider-item-bg-image, inherit);
	will-change: transform;
	transform: scale(${zoomInitialScale !== undefined ? zoomInitialScale : 1});
	transition: transform ${(autoPlayDelay + speed + autoPlayDelay * 0.5) / 1000 || 6}s linear;
	z-index: -1;
}

${zoomSelector} .vk_slider_item.swiper-slide-active::before,
${zoomSelector} .vk_slider_item.swiper-slide-duplicate-active::before {
	transform: scale(${zoomFinalScale !== undefined ? zoomFinalScale : 1.25});
}

${zoomSelector} .vk_slider_item.swiper-slide-prev::before,
${zoomSelector} .vk_slider_item.swiper-slide-next::before {
	transform: scale(${zoomInitialScale !== undefined ? zoomInitialScale : 1});
}
`;
		}

		return css;
	};

	// ズームアニメーション用のスタイルを動的に追加
	const addZoomAnimationStyles = (attributes, sliderId) => {
		if (attributes.zoomAnimation) {
			const css = generateZoomAnimationCss(attributes, sliderId);
			if (css) {
				const styleElement = document.createElement('style');
				styleElement.type = 'text/css';
				styleElement.innerHTML = css;
				document.head.appendChild(styleElement);
			}
		}
	};

	if (sliderNodeList) {
		for (const index in sliderNodeList) {
			const sliderNode = sliderNodeList[index];
			const attributes = JSON.parse(
				sliderNode.getAttribute('data-vkb-slider')
			);
			// Backward compatibility: handle typo in old attribute name.
			if (
				attributes.zoomFinalScale === undefined &&
				attributes.zoomFinalScal !== undefined
			) {
				attributes.zoomFinalScale = attributes.zoomFinalScal;
			}
			if (!sliderNode.classList.contains('swiper')) {
				sliderNode.classList.add('swiper');
			}
			let sliderId = '';
			if (attributes.blockId !== undefined) {
				sliderId = attributes.blockId;
			} else if (attributes.clientId !== undefined) {
				// 1.36.0 より古い状態で保存されてる場合の互換処理
				sliderId = attributes.clientId;
			}

			// ズームアニメーション用のスタイルを追加
			addZoomAnimationStyles(attributes, sliderId);

			// Swiper設定オブジェクトを組み立て
			const config = {
				autoplay: attributes.autoPlay
					? {
							delay: Number(attributes.autoPlayDelay) ?? 2500,
							disableOnInteraction: !!attributes.autoPlayStop,
							stopOnLastSlide: !attributes.loop,
							// direction='ltr'時はreverseDirection=trueで左→右、'rtl'時はfalseで右→左
							reverseDirection: attributes.direction === 'ltr',
						}
					: false,
				pagination:
					attributes.pagination !== 'hide'
						? {
								el: '.swiper-pagination',
								clickable: true,
								type: attributes.pagination,
								renderFraction(currentClass, totalClass) {
									return (
										'<span class="' +
										currentClass +
										'"></span>' +
										' / ' +
										'<span class="' +
										totalClass +
										'"></span>'
									);
								},
							}
						: false,
				speed: Number(attributes.speed) || 300,
				loop: !!attributes.loop,
				effect: attributes.effect || 'slide',
				navigation: {
					nextEl: '.swiper-button-next',
					prevEl: '.swiper-button-prev',
				},
			};

			if (attributes.effect !== 'fade') {
				if (attributes.slidesPerViewMobile) {
					config.slidesPerView = Number(
						attributes.slidesPerViewMobile
					);
					config.slidesPerGroup =
						attributes.slidesPerGroup === 'slides-per-view'
							? Number(attributes.slidesPerViewMobile)
							: 1;
				} else if (attributes.slidesPerView) {
					config.slidesPerView = Number(attributes.slidesPerView);
					config.slidesPerGroup =
						attributes.slidesPerGroup === 'slides-per-view'
							? Number(attributes.slidesPerView)
							: 1;
				} else {
					config.slidesPerView = 1;
					config.slidesPerGroup = 1;
				}
				if (
					attributes.slidesPerViewTablet ||
					attributes.slidesPerViewPC
				) {
					config.breakpoints = {};
					if (attributes.slidesPerViewTablet) {
						config.breakpoints[576] = {
							slidesPerView: Number(
								attributes.slidesPerViewTablet
							),
							slidesPerGroup:
								attributes.slidesPerGroup === 'slides-per-view'
									? Number(attributes.slidesPerViewTablet)
									: 1,
						};
					}
					if (attributes.slidesPerViewPC) {
						config.breakpoints[992] = {
							slidesPerView: Number(attributes.slidesPerViewPC),
							slidesPerGroup:
								attributes.slidesPerGroup === 'slides-per-view'
									? Number(attributes.slidesPerViewPC)
									: 1,
						};
					}
				}
				if (attributes.centeredSlides) {
					config.centeredSlides = !!attributes.centeredSlides;
				}
			}

			// slidesPerGroup を正整数に正規化する（Swiper に渡す値とループ判定を一致させる）。
			const toIntSpg = (v) => {
				const n = Number(v);
				return Number.isFinite(n) ? Math.max(1, Math.floor(n)) : 1;
			};
			if (config.slidesPerGroup !== undefined) {
				config.slidesPerGroup = toIntSpg(config.slidesPerGroup);
			}
			if (config.breakpoints) {
				Object.keys(config.breakpoints).forEach((bp) => {
					const spg = config.breakpoints[bp].slidesPerGroup;
					if (spg !== undefined) {
						config.breakpoints[bp].slidesPerGroup = toIntSpg(spg);
					}
				});
			}

			// ループモードに必要なスライド数が不足する場合は自動的に無効化する。
			// Swiper の loopFix は centeredSlides=true かつ slidesPerView が偶数のとき
			// 内部的に slidesPerView を +1 するため、必要最小スライド数が増加する。
			// 例: slidesPerView=2, centeredSlides=true → 最小5枚必要、4枚では破綻する。
			if (config.loop) {
				const slideCount = sliderNode.querySelectorAll(
					':scope > .swiper-wrapper > .swiper-slide'
				).length;
				const centeredSlides = !!config.centeredSlides;

				// 全ブレークポイントを含む設定ペアを収集
				const configPairs = [
					{
						spv: config.slidesPerView || 1,
						spg: config.slidesPerGroup || 1,
					},
				];
				if (config.breakpoints) {
					Object.values(config.breakpoints).forEach(
						({ slidesPerView, slidesPerGroup }) => {
							if (slidesPerView) {
								configPairs.push({
									spv: slidesPerView,
									spg: slidesPerGroup || 1,
								});
							}
						}
					);
				}

				// Swiper の loopFix と同じロジックで最小必要枚数を計算。
				// このロジックは loop-min-slides.js の getMinSlidesForLoop と同一。
				// view.js は gulp で直接 minify されるため ES module import が使えず、
				// やむなく重複させている。変更時は両方を同期すること。
				const needsLoopDisable = configPairs.some(({ spv, spg }) => {
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
					if (centeredSlides && w % 2 === 0) {
						w += 1;
					}
					let y = centeredSlides
						? Math.max(normalizedSpg, Math.ceil(w / 2))
						: normalizedSpg;
					if (y % normalizedSpg !== 0) {
						y += normalizedSpg - (y % normalizedSpg);
					}
					return slideCount < w + y;
				});

				if (needsLoopDisable) {
					config.loop = false;
					if (config.autoplay && config.autoplay !== false) {
						config.autoplay.stopOnLastSlide = true;
					}
				}
			}

			// Swiperインスタンスをwindow変数に格納
			window[`swiper${index}`] = new Swiper(
				`.vk_slider_${sliderId}`,
				config
			);
			// ページネーションがOFFの時非表示
			if (
				attributes.pagination === 'hide' &&
				window[`swiper${index}`]?.pagination
			) {
				window[`swiper${index}`].pagination.destroy();
			}
		}
	}
});
