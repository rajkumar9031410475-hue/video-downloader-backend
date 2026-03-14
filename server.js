const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to detect platform
function detectPlatform(url) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  } else if (url.includes('instagram.com')) {
    return 'instagram';
  } else if (url.includes('facebook.com') || url.includes('fb.watch')) {
    return 'facebook';
  }
  return null;
}

// Instagram video extractor
async function extractInstagram(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // Find video URL in meta tags
    let videoUrl = $('meta[property="og:video"]').attr('content') || 
                   $('meta[property="og:video:secure_url"]').attr('content') ||
                   $('video source').attr('src');
    
    // Find thumbnail
    const thumbnail = $('meta[property="og:image"]').attr('content');
    
    // Find title
    const title = $('meta[property="og:title"]').attr('content') || 'Instagram Video';
    
    if (!videoUrl) {
      throw new Error('Video URL not found');
    }
    
    return {
      success: true,
      title: title,
      thumbnail: thumbnail,
      formats: [
        {
          quality: 'HD',
          url: videoUrl,
          format: 'mp4'
        }
      ]
    };
  } catch (error) {
    console.error('Instagram extraction error:', error);
    return {
      success: false,
      error: 'Failed to extract Instagram video'
    };
  }
}

// Facebook video extractor
async function extractFacebook(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // Find video URL
    let videoUrl = $('meta[property="og:video"]').attr('content') ||
                   $('meta[property="og:video:secure_url"]').attr('content') ||
                   $('meta[name="twitter:player:stream"]').attr('content');
    
    // Find thumbnail
    const thumbnail = $('meta[property="og:image"]').attr('content');
    
    // Find title
    const title = $('meta[property="og:title"]').attr('content') || 'Facebook Video';
    
    if (!videoUrl) {
      throw new Error('Video URL not found');
    }
    
    return {
      success: true,
      title: title,
      thumbnail: thumbnail,
      formats: [
        {
          quality: 'SD',
          url: videoUrl,
          format: 'mp4'
        }
      ]
    };
  } catch (error) {
    console.error('Facebook extraction error:', error);
    return {
      success: false,
      error: 'Failed to extract Facebook video'
    };
  }
}

// YouTube video extractor
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
      thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
      formats: videoFormats.slice(0, 3) // Limit to 3 formats
    };
  } catch (error) {
    console.error('YouTube extraction error:', error);
    return {
      success: false,
      error: 'Failed to extract YouTube video'
    };
  }
}

// Main download endpoint
app.post('/api/download', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    const platform = detectPlatform(url);
    
    if (!platform) {
      return res.status(400).json({ error: 'Unsupported platform. Please use YouTube, Instagram, or Facebook URLs' });
    }
    
    let result;
    
    switch (platform) {
      case 'youtube':
        result = await extractYouTube(url);
        break;
      case 'instagram':
        result = await extractInstagram(url);
        break;
      case 'facebook':
        result = await extractFacebook(url);
        break;
    }
    
    if (result.success) {
      res.json({
        success: true,
        platform: platform,
        title: result.title,
        thumbnail: result.thumbnail,
        formats: result.formats
      });
    } else {
      res.status(500).json({ error: result.error });
    }
    
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
