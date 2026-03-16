'use strict';
const { exec, execSync } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const execAsync = promisify(exec);
const MEDIA_DIR = path.join(__dirname, 'media');

try {
  if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });
} catch {}

// ── Dependency checks ──────────────────────────────────────────────────────

function cmdExists(cmd) {
  try { execSync(`which ${cmd}`, { stdio: 'ignore' }); return true; }
  catch { return false; }
}

const hasYtDlp  = cmdExists('yt-dlp');
const hasFfmpeg = cmdExists('ffmpeg');
let extractionEnabled = true;

if (!hasYtDlp) {
  console.warn('[media] yt-dlp not found — media extraction disabled.');
  console.warn('[media] Install: pip install yt-dlp   or   brew install yt-dlp');
  extractionEnabled = false;
}
if (!hasFfmpeg) {
  console.warn('[media] ffmpeg not found — thumbnail extraction disabled.');
  console.warn('[media] Install: brew install ffmpeg');
}

// ── downloadMedia ──────────────────────────────────────────────────────────

const EXTENSIONS = ['mp4', 'webm', 'gif'];

/**
 * Download the video/GIF for a tweet.
 * Returns { localPath: '/media/{id}.{ext}', type: 'video'|'gif' } or null.
 * Never throws.
 */
async function downloadMedia(tweetUrl, tweetId) {
  if (!extractionEnabled) return null;

  // Skip re-download if file already exists on disk
  for (const ext of EXTENSIONS) {
    const existing = path.join(MEDIA_DIR, `${tweetId}.${ext}`);
    if (fs.existsSync(existing)) {
      return { localPath: `/media/${tweetId}.${ext}`, type: ext === 'gif' ? 'gif' : 'video' };
    }
  }

  const outputTemplate = path.join(MEDIA_DIR, `${tweetId}.%(ext)s`);

  try {
    await execAsync(
      `yt-dlp -f "mp4/best" --no-playlist -o "${outputTemplate}" "${tweetUrl}"`,
      { timeout: 120_000 }
    );
  } catch (err) {
    console.warn(`[media] yt-dlp failed for tweet ${tweetId}:`, (err.stderr || err.message).toString().trim());
    return null;
  }

  for (const ext of EXTENSIONS) {
    const downloaded = path.join(MEDIA_DIR, `${tweetId}.${ext}`);
    if (fs.existsSync(downloaded)) {
      return { localPath: `/media/${tweetId}.${ext}`, type: ext === 'gif' ? 'gif' : 'video' };
    }
  }

  console.warn(`[media] yt-dlp ran but produced no file for tweet ${tweetId}`);
  return null;
}

// ── extractThumbnail ───────────────────────────────────────────────────────

/**
 * Grab a frame at 0.5s from a downloaded video.
 * Returns '/media/{id}_thumb.jpg' or null.
 * Never throws.
 */
async function extractThumbnail(localPath, tweetId) {
  if (!hasFfmpeg) return null;

  const thumbPath = path.join(MEDIA_DIR, `${tweetId}_thumb.jpg`);
  if (fs.existsSync(thumbPath)) return `/media/${tweetId}_thumb.jpg`;

  const videoFile = path.join(MEDIA_DIR, path.basename(localPath));
  if (!fs.existsSync(videoFile)) return null;

  try {
    await execAsync(
      `ffmpeg -i "${videoFile}" -ss 0.5 -vframes 1 -y "${thumbPath}"`,
      { timeout: 30_000 }
    );
  } catch (err) {
    console.warn(`[media] ffmpeg failed for tweet ${tweetId}:`, (err.stderr || err.message).toString().trim());
    return null;
  }

  return fs.existsSync(thumbPath) ? `/media/${tweetId}_thumb.jpg` : null;
}

module.exports = { downloadMedia, extractThumbnail, extractionEnabled, MEDIA_DIR };
