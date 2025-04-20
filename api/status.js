// API endpoint to check status
export default function handler(req, res) {
  res.status(200).json({
    status: 'online',
    message: 'Server is running correctly',
    timestamp: new Date().toISOString()
  });
}