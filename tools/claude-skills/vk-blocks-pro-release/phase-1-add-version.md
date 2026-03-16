# フェーズ1: バージョン番号を追加する

**前提条件**: `detect-release-state.sh` の結果が `STATE=NEEDS_VERSION` であること（Changelog にバージョンなし変更エントリがある状態）

---

## 手順

### 1-0. ブランチ切り替えとリモートから最新の変更を取得する

作業は `develop` ブランチで行う：

```bash
git checkout develop
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
- 4桁目はこの時点では必ず `0`

新しいバージョン番号をユーザーに提示して確認を取ること。

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

`vk-blocks.php` の `Version:` を4桁で更新する：

```
Version: X.X.X.0
```

### 1-5. 変更をコミット・develop へプッシュ

```bash
git add vk-blocks.php readme.txt
git commit -m "[ Change version ] X.X.X.0"
git push origin develop
```

### 1-6. master へプルリクエストを作成

```bash
gh pr create --base master --head develop --title "[ Change version ] X.X.X.0" --body "バージョン番号を X.X.X.0 に更新"
```

作成した PR の URL をユーザーに報告する。

### 1-7. CI チェックの完了を待つ

PR に対して GitHub Actions が完了するまで待つ：

```bash
gh pr checks <PR番号> --watch
```

全チェックが `pass` になるまで待機する。失敗したチェックがある場合はマージせず、内容をユーザーに報告して対応を依頼する：

> CI チェックが失敗しています。内容を確認してください：`gh run view`

### 1-8. コンフリクトを確認してマージする

CI チェック通過後、PR のマージ可否を確認する：

```bash
gh pr view <PR番号> --json mergeable,mergeStateStatus
```

- `mergeable` が `MERGEABLE` であればマージを実行する：

```bash
gh pr merge <PR番号> --merge --admin --subject "[ Change version ] X.X.X.0"
```

- `mergeable` が `CONFLICTING` の場合はマージせず、コンフリクトの内容をユーザーに報告して手動対応を依頼する：

> コンフリクトが発生しています。手動で解消してからフェーズ2に進んでください。

- `mergeable` が `UNKNOWN` の場合（GitHub がまだ判定中）は数秒待ってから再確認する。

### 1-8. master をローカルに反映

マージ成功後、master を最新化する：

```bash
git checkout master
git pull
```

---

## 完了条件

- [ ] readme.txt の Changelog 先頭に `= X.X.X =` が追加された
- [ ] `vk-blocks.php` の `Version:` が `X.X.X.0` に更新された
- [ ] develop へのコミット・プッシュが完了した
- [ ] master への PR が作成された
- [ ] CI チェック（PHPUnit 等）が全て pass した
- [ ] コンフリクトなしで PR がマージされた
- [ ] ローカルの master が最新化された

完了したら **フェーズ2**（[phase-2-pre-release.md](phase-2-pre-release.md)）に進む。
