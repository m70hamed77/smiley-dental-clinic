#!/bin/bash

# ============================================
# Clean Server Startup Script
# Reads .env fresh and starts server
# ============================================

PROJECT_DIR="/home/z/my-project"
cd "$PROJECT_DIR" || exit 1

# Step 1: Kill all existing processes
echo "🔄 Step 1: Stopping all existing processes..."
pkill -9 -f "next dev" 2>/dev/null
pkill -9 -f "next-server" 2>/dev/null
fuser -k 3000/tcp 2>/dev/null
sleep 3

# Step 2: Clear cache
echo "🗑️  Step 2: Clearing cache..."
rm -rf .next
rm -rf node_modules/.prisma
sleep 2

# Step 3: Read DATABASE_URL from .env only
echo "📄 Step 3: Reading DATABASE_URL from .env..."
if [ -f .env ]; then
    # Read DATABASE_URL directly from .env file
    export DATABASE_URL=$(grep "^DATABASE_URL=" .env | head -1 | cut -d'=' -f2-)
    # Remove quotes if present
    DATABASE_URL="${DATABASE_URL%\"}"
    DATABASE_URL="${DATABASE_URL#\"}"
    echo "✓ DATABASE_URL loaded: ${DATABASE_URL:0:50}..."
else
    echo "❌ .env file not found!"
    exit 1
fi

# Step 4: Generate Prisma Client with correct URL
echo "⚙️  Step 4: Generating Prisma Client..."
DATABASE_URL="$DATABASE_URL" npx prisma generate
sleep 2

# Step 5: Start server
echo "🚀 Step 5: Starting Next.js dev server..."
bun run dev > /tmp/nextjs-clean-server.log 2>&1 &
SERVER_PID=$!
echo "✓ Server started with PID: $SERVER_PID"

# Step 6: Wait and verify
echo "⏳ Step 6: Waiting for server to start..."
sleep 12

# Check if server is responding
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅✅✅ SUCCESS! Server is running and responding (HTTP 200) ✅✅✅"
    echo "📍 URL: http://localhost:3000"
    echo "🔧 Use this command to check logs: tail -f /tmp/nextjs-clean-server.log"
else
    echo "❌ Server not responding (HTTP $HTTP_CODE)"
    echo "📋 Check logs: tail -50 /tmp/nextjs-clean-server.log"
    tail -50 /tmp/nextjs-clean-server.log
fi
