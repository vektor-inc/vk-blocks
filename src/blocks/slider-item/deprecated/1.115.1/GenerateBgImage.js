const GenerateBgImage = (props) => {
	const { attributes, prefix } = props;
	const { bgImageMobile, bgImageTablet, bgImage, bgSize, blockId } =
		attributes;

	const mobileViewport = 'max-width: 575.98px';
	const tabletViewport = 'min-width: 576px';
	const pcViewport = 'min-width: 992px';
	const underPcViewport = 'max-width: 992.98px';

	let backgroundStyle;
	const backgroundPosition = 'background-position:center!important;';
	if ('cover' === bgSize) {
		backgroundStyle = `background-size:${bgSize}!important; ${backgroundPosition}`;
	} else if ('repeat' === bgSize) {
		backgroundStyle = `background-repeat:${bgSize}!important; background-size: auto; ${backgroundPosition}`;
	} else {
		backgroundStyle = ``;
	}

	const createBgCss = (imageUrl) => `
		--vk-slider-item-bg-image: url(${imageUrl});
		background-image: url(${imageUrl});
		background-image: var(--vk-slider-item-bg-image);
		${backgroundStyle}
	`;

	//mobile only
	if (bgImageMobile && !bgImageTablet && !bgImage) {
		return (
			<style>{`.${prefix}-${blockId}{${createBgCss(bgImageMobile)}}`}</style>
		);
	}
	//tablet only
	if (!bgImageMobile && bgImageTablet && !bgImage) {
		return (
			<style>{`.${prefix}-${blockId}{${createBgCss(bgImageTablet)}}`}</style>
		);
	}
	//pc only
	if (!bgImageMobile && !bgImageTablet && bgImage) {
		return (
			<style>{`.${prefix}-${blockId}{${createBgCss(bgImage)}}`}</style>
		);
	}
	//pc -mobile
	if (bgImageMobile && !bgImageTablet && bgImage) {
		return (
			<style>
				{`
          @media screen and (${underPcViewport}) {
            .${prefix}-${blockId}{${createBgCss(bgImageMobile)}}
         }
          @media screen and (${pcViewport}) {
            .${prefix}-${blockId}{${createBgCss(bgImage)}}
         }
          `}
			</style>
		);
	}
	//pc -tablet
	if (!bgImageMobile && bgImageTablet && bgImage) {
		return (
			<style>
				{`
          @media screen and (${underPcViewport}) {
            .${prefix}-${blockId}{${createBgCss(bgImageTablet)}}
         }
          @media screen and (${pcViewport}) {
            .${prefix}-${blockId}{${createBgCss(bgImage)}}
         }
          `}
			</style>
		);
	}
	//tablet - mobile
	if (bgImageMobile && bgImageTablet && !bgImage) {
		return (
			<style>
				{`
          @media screen and (${mobileViewport}) {
            .${prefix}-${blockId}{${createBgCss(bgImageMobile)}}
         }
          @media screen and (${tabletViewport}) {
            .${prefix}-${blockId}{${createBgCss(bgImageTablet)}}
         }
        `}
			</style>
		);
	}
	//pc -tablet - mobile
	if (bgImageMobile && bgImageTablet && bgImage) {
		return (
			<style>
				{`
        @media screen and (${mobileViewport}) {
          .${prefix}-${blockId}{${createBgCss(bgImageMobile)}}
       }
        @media screen and (${tabletViewport}) {
          .${prefix}-${blockId}{${createBgCss(bgImageTablet)}}
       }
        @media screen and (${pcViewport}) {
          .${prefix}-${blockId}{${createBgCss(bgImage)}}
       }
       `}
			</style>
		);
	}

	return null;
};
export default GenerateBgImage;
