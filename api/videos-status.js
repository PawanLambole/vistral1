// API endpoint to check video status
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

  // Extract video ID from query params or URL path
  const videoId = req.query.id;
  
  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  try {
    const client = getDbClient();
    
    // Get video status
    const result = await client.query(
      'SELECT * FROM videos WHERE id = $1',
      [videoId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    const video = result.rows[0];
    
    // Get video summary if available
    const summaryResult = await client.query(
      'SELECT * FROM video_summaries WHERE videoId = $1',
      [videoId]
    );
    
    const summary = summaryResult.rows.length > 0 ? summaryResult.rows[0] : null;
    
    // Combine data for response
    const response = {
      id: video.id,
      originalName: video.originalName,
      originalDuration: video.originalDuration,
      status: video.status,
      createdAt: video.createdAt,
      summaryDuration: summary?.summaryDuration,
      textSummary: summary?.textSummary,
      transcription: summary?.transcription,
      summaryVideoPath: summary?.summaryVideoPath,
    };
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Server error fetching video status' });
  }
}