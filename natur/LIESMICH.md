# Aus Grau wird Grün – Mission Natur

3D-Simulation in Blockgrafik für die Kinderuni **START IT SMART – Mission Zukunft** (Klassen 1–4, Großleinwand).
Sie zeigt die Spielplatzszene des Drehbuchs (Abschnitt 3 „Mission Natur – Aus Grau wird Grün“) im Browser:
den grauen Platz, die Abstimmung, die Verwandlung in den Natur-Abenteuerspielplatz, den heißen Sommertag und den Starkregen.

**Start:** https://demo-testing123.github.io/smarty-soundboard/natur/
oder im Soundboard oben auf **🌳 Natur** (öffnet ein neues Fenster für den Beamer).

Die Seite läuft für sich, also auch dann, wenn Minecraft Education nicht verfügbar ist. Gestaltung und Maße des Spielplatzes stammen aus
derselben Datei wie die Minecraft-Testwelt (`../minecraft/welt.js`). Leinwand und Minecraft zeigen deshalb denselben Platz.
Die Grafik ist eigenständig: schlichte Blöcke in eigenen Farben, keine Texturen oder Figuren aus Spielen.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html`, `style.css` | Bühne 16:9, Leisten, Tafeln; Größen relativ zur Bildhöhe |
| `config.js` | **alle Texte (wörtlich aus dem Drehbuch), Schritte und Zeiten** – hier wird angepasst |
| `model.js` | ohne Grafik: sichtbare Blöcke, Wärme (vereinfacht), Wasser bei Starkregen, Zeitplan der Verwandlung |
| `scene3d.js` | 3D mit Three.js: Platz als Modell-Ausschnitt mit Bodenschnitt, Hochhäuser, Regen, Tiere, Kinder |
| `main.js` | Bedienung: Abschnitte, Schritte, Tasten, Beschriftungen |
| `test.html` | Abnahmetests (28 Prüfungen, inkl. 10 × alle Abschnitte wechseln und Leistung) |

Es gibt keinen Build-Schritt. Offline geht es über den gemeinsamen Service Worker oder `start-lokal.bat`.

## Bedienung

Nichts schaltet von selbst weiter, es gibt keinen Ton. Die SMARTy-Sätze kommen wie gewohnt aus dem Soundboard.

| Abschnitt | Taste | Schritte (→ / Leertaste) | Was zu sehen ist |
|---|---|---|---|
| Startbild | `0` | – | Titel und Knöpfe |
| Grauer Platz | `1` | Frage 1 → Frage 2 | versiegelter, grauer Platz zwischen Hochhäusern; „Würdet ihr hier nachmittags gerne spielen?“ |
| Abstimmung | `2` | Abstimmen → Frage | A „Großer Abenteuerspielplatz“, B „Grüner Abenteuerpark“. Das Ergebnis markiert man mit `A`/`B`; das ist optional, es wird nicht gezählt. |
| Beides gemeinsam | `3` | Grau → Verwandeln | Der Platz verwandelt sich Schicht für Schicht in etwa 4,5 s. Danach: Abenteuer-Spielplatz, Bäume, Wiesen, wilde Ecke. |
| Sommertag | `4` | Blanker Stein → Unter Bäumen → Tiere | Sonne und Schatten. `W` schaltet die vereinfachte Wärme-Ansicht ein: rot heiß, orange warm, blau kühler. |
| Starkregen | `5` | Grauer Platz → Grüner Platz → Regen vorbei → Gießen | grau: Wasser fließt in die Abflüsse. grün: Wasser versickert (blaue Punkte im Bodenschnitt), Regenmulde und tiefer Bereich füllen sich, die Zisterne sammelt. Danach versickert das Wasser, die Zisterne gießt den Baum. |
| Endbild | `6` | – | Schatten im Sommer · Platz für Tiere · Spielen mit Freunden · Hilfe bei Starkregen |

Weitere Tasten: `←` zurück, `R` Abschnitt neu, `I` Info für Moderation (Drehbuchstellen, SMARTy-Tasten im Soundboard), `F` Vollbild.

## Was das Modell bewusst vereinfacht

- **Wärme:** Für jede Bodenstelle wird nur geprüft, ob sie in der Sonne oder im Schatten liegt (Blick durch das Blockgitter zur Sonne)
  und ob sie aus Stein ist. Es gibt keine Temperaturen und keine Messwerte; ein Hinweis auf der Leinwand sagt das auch.
- **Wasser:** Füllstände von 0 bis 1, keine Liter. Die Zeit ist gerafft: Mulde und tiefer Bereich leeren sich in etwa 20 Sekunden statt
  in Stunden. Auch das steht auf der Leinwand. Wie im Drehbuch ist der tiefe Bereich „voll Wasser“ nicht bespielbar: Das Kind dort verschwindet,
  und die Beschriftung sagt es.
- **Abstimmung:** Laut Drehbuch folgt nach jeder Wahl „Beides gemeinsam!“. Deshalb gibt es keine eigenen A- oder B-Modelle.

## Leistung (für schwache Schul-Laptops am Beamer)

- **Kein Ruckler beim ersten Umschalten:** Beim Laden wird alles einmal unsichtbar vorbereitet (Grafikprogramme, Daten auf der Grafikkarte).
  Das erste Bild nach dem Umschalten auf Starkregen braucht etwa 3 ms statt 40 ms.
- **Gezeichnet wird nur, wenn sich etwas bewegt:** Ruhige Ansichten (grauer Platz, Abstimmung) zeichnen 0 statt 60 Bilder pro Sekunde.
  Regen, Tiere und die Verwandlung laufen weiter flüssig.
- **Schatten nur bei Änderungen:** Die Schattenkarte wird nur berechnet, wenn sich der Platz ändert (Verwandlung, Wechsel grau/grün),
  nicht in jedem Bild.
- **Wenige Zeichenaufrufe:** Die Straßenplatte, alle Hochhäuser und alle Fassaden sind zusammengefasst. Der graue Platz braucht 13 Aufrufe statt 93.
- **Kein Wegwerf-Speicher pro Bild** (Regen, Tropfen, Tiere). Damit gibt es keine kurzen Hänger durch das Aufräumen des Browsers.
- Die Bildschärfe ist auf das 1,5-Fache begrenzt. Am Beamer (Faktor 1) ändert das nichts, auf hochauflösenden Laptop-Bildschirmen spart es Rechenzeit.

## Anpassen

- **Texte:** `config.js`. Bitte wörtlich beim Drehbuch bleiben.
- **Spielplatz-Gestaltung:** `../minecraft/welt.js` (Funktion `vorlageGruen`). Das ändert Leinwand **und** Minecraft-Testwelt zugleich.
- **Zeiten:** `config.js` › `dauer`.

## Prüfen

`test.html` öffnen. Geprüft werden unter anderem:
- gleiche Vorlagen wie in der Minecraft-Testwelt
- Wärme: grau fast alles heiß, grün nichts heiß und mehr Schatten
- Wasser: grau fließt ab, grün versickert und sammelt, danach leer, die Zisterne bleibt gefüllt, Gießen
- Verwandlung vollständig und Abbruch mittendrin ohne halben Platz
- Texte wörtlich, keine Mengenangaben, keine Figur Mika
- 10 × alle Abschnitte ohne zusätzliche Objekte, Geometrien oder Texturen

Geprüft bei 1366 × 768. Auf dem echten Beamer noch nicht angesehen.
