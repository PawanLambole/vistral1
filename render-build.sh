#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install Python and dependencies
apt-get update
apt-get install -y python3 python3-pip ffmpeg libsndfile1

# Build frontend assets
npm ci
npm run build