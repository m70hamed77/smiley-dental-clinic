#!/bin/bash
cd /home/z/my-project
while true; do
  echo "[$(date)] Starting dev server..." >> dev.log
  bun run dev >> dev.log 2>&1
  echo "[$(date)] Server stopped, restarting in 3 seconds..." >> dev.log
  sleep 3
done
