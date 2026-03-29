#!/bin/bash

# Keep Server Alive Script v2
# This script keeps the Next.js dev server running continuously

PROJECT_DIR="/home/z/my-project"
LOG_FILE="$PROJECT_DIR/server-keepalive.log"
PID_FILE="$PROJECT_DIR/server.pid"

cd "$PROJECT_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

stop_server() {
    if [ -f "$PID_FILE" ]; then
        OLD_PID=$(cat "$PID_FILE")
        if ps -p "$OLD_PID" > /dev/null 2>&1; then
            log "Stopping existing server (PID: $OLD_PID)"
            kill "$OLD_PID" 2>/dev/null
            sleep 2
            # Force kill if still running
            if ps -p "$OLD_PID" > /dev/null 2>&1; then
                kill -9 "$OLD_PID" 2>/dev/null
            fi
        fi
        rm -f "$PID_FILE"
    fi

    # Kill any processes on port 3000
    pkill -f "next dev" 2>/dev/null
    fuser -k 3000/tcp 2>/dev/null
    sleep 2
}

start_server() {
    log "Starting Next.js dev server..."

    # Start server in background with nohup
    nohup bun run dev > "$PROJECT_DIR/server.log" 2>&1 &
    SERVER_PID=$!
    echo "$SERVER_PID" > "$PID_FILE"

    log "Server started with PID: $SERVER_PID"

    # Wait and check if server is actually running
    sleep 5
    if ps -p "$SERVER_PID" > /dev/null 2>&1; then
        log "✓ Server is running"
        # Test if it responds
        sleep 3
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
            log "✓ Server is responding on port 3000"
        else
            log "⚠ Server started but not responding yet"
        fi
    else
        log "✗ Server failed to start"
        return 1
    fi
}

monitor_server() {
    log "Starting server monitor..."

    while true; do
        # Check if PID file exists
        if [ ! -f "$PID_FILE" ]; then
            log "⚠ PID file not found, restarting server..."
            start_server
        else
            PID=$(cat "$PID_FILE")

            # Check if process is running
            if ! ps -p "$PID" > /dev/null 2>&1; then
                log "⚠ Server process not found (PID: $PID), restarting..."
                start_server
            else
                # Check if server responds
                if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|404"; then
                    log "⚠ Server not responding, restarting..."
                    stop_server
                    start_server
                fi
            fi
        fi

        # Check every 30 seconds
        sleep 30
    done
}

# Main
log "=========================================="
log "Keep Server Alive Script v2 Started"
log "=========================================="

# Stop any existing server
stop_server

# Start server
start_server

# Start monitoring
monitor_server
