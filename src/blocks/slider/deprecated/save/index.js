/* eslint camelcase: 0 */
import save1_126_4 from './1.126.4/save';
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

const PAUSE_BUTTON_SELECTOR = '.swiper-pause-button';

// ラベルが焼き付いていた頃の保存形式を、翻訳やロケールに依存せず復元するための属性。
//
// 停止/再生ボタンのラベルは 1.126.4 まで save 出力に焼き付いていた。その値を deprecated の
// save が `__()` で作り直すと、「保存した時の訳文」と「いま開いている人のロケールの現在の
// 訳文」が食い違った瞬間に保存内容と一致せず、リカバリー警告になる。訳文の変更や、
// ユーザーごとに異なる管理画面言語だけでなく、**エディタ用の翻訳 JSON が読み込まれなかった
// だけ**でも `__()` は英語を返すため、日本語で保存した投稿が丸ごと警告対象になる。
//
// そこで作り直すのをやめ、保存済みマークアップに実際に書かれている値をそのまま読む。
// 読んだ値を save がそのまま出力するので、訳文が何であろうと必ず一致する。
//
// ⚠️ これは上の blockAttributes13 の警告（「属性を足すな」）には当たらない。あの警告が
// 対象にしているのは `source` を持たない＝ブロックコメントから読む属性で、既定値付きで
// 足すと当時保存されていない値まで解決されてしまうケースである。ここで足すのは
//   - `source: 'attribute'` … ブロックコメントを一切参照せず、マークアップだけを見る
//   - `default` 無し … マークアップに無ければ undefined のまま。既定値の注入が起きない
// であり、さらに source 付きの属性はシリアライズ時にブロックコメントへ書き戻されない。
// そのため「当時の保存内容に無い属性が既定値付きで解決される」という事象は発生しない。
// block.json にも存在しない属性なので、block.json との同期でもない。
//
// 3 つを個別に読むのは、`aria-label` と `data-label-pause` が通常は同値でも、手で編集された
// マークアップではずれ得るため。個別に読めばその場合も出力が保存内容と一致する。
//
// ⚠️ セレクタは `querySelector` 相当で、ドキュメント順で最初に一致した要素を取る。読み取りの
// 対象になるのはブロック全体のマークアップ（インナーブロックを含む）で、save の出力順は
// インナーブロック → ナビ → ページネーション → 停止ボタン なので、**スライドの中に別の
// スライダーが入れ子になっている場合は内側のボタンが先に一致する**。
// 内側と外側のラベルは、同じ環境で保存された限りは同一セッション・同一ロケールで焼かれるため
// 同値になり、この取り違えは表面化しない。表面化するのは、別サイトや別ロケールで保存された
// マークアップをコードエディタで貼り付けた場合など、**内側と外側で焼き付いた訳文が異なる**
// ときで、その場合は外側の save が内側のラベルを出力して保存内容と食い違い、この修正が
// 塞いだはずのリカバリー警告が戻る。入れ子自体が稀なうえ、内外で訳文が違う状況はさらに稀
// なため、セレクタを外側のボタンに限定する複雑さは今回引き受けていない。
//
// Attributes that restore the era when the labels were baked in, without depending on the
// translation or the locale.
//
// The pause / play button's labels were part of the save output up to 1.126.4. If a
// deprecation's save rebuilds them with `__()`, the output stops matching the saved content
// the moment "the translation at save time" and "the current translation in the locale of
// whoever is opening the editor" diverge — which shows up as a recovery notice. That happens
// not only when the wording changes or when users have different admin languages, but also
// when the editor's translation JSON simply fails to load: `__()` then returns English and
// every post saved in Japanese is affected.
//
// So instead of rebuilding them, read the values actually present in the saved markup. The
// save emits exactly what it read, so it matches whatever the translation happens to be.
//
// ⚠️ This does NOT fall under the warning on blockAttributes13 above ("do not add
// attributes"). That warning is about attributes WITHOUT a `source` — read from the block
// comment — where adding one with a default resolves values that were never saved. What is
// added here is
//   - `source: 'attribute'` … never consults the block comment; looks only at the markup
//   - no `default` … absent from the markup means it stays undefined; no default is injected
// and sourced attributes are not written back into the block comment on serialization.
// So "an attribute that was not in the saved content gets resolved with a default" cannot
// occur. These attributes do not exist in block.json either, so this is not mirroring it.
//
// The three are read separately because `aria-label` and `data-label-pause`, while normally
// equal, can diverge in hand-edited markup; reading each one keeps the output matching the
// saved content even then.
//
// ⚠️ The selector behaves like `querySelector` and takes the first match in document order.
// What is read is the block's whole markup, inner blocks included, and the save emits inner
// blocks → navigation → pagination → pause button — so **when a slide contains a nested
// slider, the inner button matches first**. As long as both were saved in the same
// environment their labels were baked in the same session and locale, so they are equal and
// the mix-up never surfaces. It surfaces when the inner and outer wording differ — markup
// saved on another site or in another locale and pasted in through the code editor, say — and
// there the outer save emits the inner labels, disagrees with the saved content, and brings
// back the very recovery notice this fix removed. Nesting is rare to begin with and differing
// wording inside and out rarer still, so the complexity of restricting the selector to the
// outer button is not taken on here.
const bakedPauseButtonLabelAttributes = {
	bakedAriaLabel: {
		type: 'string',
		source: 'attribute',
		selector: PAUSE_BUTTON_SELECTOR,
		attribute: 'aria-label',
	},
	bakedLabelPause: {
		type: 'string',
		source: 'attribute',
		selector: PAUSE_BUTTON_SELECTOR,
		attribute: 'data-label-pause',
	},
	bakedLabelPlay: {
		type: 'string',
		source: 'attribute',
		selector: PAUSE_BUTTON_SELECTOR,
		attribute: 'data-label-play',
	},
};

// blockAttributes13（凍結）はそのままに、ラベル復元用の属性だけを足した派生。
// 使うのはラベルが焼き付いていた 2 世代（1.126.4 / 1.124.0）の deprecated のみ。
//
// A derivative of the frozen blockAttributes13 with only the label-restoring attributes added.
// Used solely by the two generations that baked the labels in (1.126.4 / 1.124.0).
const blockAttributes13WithBakedLabels = {
	...blockAttributes13,
	...bakedPauseButtonLabelAttributes,
};

/**
 * 復元用に読んだラベル属性を、移行後の属性から取り除く。
 *
 * これらはマークアップを読むためだけの属性で、現行のブロックは持たない。deprecated の
 * 判定を通った後まで残す必要が無いため落とす。source 付きの属性はブロックコメントへ
 * 書き戻されないので残っていても保存内容は汚れないが、現行スキーマに無い属性が
 * 実行時の attributes に紛れていると、後から読む人が必ず「これは何か」と引っかかる。
 *
 * Drops the label attributes that were only read in order to restore the markup.
 * They exist purely to read the markup and are not part of the current block, so there is no
 * reason to keep them past the deprecation match. Sourced attributes are never written back
 * into the block comment, so leaving them would not dirty the saved content — but an
 * attribute absent from the current schema lingering in the runtime attributes is something
 * the next reader will always stop and puzzle over.
 *
 * @param {Object} attributes 移行前の属性 / the attributes before migration.
 * @return {Object} ラベル属性を除いた属性 / the attributes without the label ones.
 */
const migrateDropBakedPauseButtonLabels = (attributes) => {
	const { bakedAriaLabel, bakedLabelPause, bakedLabelPlay, ...rest } =
		attributes;
	return rest;
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
 * The removal itself is done by WordPress' fixCustomClassname during that resolution, not by
 * any `migrate` of ours. This deprecation does carry a `migrate`
 * (`migrateDropBakedPauseButtonLabels`), but it only removes the three label attributes read
 * for restoration and never touches `className` — so there is still no path here that can
 * strip a className the user set.
 *
 * 旧クラスの除去そのものは、この解決の過程で WordPress の fixCustomClassname が行うもので、
 * こちらの `migrate` によるものではない。この deprecated は `migrate`
 * （`migrateDropBakedPauseButtonLabels`）を持つが、復元用に読んだラベル 3 属性を落とすだけで
 * `className` には一切触れない。したがってユーザーが設定した className を削ってしまう経路は
 * 依然として存在しない。
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
	// 停止/再生ボタンの翻訳文（aria-label / data-label-*）を save 出力に焼き付けていた頃
	// （= 1.125.0〜1.126.4 の保存形式）を救済する。属性スキーマは現行と同一。
	// 旧クラス `swiper-container` は 1.125.0 で削除済みのため、この save には含まれない。
	//
	// なお旧クラスを含む 1.124.0 以前の保存内容も、className へ吸収されたうえでこの save1_126_4 に
	// 一旦一致してしまう（ブロック検証はクラスを順不同の集合として比較するため）。ただし
	// applyBlockDeprecatedVersions は最初に一致した時点で止まらず配列の末尾まで走査し、
	// 一致後は isEligible を持つ deprecated だけが評価される。次の 1.124.0 の isEligible が
	// そこで true を返して上書きするため、旧クラスの除去は従来どおり行われる。#3071
	//
	// Rescues the format that baked the pause / play button's translated labels (aria-label /
	// data-label-*) into the save output (= 1.125.0 through 1.126.4). The attribute schema is
	// unchanged. The legacy `swiper-container` class was already dropped in 1.125.0, so it is
	// not part of this save.
	//
	// Content saved by 1.124.0 and earlier does match this save1_126_4 as well, once the legacy
	// class is absorbed into `className` (block validation compares classes as an unordered
	// set). That is harmless: applyBlockDeprecatedVersions does not stop at the first match — it
	// walks the whole array and, once the block is valid, only deprecations with an `isEligible`
	// are still considered. The 1.124.0 entry below returns true there and overwrites the
	// result, so the legacy class is still removed as before. #3071
	{
		attributes: blockAttributes13WithBakedLabels,
		save: save1_126_4,
		migrate: migrateDropBakedPauseButtonLabels,
	},
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
		attributes: blockAttributes13WithBakedLabels,
		save: save1_124_0,
		isEligible: isLegacySwiperContainerMarkup,
		// applyBlockDeprecatedVersions は最初の一致で止まらず配列の末尾まで走査するため、
		// 旧クラス付きのコンテンツはここでもう一度 getBlockAttributes を通ってラベル属性が
		// 復活する。上のエントリと同じく落としておく。
		// applyBlockDeprecatedVersions does not stop at the first match — it walks to the end
		// of the array — so content carrying the legacy class passes through
		// getBlockAttributes again here and regains the label attributes. Drop them as above.
		migrate: migrateDropBakedPauseButtonLabels,
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
