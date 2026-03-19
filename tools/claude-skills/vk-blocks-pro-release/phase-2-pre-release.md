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

### 2-2. `X.X.X.0` タグを作成・プッシュ

```bash
git tag X.X.X.0
git push origin X.X.X.0
```

タグをプッシュすると GitHub Actions（`release-github-and-deploy-test-sv.yml`）が自動起動し、以下が実行される：
- ビルド・dist 作成・zip 化
- GitHub Release の作成（prerelease、zip 添付）
- テストサーバー（VK Blocks Pro 単体 + Lightning G3 Pro）へのデプロイ
- **無料版（vk-blocks）の自動デプロイ**（`deploy-free.yml` が連動実行）

### 2-3. GitHub Actions の完了を待つ

```bash
gh run watch --exit-status
```

`success` になるまで待機する。失敗した場合はユーザーに報告してフェーズ3には進まない。

### 2-4. GitHub Release の zip をダウンロードしてローカルで Fatal Error チェック

#### 2-4-1. zip をダウンロード

```bash
mkdir -p /tmp/vk-blocks-pro-release-test
gh release download X.X.X.0 --pattern "vk-blocks-pro.zip" --dir /tmp/vk-blocks-pro-release-test --clobber
```

#### 2-4-2. zip を展開して wp-env 環境をセットアップ（port 9090 を使用）

wp-env はローカル zip を直接マウントできないため、先に展開する。

```bash
cd /tmp/vk-blocks-pro-release-test && unzip -q vk-blocks-pro.zip -d .

cat > /tmp/vk-blocks-pro-release-test/.wp-env.json << 'EOF'
{
  "core": "WordPress/WordPress",
  "port": 9090,
  "testsPort": 9091,
  "plugins": [ "./vk-blocks-pro" ]
}
EOF
cd /tmp/vk-blocks-pro-release-test && wp-env start
```

Docker が起動していることを事前に確認すること。

#### 2-4-3. Fatal Error チェック

公開画面・管理画面（ダッシュボード・固定ページ編集画面）それぞれで PHP エラーが発生しないことを確認する：

```bash
# 公開画面（HTTP 200 が返ること）
curl -s -o /dev/null -w "%{http_code}" http://localhost:9090/

# 管理画面ログイン
curl -s -c /tmp/vk-release-cookie.txt \
  --data "log=admin&pwd=password&wp-submit=Log+In&redirect_to=%2Fwp-admin%2F&testcookie=1" \
  -b "wordpress_test_cookie=WP+Cookie+check" \
  http://localhost:9090/wp-login.php > /dev/null

# ダッシュボードに Fatal error がないことを確認
curl -s -b /tmp/vk-release-cookie.txt http://localhost:9090/wp-admin/ | grep -c "Fatal error\|Parse error" || true

# テスト用固定ページを作成して ID を取得
PAGE_ID=$(cd /tmp/vk-blocks-pro-release-test && wp-env run cli wp post create --post_type=page --post_title="Release Test Page" --post_status=publish --porcelain 2>/dev/null | tr -d '[:space:]')

# 固定ページ編集画面に Fatal error がないことを確認
curl -s -b /tmp/vk-release-cookie.txt "http://localhost:9090/wp-admin/post.php?post=${PAGE_ID}&action=edit" | grep -c "Fatal error\|Parse error" || true
```

判定基準：
- 公開画面が HTTP 200 を返すこと
- ダッシュボードのレスポンスに `Fatal error` / `Parse error` が含まれないこと（0 が正常）
- 固定ページ編集画面のレスポンスに `Fatal error` / `Parse error` が含まれないこと（0 が正常）

いずれかが失敗した場合はユーザーに報告してフェーズ3には進まない。

#### 2-4-4. テスト環境のクリーンアップ

```bash
cd /tmp/vk-blocks-pro-release-test && yes | wp-env destroy 2>/dev/null || true
rm -rf /tmp/vk-blocks-pro-release-test /tmp/vk-release-cookie.txt
```

### 2-5. テストサーバーでの目視確認をユーザーに依頼する

ローカルの Fatal Error チェック通過後、ユーザーに以下を伝える：

> ローカルの Fatal Error チェック: ✅ 通過
> テストサーバーでの目視確認をお願いします。
> - VK Blocks Pro 単体確認サイト: https://vk-block-test.vs4.nagoya/
> - **確認ポイント:**
>   1. 公開画面（表示崩れがないか）を先に確認（編集画面を開くと Deprecated が走るため）
>   2. 編集画面（Deprecated などが発生していないか）を確認

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
- [ ] GitHub Actions（`release-github-and-deploy-test-sv.yml`）が `success` で完了した
- [ ] ローカルの Fatal Error チェックが通過した
- [ ] ユーザーがテストサーバーでの目視確認 OK を承認した

完了したら **フェーズ3**（[phase-3-stable-release.md](phase-3-stable-release.md)）に進む。
