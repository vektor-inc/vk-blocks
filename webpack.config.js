let defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
// ↑ node_modules の中の該当ファイルが config の配列をエクスポートしている
// ↑ の module.rules の 0番目の要素を一つ削除
defaultConfig.module.rules.splice(0, 1) // JSをトランスパイルするルールを削除。下の独自ルールでPOTファイルを上書きして空にしてしまう。

// path 操作用のモジュールをインポート
const path = require( 'path' );

let entries = {
  'block': __dirname + '/src/blocks/index.js',
  'admin': __dirname + '/src/admin/index.js',
};

module.exports = {
	...defaultConfig,
	entry: entries,
	output: {
		path: __dirname + '/inc/vk-blocks/build/',
		filename: '[name]-build.js', // [name]に block と admin が入ってくる
	},
	// @import **** = @vkblocks の参照先が ( __dirname, 'src' ) やでという指定
	resolve: {
		...defaultConfig.resolve,
		alias: {
			...defaultConfig.resolve.alias,
			'@vkblocks': path.resolve( __dirname, 'src' ),
		},
	},
	module: {
		...defaultConfig.module,
		rules: [
			...defaultConfig.module.rules,
			{
				test: /\.js$/,
				exclude: /(node_modules)/,
				use: {
					loader: 'babel-loader',
					options: {
						cacheDirectory: false, // キャッシュをOFF。理由：vk-blocks-js.pot を消した時に変更箇所以外の文字列が抽出されなくなる。
						babelrc: false, // babelrcを反映させない
						configFile: false, // babel.config.jsonを反映させない
						presets: [ "@wordpress/default" ],
						// @wordpress の pot ファイル生成ライブラリ使って vk-blocks の post ファイルを生成する
						plugins: [
							[
								"@wordpress/babel-plugin-makepot",
								{
									"output": "languages/vk-blocks-pro-js.pot"
								}
							]
						],
					}
				}
			}
		]
	}
};
