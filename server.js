// Simple server.js file for Render deployment
const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files (if you've built your front-end)
app.use(express.static('dist'));

// API endpoint to show the server is working
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    message: 'Server is running correctly',
    timestamp: new Date().toISOString()
  });
});

// For all other routes, serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});