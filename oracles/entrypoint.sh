#!/bin/sh

npx prisma migrate deploy

# Start hardhat node as a background process

npm run "start-$1"
