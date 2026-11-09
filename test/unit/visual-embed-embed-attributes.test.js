/**
 * @jest-environment jsdom
 */
/* eslint-env jest */
import {
	getCategories,
	parse,
	registerBlockType,
	serialize,
	setCategories,
	unregisterBlockType,
} from '@wordpress/blocks';
import { matchUrlPattern } from '@vkblocks/blocks/visual-embed/utils/match-url-pattern';
import {
	EMPTY_EMBED_ATTRIBUTES,
	createIframeCode,
	extractEmbedAttributes,
	getAllowedUrlPatterns,
	isValidEmbedSize,
	migrateLegacyAttributes,
	sanitizeEmbedAttributes,
} from '@vkblocks/blocks/visual-embed/utils/embed-attributes';
import { metadata, settings } from '@vkblocks/blocks/visual-embed';
import cases from '../fixtures/visual-embed-url-cases.json';
import sanitizeCases from '../fixtures/visual-embed-sanitize-cases.json';

// PHP が wp_localize_script で渡す許可パターン（テストでは最小限）
const patterns = ['https://*.google.com/*', 'https://*.youtube.com/embed/*'];

describe('visual-embed: matchUrlPattern（PHP と共通のケース）', () => {
	test.each(cases)('$name', ({ url, pattern, expected }) => {
		expect(matchUrlPattern(url, pattern)).toBe(expected);
	});
});

describe('visual-embed: getAllowedUrlPatterns', () => {
	afterEach(() => {
		delete window.vkBlocksVisualEmbed;
	});

	test('PHP から渡された配列をそのまま返す', () => {
		window.vkBlocksVisualEmbed = { allowedUrlPatterns: patterns };
		expect(getAllowedUrlPatterns()).toEqual(patterns);
	});

	test('渡されていない・配列でない場合は空配列（何も許可しない）', () => {
		expect(getAllowedUrlPatterns()).toEqual([]);
		window.vkBlocksVisualEmbed = {
			allowedUrlPatterns: 'https://*.google.com/*',
		};
		expect(getAllowedUrlPatterns()).toEqual([]);
	});
});

describe('visual-embed: isValidEmbedSize', () => {
	test('数値・px・% だけを受け付ける', () => {
		expect(isValidEmbedSize('560')).toBe(true);
		expect(isValidEmbedSize('560px')).toBe(true);
		expect(isValidEmbedSize('100%')).toBe(true);
		expect(isValidEmbedSize('auto')).toBe(false);
		expect(isValidEmbedSize('10em')).toBe(false);
		expect(isValidEmbedSize('')).toBe(false);
		expect(isValidEmbedSize(560)).toBe(false);
	});
});

describe('visual-embed: sanitizeEmbedAttributes（PHP と共通のケース）', () => {
	const PATTERNS = ['https://*.google.com/*', 'https://www.youtube.com/*'];
	test.each(sanitizeCases)('$name', ({ data, expected }) => {
		expect(sanitizeEmbedAttributes(data, PATTERNS)).toEqual(expected);
	});
});

describe('visual-embed: sanitizeEmbedAttributes', () => {
	test('許可した属性だけを残し、未知の属性（srcdoc・onload など）は捨てる', () => {
		expect(
			sanitizeEmbedAttributes(
				{
					src: 'https://www.youtube.com/embed/abc',
					width: '560',
					height: '315',
					title: 'Video',
					allowfullscreen: '',
					srcdoc: '<script>alert(1)</script>',
					onload: 'alert(1)',
					sandbox: '',
				},
				patterns
			)
		).toEqual({
			src: 'https://www.youtube.com/embed/abc',
			width: '560',
			height: '315',
			title: 'Video',
			allowfullscreen: '',
		});
	});

	test('KSES で &amp; に変わった保存データは & に戻してから判定する', () => {
		expect(
			sanitizeEmbedAttributes(
				{
					src: 'https://www.google.com/maps?a=1&amp;b=2',
					title: 'Tom &amp; Jerry',
				},
				patterns
			)
		).toEqual({
			src: 'https://www.google.com/maps?a=1&b=2',
			title: 'Tom & Jerry',
		});
	});

	test('不正な幅・高さと危険な style は捨て、他の属性は残す', () => {
		expect(
			sanitizeEmbedAttributes(
				{
					src: 'https://www.google.com/maps',
					width: 'auto',
					height: '450px',
					style: 'background:url(https://evil.test/x.png)',
				},
				patterns
			)
		).toEqual({
			src: 'https://www.google.com/maps',
			height: '450px',
		});
		expect(
			sanitizeEmbedAttributes(
				{ src: 'https://www.google.com/maps', style: 'border:0;' },
				patterns
			)
		).toEqual({ src: 'https://www.google.com/maps', style: 'border:0' });
	});

	test('不許可の URL・src 無し・オブジェクト以外は空にする', () => {
		expect(
			sanitizeEmbedAttributes(
				{ src: 'https://evil.test/embed', width: '560' },
				patterns
			)
		).toEqual({});
		expect(sanitizeEmbedAttributes({ width: '560' }, patterns)).toEqual({});
		expect(sanitizeEmbedAttributes(undefined, patterns)).toEqual({});
		expect(sanitizeEmbedAttributes(null, patterns)).toEqual({});
		expect(sanitizeEmbedAttributes([], patterns)).toEqual({});
		expect(sanitizeEmbedAttributes('<iframe>', patterns)).toEqual({});
	});

	test('文字列でない値は捨てる', () => {
		expect(
			sanitizeEmbedAttributes(
				{
					src: 'https://www.google.com/maps',
					allowfullscreen: true,
					width: 560,
				},
				patterns
			)
		).toEqual({ src: 'https://www.google.com/maps' });
	});
});

describe('visual-embed: extractEmbedAttributes', () => {
	test('最初の iframe の許可属性だけを取り出し、同梱の script や危険な属性は捨てる', () => {
		const data = extractEmbedAttributes(
			'<p>x</p><iframe src="https://www.youtube.com/embed/abc" width="560" srcdoc="<script>alert(1)</script>" onload="alert(1)" allowfullscreen></iframe><script>alert(2)</script><iframe src="https://evil.test/"></iframe>',
			patterns
		);
		expect(data).toEqual({
			src: 'https://www.youtube.com/embed/abc',
			width: '560',
			allowfullscreen: '',
		});
		expect(createIframeCode(data)).not.toMatch(/onload|srcdoc|script|evil/);
	});

	test('src 属性のエンティティは実体に戻して扱い、組み立て直すと再び &amp; になる', () => {
		const data = extractEmbedAttributes(
			'<iframe src="https://www.google.com/maps?a=1&amp;b=2"></iframe>',
			patterns
		);
		expect(data.src).toBe('https://www.google.com/maps?a=1&b=2');
		expect(createIframeCode(data)).toContain('a=1&amp;b=2');
	});

	test('不許可の URL・iframe 無し・文字列以外は空にする', () => {
		expect(
			extractEmbedAttributes(
				'<iframe src="https://evil.test/embed"></iframe>',
				patterns
			)
		).toEqual({});
		expect(extractEmbedAttributes('<p>no iframe</p>', patterns)).toEqual(
			{}
		);
		expect(extractEmbedAttributes('', patterns)).toEqual({});
		expect(extractEmbedAttributes(undefined, patterns)).toEqual({});
	});
});

describe('visual-embed: migrateLegacyAttributes', () => {
	const legacyCode =
		'<iframe src="https://www.google.com/maps" width="600" height="340"></iframe>';

	test('保存済みプレビューの HTML を優先して embedAttributes にし、旧属性は取り除く', () => {
		expect(
			migrateLegacyAttributes(
				{
					iframeCode:
						'<iframe src="https://www.google.com/maps?from=attr"></iframe>',
					legacyPreview: legacyCode,
					iframeWidth: '600',
					iframeHeight: '340',
					align: 'center',
					className: 'custom',
				},
				patterns
			)
		).toEqual({
			iframeWidth: '600',
			iframeHeight: '340',
			align: 'center',
			className: 'custom',
			embedAttributes: {
				src: 'https://www.google.com/maps',
				width: '600',
				height: '340',
			},
		});
	});

	test('KSES で空になったプレビューは既定の地図に戻さず、空を表す { src: "" } にする', () => {
		expect(
			migrateLegacyAttributes(
				{
					iframeCode: '',
					legacyPreview: '',
					iframeWidth: '560',
					iframeHeight: '315',
				},
				patterns
			)
		).toEqual({
			iframeWidth: '560',
			iframeHeight: '315',
			embedAttributes: EMPTY_EMBED_ATTRIBUTES,
		});
		// 既定値の iframeCode が残っていても、空のプレビューが優先される
		expect(
			migrateLegacyAttributes(
				{ iframeCode: legacyCode, legacyPreview: '' },
				patterns
			).embedAttributes
		).toEqual(EMPTY_EMBED_ATTRIBUTES);
		// 空の保存値は表示用には何も残らない
		expect(
			sanitizeEmbedAttributes(EMPTY_EMBED_ATTRIBUTES, patterns)
		).toEqual({});
	});

	test('プレビューの HTML が無い場合は iframeCode から取り出す', () => {
		expect(
			migrateLegacyAttributes({ iframeCode: legacyCode }, patterns)
				.embedAttributes
		).toEqual({
			src: 'https://www.google.com/maps',
			width: '600',
			height: '340',
		});
	});

	test('旧エディタがプレビューへ書き込んだエラー文は埋め込みとして扱わない', () => {
		expect(
			migrateLegacyAttributes(
				{
					iframeCode: 'Only allowed URLs can be embedded.',
					legacyPreview: 'Only allowed URLs can be embedded.',
				},
				patterns
			).embedAttributes
		).toEqual(EMPTY_EMBED_ATTRIBUTES);
	});
});

describe('visual-embed: createIframeCode', () => {
	test('許可属性の順に iframe を組み立て、src が無ければ空文字', () => {
		expect(
			createIframeCode({
				title: 'Map',
				src: 'https://www.google.com/maps',
				width: '100%',
			})
		).toBe(
			'<iframe src="https://www.google.com/maps" width="100%" title="Map"></iframe>'
		);
		expect(createIframeCode({})).toBe('');
		expect(createIframeCode(undefined)).toBe('');
	});
});

describe('visual-embed: 1.130.1 以前の保存内容の読み込み（deprecated）', () => {
	const defaultIframe =
		'<iframe src="https://www.google.com/maps/embed?pb=!1m0!3m2!1sen!2sus!4v1609459543842!5m2!1sen!2sus" width="100%" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>';
	const youtubeIframe =
		'<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="600" height="340" title="Legacy"></iframe>';

	beforeAll(() => {
		window.vkBlocksVisualEmbed = { allowedUrlPatterns: patterns };
		setCategories([
			...getCategories(),
			{ slug: 'vk-blocks-cat', title: 'VKBlocks' },
		]);
		registerBlockType(metadata, settings);
	});

	afterAll(() => {
		unregisterBlockType(metadata.name);
		delete window.vkBlocksVisualEmbed;
	});

	const parseOne = (html) =>
		parse(html, { __unstableSkipMigrationLogs: true })[0];

	// 配置（align）はブロックエディターのフック（block-editor の hooks）が足す属性で、この単体テストの環境では
	// 登録されないため、ここでは幅・高さ・追加クラスだけを確かめる（配置は e2e 用 fixture と実機で確認する）
	test('iframe が残っている旧ブロックは検証エラーにならず、幅・高さ・追加クラスを保って新形式になる', () => {
		const block = parseOne(
			`<!-- wp:vk-blocks/visual-embed {"iframeCode":"${youtubeIframe.replace(/"/g, '\\"')}","iframeWidth":"600","iframeHeight":"340","className":"legacy-custom"} -->
<div class="wp-block-vk-blocks-visual-embed legacy-custom vk-visual-embed"><div class="vk-visual-embed-preview">${youtubeIframe}</div></div>
<!-- /wp:vk-blocks/visual-embed -->`
		);
		expect(block.isValid).toBe(true);
		expect(block.attributes).toMatchObject({
			embedAttributes: {
				src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
				width: '600',
				height: '340',
				title: 'Legacy',
			},
			iframeWidth: '600',
			iframeHeight: '340',
			className: 'legacy-custom',
		});
		expect(block.attributes.iframeCode).toBeUndefined();
		expect(block.attributes.legacyPreview).toBeUndefined();
		// 再保存すると本文には HTML を残さない（PHP が描画する）
		expect(serialize([block])).toBe(
			'<!-- wp:vk-blocks/visual-embed {"embedAttributes":{"src":"https://www.youtube.com/embed/dQw4w9WgXcQ","width":"600","height":"340","title":"Legacy"},"iframeWidth":"600","iframeHeight":"340","className":"legacy-custom"} /-->'
		);
	});

	test('KSES で iframe が消えた旧ブロックは検証エラーの無い空の状態になり、既定の地図には戻らない', () => {
		const block = parseOne(
			`<!-- wp:vk-blocks/visual-embed {"iframeCode":"","iframeWidth":"560","iframeHeight":"315"} -->
<div class="wp-block-vk-blocks-visual-embed vk-visual-embed"><div class="vk-visual-embed-preview"></div></div>
<!-- /wp:vk-blocks/visual-embed -->`
		);
		expect(block.isValid).toBe(true);
		expect(block.attributes.embedAttributes).toEqual(
			EMPTY_EMBED_ATTRIBUTES
		);
		expect(block.attributes.iframeWidth).toBe('560');
		// KSES の再シリアライズで [] になった空も、既定の地図ではなく空として読む
		expect(
			sanitizeEmbedAttributes(
				parseOne(
					'<!-- wp:vk-blocks/visual-embed {"embedAttributes":[]} /-->'
				).attributes.embedAttributes,
				patterns
			)
		).toEqual({});
	});

	test('属性を持たない既定の地図の旧ブロックも新形式になる', () => {
		const block = parseOne(
			`<!-- wp:vk-blocks/visual-embed -->
<div class="wp-block-vk-blocks-visual-embed vk-visual-embed"><div class="vk-visual-embed-preview">${defaultIframe}</div></div>
<!-- /wp:vk-blocks/visual-embed -->`
		);
		expect(block.isValid).toBe(true);
		expect(block.attributes.embedAttributes.src).toBe(
			'https://www.google.com/maps/embed?pb=!1m0!3m2!1sen!2sus!4v1609459543842!5m2!1sen!2sus'
		);
		expect(block.attributes.embedAttributes.loading).toBe('lazy');
	});

	test('旧エディタがエラー文を保存したブロックは空の状態になる', () => {
		const block = parseOne(
			`<!-- wp:vk-blocks/visual-embed {"iframeCode":"Only allowed URLs can be embedded."} -->
<div class="wp-block-vk-blocks-visual-embed vk-visual-embed"><div class="vk-visual-embed-preview">Only allowed URLs can be embedded.</div></div>
<!-- /wp:vk-blocks/visual-embed -->`
		);
		expect(block.isValid).toBe(true);
		expect(block.attributes.embedAttributes).toEqual(
			EMPTY_EMBED_ATTRIBUTES
		);
	});

	test('新形式のブロックはそのまま読み込め、不許可の URL は表示用の属性にならない', () => {
		const block = parseOne(
			'<!-- wp:vk-blocks/visual-embed {"embedAttributes":{"src":"https://www.google.com/maps","width":"560"},"iframeWidth":"560"} /-->'
		);
		expect(block.isValid).toBe(true);
		expect(block.attributes.embedAttributes).toEqual({
			src: 'https://www.google.com/maps',
			width: '560',
		});
		const disallowed = parseOne(
			'<!-- wp:vk-blocks/visual-embed {"embedAttributes":{"src":"https://evil.test/embed"}} /-->'
		);
		expect(disallowed.isValid).toBe(true);
		expect(
			sanitizeEmbedAttributes(
				disallowed.attributes.embedAttributes,
				patterns
			)
		).toEqual({});
		// 属性無しの新形式は block.json の既定の地図
		expect(
			parseOne('<!-- wp:vk-blocks/visual-embed /-->').attributes
				.embedAttributes
		).toEqual(metadata.attributes.embedAttributes.default);
	});
});
