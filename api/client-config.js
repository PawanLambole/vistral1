// API endpoint for client configuration
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Detect environment
  const environment = process.env.NODE_ENV || 'development';
  const isProduction = environment === 'production';
  
  // This endpoint provides configuration for the client
  // to adapt to different environments
  const config = {
    environment,
    isProduction,
    api: {
      baseUrl: isProduction 
        ? `https://${process.env.VERCEL_URL || 'your-app.vercel.app'}/api` 
        : 'http://localhost:5001/api',
      endpoints: {
        status: '/status',
        uploadVideo: '/videos-upload',
        videoStatus: '/videos-status',
        videoSummary: '/videos-summary',
        processingHelpers: '/client-summarization-helper',
        storageOptions: '/storage-options',
        videosList: '/videos-list'
      }
    },
    features: {
      clientProcessing: isProduction,
      cloudStorage: isProduction,
      uploadSizeLimit: 100 * 1024 * 1024 // 100MB
    },
    deployment: {
      provider: process.env.VERCEL ? 'vercel' : 'local',
      region: process.env.VERCEL_REGION || 'local',
      buildId: process.env.VERCEL_GIT_COMMIT_SHA || 'development'
    },
    storage: {
      // Preferred cloud storage (if implemented)
      provider: process.env.STORAGE_PROVIDER || 'none',
      // Base URL for accessing stored files (for production)
      baseUrl: process.env.STORAGE_BASE_URL || '',
      // Key for client-side storage access (if applicable)
      publicKey: process.env.STORAGE_PUBLIC_KEY || ''
    }
  };
  
  return res.status(200).json(config);
}