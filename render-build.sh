#!/usr/bin/env bash
# Exit on error
set -o errexit

# Build frontend assets
npm ci
npm run build

# Print environment information
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"
echo "Directory contents: $(ls -la)"