# VK CSS Optimize

## 概要



## 使い方

```
composer require vektor-inc/vk-css-optimize
```

load autoload
```
require_once dirname( __FILE__ ) . '/vendor/autoload.php';
```

## E2Eテスト

現状単体テストは未実装のため https://github.com/vektor-inc/lightning で行う。

1. https://github.com/vektor-inc/lightning/blob/master/composer.json vk-css-optimize のバージョンを 作業中のブランチに指定
  例 ) 作業ブランチが test/working-branch の場合 "vektor-inc/vk-css-optimize": "test/working-branch"

```
composer install
wp-env start
npx playwright test --project=chromium --trace on
```

ちなみに npx playwright test --project=chromium --trace on はローカルで試すとおそらく1度落ちるが、
環境の都合なのでもう一度 npx playwright test --project=chromium --trace on すれば通る

---

## Change log

0.2.0
[ 不具合修正 ] PHP Warning 修正
[ その他 ] KUSANAGI 対応調整

0.1.0
[ 仕様変更 ] ハンドルをオプションに保存する処理を廃止 / 変数名変更リファクタリング
[ その他 ] Tree Shaking アップデート 2.2.0

0.0.0
[ 仕様変更/不具合修正 ] 対象をハンドル名だけに変更したが、古いバージョンの tree shaking が存在すると、そっちが「idがねーぞ！」と Fatal error くらうのでフィルターフック名を変更