// API endpoint for creating video summaries
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract video ID from query params
  const videoId = req.query.id;
  
  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  try {
    const client = getDbClient();
    
    // Check if video exists
    const videoResult = await client.query(
      'SELECT * FROM videos WHERE id = $1',
      [videoId]
    );
    
    if (videoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    // Get request body data
    const { 
      transcription, 
      summaryVideoPath,
      summaryDuration,
      textSummary 
    } = req.body;
    
    // Validate required fields
    if (!transcription || !summaryVideoPath || !summaryDuration) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'transcription, summaryVideoPath, and summaryDuration are required'
      });
    }
    
    // Check if summary already exists for this video
    const existingSummary = await client.query(
      'SELECT * FROM video_summaries WHERE video_id = $1',
      [videoId]
    );
    
    if (existingSummary.rows.length > 0) {
      // Update existing summary
      await client.query(
        `UPDATE video_summaries 
         SET transcription = $1, summary_video_path = $2, summary_duration = $3, text_summary = $4, updated_at = NOW()
         WHERE video_id = $5`,
        [transcription, summaryVideoPath, summaryDuration, textSummary || null, videoId]
      );
      
      return res.status(200).json({
        success: true,
        message: 'Video summary updated successfully'
      });
    } else {
      // Create new summary
      const result = await client.query(
        `INSERT INTO video_summaries (video_id, transcription, summary_video_path, summary_duration, text_summary) 
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [videoId, transcription, summaryVideoPath, summaryDuration, textSummary || null]
      );
      
      // Update video status to completed
      await client.query(
        'UPDATE videos SET status = $1, updated_at = NOW() WHERE id = $2',
        ['completed', videoId]
      );
      
      return res.status(201).json({
        success: true,
        summaryId: result.rows[0].id,
        message: 'Video summary created successfully'
      });
    }
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Server error creating video summary' });
  }
}