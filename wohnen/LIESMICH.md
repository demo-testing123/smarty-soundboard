# Wie bauen wir unsere Zukunftsstadt? – Wohnen, Bauen und CO₂

Interaktive 3D-Simulation für die Kinderuni **START IT SMART – Mission Zukunft** (Klassen 1–4, Großleinwand).
Sie ersetzt das Experiment mit sechs Bauklötzen, zeigt die drei Planungsvarianten aus dem Konzept
„Stadt von morgen“ und einen Lernblock über Baustoffe, CO₂ und Weiterbauen im Bestand.

**Start:** https://demo-testing123.github.io/smarty-soundboard/wohnen/
oder im Soundboard oben auf **🏠 Wohnen** (öffnet ein neues Fenster für den Beamer).

## 1. Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Seite mit Startbildschirm, Leisten und Anzeigen |
| `style.css` | Gestaltung, 16:9-Bühne, Schriftgrößen relativ zur Bildhöhe |
| `config.js` | **alle Texte, Pläne der Varianten und Zeiten** – hier wird angepasst |
| `model.js` | Modell ohne Grafik: berechnet alle angezeigten Zahlen aus dem Raster |
| `scene3d.js` | 3D-Modelle mit Three.js (Low-Poly, feste isometrische Kamera) |
| `main.js` | Bedienung: Modi, Schritte, Tasten, Moderationsinfo |
| `test.html` | Abnahmetests (25 Prüfungen, inkl. 10 × Moduswechsel) |
| `../lib/three.module.min.js` | Three.js r160, lokal (kein CDN) |
| `../start-lokal.bat` | Startskript für Windows ohne Internet |

Es gibt keinen Build-Schritt und keine `package.json`: Die Dateien laufen so, wie sie sind.

## 2. Starten und vorführen

- **Online:** Link oben öffnen. Beim ersten Öffnen speichert der Browser alles für den Offline-Betrieb
  (gemeinsamer Service Worker mit dem Soundboard). Danach läuft die Seite im selben Browser ohne Internet.
- **Lokal ohne Internet:** im Ordner `smarty-soundboard` die Datei `start-lokal.bat` doppelklicken
  (braucht Python 3). Der Browser öffnet `http://localhost:8000/wohnen/`. Doppelklick auf
  `index.html` funktioniert nicht – dann erscheint ein Hinweis.
- **Vollbild:** `F` oder ⛶. Im Vollbild verschwindet der Mauszeiger nach 3 Sekunden.
- Chrome oder Edge in aktueller Version; geprüft bei 1920 × 1080 und 1366 × 768.

### Bedienung

Die Leisten unten bleiben immer sichtbar. Nichts schaltet automatisch weiter, es gibt keinen Countdown
und keinen Ton.

| Aktion | Taste | Knopf |
|---|---|---|
| Startbildschirm | `0` | ⌂ |
| Experiment | `1` | Experiment |
| Variante A / B / C | `2` / `3` / `4` (oder `A` `B` `C`) | Variante A / B / C |
| Aufstocken & CO₂ | `5` | Aufstocken & CO₂ |
| nächster / vorheriger Schritt im Modus | `→` / `←`, `Leertaste`, Bild↓ / Bild↑ (Presenter) | Schrittleiste |
| Alle Varianten vergleichen | `V` | Alle vergleichen |
| Zurücksetzen (aktueller Modus) | `R` | Zurücksetzen |
| Info für Moderation | `I` | Info für Moderation |
| Vollbild | `F` | ⛶ |

**Schritte:** Experiment: Nebeneinander → Vermutung zeigen → Stapeln.
Varianten: A → B → C → Alle vergleichen. Aufstocken: Bestand → Aufstocken → Materialwissen
(Karten antippen) → Was wird eingespart? → Mini-Check → Antwort.

## 3. Welche Zahlen woraus berechnet werden

Alle Zahlen kommen aus `model.js` und dem offengelegten Raster in `config.js`. Nichts ist fest eingetragen.

- **Rasterfeld:** 1 × 1 Einheit. Das Grundstück der Varianten ist **12 × 12 = 144 Rasterfelder**.
- **Wohnmodul = 1 Wohnung:** Grundfläche **2 × 2 Rasterfelder**, eine Etage hoch.
- **Experiment:** Grundstück 3 × 3 Modulfelder. „Belegte Modul-Grundflächen“ zählt die verschiedenen
  Felder, auf denen Module stehen. „Frei geworden“ zählt die Felder, die nebeneinander belegt waren und
  jetzt frei sind. Ergebnis: nebeneinander 6 / 0, gestapelt 2 / 4, immer 6 Wohnungen.
- **Varianten:** Jeder Plan ist eine Zeichenkarte (H Haus, P privater Garten, G gemeinsamer Hof,
  O öffentlicher Park, W Weg). Gezählt werden die Zeichen.
  - **Bebaute Bodenfläche** = Felder H.
  - **Unbebaut** = 144 − H, aufgeteilt in Grün (P/G/O) und Wege (W).
  - **Wohnungen** = Gebäude (zusammenhängende H-Flächen) × Module je Etage × Etagen.

| Variante | Gebäude × Etagen | Wohnungen | Bebaut | Unbebaut | davon Grün | Wege | Grünflächentyp |
|---|---|---|---|---|---|---|---|
| A · Häuser mit eigenen Gärten | 6 × 1 | 6 | 24 | 120 | 96 | 24 | privat |
| B · Häuser mit gemeinsamen Höfen | 3 × 2 | 6 | 12 | 132 | 110 | 22 | gemeinsam |
| C · Höhere Häuser mit Park | 2 × 3 | 6 | 8 | 136 | 110 | 26 | öffentlich |

Die Zahlen sind **Rasterfelder eines vereinfachten Modells, keine Quadratmeter**. Gartenfläche (A) ist privat,
der Hof (B) gehört den Nachbarn gemeinsam, nur der Park (C) ist öffentlich. Die Varianten sind keine Rangfolge.

## 4. Bekannte Einschränkungen

- Vereinfachtes Modell: gleiche Modulgröße, ohne Treppenhäuser, Abstandsflächen, Bauvorschriften
  oder Erschließung im Gebäude. Ein echtes Hochhaus spart nicht immer genau so viel Boden.
- Der Aufstocken-Block ist ein schematisches Modell nach dem Vorbild der Frankfurter Platensiedlung,
  nicht maßstabsgetreu. Er nennt bewusst keine CO₂-Mengen oder Prozentwerte.
- Das Experiment nutzt denselben Maßstab wie die Varianten und wirkt deshalb kleiner als die Varianten.
- Ohne WebGL (sehr alte Rechner oder ausgeschaltete Hardwarebeschleunigung) erscheint nur ein Hinweis,
  es gibt keine 2D-Ersatzansicht.
- Offline klappt erst, nachdem die Seite einmal mit Internet geöffnet wurde (oder lokal über `start-lokal.bat`).

## 5. Mögliche Verbesserungen (nach der ersten Version)

1. **Experiment größer zeigen:** eigene Zoomstufe nur für das Experiment, damit die sechs Module auch
   in der letzten Reihe groß wirken (dann mit Hinweis „anderer Maßstab als bei A/B/C“).
2. **Moderationsfenster auf zweitem Bildschirm:** Notizen und Tasten auf dem Laptop, die Leinwand
   zeigt nur das Modell.
3. **Wege in A/B/C einblendbar:** auf Knopfdruck Zugänge von der Straße farbig hervorheben, damit
   die unterschiedlichen Erschließungen der Varianten noch deutlicher werden.

## Prüfen

`test.html` öffnen (online oder lokal). Geprüft werden unter anderem:
- Experiment 6 / 6 / 0 und 6 / 2 / 4 mit zwei Gebäuden à drei Etagen.
- A, B, C mit je genau 6 Wohnungen auf demselben 12 × 12-Grundstück; Flächen ergeben zusammen 144.
- Getrennte Nutzungsrechte (nur privat, nur gemeinsam, nur öffentlich).
- CO₂-Texte ohne Zahlen und Prozentwerte, Originaltexte der drei Infokarten.
- 10 × alle Modi wechseln ohne zusätzliche Objekte, Geometrien oder Texturen.
