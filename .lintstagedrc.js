// lint-staged 設定。
//
// 文字列形式 `wp-scripts lint-js --fix` だと lint-staged がコマンド末尾に
// staged ファイルを追加するが、wp-scripts lint-js は `--fix` の後に
// 続くトークンをファイル引数として認識せず、プロジェクト全体を走査して
// しまう（既存の test ファイル等で意図せず大量に失敗する）。
//
// 関数形式でファイルパスを `--fix` より前に置くことで、wp-scripts に
// 正しくスコープを伝える。
module.exports = {
	'src/**/*.js': (files) => {
		const paths = files.map((f) => JSON.stringify(f)).join(' ');
		return [
			`wp-scripts format ${paths}`,
			`wp-scripts lint-js ${paths} --fix`,
		];
	},
};
