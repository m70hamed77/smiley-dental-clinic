#!/bin/bash
# Clean Start Script - Reads .env only

# Kill any existing processes
pkill -9 -f "next dev" 2>/dev/null
pkill -9 -f "next-server" 2>/dev/null
fuser -k 3000/tcp 2>/dev/null
sleep 2

# Go to project directory
cd /home/z/my-project

# Explicitly load .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Start server
bun run dev
