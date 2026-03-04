---
layout: post
title: "Mittels Automator Musik für Audi MMI organisieren"
tags: automator mac auto sd-karte audi
background: /assets/img/posts/2019/03/A4.jpg
---
Vielleicht gibt's hier ja noch weitere altmodische Leute wie mich, die die Musik im Auto per SD-Karte organisieren müssen. Meine Situation ist die folgende:

Ich habe einen Audi A4 mit dem "großen" MMI, welches aber leider per Bluetooth nur Telefongespräche entgegennimmt. Ein Bluetooth-Adapter ist leider keine Option, da mir mein AMI (so nennt sich der proprietäre Anschluss von Audi, über den man ein AUX-Signal einspeisen kann) kaputt gegangen ist.

Daher organisiere ich die Musik in meinem Auto auf einer SD-Karte. Dabei sieht die Ordnerstruktur in dieser wie folgt aus:

```
/
-- /JAHR_MONAT
---- /Titel.mp3
```

An die Audiodateien bestehen folgende Ansprüche:
* Datei muss im MP3-Format vorliegen
* Metadaten müssen in ID3v2.3 __und__ ID3v1.1 vorliegen

Bisher hab ich das ganze manuell gemacht, habe aber eigentlich keine Lust mehr darauf. Und da ich mich sowieso mal mit dem Automator aufm Mac beschäftigen wollte, nahm ich das jetzt mal als Anlass. Das Ergebnis möchte ich euch natürlich nicht vorenthalten.

### Voraussetzungen

Um die Abhängigkeiten zu installieren, benötigt man [Homebrew](https://brew.sh) (ist allgemein empfehlenswert). Dann benötigt ihr zur Umsetzung ffmpeg (zum Konvertieren der Musikdateien) und eyeD3 (um die ID3-Daten umzuwandeln). Kann man folgendermaßen installieren

```sh
$ brew install eye-d3 ffmpeg
```

### Automator-Skript

Um das ganze auf eurem System zum Laufen zu kriegen, startet den Automator und legt einen neuen Service an. 

<img src="/assets/img/posts/2020/11/automator_schnellaktion.png" width="40%" style="text-align:center;">

Als Schritt wählt ihr dann "Dienstprogramme > Shell-Skript ausführen" aus. Unter "Eingabe übergeben" definieren wir, dass die Dateien "Als Argumente" übergeben werden (sonst kriegen wir diese ins STDIN). Mein Skript findet ihr unten.

```sh
#!/bin/sh
#Check if Auto SD card is mounted and define target directory
sdmount="/Volumes/TEDE AUTO"
targetdir="${sdmount}/$(date +'%Y_%m')"

if [ ! -d "$sdmount" ]; then
	echo "SD-Karte nicht eingelegt"; exit 1
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

Das Skript ist wie man sieht sehr einfach und macht folgendes:

* Bestimme den Zielordner (bei mir nach Jahr und Monat organisiert)
* Prüfe, ob die SD-Karte gemountet ist
* Prüfe, ob der Zielordner auf der SD-Karte existiert und erstelle diesen wenn nötig
* Für jede übergebene Datei:
	* Prüfe, ob diese bereits im Ziel existiert (falls ja, folgende Schritte skippen)
	* Datei an ffmpeg übergeben und in MP3 konvertieren
	* Datei an eyeD3 übergeben und Metadaten zuerst in ID3v2.3 umwandeln und danach nochmal in ID3v1.1


Danach könnt ihr einfach auf jede beliebige Audiodatei mit einem Rechtsklick auf Dienste das erstellte Skript ausführen und euer Mac konvertiert automatisch die Datei in das richtige Format, formatiert die Metadaten und legt das ganze hübsch organisiert auf eurer SD-Karte ab.

<img src="/assets/img/posts/2020/11/dienstemenue_schnellaktion.png" width="40%" style="text-align:center;">