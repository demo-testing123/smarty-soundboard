# Die schlaue Ampel – Verkehrssimulation

Eigenständige Browser-Anwendung für die Kinderuni **START IT SMART – Mission Zukunft**.
Zwei identische Verkehrssituationen werden verglichen: eine **normale Ampel** mit festen Zeiten
und eine **intelligente Ampel**, die das Funksignal des Busses berücksichtigt. Gemessen wird,
wie lange der Bus vor der Ampel steht.

**Start:** https://demo-testing123.github.io/smarty-soundboard/verkehr/
oder im Soundboard oben auf **🚦 Verkehr** (öffnet ein neues Fenster für den Beamer).

## Ablauf in der Show

1. Seite öffnen, `F` für Vollbild. Nichts startet von allein.
2. `1` – **Normale Ampel**, dann `Leertaste` – **Start**. Der Bus hält an Rot, die Stoppuhr
   oben rechts läuft, solange er steht. Nach Grün fährt er über die Kreuzung, dann steht
   unten „Gemessen: … Sekunden“.
3. `2` – **Intelligente Ampel**, dann `Leertaste`. Genau dieselbe Ausgangslage. Der Bus funkt
   „Ich komme!“, die Ampel prüft, die Querstraße bekommt Gelb und Rot, die Kreuzung wird frei,
   erst dann bekommt der Bus Grün. Oben zeigt die Kette **Information → Entscheidung → Wirkung**,
   welcher Schritt gerade passiert.
4. `E` – **Ergebnis**: beide Wartezeiten und „Der Bus spart … Sekunden“ (Zahlen zählen hoch).

## Tasten

| Aktion | Taste | Knopf |
|---|---|---|
| Normale Ampel wählen | `1` oder `A` | Normale Ampel |
| Intelligente Ampel wählen | `2` oder `B` | Intelligente Ampel |
| Start / Pause / Weiter | `Leertaste` oder `Enter` | ▶ Start |
| Pause / Weiter | `P` | Pause |
| Zurücksetzen (gleiche Ausgangslage) | `R` | Zurücksetzen |
| Ergebnis ein/aus | `E` (schließen auch mit `Esc`) | Ergebnis |
| Vollbild | `F` | ⛶ |
| Bedienleiste aus-/einblenden (Tasten gehen weiter) | `H` | ▾ |
| Ton an/aus | `M` | 🔊 Ton |

Ein Moduswechsel setzt immer auf die Ausgangslage zurück und startet nicht von selbst.
Zurücksetzen geht jederzeit, auch mitten im Versuch oder in der Pause. Im Vollbild verschwindet
der Mauszeiger nach 2,5 Sekunden.

## Was gemessen wird

- **Wartezeit** = Zeit, in der der Bus vor der Haltelinie steht (Geschwindigkeit fast null).
  Angezeigt wird sie auf ganze Sekunden gerundet; „spart“ ist die Differenz der gerundeten Werte.
- Die Simulation läuft in festen Schritten von 1/60 s. Gleicher Modus ergibt immer exakt
  dieselben Zahlen; die Werte stammen aus dem Ablauf und sind nicht fest eingetragen.
  Mit den aktuellen Einstellungen: normale Ampel 22 s, intelligente Ampel 4 s, der Bus spart 18 s.
- Die Ergebnisse bleiben im Browser gespeichert, bis ein Versuch erneut läuft.

## Sicherheit der Ampel

- Zwischen Grün für die eine und Grün für die andere Richtung liegen immer
  **Gelb (3 s) → alles Rot (2 s) → Rot-Gelb (1 s)**. Kreuzende Richtungen sind nie gleichzeitig frei.
- Die intelligente Ampel schaltet nicht „magisch“: Nach dem Funksignal prüft sie 1,5 s, hält
  die Mindestgrünzeit der Querstraße ein und durchläuft dann die volle Übergangszeit.
- Fahrzeuge halten bei Rot und Rot-Gelb; bei Gelb halten sie, wenn das mit normalem Bremsen geht.

**`test.html`** rechnet beide Versuche ohne Grafik durch und prüft 21 Punkte: kein gleichzeitiges
Grün, keine kreuzenden Fahrzeuge zugleich in der Kreuzung, keine Rotfahrt, Bus fährt nur bei Grün,
gleiche Ausgangslage, Reset, Wiederholbarkeit, Reihenfolge Funk → Gelb → alles Rot → Rot-Gelb → Grün.
Nach jeder Änderung an den Zeiten dort neu laden.

## Anpassen

Alle Zeiten, Strecken, Autos und Texte stehen in **`config.js`**: zum Beispiel Grünzeiten,
Gelb/alles Rot, die Prüfzeit der intelligenten Ampel, wo der Bus funkt, Tempo und welche Autos
wann auftauchen. Die Dateien sind getrennt:

| Datei | Inhalt |
|---|---|
| `config.js` | Zahlen und Texte |
| `sim.js` | Simulationslogik: Ampelphasen, Fahrzeuge, Messung (ohne Grafik) |
| `scene3d.js` | 3D-Darstellung mit Three.js (Low-Poly, feste Kamera) |
| `render2d.js` | 2D-Ansicht von oben mit derselben Logik (Ersatz ohne 3D) |
| `main.js` | Bedienung, Anzeigen, Ergebnis, Ton |
| `test.html` | automatische Prüfung der Logik |

## Technik und Offline

- Reines HTML/CSS/JavaScript, keine Installation. Three.js r160 liegt lokal in `../lib/`.
- Kann ein Rechner kein WebGL, startet automatisch die **2D-Ansicht** mit Hinweis. Erzwingen:
  `…/verkehr/?ansicht=2d`.
- Einmal mit Internet öffnen (Soundboard oder diese Seite), dann funktioniert alles auch offline
  im selben Browser. Lokal: im Ordner `smarty-soundboard` `python -m http.server` starten und
  `http://localhost:8000/verkehr/` öffnen. Per Doppelklick auf die Datei geht es nicht, dann
  erscheint eine Fehlermeldung.
- Ton: kurze, selbst erzeugte Signaltöne (Funk, Empfang, Grün, Ergebnis), mit `M` abschaltbar.

## Bekannte Grenzen

- Vereinfachtes Modell: eine Kreuzung, ein Bus, wenige Autos, keine Fußgänger, keine echte
  Funktechnik. Die Laufzeit des Funksignals ist zum Zeigen verlangsamt (0,8 s).
- SMARTy-Kommentare sind bewusst noch nicht eingebaut. Sie kommen nach Abstimmung des Drehbuchs
  ins Soundboard.
- Ein mBot ist nicht angebunden; die Simulation funktioniert vollständig ohne.
