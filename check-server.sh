#!/bin/bash

echo "==================================="
echo "Server Status Check"
echo "==================================="
echo ""

# Check if port 3000 is in use
echo "🔍 Checking port 3000..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "✅ Port 3000 is in use"
    lsof -Pi :3000 -sTCP:LISTEN
else
    echo "❌ Port 3000 is NOT in use"
    echo "⚠️  No server is running on port 3000"
fi

echo ""
echo "==================================="
echo "Checking for running Node/Next processes..."
echo "==================================="

# Check for Next.js processes
NEXT_PROCESSES=$(ps aux | grep -E "(next|node.*3000)" | grep -v grep)
if [ -n "$NEXT_PROCESSES" ]; then
    echo "✅ Found running processes:"
    echo "$NEXT_PROCESSES"
else
    echo "❌ No Next.js processes found"
fi

echo ""
echo "==================================="
echo "Testing localhost:3000..."
echo "==================================="

# Test if localhost:3000 responds
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    echo "✅ Server is responding on http://localhost:3000"
    curl -s http://localhost:3000 | head -20
else
    echo "❌ Server is NOT responding on http://localhost:3000"
fi

echo ""
echo "==================================="
echo "Summary"
echo "==================================="

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "✅ Server Status: RUNNING"
    echo "📍 URL: http://localhost:3000"
else
    echo "❌ Server Status: NOT RUNNING"
    echo "💡 To start the server, run: bun run dev"
fi
