---
name: vk-blocks-pro-release
description: "VK Blocks Pro をリリース・デプロイする際に使用する。バージョン番号の付与、プレリリース（pre_ タグ）、本番リリース（VWS 配信）のワークフローを管理する。"
compatibility: "git、gh CLI が必要"
disable-model-invocation: true
---

# VK Blocks Pro リリースワークフロー（エントリーポイント）

## いつ使うか

ユーザーが以下のいずれかを言ったときにこのスキルを使用する：
- 「リリースする」「プラグインをリリース」「vk-blocks-pro をリリース」
- 「プレリリース」「pre_ タグを打つ」
- 「本番リリース」「VWS にデプロイ」
- 「vk-blocks-pro-release」

## 概要

VK Blocks Pro のリリースは **2段階タグ戦略** を採用している：

1. **プレリリース**（`pre_X.X.X.0`）: GitHub Release 作成 + テストサーバーへのデプロイ。一般ユーザーには配信されない
2. **本番リリース**（`X.X.X.0`）: VWS 配信サーバーへのデプロイ。ユーザーへの更新通知が有効になる

なお `pre_X.X.X.0` タグを打つと、無料版（vk-blocks）の自動デプロイも連動して実行される。

バージョン形式：
- `vk-blocks.php` の `Version:` : 4桁（例: `1.116.2.0`）
- readme.txt の Changelog ヘッダー: 3桁（例: `= 1.116.2 =`）
- Git タグ: `pre_X.X.X.0`（プレリリース）/ `X.X.X.0`（本番）

## ステップ1: 現在の状態を検出する

プラグインルートディレクトリから実行する：

```bash
bash tools/claude-skills/vk-blocks-pro-release/scripts/detect-release-state.sh
```

## ステップ2: 状態に応じたフェーズを確認してユーザーに報告

検出結果をユーザーに提示し、どのフェーズから始めるかを確認する。

| STATE | 意味 | 推奨開始フェーズ |
|-------|------|----------------|
| `NEEDS_VERSION` | Changelog にバージョンなし変更エントリがある | **フェーズ1** から開始 |
| `NEEDS_PRE_RELEASE` | バージョンはあるが `pre_` タグがない | **フェーズ2** から開始 |
| `NEEDS_STABLE_RELEASE` | `pre_` タグはあるが本番タグがない | **フェーズ3** から開始 |
| `UP_TO_DATE` | 本番タグ済み | 作業不要 |

`UP_TO_DATE` の場合はユーザーに以下を伝える：

> 現在のバージョン `X.X.X.0` はすでに本番リリース済みです。新たにリリースする変更がなければ作業不要です。

ユーザーが手動で一部の作業を済ませている場合の例：
- 「バージョン番号は手動で付けた」→ **フェーズ2** から開始
- 「pre_ タグも打った」→ **フェーズ3** から開始

## 各フェーズのファイル

各フェーズの詳細手順は以下のファイルに記載されている：

- [phase-1-add-version.md](phase-1-add-version.md) — バージョン番号を Changelog・PHP ファイルに追加して master へ PR
- [phase-2-pre-release.md](phase-2-pre-release.md) — `pre_X.X.X.0` タグで GitHub Release + テストサーバーにデプロイ
- [phase-3-stable-release.md](phase-3-stable-release.md) — `X.X.X.0` タグで VWS 配信サーバーに本番デプロイ

指定されたフェーズのファイルを読み込んでから作業を開始すること。
