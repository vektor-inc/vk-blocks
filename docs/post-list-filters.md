# 投稿リスト・投稿リストスライダーの絞り込み（#3121）

- 共通表示条件に searchKeyword（string、既定空文字）と postParent（integer、既定 -1）を追加。動的ブロックで保存HTMLがないため deprecated は不要。
- 検索語は属性に直結し、PHPで sanitize_text_field と trim を通す。空なら s を追加しない。並び順は既存設定に従う。
- 親欄は単一の階層型・REST公開投稿タイプ選択時のみ表示。候補は検索ごとに最大20件、保存済み親は個別取得。直下の子のみ対象。
- 投稿タイプの追加・解除操作の setAttributes を包み、親を -1 に戻す。情報取得時・undo・欄の非表示時に useEffect で親を書き換えない。
- サーバーでも同じ型条件を確認し、親が0以上の場合のみ整数の post_parent を追加。0はAPI上の最上位指定でありUIには選択肢を追加しない。
- 既定値・未設定なら既存クエリ引数を維持。子ページリストとの共通化、関連度順、REST非公開CPT、0件案内文・見出し変更は対象外。
- 0件案内と少数件スライダーの処理は既存実装を利用。
- 検索欄はサイトに追加されない。検索判定によりテーマ・検索プラグインの影響を受ける可能性がある。menu_order が必要なら子ページリストを使う。

## WP 6.6 のプレビュー更新

[WordPress 6.6 配布ソース](https://github.com/WordPress/WordPress/blob/6.6/wp-includes/js/dist/server-side-render.js#L339) の `wp-includes/js/dist/server-side-render.js` 339行に `useDebounce(fetchData, 500)`、350〜355行に初回のみ即時取得する分岐がある。検索語用の独自 state や debounce は追加しない。
