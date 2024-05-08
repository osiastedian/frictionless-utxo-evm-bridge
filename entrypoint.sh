#!/bin/sh

# Change to the correct directory
cd /app

npm run build

mkdir server

cp -r .next/standalone server

cp -r .next/static server

cd server

# Build the Next.js app
node server.js
