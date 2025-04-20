// API endpoint for video summaries
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

  // Extract video ID from query params
  const videoId = req.query.id;
  
  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  try {
    const client = getDbClient();
    
    // Get video summary
    const summaryResult = await client.query(
      'SELECT * FROM video_summaries WHERE videoId = $1',
      [videoId]
    );
    
    if (summaryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Summary not found' });
    }
    
    const summary = summaryResult.rows[0];
    
    // Get video information
    const videoResult = await client.query(
      'SELECT * FROM videos WHERE id = $1',
      [videoId]
    );
    
    if (videoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    const video = videoResult.rows[0];
    
    // Combine data for response
    const response = {
      id: summary.id,
      videoId: video.id,
      originalName: video.originalName,
      originalDuration: video.originalDuration,
      summaryDuration: summary.summaryDuration,
      textSummary: summary.textSummary,
      transcription: summary.transcription,
      summaryVideoPath: summary.summaryVideoPath,
      createdAt: summary.createdAt
    };
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Server error fetching video summary' });
  }
}