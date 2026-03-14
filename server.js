  const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Browser pe check karne ke liye
app.get('/', (req, res) => {
  res.send('<h1>Backend is Live and Running Successfully! 🎉</h1>');
});

app.post('/api/download', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    // Open-Source Keyless Router (Bypasses YouTube/Insta Blockers)
    const response = await axios.post('https://api.cobalt.tools/api/json', {
        url: url
    }, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Origin': 'https://cobalt.tools',
            'Referer': 'https://cobalt.tools/'
        }
    });

    const data = response.data;

    if (data.status === 'error') {
        return res.status(500).json({ error: 'Video blocked by platform. Try another link!' });
    }

    let videoUrl = data.url;
    let thumbnail = 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/javascript/javascript.png'; // Default photo

    // Agar Insta mein ek se zyada video (carousel) hain
    if (data.status === 'picker') {
        videoUrl = data.picker[0].url;
        thumbnail = data.picker[0].thumb || thumbnail;
    }

    // Success Response bhej rahe hain
    res.json({
        success: true,
        platform: 'auto',
        title: 'Your Video is Ready! 🚀',
        thumbnail: thumbnail,
        formats:[
            { quality: 'HD MP4', url: videoUrl, format: 'mp4' }
        ]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server load ho raha hai. Please 30 sec baad phir se dabayein!' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
