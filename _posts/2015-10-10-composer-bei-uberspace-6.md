---
layout: post
title: "Composer bei Uberspace 6"
---
*Hinweis: Dieser Artikel kommt aus dem Archiv*

Was Composer ist, habe ich im <strike>letzten Beitrag</strike> (*Den habe ich leider nicht mehr*) erklärt. Nebenbei erwähnte ich in einer Randnotiz den Hoster Uberspace, auf dem Composer problemlos läuft. Allerdings ist dieser nicht vorinstalliert, das heißt, ihr müsst dies selbst tun. Das ist aber ganz einfach :-)

Es gibt zwar bereits eine Anleitung, die meiner Meinung nach aber viel zu kompliziert ist. Es gibt eine viel einfachere Methode, die genau so gut und in zwei Schritten erledigt ist:

```
test -d ~/bin || mkdir ~/bin  
curl -sS https://getcomposer.org/installer | php -- --install-dir=~/bin --filename=composer  
```

Das Script prüft zuerst, ob du schon ein ~/bin-Verzeichnis hast und, falls du keines hast, erstellt es eines für dich.
Danach wird der aktuellste Composer-Installer geladen und mit der Anweisung gestartet, Composer als Datei composer im Verzeichnis ~/bin zu installieren. Dieses Verzeichnis liegt automatisch in deinem $PATH, sodass du mit einem einfachen composer darauf zugreifen kannst.
Dass das ganze geklappt hat, siehst du durch die Eingabe von composer -V. Dabei sollte eine Versionsangabe rauskommen, die z.B. so aussehen könnte:

```
Composer version 1.0-dev (c83650f299cfff1049cd61ea72ee5345bd4f92d3) 2015-08-04 13:59:03
```
## Updaten

Wenn ihr auf eine neue Version von Composer aktualisieren wollt, könnt ihr dies einfach mit composer self-update tun. Die aufgerufene Composer-Library aktualisiert sich hiermit automatisch auf die neuste Version.

