#!/bin/bash

# Simple Server Monitor - Keeps Next.js Dev Server Alive

MONITOR_INTERVAL=20  # Check every 20 seconds
LOG_FILE="/home/z/my-project/monitor.log"
SERVER_LOG="/home/z/my-project/dev-server-persistent.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

check_and_restart_server() {
    # Check if server is responding
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000 2>/dev/null || echo "000")

    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
        log "✓ Server is healthy (HTTP $HTTP_CODE)"
        return 0
    else
        log "✗ Server not responding (HTTP $HTTP_CODE), restarting..."
        restart_server
        return 1
    fi
}

restart_server() {
    log "Killing any existing server processes..."
    pkill -9 -f "next dev" 2>/dev/null
    pkill -9 -f "next-server" 2>/dev/null
    fuser -k 3000/tcp 2>/dev/null || true
    sleep 3

    log "Starting new server..."
    (bun run dev > "$SERVER_LOG" 2>&1 &) && sleep 1
    log "Server restart command issued"

    sleep 8

    # Verify new server is responding
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
        log "✓✓✓ Server restarted successfully! (HTTP $HTTP_CODE) ✓✓✓"
    else
        log "✗ Server restart failed (HTTP $HTTP_CODE)"
    fi
}

# Main monitoring loop
log "=========================================="
log "Server Monitor Started"
log "=========================================="

while true; do
    check_and_restart_server
    sleep "$MONITOR_INTERVAL"
done
