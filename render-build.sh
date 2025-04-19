#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install all dependencies explicitly with --include=dev to ensure build tools are available
npm ci --include=dev

# Make node_modules binaries available in PATH
export PATH="$PATH:$(pwd)/node_modules/.bin"
echo "Updated PATH: $PATH"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Explicitly run vite build with full path
echo "Running build with explicit path to vite"
./node_modules/.bin/vite build

# Build server-side code
echo "Building server code"
./node_modules/.bin/esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Print build completion message
echo "Build completed successfully"