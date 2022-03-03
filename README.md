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

// 翻訳のみ
npm run translate

// 開発用（開発者ツールのconsoleでログが追いやすくなる）
npm run build:dev

// リリース用（石川専用：gulp dist して zip に圧縮してそのzipファイルをvwsのパッケージディレクトリに移動している）
bin/dist_kuru.sh
```

## Watch
```
// CSS、JSの監視
npm run watch
```

## 翻訳

```
// .pot ファイル生成、.po ファイルから翻訳用JSONを生成
npm run translate
```

翻訳は PoEdit などを使って `.po` ファイルを開いて編集するが、
新たに翻訳箇所が追加された場合はメニューから「potファイルから更新」を選んで更新する

## PHPUnitテスト

```
composer install
npm run phpunit
```

## e2eテスト

```
npm run test:e2e
```

wp-env の port を変更している場合

```
WP_BASE_URL='http://localhost:xxxx/' npm run test:e2e
```


## pre-commit
コミット時にphpのformat、phpcsのチェックと、lintが実行されます。
エラーがある場合コミットできません。

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
develop ブランチに push すると自動でテストサーバー https://vk-block-test.vs4.nagoya/ にデプロイされます。

## デプロイ
手順は[wiki](https://github.com/vektor-inc/vk-blocks-pro/wiki/%E3%83%87%E3%83%97%E3%83%AD%E3%82%A4)を参考に


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
