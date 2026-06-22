/* eslint-env jest */
import {
	getYouTubePreviewData,
	getYouTubeVideoIdFromSrc,
} from '@vkblocks/blocks/visual-embed/utils/youtube-preview';

describe('visual-embed: getYouTubeVideoIdFromSrc', () => {
	test('YouTube embed URL から動画IDを取得する', () => {
		expect(
			getYouTubeVideoIdFromSrc(
				'https://www.youtube.com/embed/M7lc1UVf-VE?si=test'
			)
		).toBe('M7lc1UVf-VE');
	});

	test('youtube-nocookie.com の embed URL から動画IDを取得する', () => {
		expect(
			getYouTubeVideoIdFromSrc(
				'https://www.youtube-nocookie.com/embed/M7lc1UVf-VE'
			)
		).toBe('M7lc1UVf-VE');
	});

	test('embed 以外の YouTube URL は対象外にする', () => {
		expect(
			getYouTubeVideoIdFromSrc(
				'https://www.youtube.com/watch?v=M7lc1UVf-VE'
			)
		).toBe(null);
	});

	test('playlist 用 embed URL は対象外にする', () => {
		expect(
			getYouTubeVideoIdFromSrc(
				'https://www.youtube.com/embed/videoseries?list=PL0000000000'
			)
		).toBe(null);
	});

	test('YouTube に見える末尾偽装ドメインは対象外にする', () => {
		expect(
			getYouTubeVideoIdFromSrc(
				'https://www.youtube.com.attacker.com/embed/M7lc1UVf-VE'
			)
		).toBe(null);
	});

	test('不正なパーセントエンコーディングを含む embed URL は null を返す（クラッシュしない）', () => {
		expect(
			getYouTubeVideoIdFromSrc('https://www.youtube.com/embed/%E0')
		).toBe(null);
		expect(
			getYouTubeVideoIdFromSrc('https://www.youtube.com/embed/%')
		).toBe(null);
	});
});

describe('visual-embed: getYouTubePreviewData', () => {
	test('YouTube iframe からサムネイルURLを作る', () => {
		expect(
			getYouTubePreviewData(
				'<iframe width="560" height="315" src="https://www.youtube.com/embed/M7lc1UVf-VE?si=test"></iframe>'
			)
		).toEqual({
			videoId: 'M7lc1UVf-VE',
			thumbnailUrl: 'https://i.ytimg.com/vi/M7lc1UVf-VE/mqdefault.jpg',
		});
	});

	test('iframe がないコードは対象外にする', () => {
		expect(getYouTubePreviewData('<div>not iframe</div>')).toBe(null);
	});

	test('YouTube 以外の iframe は対象外にする', () => {
		expect(
			getYouTubePreviewData(
				'<iframe src="https://www.google.com/maps/embed?pb=test"></iframe>'
			)
		).toBe(null);
	});
});
