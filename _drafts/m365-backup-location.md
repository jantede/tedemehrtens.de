---
layout: post
title: Where should you store M365 backup data?
date: 2026-03-13 16:00:00 +0100
description: M365 backup data has to live somewhere — but where? This post breaks down the tradeoffs between on-prem, hybrid, cloud IaaS, and BaaS, and helps you figure out which approach fits your organization.
tags: [m365, veeam, backup, cloud]
---

**TL;DR:** BaaS wins for most organizations — less ops overhead, predictable costs, immutability and 3-2-1 out of the box. Hybrid is viable if you already have S3-compatible storage on-prem. On-prem only makes sense with multi-site and with S3 storage. Cloud IaaS is rarely worth it. If you need real DR, MBS via BaaS is the only option that scales.

---
As a Presales Engineer at Veeam, M365 backup comes up in almost every customer conversation. And the question that follows is almost always the same: where should the backup data actually go?

Microsoft 365 is a SaaS suite in use by a lot of companies (almost 4 million!)[^1]. And it's a great tool, combining a lot of common use cases for a lot of organizations, taking the burden of them to host everything by themselves. Also, Microsoft is one of the biggest players in cyber security, so it's not only easing things for operation departments, but also enhances security while doing so. The tools M365 offers are quietly sneaking their way into the backbone of modern companies workflows, so data residing in there gets business critical just as quietly.

Business critical data needs backup and so, M365 is no exception. If you don't think so, you don't have to believe me. [Microsoft says so themselves](https://learn.microsoft.com/en-us/azure/security/fundamentals/shared-responsibility). Don't worry, I won't discuss the if but rather the how today.

## Backing up SaaS data is (not that) different to what you're used to

If you've been doing backups for a while, you know the drill: configure a job, point it at your data source, define a schedule, done. SaaS breaks that model. There's no server to point to and no filesystem to traverse. Everything goes through APIs — and that changes a few things.

One thing worth keeping in mind: **Microsoft Graph API and other M365 APIs come with rate limits**. Your backup solution is competing for the same API quota as your users and other integrations. This affects backup windows, restore speed, and overall throughput — regardless of where your backup data lives or how fast your storage is *(with the exception of Microsoft Backup Storage but we'll get to that)*.

The biggest misconception worth addressing upfront: **retention is not backup**. Microsoft keeps deleted items for a pre-configured period in the recycle bin, but that's a safety net, not a backup strategy. No versioning history beyond that window, no protection against ransomware encrypting your mailboxes, no restore to a specific point in time. That's on you.

The other shift is storage. Traditional backup workloads map well to block storage — sequential writes, fixed block sizes, predictable I/O patterns. M365 backup doesn't work like that. You're dealing with millions of small objects: emails, calendar entries, SharePoint files, Teams messages. Block storage becomes expensive and unwieldy at that scale. **Object storage — S3 or any S3-compatible target — is the natural fit here.** It scales horizontally, costs less per GB, and most backup solutions (including Veeam) are built around it for exactly this reason.

The good news: the principles you already know still apply. 3-2-1 is still 3-2-1.

## 3-2-1(-1-0) rule

If you're not familiar: 3 copies of your data, on 2 different media types, with 1 offsite. That's the classic 3-2-1 rule — simple, vendor-agnostic, and still solid advice.

The extended version we use at Veeam adds two more digits: 1 offline or air-gapped copy, and 0 errors verified through automated restore testing. Veeam builds around this as a framework, but **it makes sense regardless of what you're using**. The last digit — automated restore verification — is worth striving for, but for M365 backups it's not straightforward to implement, so we'll focus on the first four.

For M365, the offline copy deserves special attention: **immutability is non-negotiable**. Ransomware targeting backup data is *not* a theoretical scenario. If your backup storage can be written to, it can be encrypted. S3 Object Lock — or any equivalent immutability mechanism — should be a hard requirement, not an afterthought.

The rest maps cleanly to M365: your backup is copy 1, a second storage target is copies 2 and 3, and offsite is naturally covered if you're using cloud storage. The framework holds — you just have to apply it deliberately.

## So, where to store your backups then?

### All on-prem

On-prem backup sounds straightforward: your data, your hardware, your control. In practice it's often where good intentions meet poor execution.

The storage problem is covered above — block storage isn't the right fit for M365 backup data, and S3-compatible object storage on-prem fixes that. But it doesn't fix the bigger issues.

M365 is a cloud workload. Restoring data back into Exchange Online or SharePoint doesn't happen over a local network — it goes through your internet connection. At scale, that becomes a real bottleneck. And the classic fallback of restoring to a local Exchange server? Exchange Server 2016 and 2019 reached end of support on October 14, 2025[^2] — and while Exchange Server SE exists as a successor, the direction of travel is clear. Designing your restore strategy around an on-prem mail server is planning for the past.

There's also the 3-2-1 problem: an on-prem-only setup gives you copy 2 at best, in the same location. Without a multi-site setup, copy 3 is simply missing — and even then, the internet dependency on restore remains. A second on-premises location solves the offsite problem — but not the others. Restore still runs through your internet connection, and API rate limits don't care where your storage sits.

### Hybrid

A local backup copy for fast access, a cloud copy offsite — the 3-2-1 structure is built into the design by default.

One hard requirement: **S3-compatible object storage on-prem is not optional**. Veeam doesn't support backup copies from block storage to S3, so without an S3-compatible local target, hybrid simply doesn't work. This is worth factoring into your infrastructure planning before committing to this approach.

Cost-wise: don't assume hybrid is automatically cheaper. Cloud object storage can be more expensive than a well-utilized on-prem S3 target — the math depends heavily on your data volume and growth rate.

The real advantage of hybrid: your cloud storage is operated by someone else. If your on-prem environment is compromised, your backup copy is out of reach — different infrastructure, different access controls, different blast radius.

### Cloud-Only (IaaS)

Running your own backup infrastructure in the cloud — a self-hosted VB365 instance in Azure, for example — sounds like the best of both worlds. In practice, it's often the worst.

You're paying cloud prices for compute and storage, but you're still responsible for everything: provisioning, patching, monitoring, scaling. The operational overhead of on-prem, with the cost structure of cloud. Neither side of that trade is particularly attractive.

The one scenario where it makes sense: you already have a significant cloud footprint and the team to manage it, and you need full control over your backup environment for compliance or regulatory reasons. Outside of that, it's hard to justify over the alternatives.

Restore works well — everything stays in the cloud, no internet bottleneck for getting data back into M365. But that advantage alone doesn't outweigh the ops burden for most organizations.

### Backup as a service (BaaS)

BaaS is the natural endpoint of this progression: no infrastructure to manage, no storage to provision, no updates to chase. You define your policies, the service handles the rest.

The obvious concern is cost — and historically it's been valid. Most BaaS offerings charge per GB, which means your bill grows with every backup cycle. This is the one thing I personally like most about the Veeam offering: Storage is included as a flat-rate in the offer, so you don't have to worry about price increases.

The 3-2-1 structure is handled by the service. Immutability is built in. Separation of duty is inherent to the design.

The tradeoff is control. You're trusting a third party with your backup data — vendor lock-in and data residency requirements are worth verifying upfront. For most organizations, that's an acceptable trade. For some, it isn't. At Veeam, we solve this by offering to download all of your backups when required. Make sure the service you're using has an option like this, so your data won't be held hostage.

## But what about API limits?

As mentioned earlier, API rate limits are a platform-level constraint that affects every backup solution equally — no storage architecture changes that. Backup windows, restore speed, and throughput are all bound by what Microsoft allows through the API.

The exception is **Microsoft Backup Storage (MBS)**. MBS bypasses the traditional API path entirely, which makes it significantly faster — especially for large-scale restores. The tradeoff: it's less granular than a traditional backup. Think of it less as a backup and more as the only realistic DR option for M365 at scale.

At Veeam, MBS integration is available as part of the premium offering — included as flat-rate, same as the rest. And by design, MBS only works with BaaS. You can't bolt it onto an on-prem or hybrid setup. Which is another reason BaaS is the natural home for serious M365 data protection.

## Conclusion

As it is almost always in engineering, there's no universal answer — but there are clear patterns.

**If you're a small to mid-sized organization** without dedicated infrastructure or ops capacity: BaaS is the obvious choice. Less to manage, predictable costs, and the hard parts are handled for you.

**If you're a larger organization** with existing on-prem infrastructure and the team to run it: Hybrid is worth considering — but only if S3-compatible storage is already in place or planned. Don't retrofit block storage into a hybrid setup.

**If you have strict data sovereignty or regulatory requirements**: Hybrid or on-prem give you the most control. BaaS is still viable if your provider can meet your residency requirements — verify before you sign.

**If you need real DR capability for M365**: BaaS with MBS integration is the only architecture that delivers it at scale. Everything else is a workaround.

**Cloud-only IaaS**: hard to recommend for most. If you're already running significant cloud infrastructure and need full control, it works. Otherwise it's the cost of cloud with the pain of on-prem.

If you're unsure which option fits your organization, feel free to reach out — happy to talk it through. And yes, Veeam covers all of these scenarios.

---

[^1]: [See this report by Landbase](https://data.landbase.com/technology/microsoft-365/)

[^2]: Source: [Microsoft Learn](https://learn.microsoft.com/en-us/troubleshoot/exchange/administration/exchange-2019-2016-end-of-support)
