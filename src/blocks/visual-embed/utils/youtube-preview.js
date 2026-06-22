const YOUTUBE_THUMBNAIL_BASE = 'https://i.ytimg.com/vi/';
const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

const isYouTubeHost = (hostname) => {
	const normalizedHostname = hostname.toLowerCase();

	return (
		normalizedHostname === 'youtube.com' ||
		normalizedHostname.endsWith('.youtube.com') ||
		normalizedHostname === 'youtube-nocookie.com' ||
		normalizedHostname.endsWith('.youtube-nocookie.com')
	);
};

const getIframeSrc = (iframeCode) => {
	if (!iframeCode || typeof iframeCode !== 'string') {
		return null;
	}

	if (
		typeof window !== 'undefined' &&
		typeof window.DOMParser !== 'undefined'
	) {
		const parser = new window.DOMParser();
		const doc = parser.parseFromString(iframeCode, 'text/html');
		const iframe = doc.querySelector('iframe');

		return iframe ? iframe.getAttribute('src') : null;
	}

	const match = iframeCode.match(/<iframe\b[^>]*\bsrc=(["'])(.*?)\1/i);

	return match ? match[2] : null;
};

export const getYouTubeVideoIdFromSrc = (src) => {
	if (!src || typeof src !== 'string') {
		return null;
	}

	let url;
	try {
		url = new URL(src);
	} catch (e) {
		return null;
	}

	if (!isYouTubeHost(url.hostname)) {
		return null;
	}

	const match = url.pathname.match(/^\/embed\/([^/?#]+)/);

	if (!match) {
		return null;
	}

	let videoId;
	try {
		videoId = decodeURIComponent(match[1]);
	} catch (e) {
		return null;
	}

	if (videoId === 'videoseries') {
		return null;
	}

	return YOUTUBE_VIDEO_ID_PATTERN.test(videoId) ? videoId : null;
};

export const getYouTubePreviewData = (iframeCode) => {
	const src = getIframeSrc(iframeCode);
	const videoId = getYouTubeVideoIdFromSrc(src);

	if (!videoId) {
		return null;
	}

	return {
		videoId,
		thumbnailUrl: `${YOUTUBE_THUMBNAIL_BASE}${encodeURIComponent(
			videoId
		)}/mqdefault.jpg`,
	};
};
