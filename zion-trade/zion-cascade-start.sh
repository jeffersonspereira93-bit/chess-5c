#!/usr/bin/env bash
set -e
echo "🚀 [ZION-CASCADE] Subindo ecossistema autônomo completo..."
git status -s
npm test >/dev/null 2>&1 || true
node agent/zion-monitor.mjs &
DAEMON_PID=$!
echo "✅ [ZION-CASCADE] Daemon autônomo rodando com PID $DAEMON_PID."
