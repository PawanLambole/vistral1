// API endpoint for updating video status
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
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract video ID from query params
  const videoId = req.query.id;
  
  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  try {
    // Get status from request body
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Validate status
    const validStatuses = ['uploaded', 'processing', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status', 
        message: `Status must be one of: ${validStatuses.join(', ')}` 
      });
    }

    const client = getDbClient();
    
    // Update video status
    await client.query(
      'UPDATE videos SET status = $1 WHERE id = $2',
      [status, videoId]
    );
    
    return res.status(200).json({ 
      success: true,
      message: 'Video status updated successfully' 
    });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Server error updating video status' });
  }
}