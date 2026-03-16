#!/bin/bash
# Claude Code スキルのセットアップスクリプト
# プラグインルートディレクトリで実行すること
#
# Usage: bash tools/claude-skills/setup.sh

REPO_SKILLS_DIR="$(pwd)/tools/claude-skills"
USER_SKILLS_DIR="$HOME/.claude/skills"

mkdir -p "$USER_SKILLS_DIR"

for skill_dir in "$REPO_SKILLS_DIR"/*/; do
  skill_name=$(basename "$skill_dir")
  target="$USER_SKILLS_DIR/$skill_name"

  if [ -d "$target" ]; then
    echo "skip: $skill_name (already exists)"
  else
    cp -r "$skill_dir" "$target"
    echo "installed: $skill_name → $target"
  fi
done

echo ""
echo "セットアップ完了。Claude Code を再起動するとスキルが有効になります。"
