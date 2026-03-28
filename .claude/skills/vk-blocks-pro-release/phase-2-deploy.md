# フェーズ2: タグ付け・デプロイ（VK Blocks Pro 固有）

基本手順は `vk-wp-product-release` の `phase-2-deploy.md` に従う。以下は VK Blocks Pro 固有の差分のみ記載。

---

## Pro 版のデプロイ

タグをプッシュすると `release.yml` が自動起動し、以下が実行される：

1. ビルド・dist 作成 + スモークテスト（wp-env 起動、公開画面・管理画面の PHP エラー検出）
2. テストサーバーへの早期デプロイ（目視確認用。VK Blocks Pro 単体 + Lightning G3 Pro）
3. PHPUnit テスト（dist パッケージで実行）
4. E2E テスト（Playwright）
5. GitHub Release の作成（zip 添付、リリースノート自動生成）
6. VWS 配信サーバーへのデプロイ

## 無料版への反映

`release.yml` が成功すると、`deploy-free.yml` が連動実行される：
- Free 版リポジトリ（vk-blocks）の master にコミット・プッシュ

## 完了報告

> リリース完了しました。
> - GitHub Release: （URL を表示）
> - VWS への配信が完了しています
> - テストサーバーにもデプロイ済みです
> - 無料版リポジトリへの反映も完了しています（タグ付けは無料版側で別途実施してください）

## 完了条件

- [ ] `git push origin X.X.X` が成功した
- [ ] GitHub Actions（`release.yml`）が `success` で完了した
- [ ] GitHub Actions（`deploy-free.yml`）が `success` で完了した

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
