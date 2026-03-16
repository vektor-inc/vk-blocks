# フェーズ3: 本番リリース（VWS 配信サーバーへのデプロイ）

**前提条件:**
- `pre_X.X.X.0` タグが打たれ、GitHub Actions が成功済み
- ユーザーがテストサーバーおよびデモサイトでの動作確認 OK を承認済み

---

## 手順

### 3-1. master が最新であることを確認

```bash
git checkout master
git pull
```

### 3-2. `X.X.X.0` タグを作成・プッシュ

```bash
git tag X.X.X.0
git push origin X.X.X.0
```

タグをプッシュすると GitHub Actions（`release-vws.yml`）が自動起動し、VWS 配信サーバーへのデプロイが実行される。

### 3-3. GitHub Actions の完了を待つ

```bash
gh run list --workflow=release-vws.yml --limit=3
```

`conclusion: success` になるまで確認する。

リアルタイムで監視する場合：
```bash
gh run watch
```

### 3-4. 本番リリース完了をユーザーに報告する

> 本番リリース完了しました（VWS への配信が完了）。
> デモサイトなどの管理画面からアップデートが届くことを確認してください。

---

## タグを間違えた場合の修正方法

```bash
# ローカルタグ削除
git tag -d X.X.X.0
# リモートタグ削除
git push origin :X.X.X.0
# 付け直し
git tag X.X.X.0
git push origin X.X.X.0
```

---

## 完了条件

- [ ] `git push origin X.X.X.0` が成功した
- [ ] GitHub Actions（`release-vws.yml`）が `success` で完了した

これで VK Blocks Pro のリリース作業はすべて完了。
