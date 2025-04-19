# Deployment Guide for Fly.io

This guide will help you deploy your video summarization app to Fly.io's free tier.

## Prerequisites

1. Sign up for a Fly.io account at https://fly.io/
2. Install the Fly CLI:
   - On macOS: `brew install flyctl`
   - On Linux: `curl -L https://fly.io/install.sh | sh`
   - On Windows: Follow instructions on [Fly.io documentation](https://fly.io/docs/hands-on/install-flyctl/)

## Steps to Deploy

### 1. Authenticate with Fly.io

Open a terminal and run:

```bash
fly auth login
```

Follow the prompts to authenticate.

### 2. Create a Fly.io App

Navigate to your project directory and run:

```bash
fly launch
```

This will create a new app on Fly.io. It will ask you some questions:

- Choose to use an existing configuration (the fly.toml file)
- Select a name for your app (or accept the suggested one)
- Choose a region closest to you
- Choose "no" when asked about a PostgreSQL database (you can set this up separately)

### 3. Add a Persistent Volume

Create a volume for storing uploaded videos and generated summaries:

```bash
fly volumes create data --size 1 --region [your-selected-region]
```

Replace `[your-selected-region]` with the region you selected during app creation (e.g., `ewr`, `lax`, etc.)

### 4. Set Up PostgreSQL Database

You need a PostgreSQL database. You can use:

1. Fly Postgres: 
   ```
   fly postgres create
   ```

   Then connect it to your app:
   ```
   fly postgres attach --app your-app-name your-postgres-name
   ```

   This will set the DATABASE_URL secret in your app.

2. Other hosted PostgreSQL options with free tiers:
   - [Neon](https://neon.tech) - Offers a generous free tier
   - [Supabase](https://supabase.com) - Offers a free tier with PostgreSQL

Once you have your database URL, set it as a secret:

```bash
fly secrets set DATABASE_URL=your-db-connection-string
```

### 5. Deploy the App

Run:

```bash
fly deploy
```

This will:
1. Build the Docker image
2. Push it to Fly.io
3. Deploy the app with the persistent volume

### 6. Open the App

Once deployment is complete, open your app:

```bash
fly open
```

## Troubleshooting

If you encounter any issues:

1. Check the logs:
   ```
   fly logs
   ```

2. Connect to the app to debug:
   ```
   fly ssh console
   ```

3. View secrets:
   ```
   fly secrets list
   ```

## Free Tier Limits and Cost Optimization

Fly.io's free tier includes:
- 3 shared-CPU-1x, 256MB RAM VMs
- 3GB persistent volume storage total
- 160GB outbound data transfer

To ensure you stay within the free tier:

1. We've configured `auto_stop_machines = true` and `min_machines_running = 0` in the fly.toml file. This means your app will automatically scale to zero when not in use.

2. Be mindful of the volume storage (videos and summaries). The free 3GB can be used up quickly with videos. Consider deleting older videos when you don't need them anymore.

3. Monitor your usage through the Fly.io dashboard.

4. Consider implementing a cleanup routine that removes old videos and summaries after a certain period of time.

For more information, visit: https://fly.io/docs/about/pricing/