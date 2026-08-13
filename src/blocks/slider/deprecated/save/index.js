/* eslint camelcase: 0 */
import save1_124_0 from './1.124.0/save';
import save1_121_1 from './1.121.1/save';
import save1_115_0 from './1.115.0/save';
import save1_110_1 from './1.110.1/save';
import save1_105_0 from './1.105.0/save';
import save1_80_1 from './1.80.1/save';
import save1_51_0 from './1.51.0/save';
import save1_48_1 from './1.48.1/save';
import save1_34_1 from './1.34.1/save';
import save1_13_1 from './1.13.1/save';
import save1_10_0 from './1.10.0/save';
import save1_9_2 from './1.9.2/save';
import save1_9_1 from './1.9.1/save';
import save1_2_1 from './1.2.1/save';
import save1_0_16 from './1.0.16/save';

const blockAttributes = {
	unit: {
		type: 'string',
		default: 'px',
	},
	pc: {
		type: 'number',
		default: 600,
	},
	tablet: {
		type: 'number',
		default: 600,
	},
	mobile: {
		type: 'number',
		default: 600,
	},
	autoPlay: {
		type: 'boolean',
		default: true,
	},
	autoPlayDelay: {
		type: 'number',
		default: 2500,
	},
	pagination: {
		type: 'boolean',
		default: true,
	},
	clientId: {
		type: 'string',
		default: '',
	},
	width: {
		type: 'string',
		default: '',
	},
	loop: {
		type: 'boolean',
		default: true,
	},
	effect: {
		type: 'string',
		default: 'slide',
	},
	speed: {
		type: 'number',
		default: 300,
	},
};

const blockAttributes2 = {
	...blockAttributes,
	slidesPerView: {
		type: 'number',
		default: 1
	},
	slidesPerGroup: {
		type: 'number',
		default: 1
	}
}

const blockAttributes3 = {
	...blockAttributes2,
	speed: {
		type: 'number',
		default: 500,
	},
}

const blockAttributes4 = {
	...blockAttributes3,
	autoPlayStop: {
		type: 'boolean',
		default: false
	},
	pagination: {
		type: 'string',
		default: 'bullets'
	},
	clientId: {
		type: 'string',
	}
}

/**
 * 1.10.0 で高さのデフォルト値を変更
 */
const blockAttributes5 = {
	...blockAttributes4,
	pc: {
		type: 'number'
	},
	tablet: {
		type: 'number'
	},
	mobile: {
		type: 'number'
	},
}

/**
 * 1.11.0 でナビゲーション設定を追加
 */
const blockAttributes6 = {
	...blockAttributes5,
	navigationPosition: {
		type: 'string',
		default: 'mobile-bottom'
	}
}

/**
 * 1.34.1 で blockID を追加
 */
const blockAttributes7 = {
	...blockAttributes6,
	blockId: {
		type: 'string'
	}
}

/**
 * 1.48.1 で追加された値
 */
const blockAttributes8 = {
	...blockAttributes7,
	slidesPerViewMobile: {
		type: 'number',
		default: 1
	},
	slidesPerViewTablet: {
		type: 'number',
		default: 1
	},
	slidesPerViewPC: {
		type: 'number',
		default: 1
	},
	slidesPerGroup: {
		type: 'string',
		default: 'one-by-one'
	},
}

// 1.51.0 時点から追加された値
 const blockAttributes9 = {
	...blockAttributes8,
	centeredSlides: {
		type: 'boolean',
		default: false
	},
	editorMode: {
		type: 'string',
		default: 'default'
	},
}

// 1.80.1 時点からの変更点
const blockAttributes10 = {
	...blockAttributes9,
	width: {
		type: 'string'
	},
}

const blockAttributes11 = {
	...blockAttributes10,
	zoomAnimation: {
		type: 'boolean',
		default: false
	},
	zoomInitialScale: {
		type: 'number',
		default: 1
	},
	zoomFinalScale: {
		type: 'number',
		default: 1.25
	},
}

// 1.110.1 時点からの変更点（direction属性を追加）
const blockAttributes12 = {
	...blockAttributes11,
	direction: {
		type: 'string',
		default: 'rtl'
	},
}

// zoomFinalScale が zoomFinalScal として保存されていた後方互換
// blockAttributes11 から zoomFinalScale を除外し、typo版の zoomFinalScal のみにする
const { zoomFinalScale: _removed, ...blockAttributes11WithoutZoomFinalScale } = blockAttributes11;
const blockAttributes12Typo = {
	...blockAttributes11WithoutZoomFinalScale,
	zoomFinalScal: {
		type: 'number',
		default: 1.25
	},
	direction: {
		type: 'string',
		default: 'rtl'
	},
}

// 1.121.1 以降のスキーマ変更（pauseButton 属性の追加・autoPlayStop の既定値を false→true に変更）。
// 1.124.0 までの保存形式（ルート要素に旧クラス swiper-container を併記）は
// 属性スキーマが現行と同一のため、結果として現時点の block.json と同じ内容になっている。
//
// ⚠️ これは「1.124.0 時点のスキーマ」を固定したものであり、block.json と同期させるための
// 写しではない。今後 block.json に属性が追加されても、この定義は更新しないこと。
// deprecated の attributes は「その時点で保存された属性をどう解釈するか」を決めるもので、
// 当時存在しなかった属性を足すと、当時の保存内容に無い属性まで既定値付きで解決され、
// 過去バージョンのパース結果が変わってしまう。現行スキーマは block.json 側だけを更新する。
//
// Schema as of 1.121.1 and later (pauseButton added, autoPlayStop default flipped
// from false to true). The markup saved up to 1.124.0 (root element still carrying
// the legacy swiper-container class) uses the same attribute schema, so this happens
// to match the current block.json.
//
// ⚠️ This is frozen at the 1.124.0 schema — it is NOT a mirror to be kept in sync with
// block.json. Do not update it when attributes are added to block.json later. A
// deprecation's attributes define how content saved back then is interpreted; adding
// attributes that did not exist yet would resolve them with defaults against markup
// that never carried them, changing how older versions parse. Only block.json tracks
// the current schema.
const blockAttributes13 = {
	...blockAttributes12,
	autoPlayStop: {
		type: 'boolean',
		default: true,
	},
	pauseButton: {
		type: 'boolean',
		default: false,
	},
};

// Swiper v7 以前の旧クラス名。1.124.0 までは save 出力に含めていた。#3069
// The pre-v8 legacy Swiper class name, emitted by the save output up to 1.124.0. #3069
const LEGACY_SWIPER_CONTAINER_CLASS = 'swiper-container';

const hasLegacySwiperContainerClass = (attributes) =>
	typeof attributes?.className === 'string' &&
	attributes.className.split(/\s+/).includes(LEGACY_SWIPER_CONTAINER_CLASS);

/**
 * 旧クラス `swiper-container` を含む保存済みコンテンツを 1.124.0 の deprecated として扱わせる。
 *
 * 現行 save から旧クラスを外しただけでは、WordPress の customClassName サポートが
 * 「未知のクラス」として旧クラスを className 属性へ吸収してしまい、ブロックは valid のまま
 * 通過する。その結果、ユーザーが設定していない `swiper-container` が「追加 CSS クラス」に
 * 残り、再保存後も出力され続ける。isEligible で明示的に deprecated 経路へ寄せることで、
 * 1.124.0 の save を基準に className を解決させ、旧クラスを取り除く。
 *
 * Simply dropping the legacy class from the current save is not enough: WordPress'
 * customClassName support absorbs the now-unknown class into the `className`
 * attribute and the block stays valid, so `swiper-container` would linger in the
 * "Additional CSS class(es)" field and keep being emitted. Opting into this
 * deprecation resolves `className` against the 1.124.0 save instead, dropping it.
 * The removal itself is done by WordPress' fixCustomClassname during that
 * resolution, so no `migrate` of our own is involved — and therefore nothing here
 * can strip a className the user set.
 *
 * 旧クラスの除去そのものは、この解決の過程で WordPress の fixCustomClassname が行う。
 * こちらで `migrate` を持たないため、ユーザーが設定した className を
 * 削ってしまう経路は存在しない。
 *
 * A `swiper-container` the user typed into "Additional CSS class(es)" themselves must be
 * kept, so the two cases are told apart by where the class comes from: `parsedAttributes`
 * is the block comment, which only carries what the user set, while `context.block`
 * carries the parsed attributes and therefore also the class absorbed from the markup.
 * When the block comment already has it, it is the user's own class and this deprecation
 * does not apply.
 *
 * ユーザーが自分で「追加 CSS クラス」に `swiper-container` を入れていた場合はそのクラスを
 * 維持する必要があるため、どこから来たクラスかで区別する。`parsedAttributes` は
 * ブロックコメントの内容なのでユーザーが設定した分だけを持ち、`context.block` は
 * パース後の属性なので markup から吸収された分も含む。ブロックコメントに既に入っている
 * ならユーザー自身のクラスなので、この deprecated は適用しない。
 *
 * この判定は isEligible の第3引数（`{ blockNode, block }`）に依存する。本プラグインが
 * 対応する WordPress（vk-blocks.php の Requires at least 以降）ではこの引数が必ず渡される
 * ため、渡されない古いバージョン向けの経路は用意していない。対応範囲を下げる場合は
 * ここが無効化されて旧クラスが「追加 CSS クラス」に残るため、判定方法の見直しが必要。
 *
 * This check relies on isEligible's third argument (`{ blockNode, block }`), which is always
 * provided on the WordPress versions this plugin supports (see Requires at least in
 * vk-blocks.php), so there is no fallback path for versions that omit it. Lowering the
 * supported range would silently disable this check and leave the legacy class in the
 * "Additional CSS class(es)" field, so the detection would have to be revisited.
 *
 * @param {Object} parsedAttributes ブロックコメントに保存されている属性
 * @param {Array}  innerBlocks      インナーブロック（未使用）
 * @param {Object} context          第3引数のコンテキスト（`{ blockNode, block }`）
 * @return {boolean} deprecated 経路へ寄せる場合 true
 */
const isLegacySwiperContainerMarkup = (
	parsedAttributes,
	innerBlocks,
	context
) =>
	!hasLegacySwiperContainerClass(parsedAttributes) &&
	hasLegacySwiperContainerClass(context?.block?.attributes);

const migrateZoomFinalScaleTypo = (attributes) => {
	// Backward compatibility: handle typo in old attribute name.
	if (
		attributes.zoomFinalScale === undefined &&
		attributes.zoomFinalScal !== undefined
	) {
		const { zoomFinalScal, ...rest } = attributes;
		return {
			...rest,
			zoomFinalScale: zoomFinalScal,
		};
	}
	return attributes;
};

const deprecated = [
	// ルート要素から Swiper v7 以前の旧クラス `swiper-container` を削除する前
	// （= 1.124.0 までの保存形式）を救済する。属性スキーマは現行と同一。
	// この save1_124_0 が現行と違うのは保存マークアップのクラスだけで、zoom 用インライン CSS の
	// 違い（現行では削除した `.swiper-slide-duplicate-active` を含む形）は save ではなく
	// deprecated の hooks が出力する（deprecated/hooks/index.js の 1.124.0 は
	// zoom・height の出力が 1.121.1 と同一のため同じフックを再利用している）。#3069
	// Rescues markup saved before the pre-v8 legacy `swiper-container` class was
	// dropped from the root element (= the format used up to 1.124.0). The attribute
	// schema is unchanged. What differs in this save1_124_0 is the saved class list;
	// the inline zoom CSS difference (it still carries `.swiper-slide-duplicate-active`)
	// is emitted by the deprecated hooks instead — deprecated/hooks/index.js reuses the
	// 1.121.1 hook for 1.124.0 because their zoom and height output is identical. #3069
	{
		attributes: blockAttributes13,
		save: save1_124_0,
		isEligible: isLegacySwiperContainerMarkup,
	},
	// pauseButton 属性追加・autoPlayStop の既定値を false→true に変更する前
	// （= 1.121.1 までの保存形式: pauseButton なし／autoPlayStop 既定 false）を救済する。
	{
		attributes: blockAttributes12,
		save: save1_121_1,
	},
	{
		attributes: blockAttributes12Typo,
		save: save1_115_0,
		migrate: migrateZoomFinalScaleTypo,
	},
	{
		attributes: blockAttributes12Typo,
		save: save1_110_1,
		migrate: migrateZoomFinalScaleTypo,
	},
	{
		attributes: blockAttributes12,
		save: save1_115_0,
	},
	{
		attributes: blockAttributes12,
		save: save1_110_1,
	},
	{
		attributes: blockAttributes11,
		save: save1_110_1,
	},
	{
		attributes: blockAttributes10,
		save: save1_105_0,
	},
	{
		attributes: blockAttributes9,
		save: save1_80_1,
	},
	{
		attributes: blockAttributes8,
		save: save1_51_0,
	},
	{
		attributes: blockAttributes7,
		save: save1_48_1,
	},
	{
		attributes: blockAttributes6,
		save: save1_34_1,
	},
	{
		attributes: blockAttributes6,
		save: save1_13_1,
	},
	{
		attributes: blockAttributes5,
		save: save1_10_0,
	},
	{
		attributes: blockAttributes4,
		save: save1_9_2,
	},
	{
		attributes: blockAttributes3,
		save: save1_9_1,
	},
	{
		attributes: blockAttributes2,
		save: save1_2_1,
	},
	{
		attributes: blockAttributes,
		save: save1_0_16,
	},
];

export default deprecated;
