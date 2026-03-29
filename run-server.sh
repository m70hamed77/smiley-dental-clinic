#!/bin/bash

# Kill any existing dev server
pkill -f "next dev" 2>/dev/null
sleep 2

# Start the server
echo "🚀 Starting Next.js dev server..."
bun run dev

# If the server exits, restart it
while true; do
  echo "🔄 Server stopped, restarting in 5 seconds..."
  sleep 5
  echo "🚀 Restarting Next.js dev server..."
  bun run dev
done
