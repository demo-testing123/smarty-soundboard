# START IT SMART – Regie-Soundboard und Show-Zentrale

Zwei getrennte Oberflächen für die Grundschul-Bühnenshow **START IT SMART · Mission Zukunft: Rettet unsere Stadt!** (Anforderungen vom 21.11.2026):

| Dashboard | Adresse | Inhalt |
|---|---|---|
| **1 · Regie-Soundboard** | [demo-testing123.github.io/smarty-soundboard/](https://demo-testing123.github.io/smarty-soundboard/) (`index.html`) | Nur die einzelnen Sprachclips von SMARTy und der Zeitmaschinen-KI, nach Missionen und Drehbuch sortiert. Schlicht und textorientiert. |
| **2 · Show-Zentrale** | [demo-testing123.github.io/smarty-soundboard/show.html](https://demo-testing123.github.io/smarty-soundboard/show.html) | Große Kacheln: Introfilm, Abschlussfilm, 3D-Stadtkonfigurator, Wohnsimulation, Verkehrssimulation, Minecraft Education, Calliope, Präsentationsmaterialien. |

Beide Seiten verlinken sich gegenseitig: „Show-Zentrale →“ und „← Zurück zum Soundboard“. Sie öffnen sich dabei in festen Tabs, damit keine Fenster doppelt entstehen. Beide nutzen das Original-Logo (`bilder/start-it-smart-logo.png`, unverändert) und die Projektfarben Petrol, Türkis, Gelb und Weiß.

## Dashboard 1 · Regie-Soundboard

| Aktion | Klick / Taste |
|---|---|
| Clip abspielen | Play-Knopf in der Zeile oder die Taste des Clips (steht unter der Nummer) |
| Laufenden Clip stoppen | derselbe Knopf (zeigt dann ■) |
| Sofort stoppen | `Leertaste`, `Esc` oder roter Knopf „Stopp“ unten |
| Weich ausblenden (1,5 s) | `F` |
| Lautstärke | Regler unten (0–150 %) oder `↑` / `↓` |
| Nur einen Sprecher zeigen | „Alle · SMARTy · Zeitmaschinen-KI“ oben |
| Zu einer Mission springen | Missionsknöpfe oben (Eröffnung … Finale). Ein Klick auf den Missionskopf klappt sie auf oder zu. |

- **Pro Clip angezeigt:**
  - Kennung, z. B. `KI2`, `N1`, `F5b`
  - Taste
  - Szene
  - Sprecher
  - vollständiger gesprochener Text
  - Dauer aus der Audiodatei
  - Play/Stopp
  - Status: bereit · läuft · ✓ gespielt · Datei fehlt
- **Ein Clip zur Zeit:** Ein neuer Clip beendet den laufenden. Nach dem Ende startet **nichts automatisch**; der nächste Clip im Drehbuch ist nur dezent als „als Nächstes“ markiert. Der laufende Clip ist gelb hinterlegt und steht unten mit der abgelaufenen Zeit.
- **Reihenfolge:** Sie steht in `sounds.json` unter `"missionen"`: je Mission eine Liste in Drehbuch-Reihenfolge, mit Kennung und Szene.
  - Die Zeitmaschinen-KI (`KI1`–`KI3`) steht als eigener Sprecher dort, wo das Drehbuch sie vorsieht: in der Eröffnung (Live-Ankunft), vor SMARTys erstem Satz.
  - Clips, die im aktuellen Drehbuch nicht vorkommen, stehen am Ende ihrer Mission unter „Reserve“.
  - Hinweiszeilen wie „Davor: Introfilm“ dienen nur der Orientierung.
- **Klang:** Die Clips laufen über dieselbe Web-Audio-Kette wie bisher: Robo-Anteil je Stimme aus `sounds.json` (`"robo"`, SMARTy 20 %, KI 0 %), Präsenz-EQ und leichter Kompressor.
- Die Häkchen „gespielt“ gelten für diesen Browser-Tab. Unten lassen sie sich zurücksetzen.
- **Nicht mehr im Soundboard** (laut Anforderung): Filme, Beamerfenster, Erzähler-Pads (Eröffnung, Grüße aus 2050), Stimmproben, Anordnen, Überlappen, Robo-Regler, WAV-Export und eigener Sound. Die frühere Fassung steht im Git-Verlauf (Commit `c67cdb8`).

## Dashboard 2 · Show-Zentrale

| Kachel | Ziel |
|---|---|
| Introfilm | `film/Eroeffnung_Film.mp4` (1:33, KI-Hinweis in den ersten Sekunden) |
| Abschlussfilm | `film/Abschlussfilm_2050.mp4` (85,8 s, Sprecheraufnahme vollständig) |
| 3D-Stadtkonfigurator | `stadt/`. Die Starkregen-Simulation erreicht man dort über Mission Natur → Szene 3 → „Natur-Simulation öffnen“; sie hat **keine** eigene Kachel. |
| Wohnsimulation | `wohnen/` |
| Verkehrssimulation | `verkehr/` |
| Minecraft Education | Anleitung in drei Schritten: App über das Startmenü starten (oder „Direkt starten versuchen“ über `https://education.minecraft.net/open`), Welt aus dem Konfigurator exportieren oder Ersatzwelt laden, Weltimport und Startpunkt getrennt testen |
| Calliope mini | MakeCode für Calliope (`https://makecode.calliope.cc/`), externer Link |
| Präsentationsmaterialien | Canva-Link (einstellbar), Abschlussfolie mit zwei QR-Codes, Hinweis auf die lokale PowerPoint-Datei |

- **Filme:** Ein Klick auf „… starten“ spielt den Film in einem normalen Video-Element ab und schaltet dabei in den Vollbildmodus, auf dem Bildschirm, auf dem das Fenster liegt.
  - Es gibt nur ein Video-Element. Der Filmton läuft also genau einmal, und ein zweiter Film ersetzt den ersten.
  - Maus bewegen blendet eine Leiste mit Pause, Vollbild und Schließen ein. `Leertaste` = Pause/Weiter.
  - Nach dem Ende bleibt das Bild schwarz. `Esc` oder ✕ führt zurück.
- **In eigenem Fenster** (Link unter dem Startknopf): öffnet nur den Film (`show.html?film=intro` bzw. `…=abschluss`). Das Fenster lässt sich auf einen anderen Bildschirm ziehen und dort starten. Ferngesteuert wird nichts.
- Beide Filme werden beim Öffnen der Show-Zentrale vollständig geladen. Danach steht „bereit (auch offline)“, und sie starten sofort.
- **Links bearbeiten …** (unten): Canva, Calliope und die zwei QR-Links.
  - Die Einträge gelten nur in diesem Browser.
  - Für alle Geräte: Canva und Calliope in `show.json`, die QR-Links in `sounds.json` unter `abschlussfolie`.
  - Der Feedback-Link fehlt noch.
- Kacheln, Texte und Bilder stehen in `show.json`. Die Kachelbilder liegen in `bilder/` (Filmstandbilder und Bildschirmfotos der Anwendungen).

### Abnahmetest vor der Show (auf dem Veranstaltungslaptop)

1. Beide Seiten einmal mit Internet öffnen. Unten im Soundboard muss „Offline bereit“ stehen, bei den Filmen „bereit (auch offline)“.
2. Soundboard: einen SMARTy-Clip abspielen. Er endet, und der nächste startet nicht von selbst.
3. Eröffnung: `KI1`–`KI3` (Tasten `A` `S` `D`) mit richtigem Text, danach SMARTy `01`.
4. Show-Zentrale: Jede Kachel öffnet das richtige Ziel. Calliope und Canva sind Links.
5. Intro- und Abschlussfilm starten bildschirmfüllend, der Ton ist genau einmal zu hören. Der Ton läuft über die Windows-Tonausgabe (HDMI oder Anlage).
6. Es gibt keine Starkregen-Kachel. Starkregen über den Stadtkonfigurator öffnen.
7. Minecraft Education starten. Weltimport und Startposition getrennt testen (stadt/LIESMICH, Abschnitt 0.4).
8. Automatische Prüfung: `test-dashboards.html` öffnen.

## Eröffnung (Introfilm mit Tonspur)

Der Introfilm (`film/Eroeffnung_Film.mp4`, 1920×1080, 1:32,8) startet aus der Show-Zentrale. Bildwechsel, Countdown-Zahlen und der weiße Blitz sind auf die Tonspur gerendert und laufen dadurch bildgenau synchron. In den ersten Sekunden (0,25–4,95 s) steht „Diese Zukunftsvision wurde mit KI erstellt.“ im Bild. Erzeugt wird der Film im Projekt `StartItSmart_Eroeffnung_Film` (`tools/film.py`). Ändert sich die Tonspur, dort neu rendern und die Datei nach `film/` kopieren.

Die Tonspur baut `tools/intro.py` aus der Sprecheraufnahme `audio/eigene/Erzaehler_Eroeffnung_ElevenLabs.mp3`:

- **Sprache:** Die Aufnahme bleibt unverändert, sie wird nur sanft komprimiert. An den Stellen aus der Regie verlängert das Skript die Pausen zwischen den Sätzen: „Doch … irgendetwas“, „Fantasie / Mut / Ideen“, vor „EUCH!“. Der Countdown kommt etwa im Sekundentakt.
- **Musik und Effekte** sind komplett selbst berechnet (`tools/intro.py`), es gibt keine fremden Samples. Damit sind sie frei für öffentliche Aufführungen.
- Unter der Sprache wird die Musik automatisch etwa 10 dB leiser, in den Pausen kommt sie wieder hoch.
- **[`audio/intro/Regie.md`](audio/intro/Regie.md)** listet die tatsächlichen Zeitmarken aller Einsätze, nützlich für Licht und Leinwand.
- **Getrennte Spuren** für Audacity: `audio/intro/Spur_Sprecher.mp3`, `Spur_Musik.mp3`, `Spur_Effekte.mp3`.

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

**Abschlussfilm:** Renderprojekt `Downloads/StartItSmart_Abschlussfilm` (LIESMICH dort), dort auch eine Fassung mit exakt 85,0 s. Die Aufnahme „Grüße aus dem Jahr 2050“ (`audio/eigene/Erzaehler_Gruesse_2050_ElevenLabs.mp3`) steckt im Film. Im Soundboard ist sie nicht mehr einzeln abspielbar.

## Zeitmaschine (KI) – Tasten `A S D`

Der Bordcomputer der Zeitmaschine meldet sich in der Ankunftsszene nach dem Intro. Die Stimme ist weiblich (Grundstimme Tanja), klar, sachlich und etwas langsamer. Sie klingt leicht elektronisch, aber ohne Roboterverzerrung, und unterscheidet sich damit deutlich vom Erzähler und von SMARTy.

| Kennung · Taste | Ansage | Ton | Leinwand |
|---|---|---|---|
| `KI1` · `A` | Zeitreise abgeschlossen. Ziel erreicht. Willkommen in der Vergangenheit. | Bestätigungston vorweg | ZEITREISE ABGESCHLOSSEN |
| `KI2` · `S` | Warnung! Systemfehler! Unerwartete Alterstransformation festgestellt. Biologisches Alter der Zeitreisenden verändert. | zwei Warntöne vorweg | SYSTEMFEHLER: ALTERSTRANSFORMATION |
| `KI3` · `D` | Achtung! Zusätzlicher Passagier erkannt. Identifikation läuft … Roboterhund SMARTy identifiziert. Passagier war nicht angemeldet. | Scan-Geräusch in der Pause | UNBEKANNTER PASSAGIER ERKANNT |

Die Töne liegen etwa 8–10 dB unter der Sprache. Jede Ansage lässt sich einzeln abspielen. Das Drehbuch sieht im Finale noch eine „Abschlussmeldung / Rückreise nach Regieentscheidung“ der Zeitmaschine vor. Dafür gibt es noch keinen Text und keinen Clip.

## SMARTy nach Szenen

Die vollständige Zuordnung Mission → Szene → Clip → Datei steht in **[SMARTy_Zuordnung.md](SMARTy_Zuordnung.md)**. Sie wird mit `python tools/zuordnung.py` aus `sounds.json` erzeugt. Die Anzeige im Soundboard folgt `sounds.json` → `"missionen"`.

Stand 22.11.2026 (Drehbuch „humorvoll aktualisiert“ und Änderungsauftrag vom 22.11.2026):

| Mission | Reihenfolge im Soundboard |
|---|---|
| Eröffnung | KI1 → KI2 → KI3 → O1 (Systemcheck) → O9 |
| Natur | N1 → N2 → N3 → N5 → N4 |
| Technik | T1 → T2 → T3 → T4 → T5 → T6 (optional) |
| Mobilität | M1 → M2 → M3 → M9 → M4 → M5 → M6 (Verkehrssimulation) → M7 (mBot) → M10 → M11 → M8 |
| Wohnen | W1 → W2 → W3 → W4 → W5 |
| Kurze Wege | K1 → K3 → K2 |
| Bildung | B1 → B4 → B2 → B3 |
| Finale | F3 → F4 → F5a → F5b → Abschlussfilm (Show-Zentrale) |

- **Wieder im Drehbuch** (vorhandene Aufnahmen, Wortlaut geprüft): O9 „Ich habe mich mitgeschmuggelt …“, N3 „Wetterwarnung! …“, N4 „Neue Erkenntnis gespeichert …“.
- **Neu vertont:** M10 (Taste `-`), M11 (Taste `Q`). Die Tasten waren frei, weil die Erzähler-Pads nicht mehr im Soundboard sind.
- **Neuer Wortlaut, neu vertont:** B4 „… Das spart möglicherweise Baumaterial und Platz.“, F3 „Digitale Stadtplanung abgeschlossen. …“, F4 „Computer können rechnen, messen und simulieren. Aber eine lebenswerte Stadt braucht Menschen, die mitdenken.“ (F3 und F4 nach Festlegung am 22.11.2026). Von F3 und F4 gibt es keine zweite Fassung mehr.
- Die Kennungen der Eröffnung heißen jetzt O1, O9 usw. wie im Drehbuch. IDs, Dateien und Tasten bleiben gleich. O7 (Soundcheck, „Alle vier Beine vorhanden …“) bleibt Reserve, weil er nicht der Intro-Systemcheck ist.
- Die älteren Finale-Clips F5–F7 aus dem Quell-Drehbuch werden nicht zusätzlich gespielt.

## Verkehrssimulation „Die schlaue Ampel“ (`verkehr/`)

Eigene Seite im selben Projekt: **https://demo-testing123.github.io/smarty-soundboard/verkehr/**, in der Show-Zentrale über die Kachel **Verkehrssimulation** (eigener Tab). Normale Ampel und intelligente Ampel mit Busfunk im Vergleich, die Wartezeit des Busses wird gemessen. Tasten: `1`/`2` Modus, `Leertaste` Start/Pause, `R` Zurücksetzen, `E` Ergebnis, `F` Vollbild. Anleitung, Messung, Sicherheitslogik und Anpassung: [verkehr/LIESMICH.md](verkehr/LIESMICH.md). Prüfseite: `verkehr/test.html`.

## Wohnen, Bauen und CO₂ „Wie bauen wir unsere Zukunftsstadt?“ (`wohnen/`)

Eigene Seite: **https://demo-testing123.github.io/smarty-soundboard/wohnen/**, in der Show-Zentrale über die Kachel **Wohnsimulation**. Experiment mit sechs Wohnmodulen (nebeneinander/stapeln), Varianten A/B/C auf demselben 12 × 12-Raster, Aufstocken mit zwei Holzgeschossen und Materialwissen. Tasten: `1`–`5` Modi, `←`/`→` oder `Leertaste` Schritte, `R` Zurücksetzen, `I` Moderationsinfo, `F` Vollbild. Anleitung, Rastermodell und Einschränkungen: [wohnen/LIESMICH.md](wohnen/LIESMICH.md). Prüfseite: `wohnen/test.html`.

## Mission Natur „Aus Grau wird Grün“ (`natur/`)

Eigene Seite: **https://demo-testing123.github.io/smarty-soundboard/natur/**, über den Stadtkonfigurator (Mission Natur, Szene 3 „Natur-Simulation öffnen“), ohne eigene Kachel. Die Spielplatzszene des Drehbuchs als 3D-Simulation in Blockgrafik, mit demselben Platz wie in der Minecraft-Testwelt. Abschnitte: grauer Platz, Abstimmung A/B, Verwandlung „Beides gemeinsam“ Schicht für Schicht, Sommertag mit Schatten und vereinfachter Wärme-Ansicht, Starkregen (grau: Abfluss; grün: Versickern, Regenmulde, tiefer Bereich, Zisterne, Gießen), Endbild. Tasten: `1`–`6` Abschnitte, `←`/`→` oder `Leertaste` Schritte, `A`/`B` Abstimmung, `W` Wärme, `R` Zurücksetzen, `I` Moderationsinfo, `F` Vollbild. Anleitung und Vereinfachungen: [natur/LIESMICH.md](natur/LIESMICH.md). Prüfseite: `natur/test.html`.

## Stadt-Konfigurator für alle Missionen (`stadt/`)

Seite: **https://demo-testing123.github.io/smarty-soundboard/stadt/**, in der Show-Zentrale über die Kachel **3D-Stadtkonfigurator**. Regie- und Stadtplanungsanwendung nach dem Drehbuch (Arbeitsfassung 16.11.2026), gestaltet nach dem Stadt-Konfigurator des Kollegen: graue Stadt 2050, Mission Natur (A/B-Denkimpuls, „Beides gemeinsam“, Starkregen), Technik (Laternen mit Tag/Nacht), Mobilität (Parken A/B/C, Kreuzung mit Busanmeldung), Wohnen (sechs Wohnungen A/B/C, Aufstocken), Kurze Wege (gemessene Fußwege), Bildung (A/B/C), Finale mit Zukunftscheck und Rundgang. Jede Entscheidung ändert nur ihre feste Baufläche; Beschlüsse bleiben gespeichert. Dieselbe Stadt gibt es als Minecraft-Education-Welt mit einer Vorlagen-Kammer je Variante und einem Regieraum mit Knöpfen (`/clone`-Bauaufträge). Tasten: `0`–`7` Missionen, `←`/`→` Schritte, `A`/`B`/`C` Vorschau, `Enter` Übernehmen, `V` Vorher/Nachher, `N` Nacht, `M` Bauauftrag, `I` Regie, `F` Vollbild. Offline auch als Einzeldatei `stadt/START-IT-SMART_Stadtkonfigurator.html` (Doppelklick). Anleitung, Inventar, Datenmodell, Testbericht: [stadt/LIESMICH.md](stadt/LIESMICH.md). Abnahmetests: `stadt/test.html`. In Minecraft Education selbst noch nicht getestet.

## Minecraft Education: Spielplatz-Test (`minecraft/`)

Seite: **https://demo-testing123.github.io/smarty-soundboard/minecraft/**, nicht mehr in den Dashboards verlinkt (Prototyp; für die Show gilt die Minecraft-Kachel der Show-Zentrale). Prototyp für Mission Natur: Testwelt (`.mcworld`) mit grauem Platz und zwei Vorlagen-Kammern darunter. Ein Knopf auf dem Regieplatz oder der Chatbefehl `/clone` tauscht den Platz in derselben geöffneten Welt gegen den Natur-Abenteuerspielplatz (Regenmulde, tiefer Spielbereich, Zisterne) und zurück. Dazu gibt es Testplan mit `/testforblocks`, Bestandsanalyse des Stadt-Konfigurators, Technikentscheidung und Grenzen: [minecraft/LIESMICH.md](minecraft/LIESMICH.md). Selbsttests: `minecraft/test.html`. In Minecraft Education selbst noch nicht getestet.

**Ohne Internet auf dem Vorführ-Laptop:** `start-lokal.bat` doppelklicken (braucht Python 3). Dann laufen Soundboard, Show-Zentrale (`/show.html`), Stadtkonfigurator, Verkehr, Wohnen, Natur und die Minecraft-Seite unter `http://localhost:8000/`.

## In der Turnhalle

- Beide Seiten **vorher einmal mit Internet öffnen**. Unten im Soundboard steht dann „Offline bereit“, in der Show-Zentrale bei den Filmen „bereit (auch offline)“. Ab dann läuft alles im selben Browser auch ohne Netz. Calliope und Canva brauchen Internet.
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
- `text`: der gesprochene Text, so wie er im Soundboard steht. `sprechen` (optional) ist die Vorlage für die Sprachausgabe, mit Pausen wie `[Pause 0.5]` (Sekunden)
- `taste` (optional): sonst wird eine freie Taste vergeben
- Im Soundboard steht ein neuer SMARTy- oder KI-Satz erst an der richtigen Stelle, wenn er unter `"missionen"` eingetragen ist (`{ "id": …, "nr": "T7", "szene": "…" }`). Bis dahin zeigt ihn das Soundboard unter „Weitere“.
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

**Stimmproben:** Sätze mit `"gruppe": "proben"` werden erzeugt, erscheinen aber nicht im Soundboard.

## Eigene Aufnahmen statt Computerstimme

- **Dauerhaft für alle:** Die Datei z. B. als `audio/eigene/SMARTy_01_Landung.mp3` hochladen. Beim Satz in `sounds.json` dann `"datei": "audio/eigene/SMARTy_01_Landung.mp3"` eintragen. Dieser Satz wird nicht mehr per Computerstimme erzeugt.

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
- **Offline:** Ein Service Worker (`sw.js`) speichert beide Dashboards, die Sounds, die Filme und die Anwendungen im Browser.
