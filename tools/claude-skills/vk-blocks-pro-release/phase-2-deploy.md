# フェーズ2: タグ付け・デプロイ

**前提条件:**
- `vk-blocks.php` の `Version:` が `X.X.X` になっている
- readme.txt の Changelog 先頭に `= X.X.X =` が記載されている
- master にバージョン変更がコミット・プッシュ済みであること

---

## 手順

### 2-1. master をローカルでプル

```bash
git checkout master
git pull
```

### 2-2. `X.X.X` タグを作成・プッシュ

```bash
git tag X.X.X
git push origin X.X.X
```

タグをプッシュすると GitHub Actions（`release.yml`）が自動起動し、以下が実行される：
- ビルド・dist 作成
- スモークテスト（wp-env 起動、公開画面・管理画面の PHP エラー検出）
- PHPUnit テスト
- GitHub Release の作成（zip 添付、リリースノート自動生成）
- VWS 配信サーバーへのデプロイ
- テストサーバー（VK Blocks Pro 単体 + Lightning G3 Pro）へのデプロイ

`release.yml` が成功すると、**無料版デプロイ**（`deploy-free.yml`）が連動実行される：
- 無料版リポジトリ（vk-blocks）の master にコミット・プッシュ
- ※ 無料版のタグ付け・WordPress.org へのデプロイは無料版リポジトリ側で別途実施

### 2-3. GitHub Actions の完了を待つ

```bash
gh run watch --exit-status
```

`success` になるまで待機する。失敗した場合はユーザーに報告する。

### 2-4. リリース完了をユーザーに報告する

> リリース完了しました。
> - GitHub Release: （URL を表示）
> - VWS への配信が完了しています
> - テストサーバーにもデプロイ済みです
> - 無料版リポジトリへの反映も完了しています（タグ付けは無料版側で別途実施してください）

---

## タグを間違えた場合の修正方法

```bash
# ローカルタグ削除
git tag -d X.X.X
# リモートタグ削除
git push origin :X.X.X
# 付け直し
git tag X.X.X
git push origin X.X.X
```

---

## 完了条件

- [ ] `git push origin X.X.X` が成功した
- [ ] GitHub Actions（`release.yml`）が `success` で完了した
- [ ] GitHub Actions（`deploy-free.yml`）が `success` で完了した

これで VK Blocks Pro のリリース作業は完了。
