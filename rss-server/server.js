const express = require('express');
const RSS = require('rss');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Load posts from JSON file
async function loadPosts() {
  try {
    const postsPath = path.join(__dirname, 'content', 'posts.json');
    const data = await fs.readFile(postsPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading posts:', error);
    return [];
  }
}

// RSS feed endpoint
app.get('/feed.xml', async (req, res) => {
  try {
    const posts = await loadPosts();
    
    // Get the IP/hostname without port, then point to port 8080 for the web server
    const hostname = req.get('host').split(':')[0]; // Remove any port
    const baseUrl = `${req.protocol}://socialmediaclarity.net`;
    
    const feed = new RSS({
      title: 'The Social Media Clarity Podcast',
      description: '15 minutes of concentrated analysis and advice about social media in platform and product design.',
      feed_url: `${req.protocol}://${req.get('host')}/feed.xml`,
      site_url: baseUrl,
      language: 'en',
      pubDate: new Date(),
      ttl: 60,
      // Podcast-specific iTunes tags
      custom_namespaces: {
        'itunes': 'http://www.itunes.com/dtds/podcast-1.0.dtd'
      },
      custom_elements: [
        {'itunes:author': 'Randy Farmer, Scott Moore, Marc Smith'},
        {'itunes:summary': '15 minutes of concentrated analysis and advice about social media in platform and product design.'},
        {'itunes:category': {_attr: {text: 'Technology'}}},
        {'itunes:image': {_attr: {href: `${baseUrl}/icon.jpg`}}},
        {'itunes:explicit': 'false'},
        {'itunes:owner': [
          {'itunes:name': 'Randy Farmer'},
          {'itunes:email': 'randy.farmer@pobox.com'}
        ]}
      ]
    });

    // Add each post to the feed
    posts.forEach(post => {
      const audioUrl = `${baseUrl}${post.audio_url}`;
      
      feed.item({
        title: post.title,
        description: post.description,
        url: `${baseUrl}${post.url}`,
        author: post.author,
        date: new Date(post.pubDate),
        categories: post.categories || [],
        enclosure: {
          url: audioUrl,
          type: 'audio/mpeg',
          size: post.file_size
        },
        custom_elements: [
          {'itunes:duration': post.duration},
          {'itunes:explicit': 'false'},
          {'itunes:subtitle': post.description.substring(0, 100) + '...'}
        ]
      });
    });

    res.set('Content-Type', 'application/rss+xml');
    res.send(feed.xml());
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    res.status(500).send('Error generating RSS feed');
  }
});

// API endpoint to get posts as JSON
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await loadPosts();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Error loading posts' });
  }
});

// Individual post endpoint
app.get('/api/posts/:id', async (req, res) => {
  try {
    const posts = await loadPosts();
    const post = posts.find(p => p.id === parseInt(req.params.id));
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Error loading post' });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`RSS server running on port ${PORT}`);
});
