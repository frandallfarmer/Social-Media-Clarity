const express = require('express');
const compression = require('compression');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = 3000;

app.use(compression());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Load posts data for homepage
async function loadPosts() {
  try {
    const postsPath = path.join(__dirname, '..', 'rss-server', 'content', 'posts.json');
    const data = await fs.readFile(postsPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading posts:', error);
    return [];
  }
}

// Homepage with episode listing
app.get('/', async (req, res) => {
  try {
    const posts = await loadPosts();
    
    const episodeList = posts.map(post => 
      `<div style="margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h3><a href="/post/${post.id}" style="color: #007cba; text-decoration: none;">${post.title}</a></h3>
        <p style="color: #666; margin: 10px 0;"><strong>Episode ${post.id}</strong> | ${post.duration} | ${post.author}</p>
        <p>${post.description}</p>
        <div style="margin-top: 15px;">
          <a href="/post/${post.id}" style="background: #007cba; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; margin-right: 10px;">Read Show Notes</a>
          <a href="${post.audio_url}" style="background: #28a745; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px;">🎧 Listen</a>
        </div>
      </div>`
    ).join('');
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Social Media Clarity Podcast</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #eee;
            padding-bottom: 30px;
            margin-bottom: 40px;
        }
        .subtitle {
            color: #666;
            font-size: 1.2em;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>The Social Media Clarity Podcast</h1>
        <p class="subtitle">15 minutes of concentrated analysis and advice about social media in platform and product design</p>
        <p><a href="/feed.xml" style="background: #ff6600; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">📡 Subscribe to RSS Feed</a></p>
    </div>
    
    <div class="episodes">
        ${episodeList}
    </div>
    
    <footer style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
        <p><em>Hosted by Randy Farmer, Scott Moore, and Marc Smith</em></p>
    </footer>
</body>
</html>`;
    
    res.send(html);
  } catch (error) {
    res.status(500).send('Error loading episodes');
  }
});

// Individual episode pages
app.get('/post/:id', async (req, res) => {
  const episodeId = req.params.id;
  const episodePath = path.join(__dirname, 'public', 'episodes', `${episodeId}.html`);
  
  try {
    const html = await fs.readFile(episodePath, 'utf8');
    res.send(html);
  } catch (error) {
    // If scraped content doesn't exist, serve a basic page
    try {
      const posts = await loadPosts();
      const episode = posts.find(p => p.id === parseInt(episodeId));
      
      if (!episode) {
        return res.status(404).send('<h1>Episode not found</h1>');
      }
      
      const basicHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${episode.title} - Social Media Clarity Podcast</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
    <a href="/">← Back to All Episodes</a>
    <h1>${episode.title}</h1>
    <p><strong>Episode ${episode.id}</strong> | ${episode.duration} | ${episode.author}</p>
    <audio controls style="width: 100%; margin: 20px 0;">
        <source src="${episode.audio_url}" type="audio/mpeg">
    </audio>
    <p>${episode.description}</p>
    <p><em>${episode.content}</em></p>
</body>
</html>`;
      
      res.send(basicHtml);
    } catch (err) {
      res.status(404).send('<h1>Episode not found</h1>');
    }
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Web server running on port ${PORT}`);
});
