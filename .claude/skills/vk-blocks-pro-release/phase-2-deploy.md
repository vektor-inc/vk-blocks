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

**注意:** Pro 版の `copy:files:free` スクリプトは `build`, `inc`, `vendor`, `*.txt`, `*.png`, `*.php` のみをコピーするため、無料版リポジトリの `.github/` ディレクトリは Pro 版から上書きされない。無料版の GitHub Actions ワークフロー（`release.yml` 等）は無料版リポジトリ側で独立して管理される。

## Free 版のタグ付け（deploy-free.yml 成功後に自動実行）

`deploy-free.yml` が `success` になったら、確認なしで続けて Free 版リポジトリにも同じバージョンのタグを打ち、wordpress.org への配信を起動する。

### F-1. Free 版作業ディレクトリへ移動

Free 版は Pro 版と同じ `wp-content/plugins/` の隣にクローン済みのものを使う：

```bash
cd ../vk-blocks
```

`../vk-blocks` が存在しない場合は STOP してユーザーに作業ディレクトリを確認する。

### F-2. master を最新化

`deploy-free.yml` が直前にこのリポジトリの master にコミットしているため、必ず pull してから作業する：

```bash
git checkout master
git pull
```

### F-3. バージョンの一致を確認

`vk-blocks.php` の `Version:` と readme.txt の `Stable tag` が、Pro 版で打ったタグと同じ `X.X.X` になっていることを確認する：

```bash
grep -E "^[[:space:]]*\*?[[:space:]]*Version:" vk-blocks.php
grep -i "^Stable tag:" readme.txt
```

`Version:` 行は docblock 形式（` * Version: X.X.X`）でも標準ヘッダー形式（`Version: X.X.X`）でも検出できるよう、行頭の空白・`*` を許容するパターンにしている。

いずれかが `X.X.X` と一致しなければ STOP してユーザーに報告する（`deploy-free.yml` のコピー漏れの可能性）。

### F-4. タグを作成・プッシュ

```bash
git tag X.X.X
git push origin X.X.X
```

タグを push すると Free 版の `release.yml` が起動し、ビルド・テスト・GitHub Release・wordpress.org SVN デプロイまで自動実行される。

### F-5. Free 版 release.yml の完了を待つ

タグ push によって起動した `release.yml` の Run ID を特定してから watch する。引数なしの `gh run watch` は最新の任意の run を対象にしてしまい、別の workflow（例: スケジュール実行や手動 dispatch）が同時に走っていた場合に誤った run を監視してしまうため避ける：

```bash
# タグ push 直後、release.yml の最新 run ID を取得（in_progress / queued のものを優先）
RUN_ID=$(gh run list --workflow release.yml --limit 1 --json databaseId --jq '.[0].databaseId')
gh run watch "$RUN_ID" --exit-status
```

`success` まで待機する。失敗した場合はユーザーに報告して停止する。

### F-6. wordpress.org のプラグインページで Version 反映を確認

SVN コミット後、wordpress.org のプラグインページに新しいバージョンが反映されるまで数分〜数十分かかる場合がある。

```bash
curl -s "https://wordpress.org/plugins/vk-blocks/" | grep -oE 'Version[[:space:]]*[0-9]+\.[0-9]+\.[0-9]+' | head -3
```

新しい `X.X.X` が含まれていれば完了。まだ反映されていない場合はユーザーに以下を伝える：

> Free 版 release.yml は成功しました（SVN へのデプロイ完了）。
> wordpress.org のプラグインページへの反映には数十分かかる場合があります。
> 反映状況: https://wordpress.org/plugins/vk-blocks/

## フェーズ2 完了後の進行

完了条件をすべて満たしたら、**確認なしで続けてフェーズ3**（`phase-3-update-website.md`）に進む。

ここで「リリース完了しました」と完了報告して止めてはいけない。フェーズ3 の公式サイト更新情報ページ更新 + Discord 通知まで含めて「リリース完了」とみなす。完了報告はフェーズ3 の末尾で行う。

フェーズ3 の前提条件（`~/.wp-release-config.sh`、更新情報記事ID `22065`）が満たされていない場合のみ、フェーズ2 終了時点で STOP してユーザーに報告する。

## 完了条件

- [ ] `git push origin X.X.X` が成功した（Pro 版）
- [ ] GitHub Actions（`release.yml`）が `success` で完了した（Pro 版）
- [ ] GitHub Actions（`deploy-free.yml`）が `success` で完了した
- [ ] `git push origin X.X.X` が成功した（Free 版）
- [ ] GitHub Actions（`release.yml`）が `success` で完了した（Free 版）
- [ ] wordpress.org プラグインページで Version: `X.X.X` を確認した

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
