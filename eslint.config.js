/**
 * ESLint フラットコンフィグ。
 *
 * ESLint 9 / @wordpress/scripts v32 以降はレガシーな .eslintrc.js を読み込まず、
 * フラットコンフィグ（eslint.config.js）のみをサポートする。
 * そのため、@wordpress/scripts が提供するデフォルトのフラット設定
 * （@wordpress/eslint-plugin の recommended + テスト用の上書き + build/vendor 等の無視設定）
 * を継承し、本プロジェクト固有のルール無効化（旧 .eslintrc.js と同等の内容）を末尾で上書きする。
 */
const wpScriptsConfig = require('@wordpress/scripts/config/eslint.config.cjs');
const globals = require('globals');

module.exports = [
	// ESLint 9 では .eslintignore が廃止されたため、従来の .eslintignore の内容を
	// フラットコンフィグの ignores へ移行する。ブロックの deprecated 定義（過去バージョンの
	// save 出力を保持するもの）は lint 対象外とし、翻訳用ダミーファイルも除外する。
	// build / node_modules / vendor は wpScriptsConfig 側の ignores で既に除外済み。
	{
		ignores: ['**/deprecated/**', 'src/translation_dummy.js'],
	},
	...wpScriptsConfig,
	{
		// ESLint 9 のフラットコンフィグでは /* eslint-env browser */ コメントが無効化された。
		// view.js 等のフロントエンドスクリプトが使うブラウザのグローバル（MutationObserver,
		// requestAnimationFrame, getComputedStyle 等）を設定側で定義し、no-undef を防ぐ。
		languageOptions: {
			globals: {
				...globals.browser,
			},
		},
		// 冗長な eslint-disable ディレクティブ（camelcase を全体で無効化したことで
		// 不要になったインラインコメント等）の警告は大量に出るため抑制する。
		// TODO: 不要な eslint-disable コメントの除去が完了したら 'warn'（または 'error'）へ戻す。
		linterOptions: {
			reportUnusedDisableDirectives: 'off',
		},
		rules: {
			// @wordpress 既定の ignoreRestSiblings を維持しつつ、
			// catch 節の未使用引数（catch (e) など。ESLint 9 で既定が caughtErrors:'all' に変わった）と、
			// アンダースコア接頭辞の意図的な未使用変数（分割代入で spread から除外する _pt 等）を許容する。
			'no-unused-vars': [
				'error',
				{
					ignoreRestSiblings: true,
					caughtErrors: 'none',
					varsIgnorePattern: '^_',
					argsIgnorePattern: '^_',
				},
			],
			// webpack エイリアス（@vkblocks/*）や WordPress 提供パッケージを
			// ESLint の import リゾルバが解決できないため、これらのルールは無効化する。
			'import/no-unresolved': 'off',
			'import/no-extraneous-dependencies': 'off',
			camelcase: 'off',
			'@wordpress/no-unsafe-wp-apis': 'off',
			'@wordpress/i18n-translator-comments': 'off',
			'react-hooks/exhaustive-deps': 'off',
			'no-shadow': 'off',
			'jsdoc/no-undefined-types': 'off',
			'react-hooks/rules-of-hooks': 'off',
		},
	},
];
