# CLAUDE.md — tedemehrtens.de

Personal portfolio + blog of Tede Mehrtens. Jekyll static site, deployed on Cloudflare Workers.

## Dev setup

```bash
bundle exec jekyll serve   # local preview at localhost:4000
bundle install             # after Gemfile changes
```

The `.claude/launch.json` is configured so `preview_start` works directly.

## Deployment

- **Git push → master**: Cloudflare Git integration auto-builds and deploys
- **Scheduled builds** (every 8h): `.github/workflows/scheduled-build.yml` — needed for future-dated posts to go live on time; runs `bundle exec jekyll build` + `npx wrangler deploy`
- Build output: `_site/` (never committed)
- `wrangler.toml`: Cloudflare Workers Static Assets config

### Cloudflare build command (dashboard)
```
apt-get install -y webp && bundle exec jekyll build
```
The `webp` package is needed for `jekyll-webp` to generate WebP images.

## Key files

| File | Purpose |
|---|---|
| `assets/css/portfolio.css` | All styles — single file, no preprocessor |
| `assets/js/portfolio.js` | Theme toggle, mouse spotlight, hero constellation, mobile nav |
| `_includes/header.html` | `<head>` with inline theme script (prevents flash), font loading |
| `_includes/navbar.html` | Nav + theme toggle button (3 SVG icons: monitor/sun/moon) |
| `_includes/footer.html` | Footer with glassmorphism matching navbar |
| `_layouts/post.html` | Blog post layout: tags, read time, related posts |
| `_layouts/tag.html` | Tag page layout |
| `_plugins/tag_generator.rb` | Generates `/tags/<name>/` pages for each tag |
| `_headers` | Cloudflare cache + security headers |
| `wrangler.toml` | Cloudflare Workers config |
| `404.html` | Interactive constellation animation |
| `_templates/post.md` | Template for new blog posts |

## Architecture decisions

### Theme system (3-state)
- States: `auto` (system default, no localStorage) → `light` → `dark`
- `data-theme-mode` on `<html>` tracks the mode; `data-theme` tracks the resolved colour
- Inline script in `header.html` applies theme before first paint to prevent flash
- CSS icon visibility is driven by `data-theme-mode`, not `data-theme`

### Tag pages
- Custom Ruby plugin (`_plugins/tag_generator.rb`) generates `/tags/<name>/index.html` for each tag
- Tags in posts use front matter: `tags: [foo, bar]`
- **Never nest `<a>` inside `<a>`** — browsers eject inner anchors from the DOM. Post cards use `<div>` with only the title as a link.

### Images
- `jekyll-webp` automatically generates `.webp` versions of all JPEG/PNG in `assets/img/` during build
- CSS uses `image-set()` with WebP primary + JPEG fallback for background images
- For new images: just drop JPEG into `assets/img/`, WebP is created on next build
- Hero image preload: set `preload_image: /assets/img/your-image.webp` in page front matter

### Performance
- Google Fonts: async via `media="print"` swap trick (non-render-blocking)
- Cache: CSS/JS `max-age=31536000, immutable` (cache-busted via `?v={{ site.time | date: '%s' }}`), images 1 year
- Compression: Cloudflare handles Brotli/gzip automatically — **do not set `Vary: Accept-Encoding` manually** in `_headers`, it disables Cloudflare's automatic compression

### Hero animation
- Canvas constellation, desktop only (hidden + JS bails at ≤639px)
- Nodes constrained to right ~60% of canvas (dark gradient area, not over the face)
- Auto-orbits (Lissajous) until first mousemove

### Posts
- New post: copy `_templates/post.md`, name as `YYYY-MM-DD-title.md`, place in `_posts/`
- Future-dated posts are built by the scheduled workflow
- `posts/index.html` must stay in `posts/` (not `_posts/`) — Jekyll ignores non-date files in `_posts/`

## CSS conventions
- CSS variables in `:root` and `[data-theme="dark"]`
- Mobile breakpoint: 640px (`max-width: 639px`)
- Nav height: `var(--nav-height)` (60px)
- Glassmorphism: `background: var(--nav-bg)` + `backdrop-filter: blur(16px)` — used on navbar and footer
- Accent colour: `var(--accent)` — `#0969da` light / `#58a6ff` dark

## Git workflow
- SSH key: `GIT_SSH_COMMAND="ssh -i ~/.ssh/id_ed25519 -o IdentitiesOnly=yes"`
- Work happens in feature branches (worktrees), PR to master
