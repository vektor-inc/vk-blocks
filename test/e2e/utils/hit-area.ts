import type { Page } from '@playwright/test';

/**
 * 当たり判定（`vk-slider-touch-target` ミックスインが `::before` で作る不可視の矩形）の
 * 実測結果。
 *
 * `centerOffsetX` / `centerOffsetY` は「ボタンの描画ボックスの中心から見た当たり判定の
 * 中心のずれ」。当たり判定がボタンと同心である前提を置かずに済ませるための値で、
 * ずれを足せば当たり判定の実際の端やクリック可能な座標を導ける。
 */
export type HitAreaGeometry = {
	width: number;
	height: number;
	centerOffsetX: number;
	centerOffsetY: number;
	rect: { left: number; right: number; width: number; height: number };
	containerRect: { left: number; right: number };
};

/**
 * 当たり判定（不可視の `::before`）の中心とサイズを実測する。
 *
 * 疑似要素の矩形は API から直接取れないため、実効値から中心を割り出す。`::before` は
 * 対象要素のパディングボックス基準で配置されるので、border 幅と `top` / `left`、
 * `transform` の平行移動量を足して中心を求める（border は現状 0 だが将来付いた時に
 * ずれないよう加算しておく）。
 *
 * ボタンの描画ボックスの中心をそのまま当たり判定の中心とみなすと、ミックスイン側で
 * 配置が変わった時に静かに誤った値を返してしまう（テストは通るのに検証していない状態に
 * なる）ため、必ず実測した中心を使う。
 *
 * この計算は `top` / `left` / `transform` / `width` / `height` が px に解決されている前提。
 * % のままだと `parseFloat` が数値だけを拾って静かに誤った中心・サイズを出すうえ、
 * `DOMMatrix` も % を受け付けない。`top` / `left` の `auto` も `parseFloat` の
 * フォールバックで 0 に潰れてしまう。いずれも行列化の前に例外にして原因を示す。
 * ただし `width` / `height` の `auto` は「`::before` が無い」ことを意味するので、
 * そちらは後段の NaN 判定で専用のメッセージを出す。
 * あわせて `::before` が絶対配置であることも確かめる（`left` / `top` を
 * パディングボックス基準として読めるのは絶対配置のときだけ）。
 * 対象要素自身が絶対配置の基準（`position` が `static` 以外）であることも確かめる。
 * static だと `left` / `top` の基準が祖先側へ移り、中心が静かにずれる。
 *
 * 返す `width` / `height` はボーダーボックス（実際にポインタを受ける範囲）で、
 * `box-sizing` が `content-box` の場合は padding / border を加算している。
 * 疑似要素の `width` は指定値がそのまま返り、その値がどの箱を指すかは `box-sizing` で
 * 変わるため、揃えないと `::before` に padding / border が付いた時に中心とサイズが
 * 静かにずれる（`transform` の % はボーダーボックス基準で解決される）。
 *
 * この計測は `slider-navigation-sides-offset.spec.ts`（当たり判定のサイズと実際に
 * 押せるかの検証）と `slider-pagination-clearance-scope.spec.ts`（クリアランスの基準）で
 * 共有している。両者の判定基準がずれないよう、算出はこの関数に一本化すること。
 *
 * @param page              Page フィクスチャ
 * @param containerSelector スライダーコンテナのセレクタ
 * @param elementSelector   当たり判定を持つ要素のセレクタ（コンテナ内を検索する）
 * @return 実測結果。対象要素が存在しない場合は null
 */
export const measureHitAreaGeometry = async (
	page: Page,
	containerSelector: string,
	elementSelector: string
): Promise<HitAreaGeometry | null> =>
	page.evaluate(
		({ container: containerSel, element: elementSel }) => {
			const container = document.querySelector(
				containerSel
			) as HTMLElement | null;
			// コンテナが無い場合も要素が無い場合と同じ扱いにする
			// （null 参照で「セレクタが違う」と読めない例外にしないため）
			if (!container) {
				return null;
			}
			const el = container.querySelector(
				elementSel
			) as HTMLElement | null;
			if (!el) {
				return null;
			}

			const before = window.getComputedStyle(el, '::before');
			const style = window.getComputedStyle(el);
			const specifiedWidth = parseFloat(before.width);
			const specifiedHeight = parseFloat(before.height);
			// `::before` に content が無い（＝当たり判定そのものが無い）と width / height は
			// auto になり NaN になる。そのまま中心の算出に流すと NaN が伝播して
			// 「範囲外」としか報告されないため、原因を名指しする。
			// この判定を下の position 判定より前に置くのは、`::before` が無い場合の
			// computed style は position も初期値 static になり、position 側で先に落ちると
			// 「絶対配置ではありません」という的外れなメッセージになるため。
			if (Number.isNaN(specifiedWidth) || Number.isNaN(specifiedHeight)) {
				throw new Error(
					`${elementSel} の当たり判定が取得できません（::before が無い可能性があります）: width: ${before.width} / height: ${before.height}`
				);
			}
			// `left` / `top` を「対象要素のパディングボックスからのオフセット」として
			// 読めるのは絶対配置のときだけ。`position: relative` に変わると left は
			// 通常フロー上の位置からのずれになり、px のままなので下の検証も通り抜けて
			// 静かに誤った中心を返す。
			if (before.position !== 'absolute') {
				throw new Error(
					`${elementSel} の当たり判定が絶対配置ではありません（left / top をパディングボックス基準として読めません）: position: ${before.position}`
				);
			}
			// 絶対配置の基準になるのは「最も近い位置指定された祖先」のパディングボックス。
			// 対象要素自身が static だと基準が祖先側に移り、`left` / `top` は対象要素からの
			// オフセットではなくなる。それでも px で返るため下の検証も通り抜け、祖先基準の値に
			// 対象要素の border を足した誤った中心を静かに返してしまう（中心の算出で
			// `style.borderLeftWidth` を足せるのは、対象要素が基準になっている時だけ）。
			// なお transform / filter / contain などでも包含ブロックは作られるため、static のまま
			// 基準にしたいケースが出てきた場合はこの判定を広げる必要がある。
			if (style.position === 'static') {
				throw new Error(
					`${elementSel} が絶対配置の基準になっていません（当たり判定の left / top が祖先基準になり中心がずれます）: position: ${style.position}`
				);
			}
			// transform 無し（none）は「平行移動 0」として扱う。空文字を
			// DOMMatrixReadOnly に渡しても単位行列になるが、意図が読み取れないため
			// 単位行列を明示する
			const IDENTITY_MATRIX = 'matrix(1, 0, 0, 1, 0, 0)';
			const transform =
				before.transform === 'none'
					? IDENTITY_MATRIX
					: before.transform;
			// % が残っていると中心の算出が静かに狂う（かつ DOMMatrix が throw する）ため、
			// 行列化の前にどの値が % なのかを示して落とす。
			const unresolved = [
				// left / top / transform は `auto` も弾く（＝絶対配置でなくなり
				// left / top が位置を決めていない状態）。下の `parseFloat(...) || 0` が
				// auto を 0 に潰してしまい、ずれたまま「それらしい」中心を返すため。
				...Object.entries({
					left: before.left,
					top: before.top,
					transform,
				}).filter(
					([, value]) => value.includes('%') || value.includes('auto')
				),
				// width / height と padding / border は % だけを弾く。
				// `parseFloat('50%')` は 50 を返すので、% のままだと px として扱われ、
				// 当たり判定のサイズを静かに取り違える。
				// `auto` はここでは弾かない。それは「::before が無い」時の値であり、
				// 下の NaN 判定で専用のメッセージを出したいため。
				...Object.entries({
					width: before.width,
					height: before.height,
					paddingLeft: before.paddingLeft,
					paddingRight: before.paddingRight,
					paddingTop: before.paddingTop,
					paddingBottom: before.paddingBottom,
					borderLeftWidth: before.borderLeftWidth,
					borderRightWidth: before.borderRightWidth,
					borderTopWidth: before.borderTopWidth,
					borderBottomWidth: before.borderBottomWidth,
				}).filter(([, value]) => value.includes('%')),
			];
			if (unresolved.length > 0) {
				throw new Error(
					`${elementSel} の当たり判定が px に解決されていません（px 前提の計算が狂います）: ${unresolved
						.map(([name, value]) => `${name}: ${value}`)
						.join(' / ')}`
				);
			}

			// 当たり判定として扱いたいのはボーダーボックス（実際にポインタを受ける範囲）。
			// `getComputedStyle(el, '::before').width` は疑似要素では指定値がそのまま返るため、
			// その値がどの箱を指すかは box-sizing で変わる。border-box なら padding / border を
			// 含んだ値、content-box なら内容ボックスの値なので、後者では自分で足す。
			// `transform` の % もボーダーボックス基準で解決されるため、ここを揃えないと
			// `::before` に padding / border が付いた時に中心が静かにずれる。
			const px = (value: string) => parseFloat(value) || 0;
			const extraX =
				before.boxSizing === 'border-box'
					? 0
					: px(before.paddingLeft) +
						px(before.paddingRight) +
						px(before.borderLeftWidth) +
						px(before.borderRightWidth);
			const extraY =
				before.boxSizing === 'border-box'
					? 0
					: px(before.paddingTop) +
						px(before.paddingBottom) +
						px(before.borderTopWidth) +
						px(before.borderBottomWidth);
			const width = specifiedWidth + extraX;
			const height = specifiedHeight + extraY;

			const matrix = new DOMMatrixReadOnly(transform);
			// 中心の算出に使うのは平行移動成分（e / f）だけなので、scale / rotate / skew が
			// 入ると width / height は指定値のまま・中心も変形前の座標のままになり、実際の
			// ポインタ受付範囲と食い違った値を静かに返してしまう。このファイルは % / auto /
			// static をすべて例外にして「静かに誤った値を返さない」方針で通しているので、
			// transform も同じ扱いにする。現行のミックスインは translate だけなので実害は
			// 無いが、前提が崩れた時に必ず気付けるようにしておく。
			// 平行移動のみの行列は a=1, b=0, c=0, d=1（e / f は任意）。
			if (
				matrix.a !== 1 ||
				matrix.b !== 0 ||
				matrix.c !== 0 ||
				matrix.d !== 1
			) {
				throw new Error(
					`${elementSel} の当たり判定に平行移動以外の transform が含まれています（width / height と中心が変形前の値になり、実際のポインタ受付範囲と食い違います）: transform: ${before.transform}`
				);
			}
			// 対象要素自身の transform も同じ理由で平行移動に限る。下の centerOffset は
			// 「レイアウト単位で求めた中心」から「getBoundingClientRect（＝変形後の視覚的な
			// 矩形）の中心」を引いており、対象要素が scale / rotate されていると 2 つの
			// 座標系が混ざって静かにずれる（実測: scale(2) で rect.width は 80px、
			// レイアウト幅は 40px）。平行移動だけなら ::before ごと同じ量だけ動くので、
			// 矩形の寸法も中心のずれも変わらない。
			// 要素の computed transform は常に matrix() に解決されるため、
			// `::before` のような % の混入は考えなくてよい。
			const elementTransform =
				style.transform === 'none' ? IDENTITY_MATRIX : style.transform;
			const elementMatrix = new DOMMatrixReadOnly(elementTransform);
			if (
				elementMatrix.a !== 1 ||
				elementMatrix.b !== 0 ||
				elementMatrix.c !== 0 ||
				elementMatrix.d !== 1
			) {
				throw new Error(
					`${elementSel} 自身に平行移動以外の transform が含まれています（変形後の矩形と変形前の寸法が混ざり、中心のずれが誤った値になります）: transform: ${style.transform}`
				);
			}
			const centerX =
				px(style.borderLeftWidth) +
				px(before.left) +
				matrix.e +
				width / 2;
			const centerY =
				px(style.borderTopWidth) +
				px(before.top) +
				matrix.f +
				height / 2;

			const rect = el.getBoundingClientRect();
			const containerRect = container.getBoundingClientRect();
			return {
				width,
				height,
				centerOffsetX: centerX - rect.width / 2,
				centerOffsetY: centerY - rect.height / 2,
				rect: {
					left: rect.left,
					right: rect.right,
					width: rect.width,
					height: rect.height,
				},
				containerRect: {
					left: containerRect.left,
					right: containerRect.right,
				},
			};
		},
		{ container: containerSelector, element: elementSelector }
	);

/**
 * 矢印ボタンの当たり判定の「内端」＝スライダーの中央側の端が、コンテナのどちらかの端から
 * 何 px の位置にあるかを実測する。
 *
 * 中心の算出は measureHitAreaGeometry に委ねているため、姉妹スペックと同じ基準になる。
 *
 * @param page              Page フィクスチャ
 * @param containerSelector スライダーコンテナのセレクタ
 * @param arrowSelector     矢印ボタンのセレクタ（コンテナ内を検索する）
 * @param from              距離の基準にするコンテナの端
 * @return 内端の位置（px）。矢印が存在しない場合は null
 */
export const measureArrowHitInnerEdge = async (
	page: Page,
	containerSelector: string,
	arrowSelector: string,
	from: 'left' | 'right'
): Promise<number | null> => {
	const hitArea = await measureHitAreaGeometry(
		page,
		containerSelector,
		arrowSelector
	);
	if (!hitArea) {
		return null;
	}
	// 描画ボックスの中心＋実測したずれ＝当たり判定の中心
	const hitCenter =
		hitArea.rect.left + hitArea.rect.width / 2 + hitArea.centerOffsetX;
	return from === 'left'
		? hitCenter + hitArea.width / 2 - hitArea.containerRect.left
		: hitArea.containerRect.right - (hitCenter - hitArea.width / 2);
};
