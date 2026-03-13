# UI Animation Curator

A personal bookmark app for UI animation references from X/Twitter. Saves tweet metadata locally and downloads the actual video/GIF so your collection works offline.

## Setup

```bash
npm install
npm run dev
```

- Client: http://localhost:5173
- API:    http://localhost:3001

## System dependencies (media extraction)

The app downloads videos and GIFs using **yt-dlp** and **ffmpeg**. These are system tools, not npm packages. Without them the app still runs — bookmarks are saved but media will be marked "unavailable".

### Install on macOS

```bash
brew install yt-dlp ffmpeg
```

### Install with pip (cross-platform)

```bash
pip install yt-dlp
# ffmpeg: https://ffmpeg.org/download.html
```

The server logs a warning at startup if either tool is missing.

## Media storage

Downloaded files live in `server/media/` and are gitignored. They are served locally at `/media/` and never uploaded anywhere.

- `server/media/{tweetId}.mp4` — video file
- `server/media/{tweetId}_thumb.jpg` — thumbnail frame at 0.5s

## Data model

```json
{
  "id": "uuid",
  "url": "https://x.com/user/status/123",
  "tweet_id": "123",
  "author_name": "Display Name",
  "author_handle": "handle",
  "tweet_text": "plain text",
  "html": "oEmbed HTML",
  "type": "video | gif | pending | unavailable",
  "localPath": "/media/123.mp4",
  "thumbnailPath": "/media/123_thumb.jpg",
  "originalUrl": null,
  "thumbnailOriginalUrl": null,
  "tags": ["css", "spring"],
  "notes": "personal notes",
  "created_at": "ISO-8601"
}
```

`type` values:
- **`video`** / **`gif`** — media downloaded and available locally
- **`pending`** — queued for download (set during bulk import)
- **`unavailable`** — download failed or yt-dlp/ffmpeg not installed

## API

| Method | Path | Description |
|---|---|---|
| GET | `/api/bookmarks` | List all bookmarks (optional `?tags=t1,t2`) |
| GET | `/api/bookmarks/:id` | Get a single bookmark |
| POST | `/api/bookmarks` | Add bookmark (downloads media synchronously) |
| PATCH | `/api/bookmarks/:id` | Update tags / notes |
| DELETE | `/api/bookmarks/:id` | Delete bookmark |
| POST | `/api/import` | Bulk import JSON; returns `{ imported, queued, skipped }` |
| GET | `/api/import/status` | Background download progress |
| GET | `/api/tags` | List all unique tags |
| GET | `/media/:file` | Serve a downloaded media file |
