# Video Summarizer Application

A full-stack video summarization platform that transforms uploaded video content into concise, informative text and highlight videos.

## Features

- Video upload and processing
- Automatic transcription generation
- Summary video creation with key moments
- Easy downloading of results

## Technologies Used

- **Frontend**: React, TailwindCSS, Shadcn/UI
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Drizzle ORM
- **Video Processing**: Python, FFmpeg
- **Styling**: Tailwind CSS

## Deployment Options

This application can be deployed in several ways:

### 1. Render.com (No Credit Card Required)

For a basic deployment without payment information:

- Follow the instructions in [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)
- **Limited functionality**: The free tier has restrictions that limit video processing
- Several options provided in the deployment guide:
  - Deploy web UI only (for demonstration)
  - Consider alternative hosting services
  - Use mock data for demo purposes
- Note: Files are stored temporarily and will be lost when the app sleeps

### 2. Fly.io (Requires Credit Card for Verification)

For more robust deployment with persistent storage:

- Follow the instructions in [DEPLOYMENT.md](./DEPLOYMENT.md)
- Uses Fly.io's free tier (requires credit card for verification)
- Includes persistent volume storage for videos
- Better for more reliable demos

## Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. The app will be available at http://localhost:5001

## Database Setup

The application uses PostgreSQL. For local development:

1. Set up a PostgreSQL database
2. Create a `.env` file with your database connection string:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/videosummarizer
   ```
3. Run database migrations: `npm run db:push`

## Important Notes

- Video processing is CPU-intensive and may take some time depending on the hosting environment
- Free tiers of hosting services have limitations on CPU, memory, and storage
- For a production application, consider using dedicated storage services like AWS S3 or Cloudinary