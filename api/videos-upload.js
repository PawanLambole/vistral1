// API endpoint for video uploads
import { IncomingForm } from 'formidable';
import { createClient } from '@neondatabase/serverless';

// Configure database client
const getDbClient = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return createClient(connectionString);
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse form data
    const form = new IncomingForm({
      keepExtensions: true,
      maxFileSize: 100 * 1024 * 1024, // 100MB limit
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Form parsing error:', err);
        return res.status(500).json({ error: 'Error uploading file' });
      }

      // Get file info
      const videoFile = files.video[0];
      
      if (!videoFile) {
        return res.status(400).json({ error: 'No video file uploaded' });
      }

      // In a real implementation, you would:
      // 1. Save the file to cloud storage
      // 2. Insert a record in the database
      // 3. Start processing the video

      // For Vercel demo, we'll just create a DB record
      try {
        const client = getDbClient();
        
        // Insert video record
        const result = await client.query(
          'INSERT INTO videos (originalName, filePath, status) VALUES ($1, $2, $3) RETURNING id',
          [videoFile.originalFilename, 'uploads/' + videoFile.originalFilename, 'uploaded']
        );
        
        const videoId = result.rows[0].id;
        
        return res.status(200).json({ 
          success: true, 
          videoId,
          message: 'Video uploaded successfully' 
        });
      } catch (dbError) {
        console.error('Database error:', dbError);
        return res.status(500).json({ error: 'Database error' });
      }
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Server error processing upload' });
  }
}