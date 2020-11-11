# vk-blocks

This is a plugin that extends Gutenberg's blocks.

## How to Build

```
npm install --save-dev
npm run build
```
## Work

通常作業時は

```
gulp watch
```

か

```
npm run watch
```

で動かす。
ただし、翻訳作業をする時は事前に `npm run build` をした方が無難

## Translate Only

```
npm run build
```

翻訳は PoEdit などを使って po ファイルを開いて編集するが、
新たに翻訳箇所が追加された場合はメニューから「potファイルから更新」を選んで更新する

## CSS name rule

```
[ prefix ]_[ block name ]_[section name]
[ prefix ]_[ block name ]_[section name]_[sub section name]
[ prefix ]_[ block name ]-[Attribute name]-[Attribute property]
```

## 公開手順

NOTE : `0.0.0`は前のバージョン番号、`1.1.1`は公開するバージョン番号。

1. 以下のファイルのバージョンを、公開するバージョンで置き換える。
    - `vk-blocks.php`の `Version: 0.0.0`
    - `readme.txt`の `Stable tag: 0.0.0`

1. `readem.txt`の`== Changelog ==`に、修正内容を追加。
1. 1,2の修正後、コミットメッセージ `[change Version] 1.1.1` でコミット & プッシュ。
1. 全ての変更を `master`にマージ。
1. `master`ブランチをローカルにプルし、`git tag 1.1.1` 、`git push origin 1.1.1` 

これで自動で、VWSにPro版が、WordPress.orgに無料版がアップロードされます。


## 公開の仕組み（GitHubAtions） [開発者向け] 

### プロ版公開スクリプト  
ビルド&distして、`vk-blocks-pro.zip`を作成。VWSのサーバーにアップロードしている。
アップロードには`burnett01/rsync-deployments@4.1`というGitHubActionを使用。

参考URL  
- https://github.com/vektor-inc/vk-blocks-pro/blob/master/.github/workflows/deploy.yml
- https://github.com/Burnett01/rsync-deployments


### 無料版公開スクリプト  
GitHubAction内で、無料版のレポジトリにcloneして修正内容を追加して`master`ブランチにpushしている。
その後に、`git tag 1.1.1`、`git push origin 1.1.1` を実行してWordPress.orgにアップロードするアクションを発火させている。

詳細はコード内のコメントを参考に。

参考URL  
- https://github.com/vektor-inc/vk-blocks-pro/blob/master/.github/workflows/deploy-free.yml


## リリースビルド（石川専用）

gulp dist して zip に圧縮してそのzipファイルをvwsのパッケージディレクトリに移動している

```
bin/dist_kuru.sh
```