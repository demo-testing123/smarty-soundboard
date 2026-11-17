# Stadt-Konfigurator – START IT SMART „Mission Zukunft: Rettet unsere Stadt!“

Regie- und Stadtplanungsanwendung für **alle Missionen** des Drehbuchs (Arbeitsfassung vom 16.11.2026, Auftrag vom 17.11.2026).
Der Browser ist **Regieoberfläche und 3D-Vorschau**. Minecraft Education ist die **spielbare Stadt**. Beide zeigen dieselbe graue Stadt.

**Start:**
- Online: https://demo-testing123.github.io/smarty-soundboard/stadt/
- Im Soundboard: Knopf **🏙 Stadt**
- Offline per Doppelklick: die Einzeldatei `START-IT-SMART_Stadtkonfigurator.html`

> **Stand:**
> - Die Browser-Anwendung ist vollständig, alle Missionen sind enthalten.
> - Die Minecraft-Welt ist erzeugt und **technisch** doppelt geprüft (Abschnitt 8).
> - **In Minecraft Education selbst ist sie noch nicht ausgeführt.** Dafür gibt es den Testplan in Abschnitt 6.3.

---

## 1. Bestandsaufnahme: Stadt-Konfigurator des Kollegen (Phase A)

**Original gesichert:**
- `Downloads\Stadt-Konfigurator_Original_Sicherung\Stadt-Konfigurator.html`, schreibgeschützt.
- Prüfsummen: MD5 `8dc90b3a413d776c2ad068c3d583b4a6`, SHA-256 `cd78723f…09af`.
- Das Original ist nicht verändert.

Untersucht habe ich den **entpackten Code**, nicht nur die Knopftexte.

| Funktion im Original | tatsächliches Verhalten | hier |
|---|---|---|
| Petrol-/Gold-Gestaltung, Raster, Titelkasten, Schrittleiste, große A/B/C-Karten mit Bild, + / − | Eigene Schriften (DM Sans, IBM Plex Mono, OFL); der Kartenbereich füllt auf dem Beamer die Höhe | **übernommen**: Farben, Formen, Schriften (`schrift/`), Kartenaufbau. Die Kartenbilder sind keine festen Bilder mehr, sondern werden aus dem Stadtmodell gerendert. |
| 3D-Viertel „Bahnhofsviertel“ (three.js, Blockmodell 112 × 84) | Grünes Ufer-Viertel mit Bahnhof, Schule, Quartiersplatz. Jede Runde baut ihre Fläche per Code. | **Prinzip übernommen**: Blockmodell, Bauflächen, die nicht verlassen werden dürfen (das Original wirft dann einen Fehler, hier zählt der Test 0 Verstöße), Bäume, Autos, Laternen, Bänke. **Neu gebaut**: eine **graue** Stadt 2050 nach Drehbuch. |
| Fokus-Kameras (Gesamtansicht, Viertelweg, „Mikas Haustür“, Schule, Platz, Bahnhof, Brücke), Gebäudetafeln | Kamerafahrt zu festen Zielen; Tafeln an Gebäuden | **übernommen**: Kamera-Presets je Szene, Gesamtansicht, Tafeln. „Mikas Haustür“ heißt jetzt **„Unser Wohnhaus“**. |
| 5 Runden: Wohnen, Einkaufen, Mobilität, Grün und Wasser, Bildung (je A/B/C) | Ergebnis: Code wie `ABCAB`, Gesamtwelt je Kombination | **ersetzt** durch die Missionen des Drehbuchs (Abschnitt 2) |
| Gespeicherte Entscheidungen | Weltcode und QR-Link zum Weiterspielen | **übernommen als** Entscheidungsspeicher im Browser (`zustand.js`), mit Ändern, Zurücksetzen und Neu beginnen |
| Export Minecraft Education (.mcworld), Java, JSON | Erzeugt je Entscheidungsfolge eine **neue komplette Welt** | **Formate wiederverwendet** (`../minecraft/mcworld.js`). Eine neue Welt je Abstimmung gibt es **nicht**; Austausch nur in der geöffneten Welt (Abschnitt 6). |
| Offline-Betrieb | Alles in einer HTML-Datei | **übernommen**: als Projektordner mit Service Worker **und** als Einzeldatei |

### Drehbuch-Abgleich und Konflikte (bewusst entschieden)

| Konflikt | Lösung |
|---|---|
| Figur **Mika** (Original, ältere Drehbuchstellen K1, B2, Finale) | Entfernt aus Oberfläche, Wegen, Kameras und neuen Texten. Startpunkt: „Unser Wohnhaus“. Der Test prüft, dass „Mika“ nirgends vorkommt. |
| **Zwölf** Familien im Original | **Sechs** Wohnungen in jeder Variante, alle gleich groß (vereinfachtes Modell) |
| Natur im Original: „Sportplatz mit Tank / Garten mit Mulde / tiefer Platz“ (A/B/C) | Drehbuch: **A/B als Denkimpuls**, danach die **gemeinsame Lösung „Beides gemeinsam“**. A und B sind nur Diskussionsbilder, gebaut wird nur Grün. |
| Reihenfolge im Original (Wohnen zuerst) | Reihenfolge des Drehbuchs: Szene 0, Natur, Technik, Mobilität, Wohnen, Kurze Wege, Bildung, Finale |
| Mobilität: Drehbuch spricht von einem „gemeinsamen Planungsvorschlag“, der Auftrag von A/B/C | Gezeigt wird genau die gewählte Variante. Jede Variante hat eine sichere Querung, B und C bündeln Parkplätze. Die Regie-Notiz verweist auf M3. |
| Bildung C „über das Quartier verteilt“ | Eine Baufläche ist ein Quader. Deshalb liegen die drei kleinen Orte im ganzen Südviertel (Lerngarten, Bewegungsplatz, Lese-Ecke), nicht im ganzen Quartier. |
| Wohnen: „Minecraft-Welt nicht live umbauen, solange keine Varianten vorbereitet sind“ | Die Varianten **sind** vorbereitet (Kammern). Ausgelöst wird von Hand. |

## 2. Missionen und Ablauf (Drehbuch-Mapping)

| Taste | Mission | Schritte | Baufläche(n) | Minecraft |
|---|---|---|---|---|
| `0` | Szene 0 – graue Stadt | Stadt 2050 · Mission aktiviert | – | ANSICHT Gesamt |
| `1` | Natur | grauer Platz · Abstimmung A/B (Diskussionsbilder) · **Lösung: Beides gemeinsam** (Übernehmen) · Starkregen grau/grün · Mission geschafft | Spielplatz | SPIELPLATZ GRAU / GRUEN |
| `2` | Technik | Abstimmung „immer an / nur bei Dunkelheit“ · Calliope live · Ergebnis Tag → Nacht | Hauptstraße (16 Laternen) | LATERNEN IMMER AN / SENSOR, ZEIT TAG / NACHT |
| `3` | Mobilität | volle Straße · Parken A/B/C · Bus wartet · Verkehrssimulation (eigene Seite) · mBot live · Busanmeldung | Wohnstraße + Parkhausplatz; Kreuzung | PARKEN GRAU/A/B/C, KREUZUNG NORMAL/BUS |
| `4` | Wohnen | sechs Familien (Wohnsimulator, eigene Seite) · Wohnformen A/B/C · Aufstocken + 2 Holzgeschosse | Wohngrundstück; Bestandshaus | WOHNEN GRAU/A/B/C, AUFSTOCKEN BESTAND/+2 HOLZ |
| `5` | Kurze Wege | drei Wege messen · Standort A/B/C | Westviertel | EINKAUFEN GRAU/A/B/C |
| `6` | Bildung | ein Raum, zwei Nutzungen · Orte A/B/C mit Teilhabe-Fragen | Südviertel | BILDUNG GRAU/A/B/C |
| `7` | Finale | Zukunftscheck (nur echte Beschlüsse) · Vorher/Nachher · Rundgang | alle | ANSICHT … |

**Extern bleiben:**
- Introfilm, Live-Ankunft, Zeitmaschinen-KI
- SMARTy-Audio (Soundboard; die Regie-Leiste nennt die Tasten)
- Calliope-Experiment
- Verkehrssimulation, Wohnsimulator, Natur-Simulation
- mBot und Modellampel, die **nicht** verbunden sind

## 3. Architektur und Datenmodell (Phase B)

| Datei | Aufgabe (getrennt nach Auftrag) |
|---|---|
| `daten.js` | **Inhalt**: Missionen (ID, Titel, Typ, Schritte, Varianten, Kameraziel, Regie-Stichworte, SMARTy-Tasten), Kameras, Tafeln, Rundgang |
| `stadtmodell.js` | **3D-Geometrie**: graue Grundstadt, Straßennetz, Bauflächen und ihre Varianten. Eine Quelle für Browser und Minecraft. Dazu Messungen im Modell (Wege, bebaute Fläche). |
| `zustand.js` | **Entscheidungszustand**: Beschlüsse je Baufläche, Mehrheit (optional), Position, Verlauf. Gespeichert im Browser. |
| `ansicht3d.js` | **Regieansicht 3D**: zusammengefasste Blockflächen, ein Netz je Baufläche, Kameras, Tag/Nacht, Regen, Wege, Kartenbilder |
| `minecraft-ausgabe.js` | **Minecraft-Ausgabe**: Kammern, Regieraum, Ansichtspunkte, Befehle, Bauaufträge, `.mcworld` |
| `main.js`, `index.html`, `style.css` | Bühne 16:9: Leiste, Titel, Karten, Schalter, Regie, Dialoge |
| `test.html` | Abnahmetests (45 Prüfungen) |
| `einzeldatei.py` | baut die Einzeldatei |

**Status einer Mission:**
- offen
- teilweise (Mobilität und Wohnen haben je zwei Flächen)
- beschlossen

**Rücksetzen:**
- pro Mission: `Reset`, zweimal klicken
- alles: Regie › „Neu beginnen …“

### Bauflächen (feste Koordinaten; x nach Osten, z nach Süden, Boden y 63)

| Baufläche | Quader | Größe | Vorlagen-Kammern (gleiche x/z, darunter) |
|---|---|---|---|
| Spielplatz | 0 59 0 – 31 74 31 | 32 × 16 × 32 | grau: y 39…54, gruen: y 19…34 (wie im Spielplatz-Test) |
| Straßenbeleuchtung Hauptstraße | 32 62 0 – 45 71 95 | 14 × 10 × 96 | immer: y 48…57, sensor: y 34…43 |
| Wohnstraße und Parken | −64 62 −44 – 31 79 −25 | 96 × 18 × 20 | grau 40…57, A 18…35, B −4…13, C −26…−9 |
| Kreuzung mit Bus | 32 62 −26 – 51 73 −1 | 20 × 12 × 26 | normal 46…57, bus 30…41 |
| Wohngrundstück | 52 62 −60 – 91 85 −21 | 40 × 24 × 40 | grau 34…57, A 6…29, B −22…1, C −50…−27 |
| Bestandshaus | 52 62 6 – 71 85 25 | 20 × 24 × 20 | bestand 34…57, holz 6…29 |
| Westviertel (Läden, Wege) | −64 62 −24 – −17 81 31 | 48 × 20 × 56 | grau 38…57, A 14…33, B −10…9, C −34…−15 |
| Südviertel (Schule, Bahnhof) | −64 62 46 – 31 83 95 | 96 × 22 × 50 | grau 36…57, A 10…31, B −16…5, C −42…−21 |

**Regeln:**
- Bauflächen überlappen sich nie.
- Jede Variante baut nur in ihrem Quader. Das prüft der Test.
- Oberhalb jedes Quaders steht nichts.

## 4. Bedienung auf der Bühne (Regieanleitung)

**Grundsatz:** Nichts schaltet von selbst weiter. Es gibt keine Pop-ups ohne Klick und keine Internetpflicht.

**Tasten:**

| Taste | Wirkung |
|---|---|
| `0`–`7` | Szene oder Mission wählen |
| `←` `→` (auch Leertaste, Bild↑/↓) | Schritt zurück / weiter |
| `A` `B` `C` | Vorschau einer Option |
| `Enter` | Übernehmen |
| `V` | Vorher / Nachher |
| `G` | Gesamtansicht |
| `S` | zur Szene |
| `N` | Tag / Nacht |
| `R` | Regen (Natur) |
| `M` | Minecraft-Bauauftrag |
| `I` | Regie-Leiste |
| `H` | Bedienelemente aus (saubere Leinwand) |
| `F` | Vollbild |
| `Esc` | Vorschau verwerfen |

**Bildstellen für eine bebilderte Anleitung** (Bildschirmfoto bei 1366 × 768):
- **[Bild 1]** Szene 0 mit Tafeln
- **[Bild 2]** Natur, Abstimmung A/B
- **[Bild 3]** „Die Lösung: Beides gemeinsam!“
- **[Bild 4]** Starkregen grün
- **[Bild 5]** Technik bei Nacht
- **[Bild 6]** Parken C übernommen
- **[Bild 7]** Wohnen, drei Karten mit „6 Wohnungen · bebaute Fläche“
- **[Bild 8]** Kurze Wege gemessen
- **[Bild 9]** Finale mit Zukunftscheck

**Ablauf je Abstimmung:**
1. Karte anklicken oder `A`/`B`/`C` drücken. Die Stadt zeigt die Variante als **Vorschau**; die Fußnote sagt „noch nicht übernommen“.
2. Nach dem Handzeichen **Übernehmen** (`Enter`). Erst dann ist es ein Beschluss.
3. Optional die Mehrheit merken (Regie-Leiste). Sie erscheint im Zukunftscheck.
4. In Minecraft denselben Bauauftrag auslösen (`M` zeigt Knopf und Befehl).

**Regie-Leiste `I`:**
- Drehbuch-Stichworte
- SMARTy-Clips mit Soundboard-Taste. W, K, B, M und F1 sind laut Drehbuch noch neu zu produzieren.
- alle Beschlüsse mit dem passenden `/clone`-Befehl
- Mission zurücksetzen, Neu beginnen
- Verlauf

**Neu beginnen** (neue Vorlesung):
- Im Browser: Regie › Neu beginnen.
- In Minecraft: je Fläche „GRAU“ drücken oder die gesicherte Welt neu öffnen.

## 5. Was im Modell vereinfacht ist (keine erfundenen Zahlen)

- **Wege** werden **gemessen**: Breitensuche über Gehwege, Plätze und Zebrastreifen von der Haustür bis zur Ladentür. Ergebnis in Blöcken: A 53, B 35, C 23.
- **Wohnen:** In jeder Variante gibt es 6 gleich große Wohnungen (Modellannahme). Die bebaute Grundfläche wird aus den Hausumrissen gezählt: A 294, B 196, C 98 Felder.
- **Laternen, Regen, CO₂:** Es gibt keine Energie-, Wasser-, Temperatur- oder CO₂-Zahlen. Die Hinweise auf der Leinwand sagen das.
- **Laternen:** Die Zahl 1.000 stammt aus dem Drehbuch. Das Modell zeigt 16 Laternen auf der Hauptstraße als Beispiel.

## 6. Minecraft Education (Phase E)

### 6.1 Prinzip

- **Eine** vorbereitete graue Welt: „START IT SMART Stadt 2050“ (`.mcworld`, Knopf im Bauauftrag-Dialog).
- Die Welt wird **einmal** importiert und bleibt während der Vorlesung offen.
- Unter jeder Baufläche liegt jede Variante fertig gebaut in einer Kammer, in denselben Chunks.
- Ein Bauauftrag ist **ein** Befehl: `/clone <Kammer> <Baufläche>`. Er wirkt sofort und überschreibt jeden Block der Fläche, auch mit Luft. Er gilt nur für diese Fläche.
- **Keine Verbindung Browser → Minecraft.** Die Regie löst jeden Auftrag selbst aus:
  - im **Regieraum** per Knopf (Startpunkt der Welt, unter der Ringstraße)
  - oder im **Chat**

### 6.2 Einmal vor der Vorlesung

1. `.mcworld` doppelklicken, oder in Minecraft Education über „Importieren“ laden.
2. Im Regieraum den Knopf **EINMALIG** drücken, oder im Chat `/tickingarea add -64 0 -64 95 0 95 stadt`. Das sind 10 × 10 Chunks, die erlaubte Höchstgröße. Damit bleibt die ganze Stadt geladen.
3. Optional: `/gamerule sendcommandfeedback false`, `F1` für eine saubere Leinwand.

### 6.3 Regieraum und Bauaufträge

**Aufbau des Regieraums:**
- **Untere Reihe:** je Fläche alle Varianten, z. B. „PARKEN – C Parkhaus“.
- **Obere Reihe:** Ansichten (Teleport zu festen Punkten über der Stadt), ZEIT TAG / NACHT, EINMALIG.
- An jedem Ansichtspunkt liegt hinter dem Standplatz ein **ZURÜCK**-Knopf.

**Beispiel Parken C:**
```
Bauen:      /clone -64 -26 -44 31 -9 -25 -64 62 -44
Prüfen:     /testforblocks -64 -26 -44 31 -9 -25 -64 62 -44 all   → 34 560 Blöcke, keine Abweichung
Zurück:     /clone -64 40 -44 31 57 -25 -64 62 -44
Regieraum:  /tp @s 8 50 -7 facing 8 52 -13
```

Alle Befehle stehen im Dialog **⛏ Bauauftrag** (`M`), mit Kopierknöpfen und dem aktuellen Stand markiert. Als Datei gibt es sie über „Alle Bauaufträge (.txt)“.

**Testplan in Minecraft Education**, das ist noch zu tun:
1. Version notieren.
2. Welt öffnen.
3. EINMALIG drücken.
4. Pro Fläche: Variante drücken, Prüfbefehl ausführen, GRAU drücken, Prüfbefehl für grau ausführen.
5. LATERNEN SENSOR → ZEIT NACHT: Die Lampen müssen angehen. Bei TAG müssen sie ausgehen.
6. Alle Ansichten ausprobieren, dann ZURÜCK.
7. Welt speichern und neu öffnen: Knöpfe und Kammern sind noch da.

### 6.4 Nachweislich funktionierend und noch offen

| Funktion | Stand |
|---|---|
| Welt-Datei (ZIP, LevelDB mit CRC32C, Subchunks, level.dat) | **technisch geprüft**: im Browser zurückgelesen, alle 3,7 Mio. Blöcke stimmen; zusätzlich mit **Amulet** geöffnet: 24 Kammern und 8 Flächen mit 0 Abweichungen, Befehlsblöcke und Schilder lesbar |
| Blocknamen | **geprüft** mit PyMCTranslate: gültig in Bedrock 1.20.70, übersetzbar in die aktuelle Version |
| Bauaufträge `/clone` | **im Modell simuliert**: jede Fläche exakt, außerhalb nichts geändert, Zurücksetzen vollständig |
| Öffnen in Minecraft Education, Knöpfe auf Befehlsblöcken | **offen** – nicht in Minecraft Education ausgeführt |
| Ticking-Bereich 10 × 10 Chunks | **offen** – Grenze laut Bedrock-Doku 100 Chunks; falls abgelehnt: zwei Bereiche anlegen |
| Laternen mit Tageslichtsensor (umgekehrt) auf Redstone-Lampe | **offen** – übliche Minecraft-Bauweise, in Education nicht ausprobiert |
| Ansichtspunkte (Barriere-Plattform, `/tp … facing`) | **offen** – Blickwinkel im Spiel ggf. nachjustieren |
| Einbau in die Show-Welt des Kollegen | **offen** – laut Drehbuch wird die Welt beim Kollegen angefragt; Übertrag wie im Spielplatz-Test (`../minecraft/LIESMICH.md`, Abschnitt 7) |

### 6.5 Drei verschiedene Dinge

| | Was es ist | Was es nicht ist |
|---|---|---|
| **Browser-3D-Vorschau** | zeigt die Blöcke der Stadt mit dem aktuellen Beschluss oder einer Vorschau | ändert Minecraft **nicht** |
| **Bauartefakt** | die `.mcworld` mit allen Kammern und Knöpfen; die Bauaufträge (Befehle) | keine laufende Verbindung; wird einmal importiert |
| **Realer Minecraft-Umbau** | ein Knopf oder Befehl der Regie in der geöffneten Welt | passiert nicht automatisch beim Klicken im Browser |

## 7. Testbericht (`test.html`, 45 Prüfungen, alle bestanden)

**A · Modell:**
- Bauflächen überlappen nicht.
- Varianten bauen nur in ihrer Fläche (26 Varianten, 0 Verstöße).
- Ausgangs-Vorlagen sind gleich der Grundstadt.
- Alle Varianten sind verschieden.
- Der Spielplatz ist identisch mit dem Spielplatz-Test.
- Bauregeln: Wasser dicht, Kies gestützt, Pflanzen auf Erde, Schilder befestigt.
- Kein „Mika“, keine Einheiten wie °C, kWh oder Liter.

**Je Mission:**

| Mission | geprüft | Ergebnis |
|---|---|---|
| Natur | A/B nur Vorschau (Übernehmen wird abgelehnt), gemeinsame Lösung übernommen, Regenansicht läuft | ✓ |
| Technik | Laternen „nur bei Dunkelheit“ übernommen, Spielplatz bleibt grün, nachts leuchten 16 Laternen | ✓ |
| Mobilität | Parken A, B, C nacheinander: nur die Parkfläche ändert sich (0 Blöcke außerhalb), andere Beschlüsse bleiben | ✓ |
| Wohnen | A/B/C je 6 Wohnungen; 294 / 196 / 98 Felder bebaut; Karten zeigen die Werte | ✓ |
| Kurze Wege | Wege gemessen 53 / 35 / 23 Blöcke, enden an der Ladentür; Einkauf C bleibt beim Wechsel der Bildung erhalten | ✓ |
| Bildung | B, dann A: nur die Bildung ändert sich | ✓ |
| Finale | alle Beschlüsse sichtbar, Zukunftscheck vollständig, Vorher/Nachher, kein Mika | ✓ |

**Abnahmetests des Auftrags:**
- 1–8: ✓ automatisch in der Oberfläche geprüft. Testmodus mit eigenem Speicher, der Stand der Regie bleibt unberührt.
- 9: technisch ✓. In Minecraft Education selbst **offen**.
- 10: diese Datei, Abschnitt 6.5.

**Leistung:**
- 16 Zeichenaufrufe, etwa 63 000 Dreiecke.
- Im Stillstand werden 0 Bilder gezeichnet.
- Eine Variante neu zu zeigen dauert etwa 20 ms.
- Beim Start wird die Stadt in etwa 1 s gebaut.

**Offline:**
- Es gibt keine externen Ressourcen.
- Die Einzeldatei läuft auch in einem abgeschotteten Rahmen ohne Speicher (fremder Ursprung, wie beim Doppelklick).
- `file://` direkt konnte ich hier nicht öffnen.

**Nicht geprüft:**
- echter Beamer und Schul-Laptop
- Minecraft Education
- Firefox und Safari (getestet in Chromium)

## 8. Anpassen

- **Texte und Schritte:** `daten.js`. Bitte nah am Drehbuch bleiben.
- **Gestaltung einer Variante:** `stadtmodell.js` › `BAUE.<fläche>`. Danach `test.html` öffnen und die Welt neu erzeugen.
- **Einzeldatei neu bauen:** `python einzeldatei.py` im Ordner `stadt/`.
