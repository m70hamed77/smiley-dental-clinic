#!/bin/bash

# ============================================
# Auto Server Manager v2 - Keep Dev Server Alive
# ============================================

PROJECT_DIR="/home/z/my-project"
SERVER_LOG="$PROJECT_DIR/server-auto.log"
MANAGER_LOG="$PROJECT_DIR/server-manager.log"
PID_FILE="$PROJECT_DIR/server.pid"
MANAGER_PID_FILE="$PROJECT_DIR/manager.pid"

# Ensure we're in the project directory
cd "$PROJECT_DIR" || exit 1

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$MANAGER_LOG"
}

# Kill any existing server processes (NOT the manager)
cleanup_server() {
    log "Cleaning up existing server processes..."

    # Kill existing server only
    if [ -f "$PID_FILE" ]; then
        OLD_PID=$(cat "$PID_FILE")
        if ps -p "$OLD_PID" > /dev/null 2>&1; then
            log "Killing existing server (PID: $OLD_PID)"
            kill "$OLD_PID" 2>/dev/null
            sleep 1
            kill -9 "$OLD_PID" 2>/dev/null
        fi
        rm -f "$PID_FILE"
    fi

    # Kill all next dev processes (but not the manager)
    pkill -9 -f "next dev" 2>/dev/null
    pkill -9 -f "node.*next" 2>/dev/null

    # Kill anything on port 3000
    fuser -k 3000/tcp 2>/dev/null || true
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true

    sleep 2
    log "Server cleanup complete"
}

start_server() {
    log "Starting Next.js dev server..."

    # Clear old log
    > "$SERVER_LOG"

    # Start server in background
    bun run dev >> "$SERVER_LOG" 2>&1 &
    SERVER_PID=$!
    echo "$SERVER_PID" > "$PID_FILE"

    log "Server started with PID: $SERVER_PID"

    # Wait for server to initialize
    sleep 8

    # Check if process is still running
    if ps -p "$SERVER_PID" > /dev/null 2>&1; then
        log "✓ Server process is running (PID: $SERVER_PID)"

        # Test if server responds
        for i in {1..5}; do
            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
            if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
                log "✓✓✓ Server is responding! (HTTP $HTTP_CODE) ✓✓✓"
                return 0
            fi
            log "Waiting for server to respond... (attempt $i/5)"
            sleep 2
        done

        log "⚠ Server process is running but not responding yet"
        return 1
    else
        log "✗ Server process died immediately"
        log "Last server log:"
        tail -20 "$SERVER_LOG" | tee -a "$MANAGER_LOG"
        return 1
    fi
}

monitor_server() {
    log "=========================================="
    log "Starting server monitor loop..."
    log "=========================================="

    CHECK_COUNT=0

    while true; do
        CHECK_COUNT=$((CHECK_COUNT + 1))
        log "[$CHECK_COUNT] Checking server status..."

        # Check if PID file exists
        if [ ! -f "$PID_FILE" ]; then
            log "⚠ PID file not found, restarting server..."
            start_server
        else
            PID=$(cat "$PID_FILE")

            # Check if process is running
            if ! ps -p "$PID" > /dev/null 2>&1; then
                log "⚠ Server process died (PID: $PID), restarting..."
                start_server
            else
                # Process is running, check if it responds
                HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000 2>/dev/null || echo "000")

                if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
                    log "✓ Server healthy (HTTP $HTTP_CODE) - PID: $PID"
                else
                    log "⚠ Server not responding (HTTP $HTTP_CODE), restarting..."
                    kill "$PID" 2>/dev/null
                    sleep 2
                    start_server
                fi
            fi
        fi

        # Check every 15 seconds
        sleep 15
    done
}

# ============================================
# Main Execution
# ============================================

# Save our PID (for tracking only, don't kill ourselves!)
echo $$ > "$MANAGER_PID_FILE"

log "=========================================="
log "Auto Server Manager v2 Started"
log "=========================================="
log "Manager PID: $$"
log "Project: $PROJECT_DIR"
log "Server Log: $SERVER_LOG"
log "Manager Log: $MANAGER_LOG"
log "=========================================="

# Cleanup server processes first
cleanup_server

# Start server
if start_server; then
    log "✓ Server started successfully!"
else
    log "✗ Failed to start server, retrying..."
    sleep 3
    start_server
fi

# Start monitoring loop
monitor_server
