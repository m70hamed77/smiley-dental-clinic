#!/bin/bash

# Keep Next.js dev server alive
# This script will restart the server if it dies

cd /home/z/my-project

echo "Starting server keeper..."
echo $$ > /home/z/my-project/keeper.pid

while true; do
    # Check if server is running on port 3000
    if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "$(date): Server not responding, starting..."
        pkill -f "next dev" 2>/dev/null
        sleep 2
        nohup bun run dev > /home/z/my-project/dev.log 2>&1 &
        echo $! > /home/z/my-project/server.pid
        sleep 5
        echo "$(date): Server started with PID $(cat /home/z/my-project/server.pid)"
    fi

    # Check every 10 seconds
    sleep 10
done
