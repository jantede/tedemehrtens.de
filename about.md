---
layout: page
title: About
permalink: /about/
---

{% assign today = site.time | date: '%s' %}
{% assign start = '27-11-1997' | date: '%s' %}
{% assign secondsSince = today | minus: start %}
{% assign hoursSince = secondsSince | divided_by: 60 | divided_by: 60 %}
{% assign daysSince = hoursSince | divided_by: 24 %}
{% assign yearsSince = daysSince | divided_by: 365 %}

I'm Tede, {{yearsSince}} years old and from a small town near Bremen in northern Germany.
I've been fascinated by technology from an early age — taking things apart, trying to understand how they work.
I started building websites at 13 and quickly got into programming, which I continue to enjoy to this day.

I completed a dual study programme in Communications & Media Informatics at Deutsche Telekom in November 2020.
After graduating, I worked on a firewall automation project at Telekom — a good combination of network engineering and programming.

Since March 2023 I've been working at [Veeam](https://www.veeam.com) as a Systems Engineer,
and since April 2025 as Senior Systems Engineer.

---

This website has been running in various forms since 2014.
It's built with [Jekyll](https://jekyllrb.com) and hosted on Cloudflare Workers.
The source is on [GitHub](https://github.com/jantede/tedemehrtens.de).
