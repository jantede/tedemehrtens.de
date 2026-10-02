---
layout: post
title: "retention.fyi: Why Your Veeam Backups Need That Much Storage"
date: 2026-10-02 00:00:00 +02:00
description: A backup-storage visualizer for Veeam environments. What it assumes, how it calculates and how close it gets to the Veeam Calculator.
tags:
  - veeam
  - backup
  - storage
---

"How much storage do we need?" I hear that question all the time. The honest answer is "it
depends", and the follow-up is always the interesting part: what does one more year cost? What
happens if we go to object storage? Why did the repository suddenly fill up after that Active Full?

The [Veeam Calculator](https://calculator.veeam.com/) gives you the number. It doesn't show you
*why*. So I usually ended up drawing backup chains on a whiteboard. Again. And again.

[retention.fyi](https://retention.fyi) is what came out of not wanting to do that anymore. It
started as "let me just build this for myself", and it escalated a little.

> A personal side project, not an official Veeam tool. Binding numbers come from the Veeam
> Calculator. Backup belongs in expert hands, because in doubt the business depends on it. And
> no, ChatGPT & Co. aren't experts.

## How it started

The first version was a calculator: a few input fields, a number at the end. Correct-ish and
completely useless for explaining anything. Exactly the thing I already had.

The turning point was the timeline, a day-by-day simulation of the chain. Suddenly you could
*see* when points are created, merged and deleted, why the used space breathes with the week, and
why an unplanned Active Full stays with you for as long as the GFS points built on top of it.

From there it turned into a guided story in five steps: your data, your backup window, retention
and target, the timeline and a result you can take away as a PDF. Plain language, and every value
can be changed at any point to see what it does.

![The start page of retention.fyi](/assets/img/retention-fyi/retention-fyi-intro.png)
*The start page. The tool itself is in German, the numbers speak for themselves.*

Full disclosure, since I just told you AI isn't an expert: I built it with an AI coding assistant.
The model decisions, the review and the audit of every formula were mine. That's pretty much the
point of the disclaimer above.

## Not a second Calculator

Before the details, one thing to get straight: retention.fyi isn't a competitor to the Veeam
Calculator, and it doesn't want to be one. They do different jobs.

The Calculator answers **"what do we need?"**. It's official, maintained alongside the product,
sizes the whole environment around the storage and covers far more workloads and options. It's
what designs and quotes are based on.

retention.fyi answers **"why, and what if?"**. It only looks at storage for VM backups, explains
what drives the number and lets you play through changes live. It's for building an understanding,
not a bill of materials.

In practice you want both, in that order: understand first, then size properly. When the two
disagree, the Calculator wins. The deviations further down are explained, not a claim to be more
right.

## How it calculates

### Your data, and how sure you are about it

Four inputs: source size, daily change rate, Veeam's data reduction (compression and dedupe in the
job) and yearly growth. Defaults are 2 % change per day, 50 % reduction and 8 % growth.

![Step 1: data inputs, each marked as estimated](/assets/img/retention-fyi/retention-fyi-data.png)
*Step 1: four values about your data, each one marked as estimated until you replace it with a measured value.*

Most people only really know the source size. So every input is marked as **estimated** or
**measured**, with hints on where to get the real value (RVTools, job statistics, Veeam ONE). As
long as something is estimated, the result is a **range** instead of a single, overly precise
number. For change rate and growth the band comes from typical values (1 to 5 % per day, 0 to 25 %
per year).

Getting that range right was more fun than expected. Each estimated parameter runs across its band,
then all of them sit at the edge that pushes in the same direction. "Everything at its low end"
sounds right, but a *higher* reduction means *less* storage, so the naive version makes the range
too narrow.

### A restore point costs what changed since its neighbour

With Fast Clone or object storage, a restore point only stores the blocks that changed since the
previous one. The further apart two points are, the more has changed, but not linearly: the same
blocks tend to change over and over. A monthly point doesn't cost 30 days of increments.

So each point costs the daily change rate times a factor that grows in steps with the gap to its
neighbour, capped at one full. At 2 % daily change, a weekly point costs about 6 % of a full, a
monthly about 10 %, a yearly about 36 %.

The steps are values from practical experience. They hold up well for typical environments, but in
the extremes, with very high change rates or data that rewrites itself completely, reality can of
course look different.

My first model looked different: a fixed "hot" share of the data that changes again and again,
plus a cold rest that changes once. Elegant on paper, but it drifted off for long retention
periods. The stepped approach is simpler and holds up better.

Without block cloning, every full and every GFS point costs a full. That's usually the biggest
single lever on the page.

![Step 3: retention sliders and space per storage type](/assets/img/retention-fyi/retention-fyi-retention.png)
*Step 3: retention and target. Same data, same retention: 225 TB on a classic repository, 47 TB with Fast Clone.*

### Sized for the last day, not the first

For capacity, every point is valued at the full size at the end of the planning horizon, growth
included, and an increment is that full times the change rate. That's deliberately pessimistic:
old points were smaller when they were written, but you're buying storage for the last day.

The timeline is different. It simulates every day with the actual sizes of that day, so you see the
curve and its peak, not just the end.

### The real calendar

The retention plan follows the actual calendar. GFS points land on real Sundays, months and years,
and if a weekly and a monthly role fall on the same Sunday, it's **one** backup, just like in
Backup & Replication.

How many extra increments hang on the chain also depends on the weekday you look at. The plan stays
calendar-true, and capacity is planned for the least favourable day.

Immutability is always included: the lock period equals the daily retention. Leaving it out would
flatter the numbers.

### Reserve: sized by what actually happens

A repository that's exactly as big as the backups on it is full. The question is how much on top
is realistic, and a flat percentage alone doesn't answer that well. So the reserve looks at the
operations that actually eat space and takes whichever is bigger:

```
reserve = max(1.1 × Active Full, 10 % of used space)
```

**Measured in Active Fulls.** The most common reason a repository suddenly runs full is an
unplanned Active Full: a broken chain, a new job, someone clicking the wrong button. Until the old
chain ages out, both live side by side. So the reserve always has room for at least one full, plus
10 % headroom. With short retention, where the chain is small compared to a single full, this is
the part that decides.

![Timeline with an unplanned Active Full](/assets/img/retention-fyi/retention-fyi-active-full.png)
*An unplanned Active Full in year three: +12 TB at once, and most of it stays until the old GFS points age out. The reserve catches it.*

**Measured as a share.** With long GFS retention, the chain can be many times the size of one full.
One spare full is then too little buffer for growth that runs faster than planned or a retention
that gets extended "just for this one audit". Here the share takes over, never below 10 %.

The result shows which of the two drives the reserve, and both values are adjustable. The point
isn't a safety margin pulled out of thin air, but one you can explain to the people who have to
operate the thing. It applies to every target, object storage included.

### Dedupe appliances

The chain without Veeam's reduction (you turn compression off in front of an appliance), divided by
the dedupe factor. That factor has to be **measured** under the same conditions. If someone quotes
20:1 from a datasheet, you're now in a conversation with a professional, not with a website.
Appliances that combine their own dedupe with Fast Clone aren't modelled.

There's no overall winner between the targets, by the way. Object storage, Hardened Repositories
and dedupe appliances each have their place, and space is rarely the only criterion.

### Working backwards from capacity

"We have 200 TB, how long can we keep things?" The tool tries the retention combinations and keeps
what fits. Two details matter: if two options cost the same space and one keeps strictly more, the
other one is dropped. And it checks against the **peak** over the whole period, not just the end.
My first version didn't, and happily recommended retentions that overflowed in month 14.

## How close is it to the Veeam Calculator?

![The result step with recommendation, breakdown and deviations](/assets/img/retention-fyi/retention-fyi-result.png)
*The result: recommendation, breakdown per retention type, range while values are estimated, and why other numbers may look different.*


I checked the model against 18 Calculator scenarios. Common to all of them: 1 TB source data,
50 % reduction, 14 dailies and a five-year horizon. "Used" is the space the backups occupy,
"total" includes the reserve.

| Scenario | Used | Total |
|---|---:|---:|
| Dailies only, 14 days | 0 % | +1.6 % |
| 8 weeklies | 0 % | +1.8 % |
| 4 W · 3 M · 1 Y, Fast Clone, 10 %/year growth | −8.5 % | +3.5 % |
| same without growth | −8.5 % | −5.4 % |
| same without block cloning | −11.3 % | −5.8 % |
| same on object storage | −7.5 % | +25.4 % |
| 4 W · 12 M · 3 Y, Fast Clone, 1 to 10 %/day change | −4.4 to −2.7 % | −3.2 to −0.3 % |
| 4 W · 12 M · 3 Y, without block cloning | −5.3 % | −1.3 % |
| 1 to 10 monthlies and 1 yearly | −11.1 to −6.1 % | −8.3 to −3.9 % |
| 5 yearlies | −1.9 % | −0.2 % |

What that means:

- **Without GFS, the used space matches exactly.** The chain itself comes out the same.
- **With GFS, we're 0 to 11 % lower.** The Calculator keeps GFS roles idealized and separate, we
  merge what falls on the same day. That's a deliberate choice, because it's what the product
  actually does.
- **With reserve, usually within −8 to +4 %.** The Calculator plans a fixed workspace, we plan the
  reserve described above. That partly evens out the GFS difference.
- **Object storage is the outlier at around +25 %.** We plan a reserve there, the Calculator
  doesn't.

These cases sit in the site's footer, and a test recomputes them on every build. If a change to
the model moves any of them, the build fails. That's the part I'm happiest with: "feels about
right" turned into a deviation I can name.

## Try it

[retention.fyi](https://retention.fyi). Free, no login, everything runs in your browser. If you
already know what you're doing, skip the story and go straight to the timeline.

And if you size backup environments for a living: there's a mode for you too. Fewer explanations,
proper terminology, your own storage recommendation and a ± per estimated value. How to get there?
Let's just say it's hidden in plain sight.

Feedback is welcome, the critical kind most of all.
