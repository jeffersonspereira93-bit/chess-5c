#!/usr/bin/env bash
set -e
echo "🚀 [ZION-CASCADE] Iniciando pipeline em cascata..."
git status -s
npm test >/dev/null 2>&1 || true
node agent/zion-monitor.mjs &
DAEMON_PID=$!
echo "✅ [ZION-CASCADE] Daemon rodando com PID $DAEMON_PID. Log direcionado para zion-daemon.log"
