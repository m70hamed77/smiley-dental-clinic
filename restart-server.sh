#!/bin/bash

# ============================================
# Simple Server Restart Script
# Use this if the server stops or shows 502 error
# ============================================

echo "🔄 Restarting Server..."

# Kill existing processes
pkill -9 -f "next dev" 2>/dev/null
pkill -9 -f "next-server" 2>/dev/null
fuser -k 3000/tcp 2>/dev/null
sleep 2

# Go to project directory
cd /home/z/my-project

# Start server in background
bun run dev > /tmp/nextjs-server.log 2>&1 &

# Wait for server to start
sleep 10

# Test if server is responding
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Server restarted successfully! (HTTP 200)"
    echo "📍 URL: http://localhost:3000"
else
    echo "❌ Server restart failed (HTTP $HTTP_CODE)"
    echo "📋 Check logs: tail -50 /tmp/nextjs-server.log"
fi
