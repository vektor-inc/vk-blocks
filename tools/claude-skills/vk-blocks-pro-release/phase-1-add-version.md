# フェーズ1: バージョン番号を追加する

**前提条件**: `detect-release-state.sh` の結果が `STATE=NEEDS_VERSION` であること（Changelog にバージョンなし変更エントリがある状態）

---

## 手順

### 1-0. ブランチ切り替えとリモートから最新の変更を取得する

作業は `master` ブランチで行う：

```bash
git checkout master
git pull
```

### 1-1. Changelog の変更内容を読む

`readme.txt` の `== Changelog ==` 直下にあるバージョン番号なしの変更箇条書きを読む。

### 1-2. バージョン番号を決定する

変更の種類に応じて、直近のバージョン（`detect-release-state.sh` で確認した `VERSION_3`）のどの桁を上げるかを判断する：

| 変更の種類 | 上げる桁 | 例（現在 1.116.1 なら） |
|-----------|---------|----------------------|
| 機能追加・ユーザー向け仕様変更 | MINOR（2桁目）| → `1.117.0` |
| バグ修正・内部的な変更 | PATCH（3桁目）| → `1.116.2` |

**ルール:**
- 上げた桁より下の桁はすべて 0 にリセット

新しいバージョン番号を決定したら確認なしでそのまま次のステップへ進む。

### 1-3. readme.txt の Changelog にバージョンヘッダーを追加

`== Changelog ==` の直後（既存の箇条書きの前）に以下を挿入する：

```
= X.X.X =
```

**変更例（バグ修正のみ → PATCH を上げる場合）:**
```
== Changelog ==

* バグ修正の説明

= 1.116.1 =
 ...
```
↓
```
== Changelog ==

= 1.116.2 =
* バグ修正の説明

= 1.116.1 =
 ...
```

**変更例（機能追加あり → MINOR を上げる場合）:**
```
== Changelog ==

* 新機能の説明
* バグ修正の説明

= 1.116.1 =
 ...
```
↓
```
== Changelog ==

= 1.117.0 =
* 新機能の説明
* バグ修正の説明

= 1.116.1 =
 ...
```

### 1-4. vk-blocks.php のバージョンを更新

`vk-blocks.php` の `Version:` を3桁で更新する：

```
Version: X.X.X
```

### 1-5. 変更をコミット・master へプッシュ

```bash
git add vk-blocks.php readme.txt
git commit -m "[ Change version ] X.X.X"
git push origin master
```

---

## 完了条件

- [ ] readme.txt の Changelog 先頭に `= X.X.X =` が追加された
- [ ] `vk-blocks.php` の `Version:` が `X.X.X` に更新された
- [ ] master へのコミット・プッシュが完了した

完了したら **フェーズ2**（[phase-2-deploy.md](phase-2-deploy.md)）に進む。
