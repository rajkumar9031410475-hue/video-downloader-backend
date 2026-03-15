const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// YAHAN SE HUM CHECK KARENGE KI SERVER UPDATE HUA YA NAHI
app.get('/', (req, res) => {
  res.send('<h1>✅ Server 100% Update Ho Gaya Hai! Aur API Mast Chal Rahi Hai!</h1>');
});

app.post('/api/download', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        // Tarika 1: Bypass YouTube/Insta Blockers 
        const cobaltRes = await axios.post('https://api.cobalt.tools/', { url: url }, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (cobaltRes.data && cobaltRes.data.url) {
            return res.json({
                success: true,
                title: '✅ Video Ready to Download!',
                thumbnail: 'https://cdn-icons-png.flaticon.com/512/2985/2985678.png',
                formats:[{ quality: 'Download HD Video', url: cobaltRes.data.url, format: 'mp4' }]
            });
        }
    } catch (err1) {
        // Tarika 2: Agar Pehla Block hua toh doosra Auto-Backup chalega
        let backupUrl = '';
        if (url.includes('youtu')) backupUrl = `https://api.siputzx.my.id/api/d/ytmp4?url=${url}`;
        else if (url.includes('instagram')) backupUrl = `https://api.siputzx.my.id/api/d/igdl?url=${url}`;
        else backupUrl = `https://api.siputzx.my.id/api/d/fbdl?url=${url}`;

        const backupRes = await axios.get(backupUrl);
        let finalUrl = '';
        
        if (backupRes.data && backupRes.data.data) {
            if (backupRes.data.data.dl) finalUrl = backupRes.data.data.dl;
            else if (backupRes.data.data[0] && backupRes.data.data[0].url) finalUrl = backupRes.data.data[0].url;
        }

        if (finalUrl) {
            return res.json({
                success: true,
                title: '✅ Video Ready to Download!',
                thumbnail: 'https://cdn-icons-png.flaticon.com/512/2985/2985678.png',
                formats:[{ quality: 'Download HD Video', url: finalUrl, format: 'mp4' }]
            });
        }
    }
    
    // Agar dono fail hue toh naya error aayega purana wala nahi
    throw new Error('Links Blocked by platform.');
    
  } catch (error) {
    res.status(500).json({ error: 'Naya Error: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
