const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Browser pe check karne ke liye (Naya Message)
app.get('/', (req, res) => {
  res.send('<h1>✅ Final Master Server is Live! Ab Koi Error Nahi Aayegi!</h1>');
});

app.post('/api/download', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    let finalVideoUrl = null;
    let title = '✅ Video is Ready!';
    
    // Top 4 Premium Bypass Servers (100% Free)
    const instances =[
        { api: 'https://api.cobalt.tools/api/json', domain: 'https://cobalt.tools' },
        { api: 'https://cobalt-api.kwiatekmateusz.pl/api/json', domain: 'https://cobalt.kwiatekmateusz.pl' },
        { api: 'https://api.cobalt.my.id/api/json', domain: 'https://cobalt.my.id' },
        { api: 'https://co.wukko.me/api/json', domain: 'https://co.wukko.me' }
    ];

    // Loop chalega - Agar ek fail toh dusra auto-try karega
    for (let inst of instances) {
        try {
            const response = await axios.post(inst.api, { url: url }, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Origin': inst.domain,
                    'Referer': inst.domain + '/',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000 // 10 second wait karega ek server par
            });

            const data = response.data;
            if (data && data.url) {
                finalVideoUrl = data.url;
                break; // Link mil gaya, loop band karo!
            } else if (data && data.picker && data.picker.length > 0) {
                finalVideoUrl = data.picker[0].url; // Instagram multiple videos ke liye
                break;
            }
        } catch (err) {
            console.log(`Failed at: ${inst.api}`);
            continue; // Fail hua toh agle par jao (Crash nahi hoga)
        }
    }

    // Ek aur Final Backup API (Agar upar ke 4 fail ho jayein)
    if (!finalVideoUrl) {
        try {
            const backup = await axios.get(`https://api.vkrdownloader.vercel.app/server?vkr=${encodeURIComponent(url)}`);
            if (backup.data && backup.data.data && backup.data.data.downloads && backup.data.data.downloads.length > 0) {
                finalVideoUrl = backup.data.data.downloads[0].url;
                title = backup.data.data.title || title;
            }
        } catch (e) {
            console.log('Backup API also failed');
        }
    }

    // FINAL OUTPUT TO APP
    if (finalVideoUrl) {
        return res.json({
            success: true,
            title: title,
            thumbnail: 'https://cdn-icons-png.flaticon.com/512/2985/2985678.png',
            formats:[{ quality: 'Download HD Video', url: finalVideoUrl, format: 'mp4' }]
        });
    } else {
        return res.status(500).json({ error: 'Saare Servers Busy hain. Kripya 2 minute baad try karein!' });
    }

  } catch (error) {
    res.status(500).json({ error: 'System Error: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
