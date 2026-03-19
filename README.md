# vk-blocks

This is a plugin that extends Gutenberg's blocks.
#### GitHub repository
Free version : https://github.com/vektor-inc/vk-blocks
Rro version : https://github.com/vektor-inc/vk-blocks-pro ( Private )

## 環境構築（Windows編）
- XAMPP 7.4 系をインストール
- Composer をインストール
- VS Code で Git Bash を使えるようにしておく

## 前提
- Docker
- @wordpress/env をグローバルインストール( ```npm install -g @wordpress/env``` )
- NodeJS、NPM

## 依存関係のインストール
```
npm install
npm install -g @wordpress/env
composer global require wp-cli/wp-cli-bundle
```

## 開発環境の立ち上げ
```
npm start
```

## ビルド & 翻訳
```
// 本番環境用
npm build

// 翻訳ファイルの更新（JS に文言を追加した場合はこの前に npm run build を実行）
npm run update-po
npm run translate

// 開発用（開発者ツールのconsoleでログが追いやすくなる）
npm run build:dev
```

## Watch
```
// CSS、JSの監視
npm run watch
```

## 翻訳

```
1. JS に新しい文言を追加したら `npm run build`
2. `npm run update-po`
3. PoEdit などで `vk-blocks-pro-ja.po` を編集
4. `npm run translate`
```

翻訳は PoEdit などを使って `.po` ファイルを編集します。上記の順番で実行すれば変更が反映されます。

## Claude Code スキルのセットアップ

```
bash tools/claude-skills/setup.sh
```

上記コマンドで Claude Code のリリーススキルを `~/.claude/skills/` にインストールします。
インストール後に Claude Code を再起動するとスキルが有効になります。

## AI用コーディングルール

```
npm run makerule
```

上記コマンドで Claude Code / Cursor / Github Copilot / Gemini CLI に対応したコーディングルールを生成します。
生成したコーディングルールはGitの管理対象外となっています。
環境構築時に上記コマンドを叩いて、独自のルールを追加してもらっても結構です。

## PHPUnitテスト

```
composer install
npm run phpunit
```

---

## e2eテスト

```
npm run test:e2e
```

GUI無しの場合
```
npm run test:e2e-no-gui
```

wp-env の port を変更している場合

```
WP_BASE_URL='http://localhost:xxxx/' npm run test:e2e
```

単体で動かしたい場合
```
npm run test:e2e ./test/e2e-tests/specs/xxxx.test.js
```

wp-env の port を変更していて、単体でテストしたい場合
（spacerの例）
```
WP_BASE_URL='http://localhost:xxxx/' npm run test:e2e ./test/e2e-tests/specs/spacer.test.js
```

---

## E2E Test （ Playwright ）

準備

```
npm install
wp-env start
```

### テストを作成

Playwriteは操作を自動的トラッキングしてコードを出力してくれます。
以下のようにテスト対象のURLを指定して叩くと、ブラウザが起動してトラッキングを開始します。

```
npx playwright codegen "テスト対象のURL"
```

例えばWordPressのログイン画面からの動作テストを作る場合は以下のようになります。
```
npx playwright codegen "http://localhost:8889/wp-login.php"
```

### テストの実行

全てのテストの実行

```
npx playwright test
```

ブラウザは chrome だけで良い場合
```
npx playwright test --project=chromium
```

操作のスクリーンショットが見たい場合 --trace on を追加
```
npx playwright test --trace on
```

```
npx playwright test --trace on --project=chromium
```

## レポートの確認
```
npx playwright show-report
```


---

## pre-push、pre-commit
プッシュ時にphpのformat、phpcsのチェック、
コミット時にlintが実行されます。
それぞれ、エラーがある場合コミットやプッシュができません。

---
## コミットプリフィックス

fix：バグ修正
hotfix：クリティカルなバグ修正
add：新規（ファイル）機能追加
update：機能修正（バグではない）
change：仕様変更
clean：整理（リファクタリング等）
disable：無効化（コメントアウト等）
remove：削除（ファイル）
upgrade：バージョンアップ
revert：変更取り消し

## develop branch
develop ブランチにマージされると自動でテストサーバー https://vk-block-test.vs4.nagoya/ にデプロイされます。

---

## CSS 命名規則

### プリフィックスの後は _ にする

```
[ prefix ]_[ ブロック名 ]
```

### 各div要素は _ で連結する。一つのdivのクラス名は現状キャメルケース

```
[ prefix ]_[ ブロック名 ]_[ divのクラス名 ]
```

※ 当初は下記のように必ずすべての階層を記載していたが、運用が難しかったので version 1.17 以降は途中の div のクラス名は省略可に変更

```
[ prefix ]_[ ブロック名 ]_[ divのクラス名 ]
[ prefix ]_[ ブロック名 ]_[ divのクラス名 ]_[ 子のdivのクラス名 ]_[ 孫のdivのクラス名 ]
```

### 属性の前はハイフンにする
```
[ prefix ]_[ ブロック名 ]-[ 属性名 ]-[ 属性値 ]
[ prefix ]_[ ブロック名 ]_[ divのクラス名 ]-[ 属性名 ]-[ 属性値 ]
```

ちなみに 線の あり/なし など
「属性値なしで -border とかだけでいいんちゃう？」
と思うケースがあるが、今後も属性値の拡張がありえない場合、たとえば
線でも あり/なし だけではなく 直線/点線/二重線 など拡張が想定される可能性がありそうな場合は
-border-solid としておき -border-dotted -border-wave とする事ができるようにしておく。
何がなんでも あり/なし 以外以外発生しないというケースの場合は -border-true あるいは例外的に -border など属性名だけでも可

### コアのブロックにも共通で使いそうなスタイルの場合

* 'is-style-' はコアがブロックの一番外側のタグに対してつけるものなので、もし使用するならブロックの一番外側のタグでのみ使用可
* VK Blocks でしか使わないスタイル名に対して追加するなら vk_[ ブロック名 ]-style-[ 属性名 ]

---

## ブレイクポイント

スマホ
`@media (max-width: 575.98px)`

タブレット
`@media (min-width: 576px) and (max-width: 991.98px)`

PC
`@media (min-width: 992px)`

イレギュラー : 管理画面側での指定はなく、CSSでブレイクポイントが一つの場合（モバイル/PC など）以下の設定がありえる
`@media (min-width: 768px)`

---

## リリース手順

Claude Code の `/vk-blocks-pro-release` スキルを使用してリリースします。

スキルのセットアップが済んでいない場合は先に「Claude Code スキルのセットアップ」セクションを参照してください。

Claude Code で以下を入力してください：

```
/vk-blocks-pro-release
```

スキルが現在の状態を自動検出し、必要なフェーズを案内します。
手順の詳細は [`tools/claude-skills/vk-blocks-pro-release/`](tools/claude-skills/vk-blocks-pro-release/) 内の各フェーズファイルを参照してください。
