# フェーズ1: バージョン番号を追加する（VK Blocks Pro 固有）

基本手順は `vk-wp-product-release` の `phase-1-add-version.md` に従う。以下は VK Blocks Pro 固有の差分のみ記載。

---

## 固有の手順

### バージョン更新対象ファイル

`vk-blocks.php` の `Version:` を更新する（`vk-blocks-pro.php` ではない点に注意）：

```
Version: X.X.X
```

### コミット対象

```bash
git add vk-blocks.php readme.txt
git commit -m "[ Change version ] X.X.X"
git push origin master
```
