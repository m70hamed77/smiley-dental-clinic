#!/bin/bash

# Start and Monitor Server - Background Daemon
# This script runs in the background and keeps the server alive

SERVER_CMD="bun run dev"
LOG_DIR="/home/z/my-project"
SERVER_LOG="$LOG_DIR/server-daemon.log"
MONITOR_LOG="$LOG_DIR/monitor-daemon.log"

start_server() {
    echo "[$(date)] Starting server..." >> "$MONITOR_LOG"

    # Kill any existing server
    pkill -9 -f "next dev" 2>/dev/null
    pkill -9 -f "next-server" 2>/dev/null
    fuser -k 3000/tcp 2>/dev/null || true
    sleep 2

    # Start server
    $SERVER_CMD >> "$SERVER_LOG" 2>&1 &
    SERVER_PID=$!
    echo "[$(date)] Server started with PID: $SERVER_PID" >> "$MONITOR_LOG"
    echo $SERVER_PID > "$LOG_DIR/server.daemon.pid"

    sleep 5
}

# Main loop
while true; do
    # Check if server is responding
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:3000 2>/dev/null || echo "000")

    if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "404" ]; then
        echo "[$(date)] Server not responding (HTTP $HTTP_CODE)" >> "$MONITOR_LOG"
        start_server
    fi

    sleep 10
done
