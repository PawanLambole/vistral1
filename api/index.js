// Simple API endpoint for Vercel
export default function handler(req, res) {
  res.status(200).json({
    status: 'online',
    message: 'API is working correctly',
    timestamp: new Date().toISOString()
  });
}