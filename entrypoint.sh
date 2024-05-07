#!/bin/sh

# Change to the correct directory
cd /app

# Build the Next.js app
npm run build && node .next/standalone/server.js
