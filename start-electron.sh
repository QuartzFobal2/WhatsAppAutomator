#!/bin/bash
# Script to start the Electron app in development mode

# Start Vite dev server in background
NODE_ENV=development npm run dev:vite &
VITE_PID=$!

# Wait for Vite to be ready
echo "Waiting for Vite dev server..."
npx wait-on http://localhost:5000

# Start Electron
NODE_ENV=development npx electron .

# Cleanup: kill Vite when Electron exits
kill $VITE_PID
