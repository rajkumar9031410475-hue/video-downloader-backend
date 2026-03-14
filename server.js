const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Yeh naya route banaya hai taaki browser mein check ho sake
app.get('/', (req, res) => {
  res.send('<h1>Backend is Live and Running Successfully! 🎉</h1>');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

function detectPlatform(url) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('facebook.com') || url.includes('fb.watch')) return 'facebook';
  return null;
}

async function extractInstagram(url) {
  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(response.data);
    let videoUrl = $('meta[property="og:video"]').attr('content') || $('meta[property="og:video:secure_url"]').attr('content');
    const title = $('meta[property="og:title"]').attr('content') || 'Instagram Video';
    const thumbnail = $('meta[property="og:image"]').attr('content');
    
    if (!videoUrl) throw new Error('Video URL not found');
    return { success: true, title, thumbnail, formats: [{ quality: 'HD', url: videoUrl, format: 'mp4' }] };
  } catch (error) {
    return { success: false, error: 'Failed to extract Instagram video' };
  }
}

async function extractFacebook(url) {
  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(response.data);
    let videoUrl = $('meta[property="og:video"]').attr('content') || $('meta[name="twitter:player:stream"]').attr('content');
    const title = $('meta[property="og:title"]').attr('content') || 'Facebook Video';
    const thumbnail = $('meta[property="og:image"]').attr('content');
    
    if (!videoUrl) throw new Error('Video URL not found');
    return { success: true, title, thumbnail, formats:[{ quality: 'SD', url: videoUrl, format: 'mp4' }] };
  } catch (error) {
    return { success: false, error: 'Failed to extract Facebook video' };
  }
}

async function extractYouTube(url) {
  try {
    const info = await ytdl.getInfo(url);
    const formats = ytdl.filterFormats(info.formats, 'videoandaudio');
    const videoFormats = formats.map(format => ({
      quality: format.qualityLabel || 'Unknown',
      url: format.url,
      format: format.container
    }));
    return {
      success: true,
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails[0].url,
      formats: videoFormats.slice(0, 3)
    };
  } catch (error) {
    return { success: false, error: 'Failed to extract YouTube video' };
  }
}

app.post('/api/download', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });
    
    const platform = detectPlatform(url);
    if (!platform) return res.status(400).json({ error: 'Unsupported platform' });
    
    let result;
    if (platform === 'youtube') result = await extractYouTube(url);
    else if (platform === 'instagram') result = await extractInstagram(url);
    else if (platform === 'facebook') result = await extractFacebook(url);
    
    if (result.success) {
      res.json({ success: true, platform, title: result.title, thumbnail: result.thumbnail, formats: result.formats });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
