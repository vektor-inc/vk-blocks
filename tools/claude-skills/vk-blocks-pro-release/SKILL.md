---
name: vk-blocks-pro-release
description: "VK Blocks Pro をリリース・デプロイする際に使用する。バージョン番号の付与、タグの push、GitHub Actions による CI/デプロイのワークフローを管理する。"
compatibility: "git、gh CLI が必要"
disable-model-invocation: true
---

# VK Blocks Pro リリースワークフロー（エントリーポイント）

## いつ使うか

ユーザーが以下のいずれかを言ったときにこのスキルを使用する：
- 「リリースする」「プラグインをリリース」「vk-blocks-pro をリリース」
- 「VWS にデプロイ」
- 「vk-blocks-pro-release」

## 概要

タグ（`X.X.X`）を push すると GitHub Actions が自動起動し、以下の処理がすべて自動実行される：

1. **ビルド** — `npm run dist` で配布ディレクトリ + zip 作成
2. **スモークテスト** — wp-env 起動、公開画面・管理画面の PHP エラー検出
3. **PHPUnit** — dist パッケージでテスト実行
4. **リリース** — GitHub Release 作成（zip 添付、リリースノート自動生成）
5. **デプロイ** — VWS 配信サーバー + テストサーバーへのデプロイ
6. **無料版反映** — Release 成功後、無料版リポジトリ（vk-blocks）の master に自動コミット

テストが1つでも失敗した場合、Actions はそこで停止しデプロイは実行されない。
無料版のタグ付け・WordPress.org へのデプロイは無料版リポジトリ側で別途実施する。

バージョン形式：`MAJOR.MINOR.PATCH`（3桁、例: `1.118.0`）

## ステップ1: 現在の状態を検出する

プラグインルートディレクトリから実行する：

```bash
bash tools/claude-skills/vk-blocks-pro-release/scripts/detect-release-state.sh
```

## ステップ2: 状態に応じたフェーズを確認してユーザーに報告

検出結果をユーザーに提示し、どのフェーズから始めるかを確認する。

| STATE | 意味 | 推奨開始フェーズ |
|-------|------|----------------|
| `NEEDS_VERSION` | Changelog の先頭にバージョンがない | **フェーズ1** から開始 |
| `NEEDS_TAG` | バージョン追加済みだがタグが未 push | **フェーズ2** から開始 |
| `UP_TO_DATE` | 最新バージョンのタグが push 済み | 作業不要 |

`UP_TO_DATE` の場合はユーザーに以下を伝える：

> 現在のバージョン `X.X.X` はすでにリリース済みです（タグが push されています）。新たにリリースする変更がなければ作業不要です。

ユーザーが手動で一部の作業を済ませている場合の例：
- 「バージョン番号は手動で付けた」→ **フェーズ2** から開始

## 各フェーズのファイル

各フェーズの詳細手順は以下のファイルに記載されている：

- [phase-1-add-version.md](phase-1-add-version.md) — バージョン番号を Changelog・PHP ファイルに追加して master へコミット
- [phase-2-deploy.md](phase-2-deploy.md) — タグ付け・push・GitHub Actions 監視

指定されたフェーズのファイルを読み込んでから作業を開始すること。
