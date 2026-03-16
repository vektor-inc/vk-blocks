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

# vk-blocks.php からバージョンを取得
PHP_VERSION=$(grep -m1 "^ \* Version:" "$PLUGIN_FILE" | sed 's/.*Version: *//' | tr -d ' \r')
echo "PHP_VERSION=$PHP_VERSION"

# 3桁バージョンを取得（4桁目を除去）
VERSION_3=$(echo "$PHP_VERSION" | sed 's/\.[0-9]*$//')
echo "VERSION_3=$VERSION_3"

# readme.txt の Changelog に今のバージョンのヘッダーがあるか確認
if grep -q "^= $VERSION_3 =" readme.txt; then
  CHANGELOG_HAS_VERSION=true
else
  CHANGELOG_HAS_VERSION=false
fi
echo "CHANGELOG_HAS_VERSION=$CHANGELOG_HAS_VERSION"

# Changelog にバージョンなし変更エントリがあるか確認
# "== Changelog ==" の直後から最初の "= X.X.X =" の前までの行を抽出
UNVERSIONED=$(awk '/^== Changelog ==/{found=1; next} found && /^= [0-9]+\.[0-9]/{exit} found && /\S/{print}' readme.txt | head -5)
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

# pre_ タグが存在するか確認
if git tag | grep -q "^pre_${PHP_VERSION}$"; then
  PRE_TAG_EXISTS=true
else
  PRE_TAG_EXISTS=false
fi
echo "PRE_TAG_EXISTS=$PRE_TAG_EXISTS"

# 本番タグが存在するか確認
if git tag | grep -q "^${PHP_VERSION}$"; then
  STABLE_TAG_EXISTS=true
else
  STABLE_TAG_EXISTS=false
fi
echo "STABLE_TAG_EXISTS=$STABLE_TAG_EXISTS"

# 現在のブランチを確認
CURRENT_BRANCH=$(git branch --show-current)
echo "CURRENT_BRANCH=$CURRENT_BRANCH"

# 状態の判定
if [ "$HAS_UNVERSIONED" = "true" ]; then
  STATE=NEEDS_VERSION
elif [ "$PRE_TAG_EXISTS" = "false" ]; then
  STATE=NEEDS_PRE_RELEASE
elif [ "$STABLE_TAG_EXISTS" = "false" ]; then
  STATE=NEEDS_STABLE_RELEASE
else
  STATE=UP_TO_DATE
fi

echo ""
echo "=========================================="
echo "STATE=$STATE"
echo "=========================================="
