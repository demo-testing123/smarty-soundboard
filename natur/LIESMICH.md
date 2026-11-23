# Sensorlabor Regenwasser – Mission Natur

3D-Simulation in Blockgrafik für die Kinderuni **START IT SMART – Mission Zukunft** (Klassen 1–4, 400–500 Kinder, Großleinwand).
Sie erzählt nur noch die technische Geschichte des Regenwassers: Starkregen → Wasser speichern → Trockenheit → Bewässern.
Grau → Grün und die Abstimmung finden im Stadt-Konfigurator statt (Mission Natur).

**Start:** https://demo-testing123.github.io/smarty-soundboard/natur/
oder im Stadt-Konfigurator: Mission Natur → Szene 3 → „Natur-Simulation öffnen“.

Umgebaut nach dem Änderungsauftrag „Natursimulation → Sensorlabor Regenwasser“ vom 23.11.2026. Die frühere Fassung
„Aus Grau wird Grün“ mit sechs Szenen steht in der Git-Geschichte (Stand bis Commit 9465f7a).

## Was wiederverwendet und was entfernt wurde

| Wiederverwendet | Entfernt |
|---|---|
| grüne 3D-Spielplatzwelt aus `../minecraft/welt.js` (dieselbe Vorlage wie Minecraft-Testwelt und Konfigurator), unverändert | grauer Platz, Verwandlung „Beides gemeinsam“ |
| Kamera (isometrisch), Straßenplatte mit Bodenschnitt, graue Hochhäuser | Abstimmung A/B |
| Regenanimation, Versickern im Bodenschnitt, Füllstände von Regenmulde und Zisterne | Sommertag mit Wärmeansicht, Tiere |
| Kinder auf dem Spielplatz (bei Regen nicht draußen) | Endbild |
| Beschriftungen an 3D-Punkten, Vollbild, Offline über den gemeinsamen Service Worker | Startbild, Hauptleiste, Unterleiste, Info für Moderation (Taste `I`), Taste `R` |
| | Abfluss auf grauem Boden, tiefer Spielbereich mit Wasser, „Gießen“ als Teilschritt |

**Neu:**
- Wasserstandsensor an der Zisterne und Bodenfeuchtesensor im Rasen, beide als Modell.
- Blauer Zulauf von der Regenmulde zur Zisterne.
- Blaue Bewässerungsleitungen im Rasen und im Bodenschnitt, mit wandernden Tropfen.
- Rasenfarbe nach Bodenfeuchte: gelblich bei trocken, dunkler bei nass.
- Zwei Sensoranzeigen.
- Die Regel der Steuerung, sichtbar geprüft.

## Bedienung

Eine einzige Schrittsteuerung: vier große Flächen unten, links „Zurück“, rechts „Weiter“. Tasten sind nicht nötig, gehen aber auch:
`←` `→`, `1`–`4`, `F` für Vollbild. Jeder Schritt setzt beim Betreten seine Startwerte. Er lässt sich deshalb beliebig oft gleich vorführen, ohne etwas zurückzusetzen.
Nichts schaltet von selbst in den nächsten Schritt. Es gibt keinen Ton; SMARTy kommt wie gewohnt aus dem Soundboard.

| Schritt | Was passiert (Zeit gerafft) | Anzeigen am Ende |
|---|---|---|
| 1 Starkregen | Regen; über die Regenmulde fließt Wasser in die Zisterne (blauer Zulauf), Boden wird nass | Zisterne 85 %, Bodenfeuchte 92 % „Boden nass“ |
| 2 Speichern | Regen vorbei, Mulde leert sich; „Wir heben Regenwasser für trockene Tage auf.“ | 85 %, 75 % „Boden feucht“ |
| 3 Trockenheit | Sonne, die Erde trocknet aus (Rasen wird gelblich), der Sensor meldet „Boden trocken“ | 85 %, 18 % „Boden trocken“ (gelb) |
| 4 Bewässern | Die Regel wird sichtbar geprüft. Boden trocken ✓, UND Wasser vorhanden ✓, dann **Bewässerung EIN**: blaue Leitungen, Feuchte steigt, Zisterne sinkt. Danach **Bewässerung AUS** | 64 %, 60 % „Boden feucht“ |

Die Animationen dauern zusammen etwa 42 Sekunden. Mit dem Gespräch auf der Bühne dauert die Demo etwa 2–3 Minuten.

**Bühnenablauf (Stichworte aus dem Auftrag):**
1. Z2: „Und was machen wir mit dem ganzen Regenwasser? Einfach für schlechte Zeiten aufheben?“ → Schritt 1, dann 2.
2. Z1: „Wir speichern es in einer Zisterne. Ein Sensor zeigt, wie viel Wasser darin ist.“
3. Z2: „Jetzt ist die Erde trocken. Müssen wir mit 500 Gießkannen losrennen?“ → Schritt 3.
4. SMARTy N5 (Soundboard): „Technikidee erkannt! …“
5. Z1: „Ist der Boden trocken und Wasser gespeichert, kann die Steuerung die Bewässerung einschalten.“ → Schritt 4.
6. Danach optional SMARTy N4 (Soundboard).

## Regel der Steuerung (regelbasiert, keine KI)

Die Werte sind Beispielwerte in `config.js` › `regel`:
- **EIN** nur, wenn die Bodenfeuchte **unter 30 %** liegt **UND** mindestens **20 %** Wasser in der Zisterne sind.
- **AUS**, sobald die Bodenfeuchte **60 %** erreicht **ODER** weniger als 20 % Wasser da sind.
- Bei leerer oder fast leerer Zisterne startet die Bewässerung nie.

Während der Bewässerung sinkt der Wasserstand und die Bodenfeuchte steigt.
Die Anzeige zeigt ganze Prozent und dauerhaft „Vereinfachte Simulation · keine echten Messwerte“. Es gibt keine Hardware, kein Backend und keine Datenübertragung.

Farben: Blau = Wasser, Gelb = trocken, Grün = feucht genug. Rahmen und Flächen in Türkis, warmem Gelb und dunklem Blau (START IT SMART).

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html`, `style.css` | Bühne 16:9: Kopf, 3D-Welt, Sensoranzeigen, vier Schrittflächen; Größen relativ zur Bildhöhe |
| `config.js` | **alle Texte, Schritte, Startwerte, Grenzwerte und Tempi** – hier wird angepasst |
| `model.js` | ohne Grafik: sichtbare Blöcke, Rasenflächen, Regel (`darfStarten`, `mussStoppen`), Sensorlabor (Werte je Schritt) |
| `scene3d.js` | 3D mit Three.js: Platz, Regen, Versickern, Füllstände, Sensoren, Leitungen, Rasenfarbe, Kinder |
| `main.js` | Bedienung: Schritte, Anzeigen, Regelprüfung, Beschriftungen |
| `test.html` | Abnahmetests (27 Prüfungen) |

## Prüfen

`test.html` öffnen: **27 von 27** (23.11.2026). Geprüft werden unter anderem:
- Regel mit Grenzfällen, darunter alle Feuchtewerte 0–100 mit leerer oder fast leerer Zisterne: Die Bewässerung startet nie.
- Die vier Schritte mit Werten und Verlauf, Wiederholbarkeit und Vorführdauer.
- Kennzeichnung und Begriffe auf der Leinwand; keine Behauptung „KI“.
- In der App: genau vier Schrittflächen plus Zurück/Weiter, keine zweite Leiste, genau zwei Anzeigen.
- In der App: Schritt 3 zeigt 85 % / 18 %; Schritt 4 zeigt EIN, dann AUS.
- 10 × alle Schritte, ohne dass Objekte, Geometrien oder Texturen dazukommen.
- Keine externen Dateien.

Am echten Beamer noch nicht angesehen: Lesbarkeit der Anzeigen aus mehreren Metern und Farbe des trockenen Rasens.
