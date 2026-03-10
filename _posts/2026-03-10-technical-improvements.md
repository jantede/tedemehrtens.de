---
layout: post
title: "Under the Hood: What Changed Since the Relaunch"
date: 2026-03-10 18:00:00 +0100
description: "A look at all the technical improvements made to this site since the initial relaunch — compression fixes, WebP automation, CSS refactoring, linting, and proper CI/CD."
tags:
  - jekyll
  - cloudflare
  - meta
  - git
---

A few days ago I wrote about [how this site is built](/2026/03/05/how-this-site-is-built.html). What I didn't mention there is that I hadn't seriously touched frontend or web stuff in years. The relaunch was very much a case of jumping back in and figuring things out as I went.

Turns out launching a site is the easy part — the week after is when you find all the things you got subtly wrong. Some of it was rust, some of it was just that the web moved on while I wasn't looking. Either way, a lot of small fixes and improvements piled up quickly.

Here's what changed on the technical side.

## The Header That Killed Compression

First up: a classic "I was trying to be clever and it backfired" situation. One of the benefits of not having touched this stuff in a while is that you confidently do things that turn out to be completely wrong.

I had manually set `Vary: Accept-Encoding` in `_headers`. Sounds reasonable — it's a standard header that tells caches that the response varies based on what encoding the client accepts. Except Cloudflare Workers Static Assets interprets that header to mean the origin is handling compression itself, and therefore skips its own automatic Brotli/gzip compression entirely.

So I was unknowingly serving every response uncompressed. Removing that header — along with a stray `Cache-Control: max-age=0` on `/*` that was also confusing the edge cache — restored everything. Cloudflare adds `Vary: Accept-Encoding` itself when it compresses. You don't need to help it.

## Automatic WebP Conversion

Adding new images used to require a manual `cwebp` conversion step before committing. Not a big deal, but it's the kind of friction that makes you procrastinate on adding images.

I added [`jekyll-webp`](https://github.com/sverrirs/jekyll-webp) to the Gemfile. It runs during `jekyll build`, scans `assets/img/`, and generates `.webp` versions of every JPEG and PNG automatically. Quality 82, skips files that already exist so rebuilds stay fast. Now the workflow is: drop a JPEG in, commit, done.

The only catch is that the `webp` system package needs to be installed on the build runner. For Cloudflare's Git integration, the build command is:

```
apt-get install -y webp && bundle exec jekyll build
```

And the GitHub Actions scheduled build workflow got the same treatment.

## Theme Picker

The original theme toggle was a single button cycling through Auto → Light → Dark. Functional, but you had no way to tell which state you were currently in without clicking through it.

Replaced it with a small dropdown showing all three options — **Auto**, **Light**, **Dark** — with the current one highlighted. It uses the same glassmorphism styling as the navbar and footer. Closes on outside click or Escape.

The logic underneath didn't change at all. `localStorage` stores the preference, an inline script in `<head>` applies it before first paint to avoid any flash of unstyled content. One small follow-up fix: the dropdown wasn't syncing its active state correctly on initial page load when a preference was already saved. One line of JavaScript to set it on `DOMContentLoaded` sorted that.

## SEO: Open Graph and All That

The site launched without Open Graph tags, which meant every shared link showed up as a blank preview. Not great.

Added the full set of `<meta>` tags to `_includes/header.html`: Open Graph (`og:title`, `og:description`, `og:image`, `og:type`), Twitter Card (`twitter:card`, `summary_large_image`), a canonical URL, and an explicit `robots` meta tag. Posts get `og:type: article`, everything else gets `website`.

While I was in there, I also noticed the `lang` attribute on `<html>` was hardcoded to `en` — not ideal for a site that's mostly German. It now reads from the page or site config. And a favicon was missing entirely. That one I can only chalk up to "it's been a while" — the kind of basic thing you forget is even a thing until someone points it out.

For the legal pages (`/impressum/` and `/datenschutz/`), there's now a `noindex: true` front matter flag that sets `noindex, nofollow` in the robots meta. No need for those to show up in search results.

## CSS: From One File to Nineteen

The stylesheet was a single `portfolio.css` with 1129 lines. That's fine until you need to find something in it.

I migrated everything to SCSS, splitting it into 19 focused partials in `_sass/` — one per component or section. Jekyll's built-in `jekyll-sass-converter` compiles it with Dart Sass, so there's no extra build tooling involved.

The main win is `_mixins.scss`, which captures five patterns that were copy-pasted throughout the original file:

- `glassmorphism` — navbar, theme dropdown, footer
- `uppercase-label` — skill category names, related post headings
- `card-hover` — post cards and related cards
- `page-top-padding` — pages that need to clear the fixed navbar
- `page-heading` — consistent `h1` styling across page types

SCSS nesting also removes a lot of repeated parent selectors. The output CSS is semantically identical to what was there before — purely a maintainability improvement.

## GDPR-Friendly YouTube Embeds

Embedding a YouTube video with a plain `<iframe>` loads tracking scripts the moment the page opens, before the visitor has consented to anything. That's a problem.

The solution is a click-to-load pattern: show a thumbnail and a play button, load the actual iframe only when clicked. I built this as a dedicated `post-youtube` layout and a reusable `{% raw %}{% include youtube-embed.html %}{% endraw %}` partial. Posts with YouTube videos just set `layout: post-youtube` and `youtube_url` in their front matter — no inline HTML needed in the Markdown.

The Datenschutz page was updated to describe this behaviour accordingly.

## Linting

Before this, there was nothing checking code quality automatically. I added three linters running in GitHub Actions on every push:

- **ESLint** for the JavaScript in `assets/js/`
- **htmlhint** for the Liquid/HTML templates — configured to ignore rules that conflict with Liquid syntax, since partials like `_includes/header.html` are fragments, not complete HTML documents
- **markdownlint** for `_posts/` — with line length, inline HTML, and first-heading rules disabled, since blog posts legitimately need those

There's also a second CI job that does a full `jekyll build` and then runs a stricter htmlhint pass on the generated `_site/` output. This catches things like missing `alt` attributes that only surface in the rendered HTML, not in the templates.

## Cloudflare Deploy Workflow and PR Reviews

The Cloudflare Git integration already handles production deploys automatically, but I wanted more control. Added a GitHub Actions `cloudflare.yml` workflow that:

- On push to `master`: deploys to production via `npx wrangler deploy`
- On pull requests: deploys a preview Worker and posts the URL as a PR comment, updating the same comment in place on subsequent pushes instead of creating new ones

PR reviews are now handled by [CodeRabbit](https://coderabbit.ai/), which posts automated review comments on every PR. No API key needed — just install the GitHub App.

## Source Link in the Footer

Every page's footer now has a direct link to its source file on GitHub. It uses Jekyll's `page.path` variable to build the URL, so for this post it points directly to the `.md` file in the repo.

Small thing, but I like it. If something reads wrong, it's one click to see the raw Markdown or suggest a fix.

---

Most of these changes are invisible when they work — correct compression, proper cache headers, meta tags in `<head>`. But they're the kind of thing that quietly matters for how the site behaves once it's out in the world. Getting back into web development after a long break means rediscovering a bunch of these things the hard way, which is honestly a fine way to relearn them. And having linting and a proper deploy workflow in place now makes it a lot less scary to keep iterating.

Source is at [github.com/jantede/tedemehrtens.de](https://github.com/jantede/tedemehrtens.de), as always.
