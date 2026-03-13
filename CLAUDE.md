# UI Animation Curator — Figma Integration Guide for Claude

## Project Overview

A personal bookmark curator for UI animation references (tweets/X posts). Full-stack: React + Vite frontend, Express + lowdb backend, deployed on Vercel.

---

## 1. Design Tokens

### Color System

The project uses **Tailwind CSS defaults** with no custom theme extensions — all tokens map directly to Tailwind's zinc scale for the dark theme.

| Role | Token |
|---|---|
| Page background | `bg-zinc-950` |
| Card / surface | `bg-zinc-900` |
| Elevated surface | `bg-zinc-800` |
| Border (default) | `border-zinc-800` |
| Border (hover) | `border-zinc-700` |
| Border (active) | `border-zinc-600` |
| Text primary | `text-zinc-100` |
| Text secondary | `text-zinc-500` |
| Text muted | `text-zinc-600` |
| Text dimmed | `text-zinc-700` |

**Tag accent palette** — deterministic color assignment via hash of tag name:
```js
const TAG_PALETTES = [
  'bg-blue-950 text-blue-400',
  'bg-violet-950 text-violet-400',
  'bg-emerald-950 text-emerald-400',
  'bg-amber-950 text-amber-400',
  'bg-rose-950 text-rose-400',
  'bg-teal-950 text-teal-400',
  'bg-indigo-950 text-indigo-400',
  'bg-orange-950 text-orange-400',
];
```

### Typography

No custom font — system default from Tailwind base styles.

| Use | Classes |
|---|---|
| Section label | `text-xs font-medium text-zinc-500 uppercase tracking-wider` |
| Author name | `text-xs font-medium text-zinc-200` |
| Body / tweet text | `text-xs text-zinc-500` |
| Truncated body | `text-xs text-zinc-500 line-clamp-2` |
| Button | `text-xs font-medium` |
| Modal heading | `text-sm font-semibold` |

### Spacing

Standard Tailwind scale. Key usages:
- **Header bar**: `px-6 py-4`
- **Tag filter bar**: `px-6 py-2.5`
- **Main content**: `px-6 py-6`
- **Cards**: `p-3`
- **Modals**: `p-5`
- **Component gaps**: `gap-2`, `gap-3`

### Elevation / Shadow

- Card hover: `shadow-lg shadow-black/40`
- Modal: `shadow-2xl`
- Detail panel: inline style `boxShadow: '-8px 0 40px rgba(0,0,0,0.6)'`

### Border Radius

| Shape | Class |
|---|---|
| Cards | `rounded-xl` |
| Buttons / inputs | `rounded-md` |
| Tag pills | `rounded-full` |

### Transitions

```
transition-colors
transition-opacity duration-200
transition-all duration-150
```
Global iframe transition defined in `index.css`:
```css
iframe { transition: opacity 0.2s ease; }
```

---

## 2. Component Library

### Component Tree

```
App.jsx                          ← root state, layout shell
├── TagFilterBar.jsx             ← horizontal scrollable filter pills
├── BookmarkGrid.jsx             ← responsive grid wrapper
│   └── BookmarkCard.jsx         ← card with hover iframe embed
├── DetailPanel.jsx              ← slide-in right panel (edit tags/notes)
├── ImportModal.jsx              ← drag-and-drop JSON import
└── AddBookmarkModal.jsx         ← form to add a new tweet bookmark
```

All components are **functional React components** using hooks (useState, useEffect, useRef, useCallback). No class components, no context, no global state manager — state lives in `App.jsx` and is passed via props/callbacks.

### Reusable Inline Icon Components

Defined at the top of the files that use them (not in a shared file):

```jsx
// X/Twitter icon — used in BookmarkCard.jsx and DetailPanel.jsx
function XIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17..." />
    </svg>
  );
}

// Close icon — used in DetailPanel.jsx, ImportModal.jsx, AddBookmarkModal.jsx
function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
```

**Icon conventions:**
- `fill="currentColor"` or `stroke="currentColor"` — inherits from parent text color
- Sized via a `size` prop or hardcoded to 16px
- viewBox always `0 0 24 24`
- No external icon library

### Modal Pattern

All modals share the same structural pattern:
```jsx
<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
  <div className="bg-zinc-900 rounded-xl w-full max-w-md shadow-2xl">
    {/* header with close button */}
    {/* scrollable body */}
    {/* footer with action buttons */}
  </div>
</div>
```

### Selected / Active State Pattern

```jsx
// Cards
className={`border rounded-xl transition-all duration-150 cursor-pointer
  ${isSelected
    ? 'border-zinc-400 ring-1 ring-zinc-400/20'
    : 'border-zinc-800 hover:border-zinc-700 hover:shadow-lg shadow-black/40'
  }`}

// Filter pills
className={`rounded-full px-3 py-1 text-xs font-medium transition-colors
  ${active
    ? 'bg-zinc-100 text-zinc-900'
    : 'bg-zinc-900 text-zinc-500 hover:text-zinc-200 border border-zinc-800'
  }`}
```

### Button Variants

```jsx
// Primary action
className="px-4 py-2 bg-zinc-100 text-zinc-900 text-xs font-semibold rounded-md
           hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"

// Ghost / secondary
className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200
           border border-zinc-700 rounded-md hover:border-zinc-500 transition-colors"

// Destructive
className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
```

---

## 3. Frameworks & Libraries

| Layer | Technology |
|---|---|
| UI framework | React 18.3.1 |
| Build tool | Vite 5.3.1 |
| Styling | Tailwind CSS 3.4.4 |
| CSS processing | PostCSS 8.4.38 + Autoprefixer |
| File upload | react-dropzone 14.2.3 |
| Backend | Express 4.18.2 |
| Database | lowdb 1.0.0 (JSON flat file) |
| HTTP (server) | node-fetch 2.7.0 |
| IDs | uuid 9.0.0 |
| Dev runner | concurrently 8.2.2 |

**Module system:** Client uses ES Modules (`"type": "module"`). Server uses CommonJS (`require()`).

---

## 4. Asset Management

No bundled image/video assets. The design is entirely:

- **Tailwind utility classes** for color, spacing, layout
- **Inline SVG** for icons (no external files)
- **iframe embeds** for tweet content: `https://platform.twitter.com/embed/Tweet.html?id={tweetId}&theme=dark`
- **oEmbed API** for metadata: `https://publish.twitter.com/oembed?url={url}&omit_script=true`

When converting Figma designs, use Tailwind classes rather than importing image assets where possible. For any raster images, place them in `client/src/assets/` and import directly in JSX.

---

## 5. Icon System

- **No icon library** (no Lucide, Heroicons, etc.)
- All icons are **inline SVG functions** defined within the component file that uses them
- `viewBox="0 0 24 24"`, `fill="currentColor"` or `stroke="currentColor"`
- Size controlled via props or hardcoded

**When adding new icons from Figma:**
1. Define as a small function at the top of the component file
2. Use `fill="currentColor"` so they inherit text color
3. Accept a `size` prop if multiple sizes are needed
4. Do not create a shared icon file — keep icons co-located with their component

---

## 6. Styling Approach

### Method: Tailwind CSS utility classes only

No CSS Modules, no Styled Components, no BEM. All styling is done via Tailwind classes directly on JSX elements.

### Global styles (`client/src/index.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom utility: hides scrollbar while keeping scroll behavior */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* iframe fade-in for tweet embeds */
iframe {
  transition: opacity 0.2s ease;
}
```

Only add to `index.css` when Tailwind utilities are insufficient (e.g., vendor-prefixed properties, pseudo-element tricks).

### Responsive breakpoints

```jsx
// Example: BookmarkGrid responsive columns
className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
```

Uses standard Tailwind breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px).

### Inline styles

Used sparingly, only for values that can't be expressed in Tailwind:
```jsx
// Detail panel shadow (complex multi-value)
style={{ boxShadow: '-8px 0 40px rgba(0,0,0,0.6)' }}
```

---

## 7. Project Structure

```
ui-animation-curator/
├── vercel.json                  # Vercel: build command, output dir, rewrites
├── package.json                 # Root workspace (concurrently for dev)
├── package-lock.json
├── server/
│   ├── index.js                 # Express API (CommonJS); exports app for Vercel
│   ├── db.json                  # lowdb flat-file JSON store
│   └── package.json             # Server deps: express, lowdb@1, node-fetch@2, uuid, cors
└── client/
    ├── index.html               # Vite HTML entry point
    ├── vite.config.js           # Vite config; proxies /api → localhost:3001 in dev
    ├── tailwind.config.js       # Tailwind: scans src/**/*.{js,jsx}
    ├── postcss.config.js        # PostCSS + Autoprefixer
    ├── package.json             # Client deps: react, react-dom, react-dropzone
    ├── api/
    │   └── index.js             # Vercel serverless entry point (requires ../../server)
    └── src/
        ├── main.jsx             # React.createRoot mount
        ├── App.jsx              # Root: state (bookmarks, tags, activeTag, selectedBookmark)
        ├── api.js               # Fetch wrappers for all REST endpoints
        ├── index.css            # Tailwind directives + .scrollbar-hide + iframe transition
        └── components/
            ├── TagFilterBar.jsx
            ├── BookmarkGrid.jsx
            ├── BookmarkCard.jsx
            ├── DetailPanel.jsx
            ├── ImportModal.jsx
            └── AddBookmarkModal.jsx
```

### Data model (bookmark object)

```json
{
  "id": "uuid",
  "url": "https://x.com/user/status/123",
  "tweet_id": "123",
  "author_name": "Display Name",
  "author_handle": "handle",
  "tweet_text": "plain text extracted from oEmbed HTML",
  "html": "<blockquote>...oEmbed HTML...</blockquote>",
  "thumbnail_url": null,
  "tags": ["css", "spring"],
  "notes": "personal notes",
  "created_at": "ISO-8601 date"
}
```

### API endpoints (Express, proxied via `/api`)

| Method | Path | Description |
|---|---|---|
| GET | `/api/bookmarks?tags=t1,t2` | List bookmarks (optional tag filter) |
| POST | `/api/bookmarks` | Add bookmark (fetches oEmbed metadata) |
| PATCH | `/api/bookmarks/:id` | Update tags/notes |
| DELETE | `/api/bookmarks/:id` | Delete bookmark |
| POST | `/api/import` | Bulk import from JSON |
| GET | `/api/tags` | List all unique tags |

### Dev commands

```bash
npm run dev          # Both server + client (concurrently)
npm run dev:server   # Server only (node --watch, port 3001)
npm run dev:client   # Client only (vite, port 5173)
```

---

## 8. Figma-to-Code Guidelines

When translating Figma designs into this codebase:

1. **Use Tailwind classes** — map Figma color/spacing values to the zinc scale above. Never write custom CSS unless Tailwind can't express the value.
2. **Match the dark theme** — page background is `bg-zinc-950`, surfaces are `bg-zinc-900`/`bg-zinc-800`.
3. **Inline SVGs for icons** — extract icon paths from Figma and define them as small helper functions inside the component file that uses them.
4. **No new component files unless necessary** — prefer adding to an existing component or composing from existing patterns.
5. **Respect the modal pattern** — new overlay UIs should follow the `fixed inset-0 bg-black/60 z-50` backdrop pattern.
6. **Tailwind config has no custom theme** — don't add custom tokens to `tailwind.config.js`. Use existing scale values.
7. **No CSS modules or styled-components** — styling goes directly on JSX elements as Tailwind classes.
8. **Responsive by default** — use `sm:`, `lg:`, `xl:` breakpoints; the grid is the primary responsive surface.
