#!/bin/bash

while true; do
    echo "[$(date)] Starting dev server..."

    # Run dev server
    bun run dev

    # If it exits, wait a bit and restart
    echo "[$(date)] Server stopped. Restarting in 5 seconds..."
    sleep 5
done
