 const express = require('express');
const cors = require('cors');
const youtubedl = require('yt-dlp-exec');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Browser pe test karne ke liye
app.get('/', (req, res) => {
  res.send('<h1>Backend is Live & using Professional yt-dlp! 🎉</h1>');
});

app.post('/api/download', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    // yt-dlp ka native use jo sab kuch akele nikalta hai (No external APIs)
    const output = await youtubedl(url, {
      dumpJson: true,
      noWarnings: true,
      noCallHome: true,
      format: 'best[ext=mp4]/best' // Direct combined audio+video link
    });

    const videoUrl = output.url;
    
    if (!videoUrl) {
      throw new Error('Direct link not found. Platform blocked the server.');
    }

    res.json({
        success: true,
        title: output.title || 'Downloaded Video',
        thumbnail: output.thumbnail || '',
        formats:[
            { quality: 'Best Quality', url: videoUrl, format: 'mp4' }
        ]
    });

  } catch (error) {
    // Agar platform fir bhi block kare, toh screen par asli kaaran dikhega
    const errorMsg = error.message ? error.message.split('\n')[0] : 'Unknown Error';
    res.status(500).json({ error: 'System Error: ' + errorMsg.substring(0, 100) });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});       
