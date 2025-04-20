// API endpoint for listing videos
import { createClient } from '@neondatabase/serverless';

// Configure database client
const getDbClient = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return createClient(connectionString);
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = getDbClient();
    
    // Get all videos ordered by most recent first
    const result = await client.query(
      'SELECT * FROM videos ORDER BY id DESC'
    );
    
    // Format response
    const videos = result.rows.map(video => ({
      id: video.id,
      originalName: video.originalName,
      originalDuration: video.originalDuration,
      status: video.status,
      createdAt: video.createdAt
    }));
    
    return res.status(200).json(videos);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Server error fetching videos' });
  }
}