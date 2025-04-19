# Static Deployment to Render.com

This guide provides instructions for deploying a static version of your application to Render.com's free tier.

## Overview

Due to Render's free tier limitations with complex Node.js applications, we'll deploy a simplified version that demonstrates your portfolio project without requiring a complex build process.

## Steps for Deployment

### 1. Prepare Your Project

1. Build your project locally:
   ```
   npm run build
   ```

2. Copy your built files (`dist` directory) to your GitHub repository

### 2. Set Up on Render

1. Sign up for a [Render account](https://render.com/) (no credit card required)
2. From your dashboard, click **New** → **Static Site**
3. Connect to your GitHub repository
4. Configure your static site:
   - **Name**: Choose a name for your site
   - **Branch**: main (or your default branch)
   - **Build Command**: Leave empty (since we've pre-built the files)
   - **Publish Directory**: `dist`

5. Click **Create Static Site**

## What to Expect

- Your site will be deployed as a static frontend
- The application will have limited functionality:
  - UI and design will be visible
  - Static pages and routing will work
  - API calls and video processing features won't work (as those require a backend)

## Alternative Options

### For a Fully Functional App:

1. **Railway.app**: Offers a generous free tier that supports both Node.js and Python
2. **Fly.io**: Requires a credit card but has a free tier with Docker support
3. **Heroku**: Limited free tier available

### For a Static Portfolio Piece:

This Render static site deployment is perfect for showcasing your UI design and frontend skills in a portfolio.

## Getting Help

If you encounter any issues with your Render deployment, refer to their [documentation](https://render.com/docs) or [contact Render support](https://render.com/contact).