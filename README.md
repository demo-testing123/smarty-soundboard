# SMARTy Soundboard

Soundboard für die Grundschul-Bühnenshow **START IT SMART · Mission Zukunft: Rettet unsere Stadt!**
Hier liegen die Sätze des Roboterhunds SMARTy und der Erzählertext der Eröffnung. Jeder Satz wird per Klick oder Taste abgespielt.

## Bedienung

| Aktion | Klick / Taste |
|---|---|
| Satz abspielen | Pad anklicken oder Taste drücken (SMARTy `1`–`7`, Erzähler `Q W E R T Z`) |
| Laufenden Satz stoppen | dasselbe Pad oder dieselbe Taste noch einmal |
| Alles sofort stoppen | `Leertaste` oder `Esc`, roter Knopf |
| Alles weich ausblenden (1,5 s) | `F` oder „Ausblenden“ |
| Lautstärke | Regler oben oder `↑` / `↓` |
| Robo-Anteil je Stimme | Regler „Robo“ (Standard SMARTy 20 %, Erzähler 0 %; Doppelklick setzt zurück) |
| Mehrere Sätze gleichzeitig | Haken bei „Überlappen“ |
| Satz als WAV speichern (mit Effekt) | Symbol ⤓ unten rechts auf dem Pad |

Ohne „Überlappen“ beendet ein neuer Satz den laufenden Satz.

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
python -m http.server 8000        # Seite unter http://localhost:8000
```

## Technik

- Statische Seite (HTML/CSS/JS) ohne Abhängigkeiten. Web Audio spielt die Sätze verzögerungsfrei ab.
- **Robo-Effekt** (live): Ringmodulator mit 55 Hz und metallischer Kammfilter mit 7 ms werden dem Originalklang beigemischt. Dazu kommen ein Präsenz-EQ bei 3 kHz für die Verständlichkeit in der Halle und ein leichter Kompressor.
- **Sprachdateien:** [edge-tts](https://github.com/rany2/edge-tts) mit Microsoft-Neuralstimmen. Die Dateien werden auf −16 LUFS und −1,5 dBTP angeglichen. edge-tts nutzt den Vorlesedienst von Microsoft Edge über eine inoffizielle Schnittstelle. Für die Schulshow ist das üblich. Wer ganz sicher gehen will, spricht selbst ein (siehe oben).
- **Offline:** Ein Service Worker speichert Seite und Sounds im Browser.
