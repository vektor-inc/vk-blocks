#!/bin/bash
# detect-release-state.sh for vk-blocks-pro
# プラグインルートディレクトリで実行すること

PLUGIN_FILE="vk-blocks.php"

if [ ! -f "$PLUGIN_FILE" ]; then
  echo "ERROR: $PLUGIN_FILE not found. Run from plugin root."
  exit 1
fi

if [ ! -f "readme.txt" ]; then
  echo "ERROR: readme.txt not found. Run from plugin root."
  exit 1
fi

# vk-blocks.php からバージョンを取得（3桁: X.X.X）
VERSION=$(grep -m1 "^ \* Version:" "$PLUGIN_FILE" | sed 's/.*Version: *//' | tr -d ' \r')
echo "VERSION=$VERSION"

# readme.txt の Changelog に今のバージョンのヘッダーがあるか確認
if grep -q "^= $VERSION =" readme.txt; then
  CHANGELOG_HAS_VERSION=true
else
  CHANGELOG_HAS_VERSION=false
fi
echo "CHANGELOG_HAS_VERSION=$CHANGELOG_HAS_VERSION"

# Changelog にバージョンなし変更エントリがあるか確認
# "== Changelog ==" の直後から最初の "= X.X.X =" の前までの行を抽出
UNVERSIONED=$(sed -n '/^== Changelog ==/,/^= [0-9]/p' readme.txt | grep -v "^== Changelog ==" | grep -v "^= [0-9]" | grep -v "^$" | head -5)
if [ -n "$UNVERSIONED" ]; then
  HAS_UNVERSIONED=true
  echo "HAS_UNVERSIONED=true"
  echo "---"
  echo "バージョンなし変更エントリ（先頭5行）:"
  echo "$UNVERSIONED"
  echo "---"
else
  HAS_UNVERSIONED=false
  echo "HAS_UNVERSIONED=false"
fi

# タグ（X.X.X）が存在するか確認
if git tag | grep -q "^${VERSION}$"; then
  TAG_EXISTS=true
else
  TAG_EXISTS=false
fi
echo "TAG_EXISTS=$TAG_EXISTS"

# 現在のブランチを確認
CURRENT_BRANCH=$(git branch --show-current)
echo "CURRENT_BRANCH=$CURRENT_BRANCH"

# 状態の判定
if [ "$HAS_UNVERSIONED" = "true" ]; then
  STATE=NEEDS_VERSION
elif [ "$TAG_EXISTS" = "false" ]; then
  STATE=NEEDS_TAG
else
  STATE=UP_TO_DATE
fi

echo ""
echo "=========================================="
echo "STATE=$STATE"
echo "==========================================
"
