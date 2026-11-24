# Stadt-Konfigurator – START IT SMART „Mission Zukunft: Rettet unsere Stadt!“

Regie- und Stadtplanungsanwendung für **alle Missionen** des Drehbuchs (Arbeitsfassung vom 16.11.2026, Auftrag vom 17.11.2026, Ergänzungsauftrag „Kurze Wege“ vom 17.11.2026, Korrekturauftrag vom 19.11.2026).
Der Browser ist **Regieoberfläche und 3D-Vorschau**. Am Ende erzeugt er eine **Minecraft-Welt mit allen übernommenen Beschlüssen**, durch die die Kinder in Minecraft Education gehen.

**Start:**
- Online: https://demo-testing123.github.io/smarty-soundboard/stadt/
- In der Show-Zentrale (`show.html`): Kachel **3D-Stadtkonfigurator**
- Offline per Doppelklick: die Einzeldatei `START-IT-SMART_Stadtkonfigurator.html`

> **Stand (24.11.2026):** Drei Änderungsaufträge vom 23.11. (Abschnitt 00): Energiecheck nach der Technikmission, Mobilität ohne
> mBot- und Ampelvergleichs-Szene (jetzt 5 Szenen), Auswahl Schwebebahn/Flugtaxi in Mobilität Szene 4. Danach eine Korrektur
> (Abschnitt 000): Szene 3 öffnet wieder das eigenständige Verkehrstool, Szene 5 zeigt das Ergebnis ohne Ampel-Umschalter.
> Am 24.11. (Abschnitt 0000): Publikumsansicht ohne Bedienhinweise, Kurze Wege in Metern.
> Keine neuen SMARTy-Sätze, Soundboard, Show-Zentrale, Verkehrstool unverändert. `test.html`: 83 von 83.
> In Minecraft Education weiterhin nicht getestet.

---

## 0000. Aufträge vom 24.11.2026: Publikumsansicht bereinigt, Kurze Wege in Metern

**Grundsatz:** Auf der Leinwand (Kopfzone, Bedienfeld, Seitenleiste, Fußnote) stehen nur kindgerechte, inhaltliche Informationen.
Technische Bedienhinweise, Tastenkürzel und Handlungsanweisungen stehen nur in der **Regie** (Taste `I`). Funktionen, Verlinkungen,
Szenenfolge und Abstimmungen sind unverändert; die Tastenkürzel funktionieren weiter und stehen als Tooltip am Knopf.

| Wo | Vorher auf der Leinwand | Jetzt |
|---|---|---|
| Mobilität Szene 3 | „Öffnet in einem neuen Tab. Zurück: Tab schließen (Strg + W), dann Weiter → Szene 4.“ neben dem Knopf | nur der gelbe Knopf „Verkehrssimulation öffnen ↗“ (Funktion gleich); Rückweg steht in der Regie |
| Mobilität Szene 4 | „Ein Klick auf eine Karte wählt.“ | entfällt; nach der Wahl wie bisher „Beides sind Zukunftsideen …“ |
| Mobilität Szene 5 | Kacheln „noch offen – Szene 2“ / „noch nicht gewählt – Szene 4“, Knopf „… übernehmen ⏎“ | „noch offen“ / „noch nicht gewählt“, Knopf ohne ⏎; „Szene 2 bzw. 4 nachholen“ steht in der Regie |
| Start (Szene 0) | Fußnote „Gespeicherter Stand: … (Regie › „Neu beginnen“ setzt zurück)“ | in der Regie: „Gespeicherter Stand: n von 9 Beschlüssen …“ (in jeder Szene) |
| Natur, Lösung | „Vorschau. Mit „In Stadt übernehmen“ wird der grüne Platz … gebaut.“, Knopf mit ⏎ | entfällt (Fußnote zeigt weiter „Vorschau – noch nicht übernommen“); nach dem Übernehmen wie bisher „Der grüne Natur-Abenteuerspielplatz ist in unserer Stadt.“ |
| Natur, Starkregen | „Starkregen starten (R)“ / „Regen stoppen (R)“ | ohne „(R)“ |
| Technik, Calliope | „Jetzt live: Dokumentenkamera: Calliope mini, Lichtsensor, externe LED“ | „Jetzt live: Calliope mini mit Lichtsensor und LED“; Dokumentenkamera steht in der Regie |
| Technik, Energiecheck | „Zustand 2 von 4 · vereinfachte Animation“ | entfällt (steht schon oben als „2/4“ und in der Fußnote) |
| alle Abstimmungen, Aufstocken | „In Stadt übernehmen ⏎“ | „In Stadt übernehmen“ (Enter geht weiter) |
| Finale, Vorschau | Kicker „Vorschau im Konfigurator“, Hinweis „Vorschau im Konfigurator – der echte Rundgang folgt in Minecraft.“, „Vorher zeigen (V)“ | Kicker „Finale · Vorschau“; der Hinweis erscheint nur noch während des Rundgangs (Station n/9); „Vorher zeigen“ |
| Finale, Minecraft-Welt | Seitenleiste „So öffnet ihr die Welt“ (Download-Ordner, /tp-Befehle, Sicherheitsnetz, Ersatzwelt), Dateidetails, „Datei doppelklicken – die Anleitung steht rechts.“, „Optional: Bauaufträge von Hand“ | Leinwand zeigt nur die drei Schritte und die Knöpfe „Minecraft-Welt erstellen“ / „Noch einmal herunterladen“; Anleitung, Dateidetails, Ersatzwelt-Download und der Hinweis auf die Bauaufträge stehen in der Regie. Bauaufträge weiter über „⛏ Minecraft“ (Taste `M`). |

Nebenbei behoben: In der Regie erschienen statt der SMARTy-Liste „[object HTMLHeadingElement] …“ und an zwei Stellen „null“.

**Kurze Wege in Metern.** Das Stadtmodell hatte keinen festgelegten Maßstab. Für den Wegvergleich gilt jetzt ein vereinfachter
Modellmaßstab **1 Feld = 10 Meter** (`METER_PRO_FELD` in `stadtmodell.js`). Die Meter werden bei jeder Anzeige aus der tatsächlich
gemessenen Weglänge berechnet (Breitensuche im Modell × 10): heute **A 530 m, B 350 m, C 140 m** (53 / 35 / 14 Felder).
- Szene „Wo sind die Brötchen am nächsten?“: nach „Wege messen“ große Meterangaben in den drei Feldern A/B/C, Hinweis „Ungefähre Entfernungen im Stadtmodell“ (statt „Gezählt im Modell: Felder … – keine Meter“). Vorher wie bisher „Erst schätzen: Welcher Weg ist am kürzesten?“.
- Abstimmung: nach „Wege messen“ auf jeder Karte „Weg von unserem Haus: etwa 530 m“ usw. (groß).
- Farbige Wege, Marken A/B/C, Abstimmung und „Wege messen“ unverändert; keine neuen Knöpfe, Szenen oder SMARTy-Sätze. Keine Minuten.
- Die bebaute Fläche bei Wohnen bleibt in Feldern (nicht Teil des Auftrags).

**Geprüft** (`test.html`, 83 von 83), neu dabei:
- alle 26 Szenen: in Kopfzone, Bedienfeld, Seitenleiste und Fußnote kein „Strg“, „Tab schließen“, „Taste“, „(R)“, „⏎“, „Regie“, „doppelklicken“, „Download-Ordner“, „/tp“, „Dokumentenkamera“, „Konfigurator“, „von Hand“; in Kurze Wege kein „Felder“;
- Szene 3: im Bedienfeld nur der gelbe Knopf; Rückweg, gespeicherter Stand und Export-Anleitung mit Ersatzwelt stehen in der Regie; Regie ohne „[object]“/„null“;
- Kurze Wege: Meter = gemessene Felder × 10 (530 / 350 / 140 m), groß, Hinweis wie beauftragt, Bedienfeld überdeckt die 3D-Bühne nicht, Karten „etwa … m“.
- **Nicht geprüft:** Lesbarkeit am Beamer aus der letzten Reihe.

---

## 000. Korrektur vom 23.11.2026: Verkehrssimulator wieder eingebunden (Mission Mobilität)

Bei der Überarbeitung 00.1 war mit der doppelten Ampelszene auch der Knopf zum eigenständigen Verkehrstool verschwunden.
Er stand früher in der Szene „3D-Experiment: normale gegen schlaue Ampel“ (`daten.js`, `link: { text: 'Verkehrssimulation öffnen', href: '../verkehr/' }`).
Genau diese Verknüpfung ist jetzt in Szene 3 wiederhergestellt. Das Verkehrstool selbst (`../verkehr/`) ist nicht verändert, nicht kopiert und nicht nachgebaut.

| Szene | Jetzt |
|---|---|
| 1 Die Straße ist voll · 2 Wo sollen die Autos parken? | unverändert |
| 3 Der Bus wartet | 3D-Szene mit wartendem Bus wie bisher, dazu großer Knopf **„Verkehrssimulation öffnen ↗“**. Er öffnet das Verkehrstool in einem **neuen Tab**; der Konfigurator bleibt auf Szene 3 stehen. |
| 4 Fahren 2050 Autos von allein? | unverändert: Erklärung, Auswahl Schwebebahn/Flugtaxi, Speicherung; keine Verkehrssimulation |
| 5 Zurück in der Zukunftsstadt | Die Knöpfe „Normale Ampel“ / „Bus meldet sich an“ (Umschalter = zweiter Ampelvergleich) sind entfernt. Stattdessen eine Übersicht von der Wohnstraße bis zum Zukunftsverkehr mit drei Kacheln: **Parken** (Szene 2), **Ampel** (Busanmeldung, Ergebnis der Verkehrssimulation), **Zukunft 2050** (gewählte Option aus Szene 4, mit Tafel und Modell). Ein Klick auf eine Kachel fliegt dorthin, „Ganze Straße zeigen“ zurück. Die Busanmeldung wird mit **einem** Klick „Busanmeldung in Stadt übernehmen“ (oder Enter) übernommen. |

- **Rückkehr aus dem Verkehrstool:** Tab des Verkehrstools schließen (`Strg + W`). Der Konfigurator steht noch auf Szene 3 (Vollbild wieder mit `F`), dann „Weiter“ → Szene 4. Ersatzweg wie bisher: Show-Zentrale → Kachel Verkehrssimulation.
- **Sichtbarkeit Schwebebahn/Flugtaxi:** In den Szenen 1–3 ist die Baufläche Zukunftsverkehr immer leer, auch wenn aus einer Probe schon eine Wahl gespeichert ist. Auch die Beschluss-Marke oben erscheint erst ab Szene 4. Ab Szene 4 und in allen späteren Missionen ist die gewählte Option zu sehen.
- In der Einzeldatei zeigt der Knopf (wie die anderen Simulationen) auf die Online-Fassung des Verkehrstools.
- Neue Kamera „Wohnstraße bis Zukunftsverkehr“ nur für Szene 5. Minecraft-Welt, Ersatzwelt, Ansichtspunkte und Bauaufträge sind unverändert.
- Unverändert: SMARTy-Soundboard (keine neuen Sätze), Show-Zentrale, Verkehrstool, andere Missionen, Szenen 1–2.
- Geprüft (`test.html`, 80 von 80), neu dabei:
  - genau 5 Szenen, Szenen 1–2 unverändert, der einzige Link der Mission ist `../verkehr/` in Szene 3, Szene 5 ohne Umschalter;
  - `../verkehr/` ist erreichbar und ist die eigenständige Seite „Die schlaue Ampel · Verkehrssimulation“;
  - Klick auf den Knopf öffnet `/verkehr/` in einem neuen Tab, der Konfigurator bleibt auf Szene 3, Weiter führt zu Szene 4 mit der Auswahl;
  - Schwebebahn/Flugtaxi in den Szenen 1–3 nicht im Bild und ohne Marke, ab Szene 4 sichtbar;
  - Szene 5: drei Kacheln, gewählte Option (A und B) im Bild und als Tafel, Busanmeldung per Klick übernommen, keine Knöpfe „Normale Ampel“ / „Bus meldet sich an“.
- **Nicht geprüft:** Verhalten im echten Vollbild am Beamer-Laptop (neuer Tab verlässt das Vollbild; zurück mit `F`).

---

## 00. Änderungsaufträge vom 23.11.2026

### 00.1 Bus-/Ampel-Dopplung entfernt (Mission Mobilität)

| Bisher | Neu | Aktion |
|---|---|---|
| 1 – Die Straße ist voll | 1 | unverändert |
| 2 – Wo sollen die Autos parken? (A/B/C) | 2 | unverändert (Inhalt, Abstimmung, 3D, Speicherung) |
| 3 – Der Bus wartet | 3 | behalten als Überleitung, Unterzeile jetzt „Könnte eine schlaue Ampel unserem Bus helfen?“ |
| 4 – Echte Robotik: der mBot als Bus | – | entfernt (läuft live auf der Bühne) |
| 5 – 3D-Experiment: normale gegen schlaue Ampel | – | entfernt (nur noch im separaten Verkehrstool) |
| 6 – Fahren 2050 Autos von allein? | 4 | behalten (+ Auswahl Schwebebahn/Flugtaxi, 00.2) |
| 7 – Zurück in der Zukunftsstadt | 5 | behalten (seit 000 ohne Ampel-Umschalter, als Ergebnisübersicht) |

- Fortschritt zeigt jetzt „Mobilität · 1/5 … 5/5“; Kicker „Szene 4 · Blick nach vorn“ und „Szene 5“.
- Verwaiste Verweise bereinigt: kein Live-Block mBot. (Der Knopf „Verkehrssimulation öffnen“ war hier versehentlich mit entfernt; er ist seit der Korrektur 000 in Szene 3 wieder da.)
- Die SMARTy-Hinweise der entfernten Szenen (M5, M6, M7) stehen jetzt als Regie-Stichwort bei Szene 3 („in der Verkehrssimulation“, „beim Live-mBot“). Tasten und Clips sind unverändert.
- Verbindlicher Bühnenablauf (Regie-Bereich, Taste `I`): Szenen 1–2 → Szene 3 (Busproblem) → Knopf „Verkehrssimulation öffnen ↗“ (seit 000; vorher über die Show-Zentrale) → Verkehrstool (normale Ampel / Busanmeldung) → Tab schließen → Live-mBot (LED-Ampel von Hand, nicht mit dem mBot verbunden) → Szene 4 → Szene 5.
- Geprüft: Navigation vor/zurück, Tastatur, Regieansicht, Speicherung und Reset der Szenen 1–2 sowie Anzeige im Finale.

### 00.2 Zukunftsmobilität 2050: Schwebebahn oder Flugtaxi (ohne neue SMARTy-Sätze)

**Im Konfigurator umgesetzt:**
- In der bestehenden Szene 4 „Fahren 2050 Autos von allein?“ gibt es unten einen kompakten Auswahlbereich „Wie bewegen wir uns im Jahr 2050?“.
  Er zeigt zwei Karten mit 3D-Bild:
  - **A Schwebebahn:** „Viele Menschen fahren gemeinsam über der Straße.“
  - **B Flugtaxi:** „Ein kleines Fluggerät startet und landet an festen Plätzen.“
- **Ein Klick** (oder Taste `A`/`B`) wählt und speichert. Die gewählte Karte ist gold markiert. Es gibt keine Untermenüs und keine weitere Abstimmungslogik.
- Die Wahl ist eine Priorisierung. Hinweis auf der Leinwand: „Beides sind Zukunftsideen. Unsere Wahl zeigt, was wir zuerst ausprobieren.“
- Neue Baufläche **Zukunftsverkehr** am Ostweg (`52 62 −20 – 95 79 3`), statische Modelle, keine Fahr- oder Flugphysik:
  - **A:** hängende Schwebebahn: türkise Portalstützen, Fahrbalken über der Straßenmitte, Wagen darunter, Station mit Bahnsteig, Glasdach und Aufzugsturm. Es ist ausdrücklich keine Magnetschwebebahn.
  - **B:** kleines Gebäude mit Landeplatz auf dem Dach (H-Markierung) und einem kleinen Fluggerät mit vier Rotoren.
- Die Kamera der Szene zeigt Kreuzung und Ostweg von Norden. Die gewählte Variante steht im 3D-Modell, mit Tafel und Goldrahmen.
- Die Wahl wird wie alle Beschlüsse gespeichert, ist im Zukunftscheck des Finales sichtbar und bleibt beim Szenenwechsel erhalten. „Mission zurücksetzen“ und „Neu beginnen“ setzen sie zurück. Andere Beschlüsse und die Stadtgeometrie bleiben unverändert.
- Bühnentext für Z1/Z2 und fachliche Hinweise stehen im Regie-Bereich. Es gibt keine neuen SMARTy-Texte oder Clips.

**Minecraft:**
- Umgesetzt: Die exportierte Welt enthält **immer Schwebebahn UND Flugtaxi**, unabhängig von der Abstimmung. Die Abstimmung wird nicht nach Minecraft übertragen, es gibt keine Synchronisierung. Die Prüfung im Finale erwartet das so.
- Die Ersatzwelt `START-IT-SMART_Ersatzwelt_Stadt-2050.mcworld` ist neu erzeugt: gleiche Beschlüsse wie vorher, plus beide Verkehrsmittel. Sie ist mit dem eigenen Leser Block für Block geprüft.
- Von Hand (Regieraum, untere Reihe): Knopf „ZUKUNFT – BAHN + TAXI“, oder im Chat `/clone 52 40 -20 95 57 3 52 62 -20`. Ansichtspunkt „Zukunftsverkehr“ in der oberen Reihe.
- **Noch offen:**
  - Test in Minecraft Education selbst (wie 0.4).
  - Die Amulet-Gegenprobe ist nicht wiederholt. Alle verwendeten Blöcke stammen aber aus der schon geprüften Palette.
  - Die Minecraft-Spielplatz-Testwelt (`minecraft/`) ist unverändert. Sie enthält keine Verkehrsmittel.

### 00.3 Energiecheck nach der Technikmission

- Neuer letzter Schritt der Mission Technik (Technik · 5/5). Er ist keine siebte Mission, keine Abstimmung und kein eigenes Werkzeug. Die Schritte davor (Calliope, Laternen-Abstimmung) sind unverändert.
- Vier Zustände, geschaltet mit „Weiter“ (auch `→`/Leertaste) und „Zurück“. Die Kacheln springen direkt:
  1. **Strom aus:** Die Stadt wird dunkel, Fenster und Laternen sind aus. Die Stadt bleibt sichtbar und bedienbar.
  2. **Sonne + Wind:** Tag, Solarmodule auf drei flachen Hochhausdächern, ein Windrad am südlichen Stadtrand, gelbe Strompunkte zur Hauptstraße.
  3. **Abend + Speicher:** Abendlicht, die Solarmodule liefern nichts mehr, das Windrad dreht langsam. Ein Batteriespeicher (Ladestand sinkt) und ein Mast mit Leitung zum Stromnetz von außerhalb erscheinen.
  4. **Stadt leuchtet:** Nacht, Fenster und Laternen leuchten wieder. Schluss: „Energie erzeugen, speichern und zuverlässig bereitstellen.“
- Keine Zahlen, keine Pop-ups, keine Regler. Fußnote: „Vereinfachte Animation, keine echte Stromnetz-Simulation. Ein Speicher erzeugt keinen Strom …“
- Die Effekte liegen nur **über** der Stadt (Licht, eingeblendete Modelle). Die gespeicherte Stadt, die Beschlüsse und die Minecraft-Welt bleiben unberührt. Nach dem Verlassen sind Licht und Stadt exakt wie vorher (Test).
- SMARTy T6 „Verkehrsproblem“ ist als Regie-Stichwort an das Ende des Energiechecks gewandert (Drehbuch: T6 leitet zur Mobilität über). Taste und Clip sind unverändert.
- Bühnentext Z1/Z2 steht im Regie-Bereich. Vorführdauer etwa 90–120 Sekunden.
- **Noch offen:** Wirkung des dunklen Zustands am echten Beamer (Helligkeit) und Lesbarkeit der Tafeln im Saal.

### 00.4 Geprüft

- `test.html`: **76 von 76**. Neu dabei:
  - genau 5 Mobilitätsszenen, Szenen 1–2 unverändert, kein mBot und kein Ampelvergleich;
  - Energiecheck: 4 Zustände, keine Abstimmung, Licht und Modelle je Zustand, Weiter/Zurück, danach exakt wie vorher;
  - Schwebebahn/Flugtaxi: ein Klick speichert, bleibt beim Szenenwechsel, Zukunftscheck, Reset;
  - Minecraft-Welt bei Wahl A, B und ohne Wahl immer mit beiden Verkehrsmitteln;
  - alle SMARTy-Hinweise nutzen vorhandene Soundboard-Tasten.
- Einzeldatei neu gebaut und gestartet.

---

> **Stand (19.11.2026):**
> - Die Browser-Anwendung ist vollständig, alle Missionen sind enthalten.
> - Die exportierte Welt enthält jetzt die Beschlüsse und startet draußen am Platz (Ursache und Behebung: Abschnitt 0).
> - Technisch doppelt geprüft (eigener Leser und Amulet). **Der Import auf dem Veranstaltungslaptop steht noch aus** – Testplan in Abschnitt 0.4.

---

## 0. Korrekturauftrag vom 19.11.2026

### 0.1 Fehlerursachenanalyse Minecraft Education

| | |
|---|---|
| **Beobachtet** (Screenshots 14–17) | Nach dem Öffnen der heruntergeladenen `.mcworld` steht die Spielfigur in einem Gebäude ohne Ausgang statt in der grünen Stadt. Im Finale gibt es keinen klaren Schritt „In Minecraft übertragen“, nur den Bauauftrag-Dialog mit `/clone`-Befehlen. |
| **Reproduziert** | Datei aus dem alten Dialog erzeugt und gelesen: `level.dat` hatte den Startpunkt `8 50 -7` – das ist der **Regieraum unter der Ringstraße Nord** (ringsum Wände, kein Ausgang). Alle Bauflächen der Datei waren im **grauen Ausgangszustand**, obwohl im Konfigurator acht Beschlüsse übernommen waren. |
| **Ursache** | (b) Startpunkt falsch: bewusst in den Regieraum gelegt, weil die Welt als „Regie-Welt“ gedacht war, in der die Regie live per Knopf baut. (c)/(d) Der Export baute immer nur die graue Stadt plus Vorlagen-Kammern; die Beschlüsse kamen nicht in die Datei. (a) Die Welt selbst war richtig gebaut (Amulet: 0 Abweichungen). (e) Kein Formatproblem: Minecraft Education hat die Datei geöffnet. |
| **Behebung** | Der Export setzt jede Baufläche so, wie sie beschlossen ist (nur übernommene Beschlüsse, keine Vorschau, offene Flächen grau). Startpunkt **draußen** auf dem Gehweg am Platz in der Stadtmitte (`16 64 -2`), Kreativmodus (Fliegen). Die Datei wird nach dem Erzeugen **gelesen und geprüft** (Startpunkt frei mit offenem Himmel, jede Baufläche Block für Block wie beschlossen); nur eine geprüfte Datei wird angeboten, sonst erscheint eine Fehlermeldung. Neuer letzter Schritt im Finale: „Minecraft-Welt erstellen“ mit Anleitung. Weltname mit Datum und Uhrzeit, damit in Minecraft die neueste Datei erkennbar ist. |

Die Vorlagen-Kammern und der Regieraum bleiben in der Welt (nur per `/tp @s 8 50 -7` erreichbar) – für Änderungen von Hand in einer schon geöffneten Welt.
Blickrichtung beim ersten Start: Bedrock speichert sie nicht in `level.dat`; neue Spieler schauen nach Süden (+z), also über den Platz. Das ist auf dem Zielsystem zu bestätigen.

### 0.2 Änderungsprotokoll

| Punkt im Auftrag | Änderung |
|---|---|
| 0 Minecraft | siehe 0.1; Ersatzwelt mit typischen Beschlüssen: `START-IT-SMART_Ersatzwelt_Stadt-2050.mcworld` (Link im Export-Schritt) |
| 1 Layout | Eigene Kopfzone (Kicker, Titel als Leitfrage, eine Unterzeile), darunter die **freie 3D-Bühne**, rechts daneben die Seitenleiste (Knopf „Infos“ in der Fußleiste blendet sie aus), darunter Karten und Fußleiste. Kein Text liegt über der Stadt. Jede Kamera wird bei jeder Bühnengröße neu eingepasst (`rahmen` je Ansicht). Hinweisstreifen („Handzeichen …“, „Im Modell …“) entfernt – Inhalte stehen im Regie-Bereich (Taste `I`). „Übernehmen“ heißt jetzt **„In Stadt übernehmen“**. |
| 2 Ausgangszustand | Bauflächen einer späteren Mission bleiben grau, bis ihre Mission erreicht ist – Natur Szene 1 ist komplett grau, auch wenn schon Beschlüsse gespeichert sind. A/B-Vorschauen speichern nichts. Status je Abstimmung: „Noch offen“, „Vorschau – noch nicht übernommen“, „✓ Übernommen: …“. „Mission zurücksetzen“ (nur diese Mission, zweimal klicken) und „Neu beginnen“ (Regie: Beschlüsse, Mehrheiten, Vorschau, Rundgang, Regen, Nacht, Export, Kamera). Finale und Export nutzen nur übernommene Beschlüsse. |
| 3 Natur/Starkregen | Konfigurator: Regen-Infos in der Seitenleiste, gekennzeichnet „Vereinfachtes Modell · Zeit gerafft · ohne Mengen“. Natur-Simulation: Beschriftungen beim Starkregen und im Endbild als **Randlegende links mit feinen Linien** zum Wasser, Schalter **„Beschriftungen“** (Taste `L`) blendet sie aus. |
| 4 Technik | Neue Reihenfolge: Frage „Woher weiß eine Lampe, dass es dunkel ist?“ → **Calliope live** (Sensor → Programm → LED; Regel 2: erst nach etwa 5 s ununterbrochener Dunkelheit) → Abstimmung über die 1.000 Laternen → Ergebnis Tag/Nacht. Keine Kopplung Calliope–Stadt. |
| 5 Mobilität | Volle Straße → Parken A/B/C → Bus wartet → **mBot live** (Ampel von Hand) → **Verkehrssimulation** (eigene Seite) → **„Fahren 2050 Autos von allein?“** (Sensoren, Kameras, Computer; Möglichkeiten und Grenzen; keine Vorhersage; ohne Fahrer ist nicht automatisch weniger Verkehr) → zurück in die Stadt (Busanmeldung). Szenennummern und SMARTy-Tasten umsortiert. |
| 6 Wohnen | Texte kürzer und sachlich; Aufstocken als „zusätzliche Bauidee“ gekennzeichnet. |
| 6 Kurze Wege | Leitfrage „Wo sind die Brötchen am nächsten?“, großer Startpunkt „Hier wohnen wir“, große farbige Ziele A/B/C (nur Buchstaben), breite Wege mit weißem Rand, keine Fragezeichen; erst schätzen, dann „Wege messen“ (seit 24.11.: ungefähre Meter, Modellmaßstab 1 Feld = 10 m, siehe Abschnitt 0000). |
| 6 Finale | Rundgang heißt „Vorschau-Rundgang“ (im Konfigurator). Nach der letzten Station führt „Weiter“ zu **„Minecraft-Welt erstellen“**: Stadt fertig → Welt erstellen (Download mit Prüfergebnis) → Anleitung zum Öffnen → optional Bauaufträge von Hand. Showablauf (Minecraft-Rundgang, Abschlussfilm mit der Erzählerstimme des Intros, Abschlussfolie mit QR-Codes) steht im Regie-Bereich; Film und Folie sind nicht Teil des Konfigurators. |

### 0.3 Geprüft (automatisch)

- `test.html`: **67 von 67** Prüfungen, darunter neu: Export mit allen Beschlüssen (Datei gelesen, Startpunkt draußen, 8 Bauflächen Block für Block), Wiederholung mit anderen Beschlüssen (keine alten Zustände), Export ohne Beschlüsse = grau, grauer Ausgangszustand trotz gespeicherter Beschlüsse, keine Überdeckung der 3D-Bühne in 9 Szenen (16:9), Kamera-Rahmen ganz auf der Bühne, Reihenfolge Calliope/mBot, Finale → Export, „Neu beginnen“ setzt Export und Kamera zurück.
- **Amulet** (unabhängiger Leser) mit der Ersatzwelt: 24 Kammern und 8 Bauflächen wie beschlossen, 0 Abweichungen; Startpunkt `16 64 -2` frei bis zum Himmel, darunter Gehweg; 37 Befehlsblöcke lesbar.

### 0.4 Test auf dem Zielsystem (noch offen – bitte auf dem Veranstaltungslaptop)

Nicht von mir ausführbar: Ich habe kein Minecraft Education.

1. Im Konfigurator einige Beschlüsse übernehmen, im Finale „Minecraft-Welt erstellen“. Die Meldung muss „✓ Welt erstellt und geprüft“ zeigen.
2. Datei doppelklicken (oder Minecraft Education › Spielen › Importieren). Die Welt mit Datum und Uhrzeit im Namen öffnen.
3. Erwartet: Start **draußen** am Platz in der Stadtmitte, Blick über den Platz. Stimmen Park, Straßen, Wohnen, Einkauf und Bildungsort mit dem Konfigurator überein? (Fliegen: zweimal Leertaste.)
4. Neu beginnen, **andere** Beschlüsse wählen, neue Welt erstellen und importieren: Die neue Welt zeigt die neuen Beschlüsse.
5. Die Ersatzwelt ebenso öffnen und prüfen, dann als Sicherheitsnetz auf dem Laptop behalten.
6. Ergebnis (Version von Minecraft Education, Blickrichtung beim Start, Auffälligkeiten) in diese Datei eintragen.

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
| Figur **Mika** (Original, ältere Drehbuchstellen K1, B2, Finale) | Entfernt aus Oberfläche, Wegen, Kameras und neuen Texten. Startpunkt: „Unser Wohnhaus“. Kurze Wege spricht die Kinder direkt an (Ergänzungsauftrag): „Stellt euch vor, ihr wohnt hier und wollt morgens frische Brötchen holen …“. Der Test prüft, dass „Mika“ nirgends vorkommt. |
| Ergänzungsauftrag nennt die letzte Mission „Bildung, Freizeit und Teilhabe“ | Titel bleibt wie im Drehbuch: „Mission Bildung und Teilhabe – Eine Stadt für alle“. Inhalt und Reihenfolge sind gleich. |
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
| `2` | Technik | Frage „Woher weiß eine Lampe …?“ · **Calliope live** · Abstimmung „immer an / nur bei Dunkelheit“ · Ergebnis Tag → Nacht · **Energiecheck** (4 Zustände, nur Bühneneffekt) | Hauptstraße (16 Laternen) | LATERNEN IMMER AN / SENSOR, ZEIT TAG / NACHT |
| `3` | Mobilität (5 Szenen) | volle Straße · Parken A/B/C · Bus wartet mit Knopf **Verkehrssimulation öffnen ↗** (danach Live-mBot außerhalb) · „Autos von allein?“ mit Auswahl **Schwebebahn/Flugtaxi** · Ergebnis: Parken, Busanmeldung, Zukunftsidee | Wohnstraße + Parkhausplatz; Kreuzung; Zukunftsverkehr (Ostweg) | PARKEN GRAU/A/B/C, KREUZUNG NORMAL/BUS, ZUKUNFT BAHN + TAXI (immer beide) |
| `4` | Wohnen | sechs Familien (Wohnsimulator, eigene Seite) · Wohnformen A/B/C · Aufstocken + 2 Holzgeschosse | Wohngrundstück; Bestandshaus | WOHNEN GRAU/A/B/C, AUFSTOCKEN BESTAND/+2 HOLZ |
| `5` | Kurze Wege | „Wo sind die Brötchen am nächsten?“: drei Wege von „Hier wohnen wir“ schätzen und messen · Laden A/B/C mit Fußwegen von 7 Wohnhäusern | Westviertel | EINKAUFEN GRAU/A/B/C |
| `6` | Bildung | ein Raum, zwei Nutzungen · Orte A/B/C mit Teilhabe-Fragen | Südviertel | BILDUNG GRAU/A/B/C |
| `7` | Finale | Zukunftscheck (nur echte Beschlüsse) · Vorher/Nachher · Vorschau-Rundgang · **Minecraft-Welt erstellen** | alle | Export-Datei mit allen Beschlüssen |

**Extern bleiben:**
- Introfilm, Live-Ankunft, Zeitmaschinen-KI
- SMARTy-Audio (Soundboard; die Regie-Leiste nennt die Tasten)
- Calliope-Experiment
- Verkehrssimulation, Wohnsimulator, Natur-Simulation
- mBot und Modellampel, die **nicht** verbunden sind

### 2a. Ergänzungsauftrag „Kurze Wege – Wo liegt der Laden?“ (17.11.2026)

Die Mission war schon an der verlangten Stelle (nach Wohnen, vor Bildung) als eigene A/B/C-Abstimmung mit eigener Baufläche. Geändert:

| Auftrag | umgesetzt |
|---|---|
| A – großer Supermarkt am Stadtrand | große Halle mit **orangem Flachdach**, Glasfront, rotes Werbeband, Parkplatz; am Westrand der Stadt |
| B – gut erkennbare Markthalle in der Mitte | Halle mit **grünem Kupferdach** (Farbe von B) und Glasfirst, bunte Marktstände vor beiden Eingängen; zwischen Westviertel und Stadtmitte |
| C – Bäckerei, Lebensmittel- und Gemüseladen, verteilt, in bestehenden Erdgeschossen | drei Läden im **Erdgeschoss vorhandener Wohnhäuser** (Bäckerei Haus Ost, Lebensmittel Gasse, Gemüse Haus West) mit **gelb gestreiften Markisen**, Schaufenstern, Auslagen, Schildern. Die Häuser bleiben stehen. Der Kiosk der alten Fassung ist entfallen. |
| auf dem Beamer deutlich erkennbar | Kamera schaut von Westen über das Viertel und wird beim Anzeigen **für das tatsächliche Bildformat** so berechnet, dass das ganze Viertel neben dem Titel und über den Karten liegt (auch 4:3 oder 16:10). Tafeln nennen jeden Laden: „A · Supermarkt“, „B · Markthalle“, „C · Bäckerei“ … |
| Wechsel A/B/C: Wohnhäuser, Straßen, frühere Ergebnisse bleiben | Test: 0 geänderte Hausblöcke (ab 1. Obergeschoss) und 0 Straßenfelder je Variante; andere Bauflächen bleiben unberührt |
| Fußwege von Wohnhäusern zu den Geschäften, ohne erfundene Entfernungen | Abstimmung: Linien von **allen 7 Wohnhäusern** des Viertels zum jeweils nächsten Laden der gezeigten Variante (weiße Stifte = Haustüren). Keine Zahlen auf der Leinwand. „Wege messen“ misst den Weg von „Unser Wohnhaus“ im Modell und zeigt ihn seit 24.11. als ungefähre Meter (1 Feld = 10 m, keine Minuten). Gemessen: A 53, B 35, C 14 Felder = 530 / 350 / 140 m; Summe aller 7 Wege A 275, B 235, C 78. |
| nach der Handabstimmung fest übernehmen, bis zum Finale sichtbar | wie bei allen Abstimmungen: „Übernehmen“ (`Enter`). Im Finale-Rundgang zeigt die Station „Einkaufen in unserem Viertel“ die gewählten Läden und den Weg von unserem Wohnhaus. |
| Mika nicht verwenden | Schritt 1: „Wie weit ist es bis zum nächsten Laden?“ / „Stellt euch vor, ihr wohnt hier und wollt morgens frische Brötchen holen.“ In C ist der nächste Laden von unserem Wohnhaus die Bäckerei. |
| Optik, Bedienung, andere Missionen beibehalten | unverändert; neu ist nur eine zweite Querung der Ringstraße Nord vor dem Haus Ost (Weg zur Mitte) |

**Abschließende Prüfung gegen das Drehbuch (Arbeitsfassung 16.11.2026):**

| Kapitel im Drehbuch | Abstimmung | in der Anwendung |
|---|---|---|
| 2 · Szene 0–4 (Intro, Ankunft, SMARTy, Zukunftsteam) | – | Mission 0 (Introfilm u. a. extern) ✓ |
| 3 · Mission Natur | Park oder Spielplatz? A/B, danach „Beides gemeinsam“ | Mission 1 ✓ |
| 4–8 · Mission Technik | Laternen: immer an / nur bei Dunkelheit (A/B) | Mission 2 ✓ |
| 9 · Mission Mobilität | Parken A/B/C | Mission 3 ✓ (Ampel, mBot extern) |
| 10 · Mission Wohnen und Bauen | Wohnformen A/B/C | Mission 4 ✓ (Aufstocken als Vorher/Nachher) |
| 11 · Mission Kurze Wege | Standort A/B/C | Mission 5 ✓ |
| 12 · Mission Bildung und Teilhabe | Orte A/B/C | Mission 6 ✓ |
| 12a · Finale | – | Mission 7 ✓ (Zukunftscheck, Rundgang Wohnung → Laden → Platz → Kreuzung → Freizeitort) |

Der Test „Drehbuch: Reihenfolge …“ prüft genau diese Folge und die Buchstaben jeder Abstimmung.

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
- pro Mission: `Mission zurücksetzen`, zweimal klicken (andere Missionen bleiben)
- alles: Regie › „Neu beginnen …“

### Bauflächen (feste Koordinaten; x nach Osten, z nach Süden, Boden y 63)

| Baufläche | Quader | Größe | Vorlagen-Kammern (gleiche x/z, darunter) |
|---|---|---|---|
| Spielplatz | 0 59 0 – 31 74 31 | 32 × 16 × 32 | grau: y 39…54, gruen: y 19…34 (wie im Spielplatz-Test) |
| Straßenbeleuchtung Hauptstraße | 32 62 0 – 45 71 95 | 14 × 10 × 96 | immer: y 48…57, sensor: y 34…43 |
| Wohnstraße und Parken | −64 62 −44 – 31 79 −25 | 96 × 18 × 20 | grau 40…57, A 18…35, B −4…13, C −26…−9 |
| Kreuzung mit Bus | 32 62 −26 – 51 73 −1 | 20 × 12 × 26 | normal 46…57, bus 30…41 |
| Zukunftsverkehr (Ostweg) | 52 62 −20 – 95 79 3 | 44 × 18 × 24 | beide 40…57 (in der Welt immer „beide“; A/B nur im Konfigurator) |
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
- **[Bild 8]** Kurze Wege, Abstimmung mit Vorschau C (Läden und Wege)
- **[Bild 9]** Finale mit Zukunftscheck

**Ablauf je Abstimmung:**
1. Karte anklicken oder `A`/`B`/`C` drücken. Die Stadt zeigt die Variante als **Vorschau**; die Fußnote sagt „noch nicht übernommen“.
2. Nach dem Handzeichen **Übernehmen** (`Enter`). Erst dann ist es ein Beschluss.
3. Optional die Mehrheit merken (Regie-Leiste). Sie erscheint im Zukunftscheck.
4. In Minecraft denselben Bauauftrag auslösen (`M` zeigt Knopf und Befehl).

**Regie-Leiste `I`:**
- Drehbuch-Stichworte
- SMARTy-Clips mit Soundboard-Taste (alle Clips des Drehbuchs sind im Soundboard; F2 ist Clip 06, Taste 6).
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

- **Für die Show:** Im Finale „Minecraft-Welt erstellen“ – die Datei enthält die Stadt mit allen übernommenen Beschlüssen; Start draußen am Platz in der Stadtmitte (`16 64 -2`), Kreativmodus. Name: „START IT SMART Stadt 2050 · TT.MM. hh:mm“.
- **Von Hand (optional):** Die Welt kann während der Vorlesung offen bleiben und per Bauauftrag geändert werden:
- Unter jeder Baufläche liegt jede Variante fertig gebaut in einer Kammer, in denselben Chunks.
- Ein Bauauftrag ist **ein** Befehl: `/clone <Kammer> <Baufläche>`. Er wirkt sofort und überschreibt jeden Block der Fläche, auch mit Luft. Er gilt nur für diese Fläche.
- **Keine Verbindung Browser → Minecraft.** Die Regie löst jeden Auftrag selbst aus:
  - im **Regieraum** per Knopf (unter der Ringstraße, erreichbar mit `/tp @s 8 50 -7`)
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

## 7. Testbericht (`test.html`, 67 Prüfungen, alle bestanden – Stand 19.11.2026, Einzelheiten zum Korrekturauftrag in 0.3)

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
| Kurze Wege | von unserem Wohnhaus 53 / 35 / 14 Felder = 530 / 350 / 140 m (C: Bäckerei), Wege aller 7 Wohnhäuser, Summe C < B < A, A für 6 von 7 Häusern weiter als C; Wege nur über das Westviertel; Wechsel A/B/C ändert 0 Hausblöcke und 0 Straßenfelder; C-Läden im Erdgeschoss bestehender Häuser; in der Oberfläche je Variante 7 Wege und die Ladentafeln, übernommene Wahl bleibt bis zum Finale; Einkauf C bleibt beim Wechsel der Bildung | ✓ |
| Drehbuch | Reihenfolge Start → Natur → Technik → Mobilität → Wohnen → Kurze Wege → Bildung → Finale, Abstimmungen A/B, A/B, A/B/C ×4; Kurze Wege eigene Abstimmung und Fläche; „frische Brötchen“, keine Entfernungsangaben | ✓ |
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
