'use strict';
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { v4: uuidv4 } = require('uuid');
const fetch   = require('node-fetch');
const low     = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const { downloadMedia, extractThumbnail, extractionEnabled } = require('./mediaExtractor');
const importQueue = require('./importQueue');

// On Vercel the filesystem is read-only except /tmp
const dbPath = process.env.VERCEL
  ? '/tmp/db.json'
  : path.join(__dirname, 'db.json');

const adapter = new FileSync(dbPath);
const db = low(adapter);
db.defaults({ bookmarks: [] }).write();

const app = express();
app.use(cors());
app.use(express.json());

// Serve downloaded media files
app.use('/media', express.static(path.join(__dirname, 'media')));

// ── Helpers ────────────────────────────────────────────────────────────────

function extractTweetId(url) {
  return url.match(/status\/(\d+)/)?.[1] ?? null;
}

function extractTweetText(html) {
  const match = html.match(/<p[^>]*>([\s\S]*?)<\/p>/);
  if (!match) return '';
  return match[1]
    .replace(/<a[^>]*>.*?<\/a>/gs, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

// ── Routes ─────────────────────────────────────────────────────────────────

// GET /api/bookmarks?tags=tag1,tag2
app.get('/api/bookmarks', (req, res) => {
  const { tags } = req.query;
  let bookmarks = db.get('bookmarks').value();
  if (tags) {
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    bookmarks = bookmarks.filter(b => tagList.every(tag => b.tags.includes(tag)));
  }
  res.json(bookmarks);
});

// GET /api/bookmarks/:id
app.get('/api/bookmarks/:id', (req, res) => {
  const bookmark = db.get('bookmarks').find({ id: req.params.id }).value();
  if (!bookmark) return res.status(404).json({ error: 'Not found' });
  res.json(bookmark);
});

// POST /api/bookmarks  { url, tags?, notes? }
app.post('/api/bookmarks', async (req, res) => {
  const { url, tags = [], notes = '' } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });

  const tweetId = extractTweetId(url);
  if (!tweetId) return res.status(400).json({ error: 'URL must be a tweet (must contain /status/)' });

  const existing = db.get('bookmarks').find({ url }).value();
  if (existing) return res.status(409).json({ error: 'Bookmark already exists', bookmark: existing });

  try {
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`;
    const oembedRes = await fetch(oembedUrl);
    if (!oembedRes.ok) return res.status(502).json({ error: `Twitter oEmbed returned ${oembedRes.status}` });

    const oembed = await oembedRes.json();
    const authorHandle = oembed.author_url ? oembed.author_url.split('/').pop() : '';

    // Download media synchronously — latency is acceptable for a single item
    let type = 'unavailable';
    let localPath = null;
    let thumbnailPath = null;

    const media = await downloadMedia(url, tweetId);
    if (media) {
      type = media.type;
      localPath = media.localPath;
      thumbnailPath = await extractThumbnail(localPath, tweetId);
    }

    const bookmark = {
      id: uuidv4(),
      url,
      tweet_id: tweetId,
      author_name: oembed.author_name || '',
      author_handle: authorHandle,
      tweet_text: extractTweetText(oembed.html || ''),
      html: oembed.html || '',
      thumbnail_url: null,           // legacy field kept for compatibility
      type,
      localPath,
      thumbnailPath,
      originalUrl: null,             // CDN URL reference (not fetched currently)
      thumbnailOriginalUrl: null,
      tags: Array.isArray(tags) ? tags : [],
      notes: notes || '',
      created_at: new Date().toISOString(),
    };

    db.get('bookmarks').push(bookmark).write();
    res.status(201).json(bookmark);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/bookmarks/:id  { tags?, notes? }
app.patch('/api/bookmarks/:id', (req, res) => {
  const { id } = req.params;
  const bookmark = db.get('bookmarks').find({ id });
  if (!bookmark.value()) return res.status(404).json({ error: 'Not found' });

  const { tags, notes } = req.body;
  const updates = {};
  if (tags  !== undefined) updates.tags  = tags;
  if (notes !== undefined) updates.notes = notes;

  bookmark.assign(updates).write();
  res.json(bookmark.value());
});

// DELETE /api/bookmarks/:id
app.delete('/api/bookmarks/:id', (req, res) => {
  const { id } = req.params;
  if (!db.get('bookmarks').find({ id }).value()) return res.status(404).json({ error: 'Not found' });
  db.get('bookmarks').remove({ id }).write();
  res.status(204).end();
});

// POST /api/import  { bookmarks: [...] }
app.post('/api/import', (req, res) => {
  const { bookmarks: incoming } = req.body;
  if (!Array.isArray(incoming)) return res.status(400).json({ error: 'Expected { bookmarks: [...] }' });

  const existingUrls = new Set(db.get('bookmarks').map('url').value());

  const newOnes = incoming
    .filter(b => b.url && !existingUrls.has(b.url))
    .map(b => ({
      id: b.id || uuidv4(),
      url: b.url,
      tweet_id: b.tweet_id || extractTweetId(b.url) || null,
      author_name: b.author_name || '',
      author_handle: b.author_handle || '',
      tweet_text: b.tweet_text || '',
      html: b.html || '',
      thumbnail_url: b.thumbnail_url || null,
      // All incoming bookmarks are queued for download unless extraction is off
      type: extractionEnabled ? 'pending' : 'unavailable',
      localPath: b.localPath || null,
      thumbnailPath: b.thumbnailPath || null,
      originalUrl: b.originalUrl || null,
      thumbnailOriginalUrl: b.thumbnailOriginalUrl || b.thumbnail_url || null,
      tags: Array.isArray(b.tags) ? b.tags : [],
      notes: b.notes || '',
      created_at: b.created_at || new Date().toISOString(),
    }));

  if (newOnes.length > 0) {
    db.get('bookmarks').push(...newOnes).write();
  }

  const toQueue = extractionEnabled
    ? newOnes.filter(b => b.tweet_id && b.type === 'pending')
    : [];

  if (toQueue.length > 0) {
    importQueue.enqueue(toQueue, db);
  }

  res.json({ imported: newOnes.length, queued: toQueue.length, skipped: incoming.length - newOnes.length });
});

// GET /api/import/status
app.get('/api/import/status', (req, res) => {
  res.json(importQueue.getStatus());
});

// GET /api/tags
app.get('/api/tags', (req, res) => {
  const bookmarks = db.get('bookmarks').value();
  const tags = [...new Set(bookmarks.flatMap(b => b.tags))].sort();
  res.json(tags);
});

// ── Start ──────────────────────────────────────────────────────────────────

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`UI Animation Curator server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
