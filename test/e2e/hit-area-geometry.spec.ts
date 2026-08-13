import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
	measureHitAreaGeometry,
	measureArrowHitInnerEdge,
} from './utils/hit-area';

/**
 * `utils/hit-area.ts` の当たり判定計測そのものの回帰テスト。
 *
 * 実ブロックではなく合成マークアップで測る。スライダーのミックスインは現在
 * `::before` に padding / border を付けていないため、実ブロック経由では
 * 「padding / border があってもボーダーボックスで測れるか」を確認できない。
 * ここが崩れると、当たり判定のサイズとクリアランスの基準が同時に静かにずれる
 * （テストは通るのに検証していない状態になる）ため、計測側を直接固定する。
 *
 * `page.setContent` を使うのでスライダーブロックも wp-env のデータも要らない。
 * そのため `test` / `expect` は WordPress 用フィクスチャ（admin / editor / requestUtils）を
 * 足す `@wordpress/e2e-test-utils-playwright` ではなく、標準の `@playwright/test` から取る。
 * このスペックが使うのは `page` だけなので、余計なフィクスチャに依存させない。
 */

/**
 * 合成マークアップを描画する。
 *
 * コンテナは実物と同じく `position: relative`、対象要素は Swiper のボタンと同じ
 * `position: absolute` で、`::before` はミックスインと同じ「中央合わせ」で置く。
 *
 * @param page      Page フィクスチャ
 * @param beforeCss `::before` に足す追加の宣言（padding / border / box-sizing 等）
 * @param targetCss 対象要素自身に足す追加の宣言（position の上書き等）
 */
const renderFixture = async (page: Page, beforeCss: string, targetCss = '') => {
	await page.setContent(`<style>
		body { margin: 0; }
		.container { position: relative; width: 400px; height: 200px; }
		.target {
			position: absolute; left: 100px; top: 80px; width: 40px; height: 40px;
			${targetCss}
		}
		.target::before {
			content: ""; position: absolute;
			top: 50%; left: 50%; transform: translate(-50%, -50%);
			width: 44px; height: 44px;
			${beforeCss}
		}
	</style><div class="container"><div class="target"></div></div>`);
};

test.describe('当たり判定の計測（utils/hit-area.ts）', () => {
	test('padding / border が無い場合はボタンと同心・44px として測れる', async ({
		page,
	}) => {
		await renderFixture(page, '');

		const hit = await measureHitAreaGeometry(page, '.container', '.target');
		expect(hit).not.toBeNull();

		// 44px の指定どおり
		expect(hit!.width).toBe(44);
		expect(hit!.height).toBe(44);
		// ボタン（40px 角）と同心なのでずれは 0
		expect(hit!.centerOffsetX).toBeCloseTo(0, 5);
		expect(hit!.centerOffsetY).toBeCloseTo(0, 5);
	});

	// box-sizing ごとに、指定した width が「どの箱の幅か」が変わる。
	// content-box では padding / border を足したものがボーダーボックスの幅になり、
	// border-box では指定値がすでにボーダーボックスの幅になっている。
	// どちらでも同じボーダーボックス（44 + padding 10*2 + border 5*2 = 74px）になるよう指定してある。
	for (const { label, css } of [
		{
			label: 'content-box',
			css: 'box-sizing: content-box; padding: 10px; border: 5px solid;',
		},
		{
			label: 'border-box',
			css: 'box-sizing: border-box; padding: 10px; border: 5px solid; width: 74px; height: 74px;',
		},
	]) {
		test(`${label}: ::before に padding / border があってもボーダーボックスで測れる`, async ({
			page,
		}) => {
			await renderFixture(page, css);

			const hit = await measureHitAreaGeometry(
				page,
				'.container',
				'.target'
			);
			expect(hit).not.toBeNull();

			// ボーダーボックス = 44 + padding 10*2 + border 5*2 = 74px
			expect(hit!.width).toBe(74);
			expect(hit!.height).toBe(74);
			// translate(-50%, -50%) もボーダーボックス基準で解決されるため、
			// padding / border があっても中心はボタンと一致し続ける
			expect(hit!.centerOffsetX).toBeCloseTo(0, 5);
			expect(hit!.centerOffsetY).toBeCloseTo(0, 5);
		});
	}

	test('内端はボーダーボックスの端から算出される', async ({ page }) => {
		await renderFixture(
			page,
			'box-sizing: content-box; padding: 10px; border: 5px solid;'
		);

		// ボタンは left:100px・幅 40px なので中心は 120px。
		// ボーダーボックス 74px の当たり判定は 83〜157px を占める。
		// コンテナ左端（0px）からの内端＝157px、右端（400px）からの内端＝400-83=317px。
		const fromLeft = await measureArrowHitInnerEdge(
			page,
			'.container',
			'.target',
			'left'
		);
		const fromRight = await measureArrowHitInnerEdge(
			page,
			'.container',
			'.target',
			'right'
		);
		expect(fromLeft).toBeCloseTo(157, 5);
		expect(fromRight).toBeCloseTo(317, 5);
	});

	test('::before が絶対配置でない場合は理由付きで落ちる', async ({
		page,
	}) => {
		await renderFixture(page, 'position: static;');

		await expect(
			measureHitAreaGeometry(page, '.container', '.target')
		).rejects.toThrow(/絶対配置ではありません/);
	});

	// 対象要素自身が static だと、絶対配置の基準が祖先（.container）へ移る。それでも
	// `left` / `top` は px で返るため他の検証は素通りし、祖先基準の値に対象要素の border を
	// 足した誤った中心が静かに返る。ここが外れたことに気付けるよう固定する。
	test('対象要素が絶対配置の基準になっていない場合は理由付きで落ちる', async ({
		page,
	}) => {
		await renderFixture(page, '', 'position: static;');

		await expect(
			measureHitAreaGeometry(page, '.container', '.target')
		).rejects.toThrow(/絶対配置の基準になっていません/);
	});

	// 中心の算出に使うのは平行移動成分だけなので、scale / rotate が入ると width / height も
	// 中心も変形前の値のままになり、実際のポインタ受付範囲と食い違った値を静かに返す。
	for (const { label, css } of [
		{ label: 'scale', css: 'transform: translate(-50%, -50%) scale(2);' },
		{
			label: 'rotate',
			css: 'transform: translate(-50%, -50%) rotate(45deg);',
		},
	]) {
		test(`${label}: 平行移動以外の transform は理由付きで落ちる`, async ({
			page,
		}) => {
			await renderFixture(page, css);

			await expect(
				measureHitAreaGeometry(page, '.container', '.target')
			).rejects.toThrow(/平行移動以外の transform/);
		});
	}

	// 対象要素自身が scale / rotate されると、レイアウト単位で求めた中心と
	// getBoundingClientRect（変形後の矩形）の中心が混ざり、中心のずれが誤った値になる。
	// 平行移動だけなら ::before ごと同じ量動くので許容する。
	for (const { label, css, shouldThrow } of [
		{ label: 'scale', css: 'transform: scale(2);', shouldThrow: true },
		{
			label: 'rotate',
			css: 'transform: rotate(30deg);',
			shouldThrow: true,
		},
		{
			label: 'translate',
			css: 'transform: translateX(10px);',
			shouldThrow: false,
		},
	]) {
		test(`対象要素自身の transform（${label}）: 平行移動以外は理由付きで落ちる`, async ({
			page,
		}) => {
			await renderFixture(page, '', css);

			const measuring = measureHitAreaGeometry(
				page,
				'.container',
				'.target'
			);
			if (shouldThrow) {
				await expect(measuring).rejects.toThrow(
					/自身に平行移動以外の transform/
				);
				return;
			}
			// 平行移動では中心のずれが出ない（::before ごと同じ量だけ動くため）
			const hit = await measuring;
			expect(hit).not.toBeNull();
			expect(hit!.centerOffsetX).toBeCloseTo(0, 5);
			expect(hit!.centerOffsetY).toBeCloseTo(0, 5);
		});
	}

	test('::before が無い場合は理由付きで落ちる', async ({ page }) => {
		await page.setContent(
			'<div class="container"><div class="target"></div></div>'
		);

		await expect(
			measureHitAreaGeometry(page, '.container', '.target')
		).rejects.toThrow(/当たり判定が取得できません/);
	});

	test('対象が無い場合は null を返す', async ({ page }) => {
		await renderFixture(page, '');

		expect(
			await measureHitAreaGeometry(page, '.container', '.missing')
		).toBeNull();
		expect(
			await measureHitAreaGeometry(page, '.missing', '.target')
		).toBeNull();
	});
});
