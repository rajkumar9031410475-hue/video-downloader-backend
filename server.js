const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Browser pe check karne ke liye ki update hua ya nahi
app.get('/', (req, res) => {
  res.send('<h1>✅ Server 100% Fixed! API Block Bypass Active!</h1>');
});

// JSON mein se video link dhoondhne ka Jadoo (Auto-Logic)
function findVideoUrl(obj) {
    let bestUrl = null;
    function search(o) {
        if (typeof o === 'string' && o.startsWith('http')) {
            if (!o.includes('.jpg') && !o.includes('.png') && !o.includes('.webp') && !o.includes('profile_pic')) {
                bestUrl = o; 
                return true;
            }
        }
        if (typeof o === 'object' && o !== null) {
            if (o.hd && typeof o.hd === 'string' && o.hd.startsWith('http') && !o.hd.includes('.jpg')) { bestUrl = o.hd; return true; }
            if (o.url && typeof o.url === 'string' && o.url.startsWith('http') && !o.url.includes('.jpg')) { bestUrl = o.url; return true; }
            for (let k in o) {
                if (search(o[k])) return true;
            }
        }
        return false;
    }
    search(obj);
    return bestUrl;
}

app.post('/api/download', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    let finalVideoUrl = null;

    const isYT = url.includes('youtu');
    const isIG = url.includes('instagram');
    const isFB = url.includes('facebook') || url.includes('fb.watch');

    // 🚀 METHOD 1: PRIMARY BYPASS API
    try {
        let apiUrl = '';
        if (isYT) apiUrl = `https://api.ryzendesu.vip/api/downloader/ytmp4?url=${encodeURIComponent(url)}`;
        else if (isIG) apiUrl = `https://api.ryzendesu.vip/api/downloader/igdl?url=${encodeURIComponent(url)}`;
        else if (isFB) apiUrl = `https://api.ryzendesu.vip/api/downloader/fbdl?url=${encodeURIComponent(url)}`;
        
        if(apiUrl) {
            const { data } = await axios.get(apiUrl);
            finalVideoUrl = findVideoUrl(data);
        }
    } catch (e) { console.log('Method 1 Fail'); }

    // 🚀 METHOD 2: SECONDARY BYPASS API (Backup)
    if (!finalVideoUrl) {
        try {
            let apiUrl = '';
            if (isYT) apiUrl = `https://bk9.fun/download/ytmp4?url=${encodeURIComponent(url)}`;
            else if (isIG) apiUrl = `https://bk9.fun/download/ig?url=${encodeURIComponent(url)}`;
            else if (isFB) apiUrl = `https://bk9.fun/download/fb?url=${encodeURIComponent(url)}`;
            
            if(apiUrl) {
                const { data } = await axios.get(apiUrl);
                finalVideoUrl = findVideoUrl(data);
            }
        } catch (e) { console.log('Method 2 Fail'); }
    }

    // 🚀 METHOD 3: COBALT PUBLIC INSTANCE (Final Backup)
    if (!finalVideoUrl) {
        try {
            const cobaltRes = await axios.post('https://cobalt-api.kwiatekmateusz.pl/', { url: url }, {
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
            });
            finalVideoUrl = findVideoUrl(cobaltRes.data);
        } catch (e) { console.log('Method 3 Fail'); }
    }

    // FINAL OUTPUT
    if (finalVideoUrl) {
        return res.json({
            success: true,
            title: '✅ Video is Ready!',
            thumbnail: 'https://cdn-icons-png.flaticon.com/512/2985/2985678.png',
            formats: [{ quality: 'Download HD Video', url: finalVideoUrl, format: 'mp4' }]
        });
    } else {
        throw new Error("Link Private hai ya saare bypass server block ho gaye. Dusra link try karein.");
    }

  } catch (error) {
    res.status(500).json({ error: 'System Error: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
