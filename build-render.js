// Simple build script for Render deployment
const { execSync } = require('child_process');

console.log('Starting Render build process...');

try {
  // Install dependencies with --include=dev to ensure build tools are available
  console.log('Installing dependencies...');
  execSync('npm ci --include=dev', { stdio: 'inherit' });

  // Run vite build with explicit path
  console.log('Building frontend...');
  execSync('npx vite build', { stdio: 'inherit' });

  // Build server code
  console.log('Building server...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });

  console.log('Build completed successfully');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}