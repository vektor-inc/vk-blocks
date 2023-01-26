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

---

## Change log

0.0.0
[ 仕様変更/不具合修正 ] 対象をハンドル名だけに変更したが、古いバージョンの tree shaking が存在すると、そっちが「idがねーぞ！」と Fatal error くらうのでフィルターフック名を変更