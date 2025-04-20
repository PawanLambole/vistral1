# Using Your Deployed Video Summarizer on Vercel

This guide will help you get started with your Video Summarizer application after it has been deployed to Vercel.

## Accessing Your Application

After deployment, your application will be available at a URL like:
```
https://your-app-name.vercel.app
```

## Setting Up Required Services

### 1. Database Setup

Your application uses Neon.tech for database storage:

1. Sign up for a [Neon.tech](https://neon.tech) account
2. Create a new project
3. Copy your database connection string
4. In your Vercel project dashboard:
   - Go to Settings → Environment Variables
   - Add a variable named `DATABASE_URL` with your connection string
5. Redeploy your application
6. Run database migrations (see [VERCEL_MIGRATION.md](./VERCEL_MIGRATION.md))

### 2. File Storage Setup

For storing video files, you'll need a cloud storage service. We recommend:

#### Option 1: Cloudinary (Easiest)

1. Sign up for a [Cloudinary](https://cloudinary.com) account
2. Go to your Dashboard and find your Cloud name, API Key, and API Secret
3. In your Vercel project dashboard, add these environment variables:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   STORAGE_PROVIDER=cloudinary
   ```

#### Option 2: Supabase Storage

1. Sign up for a [Supabase](https://supabase.com) account
2. Create a new project
3. Go to Storage and create a bucket named `videos`
4. In your Vercel project dashboard, add these environment variables:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   STORAGE_PROVIDER=supabase
   ```

#### Option 3: AWS S3

1. Create an [AWS](https://aws.amazon.com) account
2. Create an S3 bucket
3. Create an IAM user with access to the bucket
4. In your Vercel project dashboard, add these environment variables:
   ```
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=your_region
   S3_BUCKET_NAME=your_bucket_name
   STORAGE_PROVIDER=s3
   ```

## Using the Application

1. **Upload a Video**:
   - Go to the main page
   - Click "Upload Video"
   - Select a video file from your computer
   - The video will be uploaded to your cloud storage

2. **Processing**:
   - Due to Vercel's 10-second function timeout, the processing workflow is different than in local development
   - For larger videos, you'll see guidance on how to process using client-side tools
   - For smaller videos, processing will happen automatically

3. **View Results**:
   - After processing, you can view the transcription and summary
   - Download the summary video or the full transcript
   - View a list of all your processed videos

## Troubleshooting

### Video Upload Issues

- **Error**: "Failed to upload video"
  - Check your cloud storage configuration
  - Verify environment variables are set correctly
  - Try uploading a smaller video (under 10MB)

### Processing Issues

- **Error**: "Processing timeout"
  - This is normal for larger videos on Vercel
  - Follow the client-side processing instructions
  - Consider breaking processing into smaller chunks

### Database Issues

- **Error**: "Database connection failed"
  - Check your Neon.tech database status
  - Verify your `DATABASE_URL` is correct
  - Run migrations as described in the deployment guide

## Getting Help

If you encounter issues, check the browser console for detailed error messages. Most problems can be resolved by:

1. Verifying environment variables are set correctly
2. Checking that database migrations have been run
3. Ensuring your cloud storage service is properly configured

## Limitations of Vercel Deployment

Remember that Vercel has some limitations for free tier:

1. 10-second function timeout (affects video processing)
2. Limited serverless function memory
3. No persistent file storage

For a production application with heavy video processing needs, consider:

1. Moving to a traditional server deployment
2. Using dedicated video processing services
3. Implementing client-side processing for smaller videos