#!/bin/bash

# Simple Server Watcher - Keeps Next.js Running
# This is a lightweight monitor that ensures the server stays up

echo "Server Watcher started at $(date)" >> /home/z/my-project/watcher.log

while true; do
    # Test if server responds
    if curl -s --max-time 3 http://localhost:3000 > /dev/null 2>&1; then
        # Server is up, do nothing
        :
    else
        # Server is down, restart it
        echo "[$(date)] Server down! Restarting..." >> /home/z/my-project/watcher.log

        # Kill old processes
        pkill -9 -f "next dev" 2>/dev/null
        pkill -9 -f "next-server" 2>/dev/null
        fuser -k 3000/tcp 2>/dev/null || true
        sleep 2

        # Start new server
        cd /home/z/my-project
        (bun run dev > /home/z/my-project/dev-server-persistent.log 2>&1 &)
        echo "[$(date)] Server restarted" >> /home/z/my-project/watcher.log

        # Give it time to start
        sleep 10
    fi

    # Check every 30 seconds
    sleep 30
done
