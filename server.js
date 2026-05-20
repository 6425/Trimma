import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the Vite build directory
app.use(express.static(path.join(__dirname, 'dist')));

// API Routes can be added here in the future
// app.get('/api/health', (req, res) => res.json({ status: 'Trimma OS is running' }));

// For any other request, send the React app index.html
// This is critical for React Router (client-side routing) to work
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`🚀 Trimma OS Node.js Production Server`);
  console.log(`========================================`);
  console.log(`Running on port: ${PORT}`);
  console.log(`Access at: http://localhost:${PORT}`);
});
