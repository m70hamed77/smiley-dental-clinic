#!/bin/bash

# Keep Server Running - Simple and Reliable

cd /home/z/my-project

while true; do
    # Check if server is responding
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:3000 2>/dev/null || echo "000")

    if [ "$RESPONSE" != "200" ] && [ "$RESPONSE" != "404" ]; then
        echo "[$(date)] Server down (HTTP $RESPONSE), restarting..."

        # Kill existing processes
        pkill -9 -f "next dev" 2>/dev/null
        pkill -9 -f "next-server" 2>/dev/null
        fuser -k 3000/tcp 2>/dev/null || true
        sleep 2

        # Start server
        bun run dev > dev-server-persistent.log 2>&1 &
        echo "[$(date)] Server restarted (PID: $!)"
    else
        echo "[$(date)] Server OK (HTTP $RESPONSE)"
    fi

    # Check every 15 seconds
    sleep 15
done
