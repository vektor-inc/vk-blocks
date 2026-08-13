import type { Page } from '@playwright/test';

/**
 * view.js が `window[`swiper${index}`]` に入れる Swiper インスタンスのうち、
 * このユーティリティが触る範囲だけを型にしたもの。
 *
 * Swiper の型を丸ごと持ち込まずに `any` を排すのが目的。ここに無いプロパティを
 * 使いたくなったら、この型に足してから使う。
 */
type SwiperInstance = {
	autoplay?: {
		running?: boolean;
		stop?: () => void;
	};
	realIndex: number;
};

/**
 * `window` から `swiper${index}` を引くための型。
 *
 * ⚠️ 実行時のヘルパー関数として共通化はできない。`page.evaluate` /
 * `page.waitForFunction` に渡す関数は文字列化してブラウザ側で評価されるため、
 * モジュールスコープの関数を参照するとブラウザ側で未定義になる。そのため各関数は
 * 参照を自分の中に書き、共通化するのは「型」だけに留めている
 * （型注釈はコンパイル時に消えるので評価対象に影響しない）。
 */
type SwiperWindow = { [key: string]: SwiperInstance | undefined };

/**
 * このファイルの待機処理で使うタイムアウト（ms）。
 *
 * 初期化は window load 直後に、停止/再生やスライド移動はクリック直後に起きるため、
 * Playwright 既定の 30 秒まで粘る必要はない。待ちきれない＝起きていないので、
 * 早めに落として原因を切り分けやすくする。
 */
const SWIPER_WAIT_TIMEOUT = 10000;

/**
 * Swiper の初期化が完了するまで待つ。
 *
 * 矢印・ページネーションは save.js が出力する静的マークアップなので、要素の出現を
 * 待っても初期化完了にはならない。view.js は初期化時に `window[`swiper${index}`]` へ
 * インスタンスを入れるので、そちらを待つ。Swiper がスライドの寸法を確定させる前に
 * 位置やサイズを測ると、スライダー自身の矩形がずれて実測値が変わってしまう。
 *
 * @param page  Page フィクスチャ
 * @param index ページ内のスライダーの連番（`[data-vkb-slider]` の出現順。既定は先頭）
 */
export const waitForSwiperInit = async (
	page: Page,
	index = 0
): Promise<void> => {
	await page.waitForFunction(
		(i) => (window as unknown as SwiperWindow)[`swiper${i}`] !== undefined,
		index,
		{ timeout: SWIPER_WAIT_TIMEOUT }
	);
};

/**
 * `autoplay.running` の現在値を返す。
 *
 * `window[`swiper${index}`]` という参照方法（view.js がインスタンスを入れる先）は
 * このファイルに集約する。各スペックで `swiper0` を直接触ると、連番の解決方法が
 * 散らばって複数スライダーのページに対応できなくなるため。
 * waitForSwiperInit で初期化完了を待ってから呼ぶこと。
 *
 * @param page  Page フィクスチャ
 * @param index ページ内のスライダーの連番（既定は先頭）
 */
export const getAutoplayRunning = async (
	page: Page,
	index = 0
): Promise<boolean> =>
	page.evaluate((i) => {
		const swiper = (window as unknown as SwiperWindow)[`swiper${i}`];
		// インスタンス不在を「停止中」と解釈して返さない
		// （初期化前に呼んだことが false という値に埋もれてしまうため）
		if (!swiper) {
			throw new Error(`swiper${i} が見つかりません（初期化前の可能性）`);
		}
		// autoplay オブジェクト自体はバンドル版 Swiper が autoplay:false でも生成するため、
		// ここは存在しないこともある値として optional で読む
		return !!swiper.autoplay?.running;
	}, index);

/**
 * `autoplay.running` が期待値になるまで待つ。
 *
 * 停止/再生の切り替えは Swiper 側のイベントを経由するため、クリック直後に
 * 単発で読むと状態更新とレースする。ポーリングで待つ。
 *
 * **waitForSwiperInit で初期化完了を待ってから呼ぶこと。** インスタンスが無い場合は
 * ポーリングを続けずに即座に reject する（下の判定関数が例外を投げるため）。これは
 * 「初期化を待たずに呼んだ」ことを待ち時間に埋もれさせないための意図的な挙動で、
 * 初期化されるまで待ってくれるわけではない。
 *
 * @param page    Page フィクスチャ
 * @param running 待ちたい状態
 * @param index   ページ内のスライダーの連番（既定は先頭）
 */
export const waitForAutoplayRunning = async (
	page: Page,
	running: boolean,
	index = 0
): Promise<void> => {
	await page.waitForFunction(
		({ i, expected }) => {
			const swiper = (window as unknown as SwiperWindow)[`swiper${i}`];
			// インスタンスが無い状態を「停止中」と解釈しない。
			// そのままだと running:false を待つ呼び出しが、初期化されていないだけで
			// 即座に成功してしまう（getRealIndex / waitForRealIndexChange と同じ扱いにする）
			if (!swiper) {
				throw new Error(
					`swiper${i} が見つかりません（初期化前の可能性）`
				);
			}
			return !!swiper.autoplay?.running === expected;
		},
		{ i: index, expected: running },
		{ timeout: SWIPER_WAIT_TIMEOUT }
	);
};

/**
 * 自動再生を停止する。
 *
 * 自動再生が index を動かすと「操作でスライドが進んだか」の判定がぶれるため、
 * 進む・戻るの検証前に呼ぶ。停止できなかった場合は例外にする（＝黙って no-op に
 * ならない）。素通りさせると「止めたつもりで止まっていない」状態で index の変化を
 * 見ることになり、後続の判定が自動再生の進行で偶然通ったり落ちたりする。
 *
 * @param page  Page フィクスチャ
 * @param index ページ内のスライダーの連番（既定は先頭）
 */
export const stopAutoplay = async (page: Page, index = 0): Promise<void> => {
	await page.evaluate((i) => {
		const swiper = (window as unknown as SwiperWindow)[`swiper${i}`];
		if (!swiper) {
			throw new Error(`swiper${i} が見つかりません（初期化前の可能性）`);
		}
		// autoplay オブジェクトはバンドル版 Swiper が autoplay:false でも生成するが、
		// 停止できないなら「自動再生を止めてから測る」という前提自体が崩れているので
		// ここも素通りさせない
		if (!swiper.autoplay?.stop) {
			throw new Error(
				`swiper${i} の autoplay.stop() が使えません（自動再生を停止できません）`
			);
		}
		swiper.autoplay.stop();
	}, index);
};

/**
 * 現在表示しているスライドの位置（`realIndex`）を返す。
 *
 * loop 時に複製スライドを含む `activeIndex` ではなく、実スライド基準の
 * `realIndex` を使う。初期化前に呼ぶと例外になる（＝待ち忘れを黙って通さない）。
 *
 * @param page  Page フィクスチャ
 * @param index ページ内のスライダーの連番（既定は先頭）
 */
export const getRealIndex = async (page: Page, index = 0): Promise<number> =>
	page.evaluate((i) => {
		const swiper = (window as unknown as SwiperWindow)[`swiper${i}`];
		if (!swiper) {
			throw new Error(`swiper${i} が見つかりません（初期化前の可能性）`);
		}
		return swiper.realIndex;
	}, index);

/**
 * `realIndex` が指定値から変わるまで待つ。
 *
 * 何番に移ったかではなく「移動したこと」を待つ。loop の折り返しでも成立させるため。
 *
 * @param page     Page フィクスチャ
 * @param previous 変化前の realIndex
 * @param index    ページ内のスライダーの連番（既定は先頭）
 */
export const waitForRealIndexChange = async (
	page: Page,
	previous: number,
	index = 0
): Promise<void> => {
	await page.waitForFunction(
		({ i, prev }) => {
			const swiper = (window as unknown as SwiperWindow)[`swiper${i}`];
			// インスタンスが無い場合に「変わった」と解釈して素通りさせない
			// （待ち忘れを黙って通さないよう getRealIndex と同じ扱いにする）
			if (!swiper) {
				throw new Error(
					`swiper${i} が見つかりません（初期化前の可能性）`
				);
			}
			return swiper.realIndex !== prev;
		},
		{ i: index, prev: previous },
		{ timeout: SWIPER_WAIT_TIMEOUT }
	);
};
