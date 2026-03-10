---
layout: post
title: Application-Consistent Backups of the Unraid appdata Share on btrfs
date: 2024-11-22 00:00:00 +01:00
description: How to create application-consistent backups of Docker volumes on Unraid using btrfs snapshots and Veeam pre/post scripts.
tags:
  - veeam
  - unraid
  - homelab
---
## ⚠️ Notice

This workaround does not work anymore on the Veeam Software Appliance. Also, this is not something you should use in production, but just a nice workaround for some home deployments. I'm just trying to push the boundaries a bit 😬

This is so niche that probably nobody's ever gonna use it… But that's what I also sometimes think about other peoples posts that then inspire me.

---

From the series: _Problems nobody else has but me_

## Background

I run a private Unraid server that I use not only for media storage but also as a host for several Docker containers and VMs. For backups I use Veeam Backup & Replication Enterprise Plus — though this guide also works with the free Community Edition, with the exception of backing up to cloud storage. Veeam itself runs on one of those VMs.

Some of my Docker containers run applications with databases — mainly SQLite and PostgreSQL. The setup described here is fundamentally independent of which applications you're running in Docker, though.

The goal is to set up a File Share Backup Job in Veeam that backs up the relevant Docker volumes.

## The Problem

Backups are useless if you can't restore from them. Naively reading files straight off the filesystem — which is what happens with default settings — is equivalent to pulling the power cord mid-operation. Anyone who has ever had to recover a database after a power failure knows this isn't fun and often results in corrupted data.

## The Idea

Veeam offers something called Application-Aware Processing for full machine backups. On Windows systems, this triggers a VSS snapshot, which instructs compatible applications to flush their data into a consistent state before the snapshot is taken.

So basically something you could just build yourself on a not-supported Linux, right?

Since this is my home network, I'm fine with services being unavailable for a few minutes. The simplest way to achieve consistency is to stop all containers. We could just run the backup at that point — but the downside is that all Docker containers would be stopped for the entire duration of the backup job.

This is where btrfs snapshots come in. They allow us to read data from the snapshot while the live filesystem is already back in use by the Docker containers. The plan looks like this:

1. Stop all Docker containers
2. Create a read-only btrfs snapshot
3. Start all Docker containers
4. Run the backup job against the snapshot
5. Delete the snapshot

Conveniently, Veeam Backup & Replication supports pre- and post-job scripts, which we can ~~abuse~~ make use of here.

---

## Guide

### Prerequisites

- Veeam Backup & Replication Server
- An Unraid server with SSH enabled
- The appdata share must reside **entirely** on a btrfs volume (this is not the default!)
- The backup server must be able to reach Unraid on port 22
- Basic SSH and Bash knowledge

---

### Step 1: Prepare the SSH Key

Both scripts need access to the root shell of the Unraid server. This access is also required for Veeam to connect to Unraid in general.

The easiest way to generate an SSH key on the backup server is with [puttygen.exe](https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html). While you're there, also grab `plink.exe` — you'll need it later.

![PuTTYgen key generation dialog](/assets/img/posts/cleanshot_2024-11-22_at_13.19.53.png)

Open puttygen and click "Generate", then move your mouse around the window to generate entropy. You should get a key pair.

![Generated SSH key pair in PuTTYgen](/assets/img/posts/cleanshot_2024-11-22_at_13.21.23.png)

Copy the public key shown in the top field. In Unraid, paste it under _Users → Management Access → root → SSH Authorized Keys_. If the field isn't empty, just add your key as a new line at the bottom.

Save the private key somewhere on the backup server — this creates a `.ppk` file.

Finally, make the private key available to the Veeam service via the Credential Manager. Go to _Add → SSH private key_ and create an account with the username `root`. Under "Private Key", select the `.ppk` file you just saved. No further settings are required. It's a good idea to add a comment so you can distinguish this credential from others.

![Veeam Credential Manager – SSH private key entry](/assets/img/posts/cleanshot_2024-11-22_at_13.29.08.png)

---

### Step 2: Add Unraid as a File Server in Veeam

Now add the Unraid server as a data source in Veeam: _Inventory → Unstructured Data (right-click) → Add unstructured data source → File server_.

The New File Server dialog will appear. If you haven't done so already, add Unraid as a managed server by clicking _Add New → Linux Server_.

![Veeam New File Server dialog for Unraid](/assets/img/posts/cleanshot_2024-11-22_at_13.32.16.png)

Configure the DNS name or IP address of the Unraid server, then select the credential you just created. Click through the rest of the dialog.

**Note:** The Apply step will show some errors because Unraid doesn't use a standard package manager. This is fine — Veeam will provision the required components temporarily on its own.

Unraid should now appear under _Inventory → Unstructured Data → File Servers_.

---

### Step 3: Create the Pre- and Post-Job Scripts

Before configuring the backup job itself, we need the scripts. I placed them in the same directory as the keys and `plink.exe`.

Two scripts are needed:

**`unraid_make_consistent_snap.bat`**

```bat
echo y | C:\Veeam\Scripts\unraid\putty\plink.exe -i C:\Veeam\Scripts\unraid\unraid.ppk -ssh -batch -hostkey "SSH-HOSTKEY-OF-YOUR-UNRAID-SERVER" root@unraid.lan "btrfs subvolume delete /mnt/hotstore/@veeamsnap; docker container stop $(docker container ls -q) && /etc/rc.d/rc.docker stop && btrfs subvolume snapshot -r /mnt/hotstore/ /mnt/hotstore/@veeamsnap && /etc/rc.d/rc.docker start"
```

This script stops Docker, creates a read-only snapshot of `/mnt/hotstore` (where my app data lives) at `/mnt/hotstore/@veeamsnap`, and starts Docker again.

**`unraid_cleanup_snapshot.bat`**

```bat
echo y | C:\Veeam\Scripts\unraid\putty\plink.exe -i C:\Veeam\Scripts\unraid\unraid.ppk -ssh -batch -hostkey "SSH-HOSTKEY-OF-YOUR-UNRAID-SERVER" root@unraid.lan "btrfs subvolume delete /mnt/hotstore/@veeamsnap"
```

This script deletes the snapshot after the backup is complete.

**Important:** Replace the hostkey, paths, and server address with your own values before using these scripts.

---

### Step 4: Create the Backup Job

Almost done. Create the backup job in Veeam under _Home → Jobs (right-click) → Backup → File Share_. After giving it a name, define the objects to back up. The path should point to the snapshot — in my case: `/mnt/hotstore/@veeamsnap/appdata`.

In the next step, select the backup repository. Under _Advanced → Scripts_, add both scripts and configure them to run on every session.

![Veeam backup job – Advanced Scripts configuration](/assets/img/posts/cleanshot_2024-11-22_at_13.46.07.png)

I'd also recommend enabling encryption if you're backing up to cloud storage — you'll find this option in the same window under _Storage_.

For scheduling, I run this job once daily at 05:00, after all drive operations like Mover and Parity Check have completed.

---

### Step 5: Run the Backup

Start the job. Before the actual backup begins, Docker will be briefly stopped and the snapshot created. In my setup, services are unreachable for less than a minute. Veeam then reads the consistent data from the snapshot — you'll see this confirmed by "Pre-Job script completed successfully".

Because the SSH session uses the `&&` operator to chain commands, any error on the remote system will automatically surface as a warning in the Veeam job at that point.

![Veeam job log showing pre-job script completed successfully](/assets/img/posts/cleanshot_2024-11-22_at_13.49.00.png)
