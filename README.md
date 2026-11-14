# SMARTy Soundboard

Soundboard für die Grundschul-Bühnenshow **START IT SMART · Mission Zukunft: Rettet unsere Stadt!**
Hier liegen die Sätze des Roboterhunds SMARTy und der Erzählertext der Eröffnung. Jeder Satz wird per Klick oder Taste abgespielt.

## Bedienung

| Aktion | Klick / Taste |
|---|---|
| Satz abspielen | Pad anklicken oder Taste drücken (SMARTy `1`–`7`, Eröffnung komplett `Q`, Erzähler-Einzelteile `W E R T Z U`) |
| Laufenden Satz stoppen | dasselbe Pad oder dieselbe Taste noch einmal |
| Alles sofort stoppen | `Leertaste` oder `Esc`, roter Knopf |
| Alles weich ausblenden (1,5 s) | `F` oder „Ausblenden“ |
| Lautstärke | Regler oben oder `↑` / `↓` |
| Robo-Anteil je Stimme | Regler „Robo“ (Standard SMARTy 20 %, Erzähler 0 %; Doppelklick setzt zurück) |
| Mehrere Sätze gleichzeitig | Haken bei „Überlappen“ |
| Satz als WAV speichern (mit Effekt) | Symbol ⤓ unten rechts auf dem Pad |

Ohne „Überlappen“ beendet ein neuer Satz den laufenden Satz.

## Eröffnung „Die Zukunft braucht euch“ (Taste `Q`)

Die sechs Erzählerabschnitte laufen hier als eine Sequenz mit Pausen, Musik und Effekten. Grundlage ist die Musik- und Soundregie aus dem Intro-PDF. Die Sequenz dauert etwa 1:31.

- **Musik und Effekte** sind komplett selbst berechnet (`tools/intro.py`), es gibt keine fremden Samples. Damit sind sie frei für öffentliche Aufführungen. Der Ablauf: leises Pulsieren → heller Teil mit Rhythmus und Signaltönen → Einschnitt bei „Doch …“ mit Summen → warmer, aufsteigender Akkord → Trommeln, Akzent auf „EUCH!“ → Startsignal, Puls, Impuls auf jede Countdown-Zahl → Whoosh/Impact bei „ZEITSPRUNG!“.
- Unter der Sprache wird die Musik automatisch etwa 10 dB leiser, in den Pausen kommt sie wieder hoch.
- **[`audio/intro/Regie.md`](audio/intro/Regie.md)** listet die tatsächlichen Zeitmarken aller Einsätze, nützlich für Licht und Leinwand.
- **Getrennte Spuren** für Audacity: `audio/intro/Spur_Sprecher.mp3`, `Spur_Musik.mp3`, `Spur_Effekte.mp3`.
- Die Einzelteile `W`–`U` gibt es weiterhin, ohne Musik, z. B. für Proben.
- Ändert sich ein Erzählertext, baut GitHub die Sequenz samt Musik automatisch neu. Die Pausen zwischen den Abschnitten lassen sich am Eintrag `Erzaehler_00_Eroeffnung` mit `"pausen": [2.4, 2.0, 2.4, 2.0, 2.6]` einstellen, die Musik vor dem ersten Wort mit `"vorlauf": 3.2`.

**Erzählerstimme:** tief, rau und ruhig im Stil eines Kino-Trailers. Die Grundstimme ist Christoph (−22 Hz, etwas langsamer). Dazu kommen 1,5 Halbtöne tiefere Formanten (wirkt „größer“), mehr Brustton und ein leicht rauchiger Anteil. Eingestellt wird das in `sounds.json` unter `"klang"`. Bei den Stimmproben gibt es die Varianten „ohne Rauheit“, „noch tiefer“ und „wie vorher“ zum Vergleich. Echte Stimmen bestimmter Synchronsprecher werden nicht nachgebaut.

## In der Turnhalle

- Die Seite **vorher einmal mit Internet öffnen**. Unten erscheint dann „offline bereit“. Ab dann läuft sie im selben Browser auch ohne Netz.
- Laptop per Klinke oder USB an die Tonanlage anschließen. Mit **07 · Soundcheck** die Verständlichkeit im Raum prüfen.
- Am besten Chrome oder Edge verwenden. Den Laptop vorher auf „nicht schlafen“ stellen.

## Neue Sätze oder Stimmen einbinden

Alles steht in **`sounds.json`**. Die Datei lässt sich direkt auf GitHub bearbeiten (Stift-Symbol). Nach dem Speichern erzeugt GitHub die Sprachdateien automatisch. Nach etwa 2 Minuten die Seite neu laden.

**Neuer Satz** – einen Block unter `"saetze"` ergänzen:

```json
{
  "id": "SMARTy_08_Bellen", "stimme": "smarty", "taste": "8",
  "titel": "08 · Bellen",
  "text": "Wuff! Das heißt auf Roboterisch: Hallo!",
  "sprechen": "Wuff! [Pause 0.4] Das heißt auf Roboterisch: Hallo!",
  "einsatz": "Wenn SMARTy die Kinder begrüßt."
}
```

- `id`: eindeutig, wird zum Dateinamen (`audio/SMARTy_08_Bellen.mp3`)
- `text`: steht auf dem Pad. `sprechen` (optional) wird gesprochen, mit Pausen wie `[Pause 0.5]` (Sekunden)
- `taste` (optional): sonst wird eine freie Taste vergeben
- `tts` (optional): Einstellungen nur für diesen Satz, z. B. `{ "rate": "-10%" }`

**Neue Stimme** – einen Block unter `"stimmen"` ergänzen und in den Sätzen mit `"stimme": "<id>"` verwenden:

```json
{
  "id": "buergermeisterin", "name": "Bürgermeisterin", "rolle": "freundlich, bestimmt",
  "farbe": "#a78bfa",
  "tts": { "voice": "de-DE-TanjaNeural", "pitch": "+0Hz", "rate": "+0%" },
  "robo": 0
}
```

Optional formt `"klang": { "formant": -1.5, "tiefe": 3, "rau": 0.35 }` die Stimme. `formant` in Halbtönen, negativ = größer/tiefer. `tiefe` = Brustton in dB. `rau` = rauchiger Anteil von 0 bis 1.

Deutsche Grundstimmen: `de-DE-ChristophNeural`, `de-DE-TanjaNeural`, `de-AT-JonasNeural`, `de-AT-IngridNeural`, `de-CH-JanNeural`, `de-CH-LeniNeural`. Die mehrsprachigen Stimmen wie `en-US-AndrewMultilingualNeural` sprechen auch Deutsch, aber mit Akzent. `pitch` hebt oder senkt die Tonhöhe (`+20Hz`), `rate` ändert das Tempo (`-10%`).

**Stimmproben:** Sätze mit `"gruppe": "proben"` erscheinen unten im Bereich „Stimmproben“ und haben keine Taste.

## Eigene Aufnahmen statt Computerstimme

- **Schnell, nur auf einem Gerät:** „＋ Eigener Sound“ öffnen und eine Datei laden oder mit dem Mikrofon aufnehmen. Der Robo-Effekt der Stimme wird live dazugemischt. Die Lautstärke wird automatisch angeglichen.
- **Dauerhaft für alle:** Die Datei z. B. als `audio/eigene/SMARTy_01_Landung.mp3` hochladen. Beim Satz in `sounds.json` dann `"datei": "audio/eigene/SMARTy_01_Landung.mp3"` eintragen. Dieser Satz wird nicht mehr per Computerstimme erzeugt.
- Mit ⤓ lässt sich jeder Satz samt Robo-Effekt als WAV speichern, z. B. für eine andere Abspiel-Software.

## Lokal arbeiten (optional)

```bash
pip install -r tools/requirements.txt
python tools/generate.py          # nur neue oder geänderte Sätze
python tools/generate.py --alle   # alles neu
python tools/intro.py             # Eröffnung mit Musik (nach generate.py)
python -m http.server 8000        # Seite unter http://localhost:8000
```

## Technik

- Statische Seite (HTML/CSS/JS) ohne Abhängigkeiten. Web Audio spielt die Sätze verzögerungsfrei ab.
- **Robo-Effekt** (live): Ringmodulator mit 55 Hz und metallischer Kammfilter mit 7 ms werden dem Originalklang beigemischt. Dazu kommen ein Präsenz-EQ bei 3 kHz für die Verständlichkeit in der Halle und ein leichter Kompressor.
- **Sprachdateien:** [edge-tts](https://github.com/rany2/edge-tts) mit Microsoft-Neuralstimmen. Die Dateien werden auf −16 LUFS und −1,5 dBTP angeglichen. edge-tts nutzt den Vorlesedienst von Microsoft Edge über eine inoffizielle Schnittstelle. Für die Schulshow ist das üblich. Wer ganz sicher gehen will, spricht selbst ein (siehe oben).
- **Offline:** Ein Service Worker speichert Seite und Sounds im Browser.
