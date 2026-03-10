---
layout: post
title: "Using Automator to Organize Music for the Audi MMI"
tags: automator mac car sd-card audi
background: /assets/img/posts/2019/03/A4.jpg
---
Maybe there are some other old-fashioned folks out there like me who still have to organize their car music via SD card. My situation is this:

I have an Audi A4 with the "large" MMI, which unfortunately only accepts Bluetooth for phone calls. A Bluetooth adapter isn't an option either, since my AMI port (Audi's proprietary connector for feeding in an AUX signal) broke.

So I organize the music in my car on an SD card. The folder structure looks like this:

```
/
-- /YEAR_MONTH
---- /Track.mp3
```

The audio files have to meet these requirements:
* File must be in MP3 format
* Metadata must be present in both ID3v2.3 **and** ID3v1.1

I've been doing all of this manually so far, but I'm honestly tired of it. Since I wanted to explore Automator on the Mac anyway, I took this as an opportunity to do so. Here's what I came up with.

### Prerequisites

To install the dependencies you'll need [Homebrew](https://brew.sh) (generally recommended). You'll then need ffmpeg (to convert the audio files) and eyeD3 (to convert the ID3 tags). Install them like this:

```sh
$ brew install eye-d3 ffmpeg
```

### Automator Script

To get this running on your system, open Automator and create a new Quick Action.

<img src="/assets/img/posts/2020/11/automator_schnellaktion.png" width="40%" style="text-align:center;">

Add the action "Utilities > Run Shell Script". Under "Pass input", select "as arguments" (otherwise the files will be piped into STDIN). You can find my script below.

```sh
#!/bin/sh
#Check if Auto SD card is mounted and define target directory
sdmount="/Volumes/TEDE AUTO"
targetdir="${sdmount}/$(date +'%Y_%m')"

if [ ! -d "$sdmount" ]; then
	echo "SD card not inserted"; exit 1
fi

# Create target directory if not exists
[ ! -d "$targetdir" ] && mkdir -p "$targetdir"

for f in "$@"
do
	filename=$(basename $f)
	if [ ! -f "${targetdir}/${filename%.*}.mp3" ]; then
		/usr/local/bin/ffmpeg -i "$f" "${targetdir}/${filename%.*}.mp3"
		/usr/local/bin/eyeD3 --to-v2.3 "${targetdir}/${filename%.*}.mp3"
		/usr/local/bin/eyeD3 --to-v1.1 "${targetdir}/${filename%.*}.mp3"
	fi
done
```

The script is quite simple and does the following:

* Determine the target folder (organized by year and month in my case)
* Check whether the SD card is mounted
* Check whether the target folder on the SD card exists and create it if needed
* For each passed file:
	* Check whether it already exists at the destination (skip the following steps if so)
	* Pass the file to ffmpeg and convert it to MP3
	* Pass the file to eyeD3 and convert the metadata first to ID3v2.3, then to ID3v1.1

Afterwards, you can right-click on any audio file, go to Services, and run the created script. Your Mac will automatically convert the file to the correct format, fix the metadata, and neatly organize everything on your SD card.

<img src="/assets/img/posts/2020/11/dienstemenue_schnellaktion.png" width="40%" style="text-align:center;">
