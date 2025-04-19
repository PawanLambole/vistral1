# Deploying to Render.com (No Credit Card Required)

This guide will help you deploy your video summarization app to Render.com's free tier without requiring a credit card.

## Important Note About Free Tier Limitations

Render's free tier has some important limitations to be aware of:

1. **Sleep after inactivity**: Free web services sleep after 15 minutes of inactivity, which means the first request after a period of inactivity may take some time to process.
2. **Limited disk space**: The free tier has limited disk space that will restrict how many videos you can store.
3. **CPU/RAM limitations**: Processing large videos may be slower than on a paid tier.

## Steps to Deploy

### 1. Create a Render Account

Go to [render.com](https://render.com/) and sign up for a free account. No credit card is required.

### 2. Create a Web Service

1. From your Render dashboard, click "New" and select "Web Service".
2. Connect your GitHub repository (you'll need to push your code to GitHub first).
3. Give your service a name.
4. For the Environment, select "Node".
5. Set the Build Command to: `npm install && npm run build`
6. Set the Start Command to: `npm run start`
7. Select the Free tier.

### 3. Add Environment Variables

Add the following environment variables:
- `NODE_ENV`: `production`
- `PORT`: `10000` (Render assigns this port for your application)

### 4. Setup a Free Database

For the PostgreSQL database, you have a few options that don't require a credit card:

1. **Neon.tech** (Recommended): 
   - Go to [neon.tech](https://neon.tech/) and create a free account
   - Create a new project
   - After the project is created, you'll see a connection string that looks like:
     ```
     postgres://[user]:[password]@[endpoint]/[dbname]
     ```
   - Copy this connection string
   - Add it as an environment variable in Render: `DATABASE_URL`

2. **Supabase**:
   - Go to [supabase.com](https://supabase.com/) and create a free account
   - Create a new project
   - Go to Project Settings > Database > Connection string
   - Copy the connection string and add your password
   - Add it as an environment variable in Render: `DATABASE_URL`

### 5. Deploy a Simplified Version (Important!)

Due to Render's free tier limitations, we need to take a more focused approach:

#### Option 1: Deploy the Web Application Only

This approach runs the Node.js application without video processing capabilities:

1. Create a new web service on Render
2. **IMPORTANT**: For the build command, enter this EXACT text: `node build-render.js`
3. For the start command, enter: `npm run start`
4. In the **Environment** tab, add the following variables:
   - `RENDER`: `true`
   - `NODE_ENV`: `production`
   - `PORT`: `10000`

This will deploy a version of your application that can display the UI and handle basic functionality, but won't be able to process videos.

#### Option 2: Use a Different Hosting Service

For full functionality including video processing:

1. **Railway.app**: Offers a generous free tier that supports both Node.js and Python
2. **Fly.io**: Requires a credit card but has a free tier with Docker support
3. **Digital Ocean App Platform**: Has a free trial and supports multiple services

#### Option 3: Mock the Video Processing

For portfolio demonstration purposes:

1. Deploy the app to Render
2. Modify the code to use pre-generated video summaries and transcripts
3. This way you can showcase the UI and user flow without actual processing

The current build script has been optimized to at least get the Node.js portion of your application running on Render.

### 6. Important: Understanding File Storage on Render

The application has been modified to use Render's temporary file system (`/tmp` directory) for storing uploaded videos and generated summaries. This means:

1. **Files will not persist when the app sleeps**: After 15 minutes of inactivity, Render's free tier will put your app to sleep, and all files stored in `/tmp` will be lost.

2. **User experience implications**: Users should be encouraged to download their summary videos immediately after they're generated, as they might not be available later.

3. **Processing large videos**: Render's free tier has limited CPU resources, so processing large videos might take longer than in a local environment.

**For a production app**: To overcome these limitations, you'd eventually want to integrate with a dedicated storage service like:
- Cloudinary (has a free tier for media files)
- AWS S3 (limited free tier for 1 year)
- Supabase Storage (generous free tier)

But for testing and portfolio purposes, the current configuration will work with the understanding that files are temporary.

### 7. Deploy Your Application

Click "Create Web Service" and wait for the deployment to complete. Once deployed, Render will provide you with a URL to access your application.

### 8. Run Database Migrations

After your app has been deployed, you need to create the database tables:

1. In your Render dashboard, select your web service
2. Go to the **Shell** tab
3. Run the following command to create your database schema:
   ```
   npm run db:push
   ```
4. You should see output indicating that the tables were created successfully
5. Your application is now ready to use!

## Handling Limitations

### Managing File Storage

Since free tier services have limited storage, implement a strategy to manage your files:

1. Delete processed videos and summaries after they've been downloaded
2. Set a time limit for how long videos are stored
3. Limit the maximum file size users can upload

### Handling Sleep Mode

The free tier will sleep after 15 minutes of inactivity. To improve user experience:

1. Add a loading screen when the service is waking up
2. Inform users that the first request may take some time
3. Consider implementing a service that pings your application regularly to prevent sleep (though this may violate Render's terms of service)

## Upgrading Later

If you need more resources later, you can upgrade to Render's paid tiers, which offer:

- No sleep time
- More CPU and RAM
- Larger disk space
- Persistent storage

For more information, visit the [Render Pricing Page](https://render.com/pricing).