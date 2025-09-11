---
root: true
targets: ["*"]
description: "Project overview and general development guidelines"
globs: ["**/*"]
---

# VK Blocks Pro コーディングルール

## 1. 共通ルール
- 本プラグインは WordPress のコーディング規約とベストプラクティスに準拠します。
- 対応環境は PHP 7.4+。インデントは常にタブ（スペース禁止）。
- フロント出力は必ず i18n 関数（`__()`, `_e()` など）を通す。
- 受け取った値は WordPress API で検証/サニタイズし、出力は適切にエスケープする。
- 名前空間は使用しない。関数/グローバルは `vk_blocks_` プレフィックス必須。
- ドキュメント/コミュニケーションは原則日本語。

## 2. PHP
- PHP は原則 `inc/` に配置し、役割ごとにファイルを分割する。
- 代表例:
	- 設定定義: `class-vk-blocks-global-settings.php`
	- オプション: `class-vk-blocks-options.php`
	- 管理画面/エンキュー: `admin.php`
	- REST API: `App/RestAPI/BlockMeta/`
	- Font Awesome: `fontawesome/`
	- ダイナミック CSS: `style/`（PHPで出力）

## 3. JavaScript / React
- ブロックは `src/blocks/` にブロック単位で配置（基本セット: `index.php`, `index.js`, `block.json`, `edit.js`, `save.js`, `style.scss`, `icon.svg`）。
- 無料版は `src/bundle.js`、Pro 版は `src/bundle-pro.js` に import を追加。
- 登録は `inc/vk-blocks/class-vk-blocks-global-settings.php` の `blocks()` に追加し、`is_pro` を正しく設定（無料=false、Pro=true）。
- ビルド/テスト: `npm run build`、開発は `npm run build:dev` / `npm run build:cache`。フィクスチャ `npm run test-unit`、E2E `npm run test:e2e`。

## 4. ファイル構成
- 詳細は本ドキュメント末尾の「ファイル構成一覧」を参照。
- 各ディレクトリの用途に沿って配置し、役割が曖昧にならないよう整理する。

## 5. ブロック作成手順
1. 種別を確認（無料版 or Pro版）。
2. ディレクトリ作成（無料: `src/blocks/`、Pro: `src/blocks/_pro/`）。
3. 必要ファイルを用意（`index.php` / `index.js` / `block.json` / `edit.js` / `save.js` / `style.scss` / `icon.svg`）。
4. `bundle.js` または `bundle-pro.js` に import を追加。
5. `class-vk-blocks-global-settings.php` の `blocks()` に定義を追加し、`is_pro` を設定。
6. ビルドして動作確認（必要ならフィクスチャ/E2E を追加）。

## 6. テスト
- フィクスチャ: `test/e2e-test/fixtures` に HTML を配置（生成/更新は `npm run test-unit` を参照）。
- E2E: `test/e2e/` に Playwright テストを配置（実行: `npm run test:e2e`）。
- PHPUnit: `test/phpunit/` に配置（無料: `free/`、Pro: `pro/`）。

## 7. プルリクエストのレビュー
- GitHub CLI（gh）が使える場合は対象 PR を取得。未導入ならインストール案内または目視レビューを依頼。
- PR は `.github/PULL_REQUEST_TEMPLATE.md` に準拠。「レビュワー確認方法・確認内容など」に従って動作確認（「変更内容の確認方法」に記載があるケースも）。
- 関連する Issue / チケットがある場合は PR 説明にリンクを明記し、要件の充足・スコープの一致・未解決事項の有無を確認する（可能であれば `Closes #123` などで自動クローズを設定）。
- ベースブランチは `develop`。異なる場合は作成者へ確認。
- レビューコメントの投稿は承認のもとで行う（誤解や過剰な修正要求を避けるため）。

## 8. セキュリティ / サニタイズ
- 入力値の検証: `sanitize_text_field()`, `sanitize_key()`, `absint()`, `floatval()`, `esc_url_raw()`, `wp_unslash()` を用途に応じて使用。配列は要素ごとにサニタイズ。
- 出力時のエスケープ: 文字列は `esc_html()`, 属性は `esc_attr()`, URL は `esc_url()` を使用。HTML を許可する場合は `wp_kses()` / `wp_kses_post()` を使用し、許可タグは必要最小限。
- DB アクセス: `$wpdb->prepare()` を必ず使用。独自の生 SQL は極力避け、WordPress API を優先。
- オプション/メタ保存: 保存前に適切にサニタイズ。取得後の出力時にも必ずエスケープ。
- 管理画面操作: `check_admin_referer()` / `wp_verify_nonce()` と権限チェック（`current_user_can()`）を必ず実装。
- REST API: `permission_callback` を必須化し、厳密に true/false を返却。`args` に `sanitize_callback` と `validate_callback` を設定。
- 外部リクエスト: `wp_safe_remote_get()` 等を使用し、タイムアウト・失敗時のフォールバック・キャッシュ（Transients）を検討。取得データの表示は必ずエスケープ。
- 禁止事項: `eval()`、ユーザー入力を含む `include`/`require`、任意ファイル書き込み、未検証のファイルアップロード。

## 9. 国際化 (i18n)
- テキストドメイン: PHP/JS ともに `vk-blocks-pro` を使用。
- PHP: `__()`, `_e()`, `_x()`, `_n()` を適切に使い分け、変数を含む出力は `printf( esc_html__( '...', 'vk-blocks-pro' ), $var )` 等でエスケープ併用。
- 翻訳者コメント: 置換子の意味が分かりづらい場合は `/* translators: ... */` を付与。
- JS: `@wordpress/i18n` の `__()` などを使用し、ビルド後は `wp_set_script_translations()` により翻訳を読み込み。
- POT/JSON 生成: `npm run translate` を使用。翻訳キーの重複・不要キーを作らない。

## 10. コーディングスタイル / Lint
- PHP: WordPress Coding Standards を適用（`.phpcs.xml`）。PR 前に `npm run lint:php` を実行。すべての公開関数に DocBlock を付与。
- JS: `@wordpress/scripts` の ESLint/Prettier 設定に準拠。`npm run lint` を実行して自動整形・静的検査を通過させる。
- SCSS/CSS: クラス名は衝突回避のため `vk-` プレフィックス（例: `.vk-visual-embed`）。過度な `!important` を避け、アクセシビリティに配慮したフォーカススタイルを付与。
- インデント: `.editorconfig` に従い、PHP/JS/SCSS はタブ。YAML はスペース 2。

## 11. ブロック実装ルール（互換性・block.json）
- ブロック名: `vk-blocks/xxx` 形式を必須とし、一意性を担保。
- `block.json`: `title`, `category`, `icon`, `attributes`, `supports` を適切に定義。`textdomain` は `vk-blocks-pro`。
- 互換性: 既存属性の削除/意味変更を行う場合は `deprecated` を実装し、旧コンテンツをマイグレーション。`save.js` の出力差分は慎重に。
- アセット: `index.php` からのエンキューに統一。`src/` 直読みは禁止。ビルド後に `inc/vk-blocks/build/` 配下へ配置される前提で処理する。
- 登録: `inc/vk-blocks/class-vk-blocks-global-settings.php` の `blocks()` に定義追加し、無料/Pro の `is_pro` を正しく設定。

## 12. REST API 実装ガイド
- ルーティング: ネームスペースはプロジェクトの方針に従い（例: `vk-blocks/v1`）、エンドポイント名はわかりやすく動詞を避けた名詞形を推奨。
- `register_rest_route()`: `permission_callback` は匿名関数でも可だがテスト可能性を考慮し関数化推奨。`args` に `sanitize_callback`/`validate_callback` を必ず設定。
- レスポンス: `WP_REST_Response` を使用し、エラーは `new WP_Error( code, message, data )` を返却。機微情報を含めない。
- パフォーマンス: 重い処理はトランジェント等で短期キャッシュ。キャッシュキーは `vk_blocks_` 接頭辞で衝突回避。

## 13. アクセシビリティ (a11y)
- セマンティック HTML を優先し、必要に応じて `aria-*` を付与。ラベルとコントロールの関連付けを明確に。
- キーボード操作で全機能にアクセス可能にし、フォーカス可視化を担保。
- コントラスト比は WCAG AA 以上を目安に。点滅/自動再生などは回避または `prefers-reduced-motion` に対応。

## 14. ビルド / アセット運用
- Node は Volta 設定（`package.json`）に従う。基本コマンド: `npm run build`（本番）、`npm run build:dev`/`build:cache`（開発）。
- 変更を含む PR ではビルドを実施し、必要な生成物（`inc/vk-blocks/build/` 等）をコミット。PR テンプレートの確認事項に従う。
- 翻訳ファイルは `npm run translate` で更新。

## 15. Git / PR 運用
- PR は必ず `.github/PULL_REQUEST_TEMPLATE.md` に従って作成し、テンプレートのチェック項目を満たす。
- PR のタイトルは、readme.txt に記載した変更内容をそのまま日本語化したものとする（簡潔で要点のみ）。
- readme.txt 更新（ユーザー向け変更がある場合は必須）:
	- 「Changelog」に既存フォーマットで追記（例: `[ Add function ][ Block Name ] ...` / `[ Bug fix ] ...` / `[ Specification change ] ...` / `[ Other ] ...`）。Pro専用機能は `[ ... (Pro) ]` と明記。
	- バージョン見出し（例: `= 1.109.2 =`）配下に箇条書きで追加。未リリースの変更は先頭に一時的に追記し、リリース時に該当バージョン見出しへ移動。
	- 記述は英語で簡潔に、影響範囲（対象ブロックや機能名）を角括弧で明示。
	- 仕様変更・非推奨化がある場合は、[Blocks]/[Extensions]/[Settings] のリスト表記（例: `not recommended`）も整合させる。
	- 互換性に影響する場合は `Requires at least` / `Tested up to` / `Requires PHP` の見直しを行い、`vk-blocks.php` のヘッダーと齟齬がないようにする。
- 関連する Issue / チケットがある場合は PR タイトルまたは本文にリンク（例: `Closes #123`）を付与し、要件・スコープ・受入条件の整合を確認する。
- ブランチ命名: `feature/…`, `fix/…`, `chore/…`, `test/…` など用途が分かる形に統一。
- 小さな PR を心掛け、リファクタや整形のみの変更は機能修正と分離。
- 送信前チェック: `npm run lint`, `npm run lint:php`, `npm run build`, `npm run test-unit`, `npm run test:e2e`（必要な場合）。
- ベースブランチは `develop` 固定。強制 push や rebase が必要な場合は事前に共有。

## 16. 互換性ポリシー
- 対応 PHP バージョン: 7.4 以上。対応 WordPress バージョン: `vk-blocks.php` の `Requires at least` に準拠。
- API 利用: 対象バージョン未満の関数/フックを使用しない。必要に応じてフォールバック実装。
- JS は `@wordpress/scripts` によりトランスパイルされる前提で、モダン構文はビルド経由で提供。

## 17. ファイル構成一覧
- **`inc/`**: PHPコードを原則ここに格納する
  - **`vk-blocks/`**: 本プラグインに関する処理はここに格納する
    - **`class-vk-blocks-global-settings.php`**: 各ブロックの定義
    - **`class-vk-blocks-block-loader.php`**: ブロックの読み込み処理全般
    - **`class-vk-blocks-options.php`**: wp_optionsに保存する設定値の定義
    - **`admin/`**: 管理画面に関する処理
      - **`admin.php`**: 管理画面のメニューへの各種追加処理、設定画面で必要なJSのエンキュー
      - **`images/**: 管理画面で使用する画像ファイル
        - **`vk-blocks-logo_ol.svg`**: VK Blocksロゴ(SVG)
        - **`vk-blocks-logo.png`**: VK Blocksロゴ(PNG)
    - **`App/RestAPI/BlockMeta/`**: REST APIのエントリポイント
      - **`class-vk-blocks-entrypoint`**: REST APIのエントリポイント
    - **`blocks/`**: ブロックに関連する処理
      - **`class-vk-blocks-faq-schema-manager.php`**: FAQブロックのスキーマ出力処理
    - **`build/`**: ビルド結果を格納する
    - **`extensions/core/`**: コア拡張に関連する処理
      - **`list.php`**: リストブロック拡張に関連する処理
    - **`fontawesome/`**: Font Awesomeに関連する処理
      - **`class-vk-blocks-font-awesome-api.php`**: Font Awesomeに関連する処理
      - **`font-awesome-config.php`**: Font Awesomeの設定値を定義する
    - **`images/`**: プラグインで使用する画像ファイルを格納
    - **`style/`**: ダイナミックCSS関連
      - **`balloon.php`**: バルーンブロックに関連するCSS出力
      - **`common-margin.php`**: 共通余白に関連するCSS出力
      - **`hidden-extension.php`**: ブロックの非表示設定に関するCSS出力
    - **`util/`**: ユーティリティ関連
      - **`array-merge.php`**: 配列のマージ
      - **`color-slug-to-color-code.php`**: 色のスラッグをカラーコードに変換する
  - **`vk-blocks-pro/`**: Pro版に関連する処理はここに格納する
    - **`vk-blocks-pro-functions.php`**: 本ディレクトリ内のPHPコードのreuqire、各JSのエンキュー
    - **`admin-pro/`**: 管理画面に関する処理
      - **`admin-pro.php`**: Pro版で設定画面のメニューに項目を追加する処理
    - **`App/RestAPI/BlockMeta/`**:
      - **`class-vk-blocks-entrypoint`**: REST APIのエントリポイント（Pro版に関連するもののみ）
    - **`blocks`:** ブロックに関連する処理
      - **`class-vk-blocks-blog-card.php`**: ブログカード関連の処理
    - **`extensions/common`**: コア拡張に関連する処理
      - **`custom-block-style.php`**: カスタムブロックスタイルに関連する処理
      - **`custom-css-extensions.php`**: カスタムCSSに関連する処理
      - **`custom-format.php`**: カスタムフォーマットに関連する処理
- **`src/`**: Gutenbergのカスタムブロック用のJSコードを原則ここに格納する
  - **`blocks/`**:
    - **`alert`**: A colored box with four statuses, including annotations and alerts.
    - **`ancestor-page-list`**: Display Page list from ancestor page
    - **`balloon`**: These speech balloons are perfect for recreating conversations.
    - **`border-box`**: This is a border box where you can place headings to attract attention.
    - **`button`**: A button link that can display icons before and after.
    - **`faq`**: Displays a combination of questions and answers.
    - **`faq2`**: It displays a combination of questions and answers. You can freely add blocks to the question area as well.
    - **`faq2-a`**: Answer area where you can add blocks freely.
    - **`faq2-q`**: Question area where you can freely add blocks.
    - **`flow`**: Displays a sequential description in time series.
    - **`heading`**: This is a heading that allows you to set text size, subtext, icon, and margin.
    - **`icon`**: Display icons with Font Awesome.
    - **`icon-outer`**: Display the Font Awesome icons horizontally.
    - **`page-content`**: Displays the body content of the specified parent page.
    - **`pr-blocks`**: This is a PR block where you can place images and icon. But currently, it is possible to create the same layout by combining Column Block and Icon Block, so this block is not recommended. Please check Columns category of Block Patterns.
    - **`pr-content`**: This is PR content where you can place images, headlines, text, and buttons.
    - **`slider`**: This slider allows you to place various items.Slider is do not move in edit screen.
    - **`slider-item`**: This is one item in the slider.
    - **`spacer`**: Use responsive spacers to get the margins right.
    - **`staff`**: Used for staff introduction, company introduction, school introduction, menu, etc.
    - **`visual-embed`**: Easily embed iframe content with a live preview in the editor, perfect for maps, videos, and other iframe-based media.
    - **`_pro/`**:
      - **`accordion`**: Collapses and hides content when the content is long.
      - **`accordion-target`**: This is the content area where you can add blocks freely.
      - **`accordion-trigger`**: This is the title area where you can freely add blocks.
      - **`animation`**: Add animation to elements when scrolling the page.
      - **`archive-list`**: Displays a list of archives
      - **`blog-card`**: Add a block that fetches and displays content from a URL.
      - **`blog-card-excerpt`**: Shows an excerpt retrieved from a URL.
      - **`blog-card-featured-image`**: Displays the featured image obtained from the URL.
      - **`blog-card-site-logo`**: Displays the site logo image obtained from the URL.
      - **`blog-card-site-title`**: Displays the site title obtained from the URL.
      - **`blog-card-title`**: Displays the title obtained from the URL.
      - **`breadcrumb`**: Displays breadcrumbs of a page's hierarchy, or a post's categories.This block is not displayed on the front page.
      - **`button-outer`**: Display the VK Button block horizontally.
      - **`card`**: A card where you can place images, headings, text, and links.
      - **`card-item`**: A single item in a card block.
      - **`child-page`**: When a parent page is specified, a list of its child pages will be displayed.
      - **`dynamic-text`**: Display dynamic text
      - **`fixed-display`**: Remains fixed on the screen at all times.
      - **`grid-column`**: Set the number of columns to be displayed for each screen size.
      - **`grid-column-item`**: One item in a grid column block.
      - **`gridcolcard`**: This block can flexible column layout
      - **`gridcolcard-item`**: It is a block of single column of Grid Column Card.
      - **`gridcolcard-item-body`**: Body of Grid Column Card Block Item
      - **`gridcolcard-item-footer`**: Footer button area of Grid Column Card Block Item
      - **`gridcolcard-item-header`**: Header image area of Grid Column Card Block Item
      - **`icon-card`**: Display card with icons, headings, text, and links.
      - **`icon-card-item`**: This is one item in an icon card.
      - **`outer`**: Set the background image, color, and border to show the layout and divisions.
      - **`post-category-badge`**: Displays a single category or custom taxonomy associated with the post. It allows for the specification of taxonomy and design.
      - **`post-list`**: Displays the list of posts by setting the post type, classification, and number of posts to display.
      - **`post-list-slider`**: Displays the list of posts by setting the post type, classification, and number of posts to display.
      - **`post-new-badge`**: Easily highlight your latest post.
      - **`select-post-list`**: Displays an arbitrarily specified page with the layout of the posting list.
      - **`select-post-list-item`**: A single item in the select post list.
      - **`step`**: Set and display step marks, which are useful when explaining the order.
      - **`step-item`**: This element sets the icon, color, and style of the step mark.
      - **`tab`**: These are tabs where you can place various items. Click on the tab label to switch between them.
      - **`tab-item`**: A single item in a tab.
      - **`table-of-contents-new`**: This is a table of contents that is automatically generated according to the headings when added.
      - **`taxonomy`**: Display Taxonomy List Pulldown
      - **`timeline`**: Displays a simple schedule and other information that is useful for explaining the order.
      - **`timeline-item`**: This element sets the label, color, and style of the timeline.
- **`test`**: テストを格納する
  - **`e2e`**: playwrightによるE2Eテストケースが格納される
  - **`e2e-test`**: Gutenbergのテスト用
    - **`fixtures`**: 各ブロックのフィクスチャーをここに格納する (*.html)
- **`phpunit`**: PHPUnit用
    - **`free`**: VK Blocks 無料版で使うブロックのテストケース
    - **`pro`**: VK Blocks Proで使うブロックのテストケース
