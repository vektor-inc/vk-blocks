import { defineConfig } from '@playwright/test';
const baseConfig = require( '@wordpress/scripts/config/playwright.config.js' );

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config = defineConfig( {
	...baseConfig,
	testDir: './test/e2e',
	// テスト実行前に専用テスト環境をクリーンな状態へリセットする
	// （テーマ初期化・全投稿削除・エディタ設定リセット）。
	// 開発環境と状態を共有しないための要。
	globalSetup: require.resolve( './test/e2e/global-setup.js' ),
	// 開発用 ( .wp-env.json / :8888 ) とは別に、専用のテスト環境
	// ( .wp-env.tests.json / :8889 ) を起動する。--config で別ファイルを指すと
	// wp-env は別キャッシュ＝独立した Docker インスタンスを生成するため、
	// 開発環境と完全に分離した状態で e2e を実行できる。
	webServer: {
		...baseConfig.webServer,
		// 起動ロジックは package.json の test:env:start に集約する。
		command: 'npm run test:env:start',
	},
} );

export default config;
