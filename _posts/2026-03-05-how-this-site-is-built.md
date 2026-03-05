---
layout: post
title: How this Website is Built
date: 2026-03-05T16:00:00
description: A short rundown about how this website is built and operated completely free of cost and headache
tags:
  - jekyll
  - cloudflare
  - meta
  - git
---
This site has been running on Jekyll since 2019 — back then hosted on GitHub Pages. [Recently I gave it a proper redesign](/2026/03/04/new-website.html) and migrated hosting to Cloudflare Workers. The core philosophy hasn't changed: no server, no database, no nonsense. Here's how it works.

## The Stack

**Jekyll** as the static site generator, **GitHub** for version control, **Obsidian** for writing, and **Cloudflare Workers** for hosting. No database, no CMS, no moving parts.
![690](/assets/img/posts/architecture.svg)

## The WordPress Problem

Most people who want a blog or portfolio end up on WordPress. It's the default answer, the path of least resistance. I don't blame you.

And sure, it works — until it doesn't.

What's important to me is that I can leave this page for prolonged periods of time to itself without having to take care of it **at all**. Also, I like simple workflows and things loading super fast.

WordPress means a database that can go cause problems. It means PHP vulnerabilities, plugin updates that break your theme, hosting costs, and an admin panel you have to log into just to write a sentence. I've seen others spend more time maintaining their WordPress setup than actually writing. One friend got his site hacked through an outdated plugin he forgot about.

I get it, WordPress is powerful and flexible. But for a personal site where you just want to write and show your work, it's a lot of infrastructure for very little value.

There's a better way.

## Why Jekyll

Jekyll takes Markdown files and spits out a static HTML site. That's it. No PHP, no Node runtime, no database that can get corrupted or hacked. The whole site is just files.

It's been around since 2008 and it shows — in a good way. The tooling is mature, the community has solved every problem you can think of, and it gets out of your way. You write Markdown, Jekyll builds HTML, done.

The alternative would have been something like Hugo or Eleventy, but Jekyll's simplicity won me over. And since I'm already familiar with Ruby from other projects, the ecosystem felt natural.

## Writing with Obsidian

Obsidian is a nice Markdown (and therefore text) editor which I use primarily for taking notes. It also comes in handy in maintaining this web page. Obsidian consists of a vault (which is just a directory you can point it to). Within this vault you can define several options: Where to put new text files (i.e. blog posts) and also where to put the images that I drag & drop into the Markdown files.

My Obsidian vault is pointed directly at the Jekyll repo. This means I get all of Obsidian's quality-of-life features — live preview, templates, backlinks — while writing posts that Jekyll can build natively.

New drafts land in `_drafts/` automatically via a template, with frontmatter pre-filled:

```yaml
---
title: 
date: 2026-03-05
tags: []
layout: post
---
```

I can edit in Obsidian and then locally create a copy of my website using `bundle exec jekyll serve --draft` to preview how it'd look in the real world.

When a post is ready to publish, `bundle exec jekyll publish` moves it to `_posts/` with the correct date prefix and that's it. One command, then commit and `git push`.

## GitHub as the Source of Truth

Every change goes through Git. This gives me a full history of every post, every edit, every tweak to the layout. If I break something, I can roll back. If I want to write on a different machine, I just clone the repo.

For bigger changes I work in a feature branch and open a PR against `main`. Nothing fancy, but it keeps things clean. Also this comes in handy with the next part of the stack.

## From GitHub Pages to Cloudflare Workers

The site ran on GitHub Pages from 2019 until early 2026 and it was fine — until it wasn't. GitHub Pages has a strict plugin whitelist, limited build flexibility, and the CDN coverage is decent but not great.

Cloudflare builds the site on every push to `main` and deploys it to their global edge network — roughly 300 points of presence worldwide. Someone visiting from Tokyo gets the site served from Tokyo. Someone in Frankfurt gets it from Frankfurt.

For a personal portfolio this is complete overkill. But also it's free and I like overdoing things. So hello, dear readers from Tokyo 👋 - hope the page loaded quickly.

The build pipeline is simple. Basically, we just need to specify an asset directory which contains the static page output to host. For jekyll, this is `_site` - fully configured it looks something like this, via `wrangler.toml`:

```toml
name = "tedemehrtens-de"
compatibility_date = "2026-03-05"
assets = { directory = "./_site" }
```

And the Cloudflare build settings:

```
Build command:  bundle exec jekyll build
Deploy command: npx wrangler deploy
```

Push to GitHub → Cloudflare picks it up → builds Jekyll → deploys globally. The whole thing takes about 30 seconds.

Compared to GitHub Pages, Cloudflare has no plugin restrictions, faster builds, better CDN coverage, and proper preview deployments for branches. It's not even close.

And what is also neat, remember the bigger changes that I put into separate branches? Cloudflare automatically deploys them to a magically generated subdomain and posts this link directly in the PR. So I can collect the changes, open the PR and get a link to preview it on production infrastructure almost instantaneously. And the best thing is, this is not on my local machine, so I can share it with friends and ask for their opinion.

## What I Like About This Setup

There's no admin panel to log into, no updates to apply, no server to monitor. The site is just files in a Git repo. Writing happens in a tool I already use for notes. Deployment is automatic.

The whole thing costs nothing and will keep working as long as Cloudflare exists and GitHub exists — which is a pretty safe bet.

If you're a developer or otherwise technically interested person running your blog on WordPress, I genuinely encourage you to look at this approach. The initial setup takes a few hours. After that you just write, push, and it's alive. No updates to apply, no server to babysit, no 3am "your site is down" emails.

Maybe this is just me being extravagant, but given the headaches Wordpress caused me (and I know this is true to some of you as well) - I clearly prefer running a Git repo. I know which one I'd rather maintain.