// lint-staged 設定。
//
// 文字列形式 `wp-scripts lint-js --fix` だと lint-staged がコマンド末尾に
// staged ファイルを追加するが、wp-scripts lint-js は `--fix` の後に
// 続くトークンをファイル引数として認識せず、プロジェクト全体を走査して
// しまう（既存の test ファイル等で意図せず大量に失敗する）。
//
// 関数形式でファイルパスを `--fix` より前に置くことで、wp-scripts に
// 正しくスコープを伝える。
//
// 整形は `wp-scripts lint-js --fix` に一本化している。`wp-scripts format` は
// WordPress 公式フォークの wp-prettier でしか動かず（他の prettier を見つけると
// "Incompatible version of Prettier" で失敗する）、本プロジェクトが使う素の
// prettier とは括弧内スペースの扱いが違うため、混ぜるとコミットのたびに
// 全 JS が書き換わってしまう。eslint-plugin-prettier 経由の prettier/prettier
// ルールが素の prettier で同じ整形を自動修正するので、format は不要。
module.exports = {
	'src/**/*.js': (files) => {
		const paths = files.map((f) => JSON.stringify(f)).join(' ');
		return [`wp-scripts lint-js ${paths} --fix`];
	},
};
