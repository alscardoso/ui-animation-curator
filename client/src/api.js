const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export function fetchBookmarks(tag = null) {
  const qs = tag ? `?tags=${encodeURIComponent(tag)}` : '';
  return request(`/bookmarks${qs}`);
}

export function fetchTags() {
  return request('/tags');
}

export function createBookmark(url, tags = [], notes = '') {
  return request('/bookmarks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, tags, notes }),
  });
}

export function updateBookmark(id, data) {
  return request(`/bookmarks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function deleteBookmark(id) {
  return request(`/bookmarks/${id}`, { method: 'DELETE' });
}

export function importBookmarks(bookmarks) {
  return request('/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookmarks }),
  });
}

export function fetchBookmarkById(id) {
  return request(`/bookmarks/${id}`);
}

export function fetchImportStatus() {
  return request('/import/status');
}
