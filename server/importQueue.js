'use strict';
const path = require('path');
const fs = require('fs');
const { downloadMedia, extractThumbnail } = require('./mediaExtractor');

const STATUS_FILE = path.join(__dirname, 'importStatus.json');

let status = { total: 0, completed: 0, failed: 0, inProgress: false };
const queue = [];
let processing = false;
let _db = null;

function saveStatus() {
  try { fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2)); } catch {}
}

function getStatus() {
  return { ...status };
}

/**
 * Add items to the download queue.
 * Items already in the queue or currently processing are not deduplicated here;
 * mediaExtractor skips files already on disk.
 */
function enqueue(items, db) {
  _db = db;
  status = { total: items.length, completed: 0, failed: 0, inProgress: true };
  queue.push(...items);
  saveStatus();
  if (!processing) processNext();
}

async function processNext() {
  if (queue.length === 0) {
    processing = false;
    status.inProgress = false;
    saveStatus();
    return;
  }

  processing = true;
  const item = queue.shift();

  try {
    const result = await downloadMedia(item.url, item.tweet_id);
    if (result) {
      const thumbnailPath = await extractThumbnail(result.localPath, item.tweet_id);
      _db.get('bookmarks')
        .find({ id: item.id })
        .assign({ type: result.type, localPath: result.localPath, thumbnailPath })
        .write();
      status.completed++;
    } else {
      _db.get('bookmarks').find({ id: item.id }).assign({ type: 'unavailable' }).write();
      status.failed++;
    }
  } catch (err) {
    console.warn('[importQueue] unexpected error for', item.tweet_id, err.message);
    try { _db.get('bookmarks').find({ id: item.id }).assign({ type: 'unavailable' }).write(); } catch {}
    status.failed++;
  }

  saveStatus();
  // Yield to the event loop between downloads so status polls are served
  setImmediate(processNext);
}

module.exports = { enqueue, getStatus };
