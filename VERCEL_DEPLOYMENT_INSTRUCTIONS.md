# Deploying Video Summarizer to Vercel

This guide provides step-by-step instructions for deploying this Video Summarizer application to Vercel's free tier.

## What You Need

1. A GitHub account
2. A Vercel account (free tier is fine)
3. A free database from Neon.tech (PostgreSQL)

## Step 1: Set Up Your Database

1. Go to [Neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Save your connection string (it will look like `postgres://username:password@hostname/database`)

## Step 2: Push Your Code to GitHub

1. Create a new repository on GitHub
2. Push your code to the repository with the following files:
   - All project code
   - The `vercel.json` configuration file
   - API endpoints in the `/api` directory

## Step 3: Deploy to Vercel

1. Go to [Vercel](https://vercel.com) and sign up/sign in
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. Add Environment Variables:
   - Click "Environment Variables"
   - Add a variable named `DATABASE_URL` with your Neon.tech connection string
   - Add a variable named `NODE_ENV` with value `production`

6. Click "Deploy"

## Step 4: Verify Your Deployment

1. Once deployed, Vercel will provide a URL for your application
2. Visit this URL to confirm your application is running
3. Test the API by visiting `/api/status` endpoint

## What Works in This Deployment?

1. **Frontend**: Your complete user interface
2. **API endpoints**: Basic functionality like status checking
3. **Database connectivity**: Using Neon.tech PostgreSQL

## Limitations and Workarounds

### Video Processing Limitations

Vercel has a serverless function timeout of 10 seconds, which may not be enough for video processing. Options to handle this:

1. **Use client-side processing**: For smaller videos, consider using Web Assembly or client-side JavaScript libraries
2. **Use external services**: Consider integrating with external video processing APIs
3. **Move to Edge Functions**: Vercel's Edge Functions have different runtime characteristics

### File Storage Limitations

Vercel doesn't provide persistent file storage. Options:

1. **Use cloud storage**: Store uploaded videos and processed results in services like AWS S3, Cloudinary, or Supabase Storage
2. **Add storage configuration**: Update the API endpoints to use these cloud storage services

## Scaling Beyond the Free Tier

As your application grows, consider:

1. **Upgrading to Vercel Pro**: Longer function timeouts and more resources
2. **Using a hybrid architecture**: Keep the frontend on Vercel and move intensive processing to a dedicated server or cloud function with longer timeouts

## Troubleshooting

1. **Database Connection Issues**: Make sure your `DATABASE_URL` is correctly formatted and accessible from Vercel's servers
2. **Build Failures**: Check your build logs for errors and warnings
3. **API Errors**: Look at the function logs in Vercel's dashboard for detailed error messages

## Need Help?

If you encounter issues with your deployment, check Vercel's documentation or reach out to their support team.