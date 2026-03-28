---
name: vk-blocks-pro-release
description: "VK Blocks Pro をリリース・デプロイする際に使用する。バージョン番号の付与、タグの push、GitHub Actions による CI/デプロイのワークフローを管理する。"
compatibility: "git、gh CLI が必要"
disable-model-invocation: true
---

# VK Blocks Pro リリースワークフロー

## いつ使うか

ユーザーが以下のいずれかを言ったときにこのスキルを使用する：
- 「vk-blocks-pro をリリース」
- 「vk-blocks-pro-release」

## 基本フロー

`vk-wp-product-release` スキルの共通フローに従う。フェーズ0〜3の基本手順はそちらを参照すること。

このドキュメントでは **VK Blocks Pro 固有のルール** のみ記載する。

## VK Blocks Pro 固有のルール

### Pro 版のデプロイ先

- VWS 配信サーバー
- テストサーバー（VK Blocks Pro 単体 + Lightning G3 Pro）

### 無料版（vk-blocks）との関係

Pro 版と Free 版は **別リポジトリ** に分かれている。

| リポジトリ | 役割 |
|---|---|
| `vk-blocks-pro`（本リポジトリ） | 開発の本体。Pro/Free 共通のコードを管理。package.json もここに置かれる |
| `vk-blocks` | wordpress.org 配信用の Free 版リポジトリ |

### Pro 版リリース時の無料版反映フロー

```
Pro 版でタグ付け
  → release.yml が発火（テスト・GitHub Release・VWS デプロイ）
  → 成功したら deploy-free.yml が連動実行
  → Free 版リポジトリ（vk-blocks）の master にコードをコミット
```

**ここまでが Pro 版リポジトリの責務。**

Free 版の wordpress.org へのデプロイは Free 版リポジトリ側で別途実施する：
- Free 版リポジトリで手動タグ付け → Free 版の release.yml が発火 → wordpress.org デプロイ

### VK Blocks Free 版固有の注意事項

- **`languages` ディレクトリを Free 版 dist に含めてはいけない** — Free 版は wordpress.org で配布されるため、翻訳は GlotPress で管理される。languages を含めると GlotPress の翻訳が無効になる
- **Free 版のビルドは `npm run dist:free`** — `npm run dist` は Pro 版用。Free 版は `dist:free` で `dist/vk-blocks/` に配布物を作成する
- **Free 版テスト時は `test/phpunit/pro/` を除外する** — Pro 版専用テストは Free 版 dist では実行できない（プラグインパスの違い等で失敗する）

## 状態検出スクリプト

```bash
bash .claude/skills/vk-blocks-pro-release/scripts/detect-release-state.sh
```

## 各フェーズのファイル

独自の手順がある部分のみ本スキル内にファイルがある。それ以外は `vk-wp-product-release` の各フェーズを参照すること。

- [phase-1-add-version.md](phase-1-add-version.md) — VK Blocks Pro 固有のバージョン更新手順
- [phase-2-deploy.md](phase-2-deploy.md) — VK Blocks Pro 固有のデプロイ手順
