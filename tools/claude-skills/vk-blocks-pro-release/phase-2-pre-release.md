# フェーズ2: プレリリース（テストサーバーへのデプロイ）

**前提条件:**
- `vk-blocks.php` の `Version:` が `X.X.X.0` になっている
- readme.txt の Changelog 先頭に `= X.X.X =` が記載されている
- develop → master の PR がマージ済みであること

---

## 手順

### 2-1. master をローカルでプル

```bash
git checkout master
git pull
```

### 2-2. `pre_X.X.X.0` タグを作成・プッシュ

```bash
git tag pre_X.X.X.0
git push origin pre_X.X.X.0
```

タグをプッシュすると GitHub Actions（`release-github-and-deploy-test-sv.yml`）が自動起動し、以下が実行される：
- ビルド・dist 作成・zip 化
- GitHub Release の作成（zip 添付）
- テストサーバー（VK Blocks Pro 単体 + Lightning G3 Pro）へのデプロイ
- **無料版（vk-blocks）の自動デプロイ**（`deploy-free.yml` が連動実行）

### 2-3. GitHub Actions の完了を待つ

```bash
gh run list --workflow=release-github-and-deploy-test-sv.yml --limit=3
```

`conclusion: success` になるまで確認する。

リアルタイムで監視する場合：
```bash
gh run watch
```

### 2-4. GitHub Release の確認

Actions 完了後、GitHub Release が作成されているか確認する：

```bash
gh release list --limit=3
```

### 2-5. テストサーバーでの目視確認をユーザーに依頼する

以下をユーザーに伝えてテスト確認を促す：

> プレリリース完了しました。以下のテストサーバーで動作確認をお願いします。
> - VK Blocks Pro 単体確認サイト: https://vk-block-test.vs4.nagoya/
> - **確認ポイント:**
>   1. 公開画面（表示崩れがないか）を先に確認（編集画面を開くと Deprecated が走るため）
>   2. 編集画面（Deprecated などが発生していないか）を確認
>   3. GitHub Release の zip をダウンロードしてデモサイトにアップして確認

---

## タグを間違えた場合の修正方法

```bash
# ローカルタグ削除
git tag -d pre_X.X.X.0
# リモートタグ削除
git push origin :pre_X.X.X.0
# 付け直し
git tag pre_X.X.X.0
git push origin pre_X.X.X.0
```

---

## 完了条件

- [ ] `git push origin pre_X.X.X.0` が成功した
- [ ] GitHub Actions（`release-github-and-deploy-test-sv.yml`）が `success` で完了した
- [ ] GitHub Release が作成された
- [ ] ユーザーがテストサーバーでの動作確認 OK を承認した

完了したら **フェーズ3**（[phase-3-stable-release.md](phase-3-stable-release.md)）に進む。
