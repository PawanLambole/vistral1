# Deploying to Vercel

This guide provides instructions for deploying your Video Summarizer application to Vercel.

## Why Vercel?

Vercel is an excellent platform for deploying this type of application because:

1. It has a generous free tier that doesn't require a credit card
2. It handles React/Vite applications extremely well
3. It provides serverless functions for API endpoints
4. It integrates directly with GitHub for continuous deployment

## Database Setup with Neon.tech

For the database, we'll use Neon.tech's serverless PostgreSQL:

1. Go to [Neon.tech](https://neon.tech) and sign up for a free account
2. Create a new project (free tier is sufficient)
3. Once your project is created, find your connection string:
   - Click on your project
   - Navigate to the "Connection Details" tab
   - Copy the connection string (it should look like `postgres://username:password@endpoint/database`)

## Deployment Steps

### 1. Push Your Code to GitHub

1. Create a GitHub repository for your project
2. Push your code to the repository

### 2. Connect to Vercel

1. Go to [Vercel](https://vercel.com/) and sign up for a free account
   - You can sign up directly with your GitHub account
2. Click "Add New..." → "Project"
3. Find and select your GitHub repository
4. Vercel will automatically detect that this is a Vite project

### 3. Configure Your Project

1. **Project Name**: Choose a name for your project
2. **Framework Preset**: Vercel should automatically detect Vite
3. **Root Directory**: Keep as `.` (the root of your repository)
4. **Build Command**: Keep the default `npm run build`
5. **Output Directory**: Should be set to `dist` by default
6. **Install Command**: Keep the default `npm install`

### 4. Environment Variables

Set up the following environment variables:

1. Click on "Environment Variables" section
2. Add the following:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: Your PostgreSQL connection string (Neon.tech recommended)

### 5. Deploy

1. Click "Deploy"
2. Vercel will build and deploy your application
3. Once complete, you'll receive a URL for your deployed application

## Database Setup

After deployment, you need to run database migrations:

1. Go to the Vercel dashboard
2. Select your project
3. Go to "Deployments" → Select latest deployment
4. Click "Functions" tab
5. Find the "Console" option and click on it
6. Run: `npx drizzle-kit push`

## Important Notes

1. **Limitations**: Vercel has some restrictions for free tier:
   - Serverless function execution time is limited to 10 seconds
   - No persistent file storage (uploaded files are temporary)
   - Limited serverless function memory (1GB max)
   - Video processing with Python might be limited

2. **Suggested Storage Solutions**:

   For storing uploaded videos and generated summaries, consider these free options:
   
   - **Cloudinary**: Offers 1GB free storage, video hosting and streaming
     ```
     # Add to environment variables
     CLOUDINARY_CLOUD_NAME=your_cloud_name
     CLOUDINARY_API_KEY=your_api_key
     CLOUDINARY_API_SECRET=your_api_secret
     ```
   
   - **Supabase Storage**: 1GB free storage, works well with Neon.tech
     ```
     # Add to environment variables
     SUPABASE_URL=your_supabase_url
     SUPABASE_ANON_KEY=your_anon_key
     ```
   
   - **AWS S3**: 5GB free storage (12 months), reliable for large files
     ```
     # Add to environment variables
     AWS_ACCESS_KEY_ID=your_access_key
     AWS_SECRET_ACCESS_KEY=your_secret_key
     AWS_REGION=your_region
     S3_BUCKET_NAME=your_bucket_name
     ```

3. **Video Processing Workarounds**:
   
   - Use client-side libraries like ffmpeg.wasm for browser-based processing
   - Process videos in smaller chunks to fit within memory limits
   - Use Web Workers to handle processing in background threads
   - Consider breaking complex operations into multiple serverless function calls

## Continuous Deployment

One of the best features of Vercel is continuous deployment:

1. Any changes you push to your main branch will automatically trigger a new deployment
2. You can also create preview deployments by creating pull requests in GitHub

This makes it easy to maintain and update your application over time.