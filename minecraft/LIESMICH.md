# Spielplatz-Test für Minecraft Education

Prototyp für **START IT SMART – Mission Natur**: In **derselben geöffneten Welt** wird ein grauer Platz durch einen
fertig gebauten Natur-Abenteuerspielplatz ersetzt und zuverlässig wieder zurückgesetzt. Die Welt wird dafür nicht neu importiert, und es läuft kein Block-für-Block-Aufbau.

**Seite mit Download, Befehlen und Testplan:** https://demo-testing123.github.io/smarty-soundboard/minecraft/
(oder im Soundboard oben auf **⛏ Minecraft**)

> **Stand:** Die Welt ist erzeugt und doppelt geprüft (siehe Abschnitt 8). **In Minecraft Education selbst ist sie noch nicht
> ausprobiert.** Den Test machen wir mit dem Testplan (Abschnitt 6).

---

## 1. Machbarkeit in Kürze

- **Machbar mit Bordmitteln von Minecraft Education.** Nötig sind keine Add-ons, kein Code Builder und keine Verbindung von außen.
- **Prinzip:** Die fertigen Varianten stehen in derselben Welt in geschlossenen **Vorlagen-Kammern direkt unter dem Platz**.
  Ein Befehl `/clone … replace` kopiert eine Kammer in einem Schritt auf den Platz. `replace` überschreibt dabei
  **jeden** Block des Platz-Quaders, auch mit Luft. Alte Bäume oder altes Wasser bleiben deshalb nicht zurück. Außerhalb des Quaders ändert sich nichts.
- **Auslöser:** Knöpfe auf Befehlsblöcken am Regieplatz oder derselbe Befehl im Chat. Ausgelöst wird von Hand in Minecraft,
  wie im Auftrag erlaubt. Eine automatische Verbindung von der Webseite zu Minecraft gibt es nicht.
- **.mcworld und Austausch sind zwei verschiedene Dinge:**
  - Eine `.mcworld` ist eine **komplette neue Welt**. Jeder Import legt eine neue Kopie in der Weltenliste an. Wir brauchen das nur **einmal vor der Vorlesung**, um die Ausgangswelt mit Platz und Kammern zu bekommen.
  - Der **Austausch eines Bauabschnitts** passiert danach nur noch per Befehl in der laufenden Welt.

## 2. Bestandsanalyse: Stadt-Konfigurator des Kollegen

`Stadt-Konfigurator.html` ist eine einzelne, 1,3 MB große Datei mit gebündeltem und verkleinertem Code. Darin stecken three.js 0.180, pako 2.2,
eine NBT-Bibliothek und 15 Vorschaubilder. Ich habe den Code entpackt und gelesen.

| Teil | Was er tut | Für den Spielplatz wiederverwendbar? |
|---|---|---|
| **Themenrunden** | 5 Runden mit A/B/C: Wohnen, Einkaufen, Mobilität, „Grün und Wasser“, Bildung und Freizeit. Texte mit der Figur Mika. Das Ergebnis ist ein 5-Zeichen-Code wie `ABCAB`. | **Nein.** Das Drehbuch hat Vorrang, Mika ist nicht gewünscht. Die Varianten der Runde „Grün und Wasser“ (Sportplatz mit Wassertank, Garten mit Regenmulde, tiefer Spiel- und Sportplatz) übernehme ich bewusst nicht. |
| **Geometrie / Stadtmodell** | Voxelmodell „Bahnhofsviertel“, 112 × 84 Blöcke, 64 hoch. Die Grundstadt wird per Code gebaut. Jede Runde baut ihren Bereich mit Hilfsfunktionen (Quader füllen, Baum, Bank, Laterne). Der Quartiersplatz liegt im Modell bei x 57–88, z 56–79, das ist etwa 32 × 24. | **Als Muster.** Quader-Hilfen und Bäume mit dauerhaftem Laub habe ich übernommen. Der Code selbst ist eng an die Runden-Logik gebunden. |
| **Weltgenerierung** | Setzt das Modell in eine 176 × 144 × 192 große Welt mit Uferlandschaft ringsum. Dazu kommen Startpunkt, Schilder und Wege. | **Prinzip übernommen:** dichter Blockpuffer → Chunks. |
| **Export Minecraft Education (.mcworld)** | Eigene LevelDB-Schreibung (Protokolldatei und Manifest mit CRC32C), Subchunks Version 9 mit Blockpalette, Höhenkarte und Biom, Schilder als NBT, level.dat (Stand 1.20.70) mit Education-Schaltern. | **Ja, direkt wiederverwendet.** Nach gleichem Aufbau lesbar neu geschrieben (`mcworld.js`) und ergänzt um Befehlsblöcke, Spielregeln für die Bühne und `.mcstructure`. Blocknamen und Zustände sind dieselben wie im Konfigurator. |
| **Export Java 1.20.4, JSON „Beschluesse.json“, QR-Teilen** | Region-Dateien für Java, Protokoll der Beschlüsse | Nein (wir arbeiten mit Education). |
| **3D-Ansicht** | three.js-Darstellung des Voxelmodells mit Drehen und Zoomen | Für den Austausch nicht nötig. Später denkbar als Vorschau der Varianten. |
| **Bedienoberfläche** | Runden-Karten, Fortschritt, Ergebnis, Download-Dialog | Nein. Ein neues Abstimmungs-Dashboard ist nicht beauftragt. |

**Was für unser Ziel fehlt:** Der Konfigurator erzeugt für jede Entscheidungskombination eine **neue komplette Welt**.
Austausch in einer laufenden Welt, gespeicherte Strukturen, Befehle oder Befehlsblöcke kommen darin nicht vor. Genau das ergänzt dieser Prototyp.

## 3. Technikentscheidung

| Weg (aktuelle Education-Version 26.30, Bedrock-Technik) | Bewertung |
|---|---|
| **`/clone` aus Vorlagen-Kammer** ✅ gewählt | Seit Jahren in Bedrock und Education. `replace` (Standard) kopiert alle Blöcke **einschließlich Luft**. Grenze: 655 360 Blöcke, der Platz braucht 16 384. Der Wechsel passiert sofort in einem Befehl. Die Vorlage steht sichtbar in der Welt, das Team kann sie **im Spiel umbauen**. Ein separater Speicherschritt ist nicht nötig. Voraussetzung: Quelle und Ziel sind geladen. Deshalb liegen die Kammern in denselben Chunks wie der Platz, dazu kommt ein Ticking-Bereich. |
| `/structure save` / `load` (Option) | Gibt es in Bedrock und Education. Grenze 64 × 384 × 64. `disk` speichert in der Welt. Kann **animiert** laden (`layer_by_layer`), was auf der Bühne schön wirkt. Braucht einmal Speichern. Ob beim Laden auch Luft geschrieben wird, sagt die Doku nicht ausdrücklich, deshalb prüft das Test 11. |
| Strukturblock (Menü am Block) | Gleiche Technik wie `/structure`, aber umständlicher auf der Bühne. Der Import von `.mcstructure` ist laut Microsoft nur unter Windows möglich und für Education nicht offiziell bestätigt. |
| Code Builder / MakeCode | Kann `blocks.clone` und Chat-Befehle. Braucht aber eine laufende Code-Verbindung, also mehr Fehlerquellen auf der Bühne. Agent und Builder bauen Block für Block und sind dafür zu langsam. Nur als **optionaler** Auslöser (Abschnitt 4). |
| `.mcworld` je Zustand | Erfüllt das Ziel nicht, weil jedes Mal eine neue Welt geladen werden müsste. |
| Automatische Steuerung von der Webseite | Nicht nachgewiesen und nicht verwendet. |

## 4. Der Prototyp

### Dateien

| Datei | Inhalt |
|---|---|
| `index.html`, `main.js`, `style.css` | Seite: Download, Befehle zum Kopieren, Ablauf nach Drehbuch, Testplan mit Häkchen, Draufsichten |
| `welt.js` | **Weltmodell und alle Koordinaten.** Vorlagen „grau“ und „grün“, Kammern, Regieplatz. Alle Befehle werden hieraus berechnet. |
| `mcworld.js` | Dateiformate: NBT, LevelDB, Subchunks, level.dat, ZIP, `.mcstructure` |
| `test.html` | 29 Selbsttests: Datei zurücklesen, Tausch simulieren, Bauregeln |

Die `.mcworld` entsteht beim Klick im Browser. Es gibt keinen Build-Schritt, und die Seite läuft auch offline.

### Koordinaten (x nach Osten, z nach Süden; Boden y 63, man steht auf y 64)

| Bereich | von | bis | Größe |
|---|---|---|---|
| **Platz** (sichtbar, wird überschrieben) | 0 59 0 | 31 74 31 | 32 × 16 × 32 = 16 384 Blöcke |
| Vorlage **GRAU** (Kammer) | 0 39 0 | 31 54 31 | gleich groß |
| Vorlage **GRÜN** (Kammer) | 0 19 0 | 31 34 31 | gleich groß |
| Kontrollkopie: Platz + 4 Blöcke Rand im Ausgangszustand | −4 −1 −4 | 35 14 35 | 40 × 16 × 40 = 25 600 |
| Ticking-Bereich `spielplatz` | −8 · −8 | 39 · 39 | 4 × 4 Chunks |
| Regieplatz (Startpunkt) | 17 80 47 | | Blick auf 16 63 14 |
| Aussichtspunkt Wasser | 16 70 38 | | Blick auf 14 61 16 |

Der Platz-Quader reicht 4 Schichten unter den Boden, für Mulde, tiefen Spielbereich und Zisterne, und 11 Schichten darüber, für die Bäume.

### Befehle

```
GRÜN:            /clone 0 19 0 31 34 31 0 59 0
GRAU:            /clone 0 39 0 31 54 31 0 59 0
Ansicht Übersicht: /tp @s 17 80 47 facing 16 63 14
Ansicht Wasser:    /tp @s 16 70 38 facing 14 61 16
Einmalig:        /tickingarea add -8 0 -8 39 0 39 spielplatz
Prüfen (grau):   /testforblocks -4 59 -4 35 74 35 -4 -1 -4 all
Prüfen (grün):   /testforblocks 0 19 0 31 34 31 0 59 0 all
```

Die Befehlsblöcke enthalten dieselben Befehle, nur mit `@p` statt `@s`. Mit Animation, nach einmaligem Speichern:

```
/structure save spielplatz_grau 0 39 0 31 54 31 false disk true
/structure save spielplatz_gruen 0 19 0 31 34 31 false disk true
/structure load spielplatz_gruen 0 59 0 0_degrees none layer_by_layer 3
/structure load spielplatz_grau 0 59 0
```

### Optional: Auslösen per Chatwort mit MakeCode (ungetestet)

Nur falls ihr lieber `gruen` und `grau` in den Chat tippt. Code Builder muss dafür verbunden sein, und das Programm muss laufen.

```javascript
player.onChat("gruen", function () {
    blocks.clone(world(0, 19, 0), world(31, 34, 31), world(0, 59, 0), CloneMask.Replace, CloneMode.Normal)
})
player.onChat("grau", function () {
    blocks.clone(world(0, 39, 0), world(31, 54, 31), world(0, 59, 0), CloneMask.Replace, CloneMode.Normal)
})
```

### Inhalt

- **Grau:** Betonplatten mit Fugen auf Schotter, vier Abflüsse, Betonwürfel und eine Bank ohne Lehne, ein Lichtmast. Kein Schatten, kein offener Boden.
- **Grün** (Drehbuch Mission Natur: „Beides gemeinsam!“, Natur-Abenteuerspielplatz):
  - 7 Bäume für Schatten, Wiese mit Blumen, wilde Ecke mit Insektenhotel, Totholz und niedriger Hecke
  - wasserdurchlässige Kieswege
  - Kletterturm mit Stufen und Rutsche, Schaukel, Balancierbalken und Trittstämme, Bänke und Picknicktisch
  - **bepflanzte Regenmulde** mit Zulauf vom Weg
  - **tiefer liegender Spielbereich**, zwei Stufen tief, mit Sitzstufen, Baumstümpfen und Kletterfelsen
  - **Zisterne** unter Glas, hellblau markiert, mit Gießleitung zum Baum
  - Drei Schilder benennen Mulde, Spielbereich und Zisterne. Es gibt keine echte Überflutung, wie im Drehbuch.
  - Die Gestaltung ist ein **Entwurf**. Ihr ändert sie direkt in der Grün-Kammer; Seite, Abschnitt 5, „So ändert ihr …“.
- **Umgebung:** Bordstein, Gehweg und Straße ringsum, acht graue Hochhäuser („zentraler Platz zwischen Hochhäusern“).
- **Spielregeln der Welt:** Kreativmodus, Befehle an, Befehlsblöcke an (ohne Chat-Ausgabe), immer Mittag, kein Wetter, keine Tiere,
  `randomtickspeed 0`. Damit wächst, verwelkt und verfällt nichts, und die Vorlagen bleiben unverändert.

## 5. Schritt-für-Schritt-Anleitung

**Vorbereitung (einmal, vor der Vorlesung):**
1. Seite öffnen und **⬇ Spielplatz-Test.mcworld** klicken. Die Datei doppelklicken, oder in Minecraft Education „Spielen“ › „Importieren“ wählen.
2. Die Welt öffnet sich auf dem Regieplatz. Falls Befehle abgelehnt werden: Welteinstellungen › „Cheats aktivieren“.
3. Im Chat (Taste `T` oder `/`, Einfügen mit Strg+V): `/tickingarea add -8 0 -8 39 0 39 spielplatz`
4. Prüfen: `/testforblocks -4 59 -4 35 74 35 -4 -1 -4 all` → 25 600 Blöcke verglichen.

**In der Vorlesung:** Knöpfe links auf dem Regieplatz (immer Knopf in Blickrichtung anklicken):
GRAU · GRÜN · ANSICHT Wasser · ANSICHT Übersicht. Am Aussichtspunkt Wasser gibt es einen Knopf ZURÜCK.
Zuordnung zum Drehbuch: Seite, Abschnitt 3. Für die Leinwand `F1` drücken. Außerdem `/gamerule showcoordinates false` und `/gamerule sendcommandfeedback false`.

**Zurücksetzen:** Knopf GRAU oder `/clone 0 39 0 31 54 31 0 59 0`. Das geht beliebig oft.

**Grün-Entwurf ändern:** `/tp @s 16 24 24 facing 16 25 8` (in der Grün-Kammer), dort bauen, dann GRÜN drücken.
Die Kammerwände nicht abbauen. Wasser nur in rundum geschlossenen Becken.

## 6. Testplan

Steht mit Kopierknöpfen und Häkchen auf der Seite (Abschnitt 4). Kurzfassung:

| Test | Was er beweist |
|---|---|
| T0 Version notieren | Welche Education-Version läuft auf dem Vorlesungs-Laptop |
| T1 Welt öffnet sich | Die Datei wird von Education akzeptiert |
| T2 Prüfung grau (25 600) | Die Welt ist vollständig und richtig angekommen |
| T3 GRÜN + Prüfung grün (16 384) + vier Randstreifen | Der Platz ist exakt die Vorlage, die Nachbarn sind unverändert |
| T4 Zisterne 10 s beobachten | Kein Wasser läuft aus |
| T5 GRAU + Prüfung grau | Nichts Altes bleibt zurück (auch Laub, Wasser, Schilder), der Rand ist unverändert |
| T6 10 × wechseln | Wiederholbar |
| T7 Fremdblock auf Platz und Bordstein | Der Platz wird vollständig überschrieben, der Bordstein bleibt |
| T8 Speichern, schließen, öffnen | Die Welt bleibt über Neustarts gleich, die Knöpfe gehen weiter |
| T9 Chatbefehle | Ausweg ohne Befehlsblöcke |
| T10 Beamer, F1 | Die Ansichten taugen für die Leinwand |
| T11 Option `/structure` | Animation und Luft-Überschreiben |

## 7. Übertrag in die Show-Welt

Der Prototyp ist eine eigene Testwelt. Für die echte Stadt gibt es zwei Wege:

- **A, empfohlen:** Der Kollege ergänzt seinen Education-Export. Unter seinen Quartiersplatz kommen zwei gleich große Kammern,
  dazu der Regieplatz mit Knöpfen. Im Konfigurator ist dort nur Erde. Die Änderung kommt also nur dazu, und `mcworld.js` zeigt die Formate für Befehlsblöcke.
- **B, in der fertigen Show-Welt per Befehl:** Den Platz-Quader festlegen, zwei Kammern darunter mit `/fill … air` freiräumen,
  den grauen Ausgangszustand mit `/clone` vom Platz in die Kammer sichern und die grüne Fassung in der anderen Kammer bauen.
  Dafür ist auch `spielplatz_gruen.mcstructure` da, dessen Import in Education allerdings ungeprüft ist.

Der Platz darf bis zu 64 × 64 groß sein; damit funktionieren beide Wege, `/clone` und `/structure`.

## 8. Grenzen und Risiken

**Geprüft (ohne Minecraft):**
- `test.html`, 29 von 29: Die `.mcworld` wird zurückgelesen, also ZIP-Prüfsummen, LevelDB-Protokoll mit CRC32C, level.dat und alle
  2,2 Mio. Blöcke im Vergleich mit dem Modell. Dazu kommen Schilder und Befehlsblöcke in der Datei. 10 × GRÜN/GRAU wird im Modell simuliert: Der Platz ist exakt, außerhalb ändert sich nichts, und danach ist der Ausgangszustand wieder da. Bauregeln: Wasser dicht, Kies gestützt, Pflanzen auf Erde, Schilder befestigt.
- **Unabhängige Gegenprobe** (einmalig lokal, nicht Teil des Repos): Die Welt mit **Amulet** geöffnet, das Mojangs LevelDB-Bibliothek nutzt.
  level.dat, Befehlsblock mit Befehl und Schild mit Text werden richtig gelesen, und Platz und beide Kammern stimmen in 3 × 16 384 Blöcken
  mit den `.mcstructure`-Dateien überein. Außerdem lassen sich alle 48 verwendeten Blockarten aus dem Format 1.20.70 sauber
  ins Format **26.30** übersetzen (z. B. `tallgrass` → `short_grass`, `chain` → `iron_chain`).

**Ungeprüft:**
- Öffnen und Wechseln in **Minecraft Education** selbst (T1–T10)
- Ob die Knöpfe auf den mitgelieferten Befehlsblöcken auslösen. Das Versionsfeld steht auf 13, weil ich es nicht genauer belegen konnte. Falls nicht: Chatbefehle, oder den Befehl im Befehlsblock neu eintragen.
- `/structure` mit Animation und ob beim Laden auch Luft überschrieben wird (T11)
- Wortlaut der Meldungen von `/testforblocks` auf Deutsch
- iPad und Chromebook (geplant ist ein Windows-Laptop)

**Risiken und Gegenmittel:**
- Steht eine Spielfigur beim Wechsel auf dem Platz, kann sie in Blöcken stecken. Die Kamera steht deshalb auf dem Regieplatz.
- Spielen Kinder im Mehrspielermodus mit und verändern den Platz, macht GRAU alles wieder sauber.
- Beim Drücken eines Knopfes ist dieser kurz im Bild. Die Alternative ist der Chatbefehl.
- Wird eine Kammerwand abgebaut, ändert sich nur die Vorlage. `/testforblocks` zeigt das, weil die Prüfung dann fehlschlägt.

**Offene Fragen ans Team:** Welche Education-Version läuft auf dem Vorlesungs-Laptop? Kommt die Show-Welt vom Kollegen (dann Weg A)?
Gefällt der Grün-Entwurf, oder soll etwas anders aussehen?
