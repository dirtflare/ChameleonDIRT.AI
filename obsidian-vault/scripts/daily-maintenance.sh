#!/usr/bin/env bash
#
# daily-maintenance.sh
# Obsidian Vault の朝の自動メンテナンスを Claude Code (headless) で実行する。
# cron / launchd から毎朝呼び出す想定。
#
# 使い方:
#   chmod +x scripts/daily-maintenance.sh
#   ./scripts/daily-maintenance.sh
#
set -euo pipefail

# このスクリプトが置かれているディレクトリ = scripts/、その親 = Vault ルート
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VAULT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$VAULT_DIR/logs"
mkdir -p "$LOG_DIR"

STAMP="$(date +%Y-%m-%d_%H%M%S)"
LOG_FILE="$LOG_DIR/maintenance_$STAMP.log"

# claude CLI が無ければ終了
if ! command -v claude >/dev/null 2>&1; then
  echo "[$(date)] ERROR: 'claude' CLI が見つかりません。Claude Code をインストールしてください。" | tee -a "$LOG_FILE"
  exit 1
fi

echo "[$(date)] 朝のメンテナンス開始 (vault: $VAULT_DIR)" | tee -a "$LOG_FILE"

cd "$VAULT_DIR"

# headless モードで実行。CLAUDE.md は cwd から自動で読み込まれる。
# --permission-mode acceptEdits で対話なしにファイル編集を許可（無人実行のため）。
claude -p "/daily-maintenance" \
  --permission-mode acceptEdits \
  >> "$LOG_FILE" 2>&1

echo "[$(date)] 完了。ログ: $LOG_FILE" | tee -a "$LOG_FILE"

# 変更を git 管理している場合は自動コミット（任意・失敗しても止めない）
if [ -d "$VAULT_DIR/.git" ]; then
  git -C "$VAULT_DIR" add -A || true
  git -C "$VAULT_DIR" commit -m "chore: daily vault maintenance $STAMP" || true
fi
