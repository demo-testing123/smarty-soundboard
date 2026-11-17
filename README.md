# SMARTy Soundboard

Soundboard für die Grundschul-Bühnenshow **START IT SMART · Mission Zukunft: Rettet unsere Stadt!**
Hier liegen die Sätze des Roboterhunds SMARTy und die Eröffnung mit Erzähler und Musik. Jeder Satz wird per Klick oder Taste abgespielt.

## Bedienung

| Aktion | Klick / Taste |
|---|---|
| Satz abspielen | Pad anklicken oder Taste drücken (SMARTy `1`–`0`, `W`–`Ü` `+`, `G`–`#`, `Y`–`,`; Eröffnung als Film `Q`, Zeitmaschine `A S D`). `Ü Ö Ä + #` gelten für die deutsche Tastatur. |
| Laufenden Satz stoppen | dasselbe Pad oder dieselbe Taste noch einmal |
| Alles sofort stoppen | `Leertaste` oder `Esc`, roter Knopf |
| Alles weich ausblenden (1,5 s) | `F` oder „Ausblenden“ |
| Lautstärke | Regler oben oder `↑` / `↓` |
| Robo-Anteil je Stimme | Regler „Robo“ (Standard SMARTy 20 %, Erzähler 0 %; Doppelklick setzt zurück) |
| Mehrere Sätze gleichzeitig | Haken bei „Überlappen“ |
| Satz als WAV speichern (mit Effekt) | Symbol ⤓ unten rechts auf dem Pad |
| Pads und Bereiche umstellen, Platz verteilen | „⇄ Anordnen“: Pad oder Kopf eines Bereichs ziehen = verschieben; Griff zwischen zwei Blöcken nach links/rechts ziehen = Breite zwischen beiden verteilen; Tastatur `←` `→` bzw. `Umschalt`+`←` `→`. Danach „Für alle Geräte speichern“ (siehe unten) |

Ohne „Überlappen“ beendet ein neuer Satz den laufenden Satz.

## Eröffnung „Die Zukunft braucht euch“ (Taste `Q`)

Der Erzähler hat genau einen Sound: die komplette Eröffnung als eine Sequenz mit Pausen, Musik und Effekten, etwa 1:33 lang. Grundlage sind die Musik- und Soundregie aus dem Intro-PDF und die **Sprecheraufnahme** `audio/eigene/Erzaehler_Eroeffnung_ElevenLabs.mp3`.

- **Sprache:** Die Aufnahme bleibt unverändert, sie wird nur sanft komprimiert. An den Stellen aus der Regie verlängert das Skript die Pausen zwischen den Sätzen: „Doch … irgendetwas“, „Fantasie / Mut / Ideen“, vor „EUCH!“, der Countdown kommt etwa im Sekundentakt.
- **Musik und Effekte** sind komplett selbst berechnet (`tools/intro.py`), es gibt keine fremden Samples. Damit sind sie frei für öffentliche Aufführungen. Der Ablauf: leises Pulsieren → heller Teil mit Rhythmus und Signaltönen → Einschnitt bei „Doch …“ mit Summen → warmer, aufsteigender Akkord → Trommeln, Akzent auf „EUCH!“ → Startsignal, Puls, Impuls auf jede Countdown-Zahl → Whoosh/Impact bei „ZEITSPRUNG!“.
- Unter der Sprache wird die Musik automatisch etwa 10 dB leiser, in den Pausen kommt sie wieder hoch.
- **[`audio/intro/Regie.md`](audio/intro/Regie.md)** listet die tatsächlichen Zeitmarken aller Einsätze, nützlich für Licht und Leinwand.
- **Getrennte Spuren** für Audacity: `audio/intro/Spur_Sprecher.mp3`, `Spur_Musik.mp3`, `Spur_Effekte.mp3`.

### Eröffnungsfilm (Beamer)

Taste `Q` spielt die Eröffnung als **Film mit Ton im Vollbild** (`film/Eroeffnung_Film.mp4`, 1920×1080). Bildwechsel, Countdown-Zahlen und der weiße Blitz sind auf die Tonspur gerendert und bleiben dadurch bildgenau synchron.

- Laptop und Beamer **gespiegelt** betreiben. Die Seite schaltet beim Start selbst in den Vollbildmodus.
- Nach dem Blitz bleibt das Bild **schwarz stehen**. Die SMARTy-Tasten `1`–`7` funktionieren weiter, man sieht sie dabei nur nicht. Während der Film läuft, brechen andere Sounds ihn nicht ab.
- `Leertaste` stoppt den Film sofort, `F` blendet Bild und Ton weich nach Schwarz aus. In beiden Fällen bleibt das Bild schwarz.
- `Esc` (oder ein Klick nach dem Filmende) beendet das Vollbild und führt zurück zum Soundboard. Während der Film läuft, ignoriert die Seite Klicks.
- Ohne Haken bei **🎬 Film zeigen** (im Erzähler-Bereich) spielt `Q` nur den Ton, z. B. für Proben ohne Beamer.
- Der Film wird wie die Sounds im Browser gespeichert und läuft dadurch auch offline. 🎞 auf dem Feld speichert ihn als MP4.
- Erzeugt wird er im Projekt `StartItSmart_Eroeffnung_Film` (`tools/film.py`). Ändert sich die Tonspur, dort neu rendern und die Datei nach `film/` kopieren.

**Einstellungen** am Eintrag `Erzaehler_00_Eroeffnung` in `sounds.json` (GitHub baut danach automatisch neu):

| Wert | Bedeutung |
|---|---|
| `aufnahme` | Pfad der Sprecheraufnahme |
| `abschnitte` | die 6 Abschnitte mit Startzeit in der Aufnahme (Sekunden, ungefähr reicht) und Text |
| `pausen` | Pausen zwischen den 6 Abschnitten, z. B. `[2.4, 2.0, 2.4, 2.0, 2.6]` |
| `vorlauf` | Musik vor dem ersten Wort (Sekunden) |
| `pause_min` | Mindestpause zwischen zwei Sätzen |
| `pausen_innen` | einzelne Pausen, z. B. `"3.1": 0.9` = Abschnitt 3, nach dem 1. Satzteil 0,9 s |
| `countdown_takt` | Abstand der Countdown-Zahlen (Beginn zu Beginn) |

**Neue Aufnahme einsetzen:** Die Datei unter demselben Namen hochladen, also `audio/eigene/Erzaehler_Eroeffnung_ElevenLabs.mp3` ersetzen. Wenn sich das Tempo ändert, die sechs Startzeiten bei `abschnitte` anpassen. Das Skript findet die Satzteile über die Pausen selbst. Es bricht mit einer Meldung ab, wenn die Startzeiten nicht passen.

## Zeitmaschine (KI) – Tasten `A S D`

Der Bordcomputer der Zeitmaschine meldet sich in der Ankunftsszene nach dem Intro. Die Stimme ist weiblich (Grundstimme Tanja), klar, sachlich und etwas langsamer. Sie klingt leicht elektronisch, aber ohne Roboterverzerrung, und unterscheidet sich damit deutlich vom Erzähler und von SMARTy.

| Taste | Ansage | Ton | Leinwand |
|---|---|---|---|
| `A` | Zeitreise abgeschlossen. Ziel erreicht. Willkommen in der Vergangenheit. | Bestätigungston vorweg | ZEITREISE ABGESCHLOSSEN |
| `S` | Warnung! Systemfehler! Unerwartete Alterstransformation festgestellt. … | zwei Warntöne vorweg | SYSTEMFEHLER: ALTERSTRANSFORMATION |
| `D` | Achtung! Zusätzlicher Passagier erkannt. Identifikation läuft … Roboterhund SMARTy identifiziert. Passagier war nicht angemeldet. | Scan-Geräusch in der Pause | UNBEKANNTER PASSAGIER ERKANNT |

Die Töne liegen etwa 8–10 dB unter der Sprache. Jede Ansage lässt sich einzeln abspielen. Mit ⤓ speichert man sie als WAV.

## SMARTy nach Szenen (Drehbuch vom 16.11.2026)

Die SMARTy-Pads sind nach den Szenen im Drehbuch geordnet. Die Tasten der älteren Sätze sind gleich geblieben.

| Szene | Taste | Clip |
|---|---|---|
| Ankunft | `8` `9` `0` | Heimlicher Passagier · Mitgeschmuggelt · Sehr guter Grund |
| Mission Natur | `3` | N1 · Ich habe 327 Computerspiele gespeichert … |
| | `4` | N2 · Aha! Menschen brauchen also nicht nur Computer … |
| | `W` | N3 · Wetterwarnung! Starkregen im Anmarsch … (Textvorschlag, erst nach Freigabe) |
| | `E` | N4 · Neue Erkenntnis gespeichert: … Regenwasser auffangen … (Textvorschlag, erst nach Freigabe) |
| Mission Technik | `R` | T1 · Sprachbefehl nicht erkannt … Helligkeitssensor verwenden. |
| | `T` | T2 · Programm verstanden. Bereit für den Praxistest. |
| | `Z` | T3 · Programmoptimierung erkannt … Sehr gute Idee, Zukunftsteam! |
| | `U` | T4 · Experiment erfolgreich … in die Stadtplanung übernommen werden. |
| | `I` | T5 · Mission Technik abgeschlossen. Zukunftsstadt aktualisiert. |
| | `O` | T6 · Warnung. Verkehrsproblem erkannt. (optional) |
| Mission Mobilität | `Y` `X` `C` `V` | M1 · Verkehrsanalyse … · M2 · Jeder Parkplatz braucht Fläche … · M3 · Vorschlag: Parkplätze bündeln … · M4 · … Geduld … nicht erkannt. |
| | `B` `N` `M` `,` | M5 · Funkverbindung hergestellt … · M6 · … darf niemanden gefährden … · M7 · Test erfolgreich (mBot) … · M8 · Mission Mobilität abgeschlossen … |
| Mission Wohnen | `G` `H` `J` `K` `L` | W1 · Bauauftrag erkannt … · W2 · Messung abgeschlossen … · W3 · Alle drei Entwürfe … · W4 · Alternative erkannt: … aufstocken · W5 · Klimacheck … |
| Mission Kurze Wege | `Ö` `Ä` | K1 · Wegvergleich gestartet … · K2 · Stadt der kurzen Wege … |
| Mission Bildung | `P` `Ü` `+` | B1 · Raumanalyse … · B2 · Zugang prüfen … · B3 · … macht das Mitmachen möglich. |
| Finale | `#`, dann `6` | F1 · Zukunftsanalyse abgeschlossen … · F2 = Clip 06 „Mission erfolgreich! Danke, Zukunftscrew! …“ |
| Weitere Sätze | `1` `2` `5` `6` `7` | Landung · Entdeckung · Zukunftsalarm · Finale · Soundcheck (stehen nicht im aktuellen Drehbuch) |

## Anordnung für alle Geräte

Die gemeinsame Anordnung steht in **`layout.json`**. Jedes Gerät lädt sie beim Öffnen der Seite. Auf dem Handy liegen naturgemäß weniger Blöcke nebeneinander, Reihenfolge und Breitenverhältnis sind aber dieselben.

- Was man im Modus „⇄ Anordnen“ ändert, gilt zunächst nur auf diesem Gerät. Oben erscheint dann der Hinweis „noch nicht für alle Geräte gespeichert“.
- **Für alle Geräte speichern** schreibt `layout.json` ins Repository. Nach etwa 2 Minuten zeigen alle Geräte die neue Anordnung (Seite neu laden). **Verwerfen** holt die gemeinsame Anordnung zurück.
- **Mit Token (ein Klick):** Beim ersten Speichern fragt die Seite nach einem GitHub-Token. Er wird einmal pro Gerät angelegt, auf dem man anordnet: [neuer Fine-grained Token](https://github.com/settings/personal-access-tokens/new), *Repository access* nur `smarty-soundboard`, *Permissions* „Contents: Read and write“. Der Token bleibt nur in diesem Browser; „Token auf diesem Gerät löschen“ entfernt ihn.
- **Ohne Token:** „Ohne Token …“ kopiert den Text und öffnet `layout.json` im GitHub-Editor. Dort alles markieren, einfügen und „Commit changes“ klicken.
- Zum Abspielen braucht kein Gerät einen Token. Offline gilt die zuletzt geladene Anordnung.

## Verkehrssimulation „Die schlaue Ampel“ (`verkehr/`)

Eigene Seite im selben Projekt: **https://demo-testing123.github.io/smarty-soundboard/verkehr/**, im Soundboard oben über **🚦 Verkehr** (öffnet ein neues Fenster für den Beamer). Normale Ampel und intelligente Ampel mit Busfunk im Vergleich, die Wartezeit des Busses wird gemessen. Tasten: `1`/`2` Modus, `Leertaste` Start/Pause, `R` Zurücksetzen, `E` Ergebnis, `F` Vollbild. Anleitung, Messung, Sicherheitslogik und Anpassung: [verkehr/LIESMICH.md](verkehr/LIESMICH.md). Prüfseite: `verkehr/test.html`.

## Wohnen, Bauen und CO₂ „Wie bauen wir unsere Zukunftsstadt?“ (`wohnen/`)

Eigene Seite: **https://demo-testing123.github.io/smarty-soundboard/wohnen/**, im Soundboard oben über **🏠 Wohnen**. Experiment mit sechs Wohnmodulen (nebeneinander/stapeln), Varianten A/B/C auf demselben 12 × 12-Raster, Aufstocken mit zwei Holzgeschossen und Materialwissen. Tasten: `1`–`5` Modi, `←`/`→` oder `Leertaste` Schritte, `R` Zurücksetzen, `I` Moderationsinfo, `F` Vollbild. Anleitung, Rastermodell und Einschränkungen: [wohnen/LIESMICH.md](wohnen/LIESMICH.md). Prüfseite: `wohnen/test.html`.

## Mission Natur „Aus Grau wird Grün“ (`natur/`)

Eigene Seite: **https://demo-testing123.github.io/smarty-soundboard/natur/**, im Soundboard oben über **🌳 Natur**. Die Spielplatzszene des Drehbuchs als 3D-Simulation in Blockgrafik, mit demselben Platz wie in der Minecraft-Testwelt. Abschnitte: grauer Platz, Abstimmung A/B, Verwandlung „Beides gemeinsam“ Schicht für Schicht, Sommertag mit Schatten und vereinfachter Wärme-Ansicht, Starkregen (grau: Abfluss; grün: Versickern, Regenmulde, tiefer Bereich, Zisterne, Gießen), Endbild. Tasten: `1`–`6` Abschnitte, `←`/`→` oder `Leertaste` Schritte, `A`/`B` Abstimmung, `W` Wärme, `R` Zurücksetzen, `I` Moderationsinfo, `F` Vollbild. Anleitung und Vereinfachungen: [natur/LIESMICH.md](natur/LIESMICH.md). Prüfseite: `natur/test.html`.

## Stadt-Konfigurator für alle Missionen (`stadt/`)

Seite: **https://demo-testing123.github.io/smarty-soundboard/stadt/**, im Soundboard oben über **🏙 Stadt**. Regie- und Stadtplanungsanwendung nach dem Drehbuch (Arbeitsfassung 16.11.2026), gestaltet nach dem Stadt-Konfigurator des Kollegen: graue Stadt 2050, Mission Natur (A/B-Denkimpuls, „Beides gemeinsam“, Starkregen), Technik (Laternen mit Tag/Nacht), Mobilität (Parken A/B/C, Kreuzung mit Busanmeldung), Wohnen (sechs Wohnungen A/B/C, Aufstocken), Kurze Wege (gemessene Fußwege), Bildung (A/B/C), Finale mit Zukunftscheck und Rundgang. Jede Entscheidung ändert nur ihre feste Baufläche; Beschlüsse bleiben gespeichert. Dieselbe Stadt gibt es als Minecraft-Education-Welt mit einer Vorlagen-Kammer je Variante und einem Regieraum mit Knöpfen (`/clone`-Bauaufträge). Tasten: `0`–`7` Missionen, `←`/`→` Schritte, `A`/`B`/`C` Vorschau, `Enter` Übernehmen, `V` Vorher/Nachher, `N` Nacht, `M` Bauauftrag, `I` Regie, `F` Vollbild. Offline auch als Einzeldatei `stadt/START-IT-SMART_Stadtkonfigurator.html` (Doppelklick). Anleitung, Inventar, Datenmodell, Testbericht: [stadt/LIESMICH.md](stadt/LIESMICH.md). Abnahmetests: `stadt/test.html`. In Minecraft Education selbst noch nicht getestet.

## Minecraft Education: Spielplatz-Test (`minecraft/`)

Seite: **https://demo-testing123.github.io/smarty-soundboard/minecraft/**, im Soundboard oben über **⛏ Minecraft**. Prototyp für Mission Natur: Testwelt (`.mcworld`) mit grauem Platz und zwei Vorlagen-Kammern darunter. Ein Knopf auf dem Regieplatz oder der Chatbefehl `/clone` tauscht den Platz in derselben geöffneten Welt gegen den Natur-Abenteuerspielplatz (Regenmulde, tiefer Spielbereich, Zisterne) und zurück. Dazu gibt es Testplan mit `/testforblocks`, Bestandsanalyse des Stadt-Konfigurators, Technikentscheidung und Grenzen: [minecraft/LIESMICH.md](minecraft/LIESMICH.md). Selbsttests: `minecraft/test.html`. In Minecraft Education selbst noch nicht getestet.

**Ohne Internet auf dem Vorführ-Laptop:** `start-lokal.bat` doppelklicken (braucht Python 3). Dann laufen Soundboard, Verkehr, Wohnen, Natur und die Minecraft-Seite unter `http://localhost:8000/`.

## In der Turnhalle

- Die Seite **vorher einmal mit Internet öffnen**. Unten erscheint dann „offline bereit“. Ab dann läuft sie im selben Browser auch ohne Netz.
- Laptop per Klinke oder USB an die Tonanlage anschließen. Mit **07 · Soundcheck** die Verständlichkeit im Raum prüfen.
- Am besten Chrome oder Edge verwenden. Den Laptop vorher auf „nicht schlafen“ stellen.

## Neue Sätze oder Stimmen einbinden

Alles steht in **`sounds.json`**. Die Datei lässt sich direkt auf GitHub bearbeiten (Stift-Symbol). Nach dem Speichern erzeugt GitHub die Sprachdateien automatisch. Nach etwa 2 Minuten die Seite neu laden.

**Neuer Satz** – einen Block unter `"saetze"` ergänzen:

```json
{
  "id": "SMARTy_11_Bellen", "stimme": "smarty", "taste": "p",
  "titel": "11 · Bellen", "szene": "Mission Technik – Straßenlaternen",
  "text": "Wuff! Das heißt auf Roboterisch: Hallo!",
  "sprechen": "Wuff! [Pause 0.4] Das heißt auf Roboterisch: Hallo!",
  "einsatz": "Wenn SMARTy die Kinder begrüßt."
}
```

- `id`: eindeutig, wird zum Dateinamen (`audio/SMARTy_11_Bellen.mp3`)
- `text`: steht auf dem Pad. `sprechen` (optional) wird gesprochen, mit Pausen wie `[Pause 0.5]` (Sekunden)
- `taste` (optional): sonst wird eine freie Taste vergeben
- `szene` (optional): Überschrift im Board; die Pads erscheinen in der Reihenfolge der Datei
- `tts` (optional): Einstellungen nur für diesen Satz, z. B. `{ "rate": "-10%" }`
- Töne im Text (selbst berechnet, dezent): `[Ton bestaetigung]`, `[Ton warnung]`, `[Ton scan 1.4]` (Dauer in Sekunden)

**Neue Stimme** – einen Block unter `"stimmen"` ergänzen und in den Sätzen mit `"stimme": "<id>"` verwenden:

```json
{
  "id": "buergermeisterin", "name": "Bürgermeisterin", "rolle": "freundlich, bestimmt",
  "farbe": "#a78bfa",
  "tts": { "voice": "de-DE-TanjaNeural", "pitch": "+0Hz", "rate": "+0%" },
  "robo": 0
}
```

Optional formt `"klang"` die Stimme, z. B. `{ "formant": -0.8, "tiefe": 2, "waerme": 3, "alter": 0.5, "praesenz": 1.5 }`:

| Wert | Wirkung |
|---|---|
| `formant` | Halbtöne, negativ = größerer Stimmkörper. Ab etwa −1,5 wirkt es schnell bedrohlich |
| `tiefe` | Brustton in dB |
| `waerme` | untere Mitten in dB plus weichere Höhen: warm und freundlich |
| `alter` | 0 bis 1, leichtes Zittern: ältere Stimme |
| `praesenz` | dB bei 3 kHz für die Verständlichkeit (Standard 2) |
| `rau` | 0 bis 1, rauchig und kratzig |
| `digital` | 0 bis 1, leicht elektronisch: kurze, feste Reflexionen ohne Schweben, schlanker Klang |

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
- **Erzähler:** Sprecheraufnahme von ElevenLabs (`audio/eigene/`). Ob und wie du sie öffentlich aufführen und veröffentlichen darfst, hängt von deinem ElevenLabs-Tarif ab.
- **Offline:** Ein Service Worker speichert Seite und Sounds im Browser.
