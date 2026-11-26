# Clip-Zuordnung: Mission → Szene → Clip → Datei

Automatisch erzeugt aus `sounds.json` (`"missionen"`) mit `python tools/zuordnung.py`. Reihenfolge = Regie-Soundboard (Drehbuch vom 22.11.2026, Änderungsauftrag vom 22.11.2026). SMARTy: Sprachausgabe Christoph (+20 Hz, +3 %), Zeitmaschinen-KI: Tanja (digital). Alle Clips ohne Musik, auf −16 LUFS angeglichen.

**Prüfung Text ↔ Audio:** Die Sprachdateien werden aus dem Feld `sprechen` erzeugt. Es entspricht dem angezeigten Text, nur mit Pausenmarken und Aussprache (z. B. „zweitausendfünfzig“). Der Generator erzeugt jede Datei neu, sobald sich dieser Text ändert. `test-dashboards.html` vergleicht zusätzlich die Satzteile in der Audiodatei. Das ist keine Spracherkennung: Vor der Show einmal anhören.

## Eröffnung – Introfilm und Live-Ankunft

| Kennung | Taste | Sprecher | Szene | Text | Datei | Einsatz / Stand |
|---|---|---|---|---|---|---|
| – | | | *Davor: Introfilm – startet in der Show-Zentrale (Ton steckt im Film).* | | | |
| **KI1** | `A` | Zeitmaschinen-KI | Szene 2 · Live-Ankunft · Leinwand „ZEITREISE ABGESCHLOSSEN“ | Zeitreise abgeschlossen. Ziel erreicht. Willkommen in der Vergangenheit. | `audio/KI_01_Zeitreise_abgeschlossen.mp3` (7,2 s) | Nach dem Intro · Leinwand: „ZEITREISE ABGESCHLOSSEN“ |
| **KI2** | `S` | Zeitmaschinen-KI | Szene 2 · Alterstransformation · Leinwand „SYSTEMFEHLER: ALTERSTRANSFORMATION“ | Warnung! Systemfehler! Unerwartete Alterstransformation festgestellt. Biologisches Alter der Zeitreisenden verändert. | `audio/KI_02_Systemfehler_Alterstransformation.mp3` (10,9 s) | Wenn die Zeitreisenden merken, dass sie erwachsen sind · Leinwand: „SYSTEMFEHLER: ALTERSTRANSFORMATION“ |
| **KI3** | `D` | Zeitmaschinen-KI | Szene 3 · Blinder Passagier · Leinwand „UNBEKANNTER PASSAGIER ERKANNT“ | Achtung! Zusätzlicher Passagier erkannt. Identifikation läuft … Roboterhund SMARTy identifiziert. Passagier war nicht angemeldet. | `audio/KI_03_Unbekannter_Passagier.mp3` (13,2 s) | Kurz bevor der echte SMARTy (Unitree Go2) auftritt · Leinwand: „UNBEKANNTER PASSAGIER ERKANNT“ |
| **O1** | `1` | SMARTy | Szene 3 · Systemcheck – SMARTy ist auf der Bühne, nach Z2 „Du bist uns heimlich gefolgt!“ | Systemcheck abgeschlossen. Zeitreise überstanden. Moment mal … wo sind wir denn hier gelandet? | `audio/SMARTy_01_Landung.mp3` (7,0 s) | Nach dem Zeitreise-Crash. |
| **O9** | `9` | SMARTy | Szene 3 · nach Z1 „Aber warum bist du überhaupt mitgekommen?“ | Ich habe mich mitgeschmuggelt. Ihr habt vergessen, mich einzuladen. | `audio/SMARTy_09_Mitgeschmuggelt.mp3` (4,2 s) | Eröffnung, Szene 3 – nach SMARTys Systemcheck und Z1 „Aber warum bist du überhaupt mitgekommen?“ · reaktiviert (Drehbuch 22.11.2026) |

Reserve (nicht im aktuellen Drehbuch, bleibt erhalten):

| Kennung | Taste | Sprecher | Szene | Text | Datei | Einsatz / Stand |
|---|---|---|---|---|---|---|
| **O8** | `8` | SMARTy | frühere Fassung der Ankunft | Zeitreise erfolgreich. Heimlicher Passagier ebenfalls angekommen. | `audio/SMARTy_08_Heimlicher_Passagier.mp3` (4,3 s) | Ankunftsszene. |
| **O10** | `0` | SMARTy | frühere Fassung der Ankunft | Doch. Sehr guter Grund. | `audio/SMARTy_10_Sehr_guter_Grund.mp3` (1,9 s) | Ankunftsszene: trockene Antwort. |
| **O2** | `2` | SMARTy | ältere Sätze | Alarm! Ich entdecke ganz viele kleine Menschen! Können die uns etwa hören? | `audio/SMARTy_02_Entdeckung.mp3` (5,6 s) | SMARTy schaut zum Publikum. |
| **O5** | `5` | SMARTy | ältere Sätze | Achtung, Achtung! Unsere Zukunftsstadt ist in Gefahr! Wir brauchen dringend eure Hilfe! | `audio/SMARTy_05_Zukunftsalarm.mp3` (6,4 s) | Beginn der Rettungsmission. |
| **O7** | `7` | SMARTy | Soundcheck vor der Show – nicht der Intro-Systemcheck (anderer Text) | Systemcheck abgeschlossen. Alle vier Beine vorhanden. Moment mal … was sind denn das für kleine Wesen? | `audio/SMARTy_07_Stimmtest.mp3` (7,1 s) | Optional: Stimmtest über die Hallenanlage vor der Show. |

## Natur – Aus Grau wird Grün

| Kennung | Taste | Sprecher | Szene | Text | Datei | Einsatz / Stand |
|---|---|---|---|---|---|---|
| **N1** | `3` | SMARTy | Szene 1 · Der graue Platz (Clip 03) | Ich habe 327 Computerspiele gespeichert. Wozu braucht ihr denn noch echte Spielplätze? | `audio/SMARTy_03_Frage.mp3` (6,4 s) | Mission Natur · nach „Vielleicht fehlt hier einfach das richtige Computerspiel?“ |
| **N2** | `4` | SMARTy | Szene 2 · Park oder Spielplatz? – nach „Beides gemeinsam“ (Clip 04) | Aha! Menschen brauchen also nicht nur Computer, sondern auch Natur, Freunde und Platz zum Spielen! | `audio/SMARTy_04_Aha.mp3` (6,1 s) | Mission Natur · Leinwand „DIE LÖSUNG: BEIDES GEMEINSAM!“, Grünversion in Minecraft |
| **N3** | `W` | SMARTy | Szene 3 · Starkregen – nach Z2s Frage, vor der Simulation | Wetterwarnung! Starkregen im Anmarsch. Prognose: sehr, sehr nasse Pfoten. | `audio/SMARTy_N3_Wetterwarnung.mp3` (5,6 s) | Natur, Szene 3 – nach Z2s Frage nach Starkregen, vor der Simulation · reaktiviert (Drehbuch 22.11.2026) |
| **N5** | `<` | SMARTy | Szene 3 · Starkregen – Sensoren messen die Bodenfeuchte | Technikidee erkannt! Ein Bodenfeuchtesensor liefert Messwerte. Ein Computer kann anzeigen, ob die Erde trocken ist. | `audio/SMARTy_N5_Bodenfeuchte.mp3` (7,2 s) | Szene 3 · Starkregen – beim Regenwasser für die Bäume (neu laut Sprachtexte-Liste 19.11.2026) |
| **N4** | `E` | SMARTy | Szene 3 · Starkregen – nach Sensor und Mensch, vor dem Szenenabschluss | Neue Erkenntnis gespeichert: Ein guter Spielplatz kann auch Regenwasser auffangen. Multifunktional. Gefällt mir! | `audio/SMARTy_N4_Regenwasser.mp3` (7,3 s) | Natur, Szene 3 – nach der Erklärung Sensor/Mensch, vor dem Szenenabschluss · reaktiviert (Drehbuch 22.11.2026) |

## Technik – Straßenlaternen

| Kennung | Taste | Sprecher | Szene | Text | Datei | Einsatz / Stand |
|---|---|---|---|---|---|---|
| **T1** | `R` | SMARTy | Bühnendialog – nach „Liebe Straßenlaternen …“, nichts passiert | Sprachbefehl nicht erkannt. Straßenlaternen besitzen keine Ohren. Vorschlag: Helligkeitssensor verwenden. | `audio/SMARTy_T1_Sprachbefehl.mp3` (6,9 s) | Technik zu Beginn – nach „Liebe Straßenlaternen, bitte nur leuchten, wenn es dunkel ist!“, vor dem Calliope-Experiment |
| **T2** | `T` | SMARTy | Programmierfolie – vor dem Calliope-Test | Programm verstanden. Bereit für den Praxistest. | `audio/SMARTy_T2_Programm_verstanden.mp3` (3,2 s) | Nach der Programmierfolie · nach „… einer Regel, die wir festgelegt haben.“ |
| **T3** | `Z` | SMARTy | Zusatzaufgabe kurze Wolke – Regel mit fünf Sekunden | Programmoptimierung erkannt. Kurzzeitige Verdunkelung ignorieren. Sehr gute Idee, Zukunftsteam! | `audio/SMARTy_T3_Programmoptimierung.mp3` (6,4 s) | Nach der Verbesserungsfolie „Wir machen unser Programm schlauer!“ |
| **T4** | `U` | SMARTy | Ergebnis im Stadt-Konfigurator | Experiment erfolgreich. Intelligente Straßenbeleuchtung kann in die Stadtplanung übernommen werden. | `audio/SMARTy_T4_Experiment_erfolgreich.mp3` (5,9 s) | Nach dem Calliope-Experiment, vor der Laternenabstimmung |
| **T5** | `I` | SMARTy | nach der Tag-/Nachtansicht | Mission Technik abgeschlossen. Zukunftsstadt aktualisiert. | `audio/SMARTy_T5_Mission_Technik.mp3` (3,9 s) | Nach der Laternenabstimmung und Tag/Nacht in der Stadt |
| **T6** | `O` | SMARTy | Übergang zur Mobilität (optional) | Warnung. Verkehrsproblem erkannt. | `audio/SMARTy_T6_Verkehrsproblem.mp3` (2,4 s) | Optional · Übergang zur Mobilität, Leinwand: Kreuzung in Minecraft · nur falls die Szene so bleibt |

## Mobilität – Platz für alle

| Kennung | Taste | Sprecher | Szene | Text | Datei | Einsatz / Stand |
|---|---|---|---|---|---|---|
| **M1** | `Y` | SMARTy | Szene 1 · Die Straße ist voll | Verkehrsanalyse: Viele parkende Autos. Wenig Platz für Menschen. Meine vier Beine finden das unpraktisch. | `audio/SMARTy_M1_Verkehrsanalyse.mp3` (7,2 s) | Szene 1 · nach „Autos, Autos, Autos! Wo können hier Kinder sicher laufen?“ |
| **M2** | `X` | SMARTy | Szene 2 · Parkplatzentscheidung | Jeder Parkplatz braucht Fläche. Gute Planung muss an Kinder, Fußgänger, Fahrgäste und Menschen mit schweren Einkäufen denken. | `audio/SMARTy_M2_Parkplatz_Flaeche.mp3` (7,5 s) | Szene 2 · nach der Abstimmung A/B/C und „… mit ihren Einkäufen weiter laufen.“ |
| **M3** | `C` | SMARTy | Szene 2 · Parkplatzentscheidung | Vorschlag: Parkplätze bündeln, Gehwege verbreitern und sichere Übergänge schaffen. | `audio/SMARTy_M3_Vorschlag.mp3` (5,1 s) | Szene 2 · nach „Können wir vielleicht das Beste aus mehreren Ideen verbinden?“ |
| **M9** | `.` | SMARTy | Szene 2 · Probe-Bauen am Computer | Simulation erkannt. Verschiedene Lösungen lassen sich am Computer vergleichen, bevor in der echten Stadt gebaut wird. | `audio/SMARTy_M9_Simulation.mp3` (6,7 s) | Szene 2 · Parkplatzentscheidung – nach M3, beim Vergleich der Varianten im Stadt-Konfigurator (neu 19.11.2026) |
| **M4** | `V` | SMARTy | Szene 3 · Der Bus wartet | Bus erkannt. Viele Fahrgäste erkannt. Wartezeit erkannt. Geduld … nicht erkannt. | `audio/SMARTy_M4_Geduld.mp3` (6,6 s) | Szene 3 · nach „Passen in einen Bus mehr Menschen als in ein Auto?“ |
| **M5** | `B` | SMARTy | Szene 4 · Verkehrssimulation – Versuch B, Bus meldet sich an | Funkverbindung hergestellt. Der Bus meldet sich an der Ampel. | `audio/SMARTy_M5_Funkverbindung.mp3` (3,8 s) | Verkehrssimulation (nach dem mBot) – vor Versuch B: der Bus meldet sich an |
| **M6** | `N` | SMARTy | Szene 4 · Verkehrssimulation – nach der Frage nach den Autos | Eine intelligente Ampel darf niemanden gefährden. Der Bus kann früher Grün bekommen – andere warten dann vielleicht etwas länger. | `audio/SMARTy_M6_Niemand_gefaehrden.mp3` (7,3 s) | Verkehrssimulation – nach „Aber was passiert mit den Autos auf der anderen Straße?“ |
| **M7** | `M` | SMARTy | Szene 5 · mBot als Bus – nach dem Test bei Grün | Test erfolgreich. Unser Roboter hält und fährt auf ein Signal hin weiter. Die Ampel steuert ihn heute noch nicht selbst. | `audio/SMARTy_M7_Test_erfolgreich.mp3` (7,2 s) | Szene 5 · mBot auf der Bühne (nach der Verkehrssimulation) – nach dem Test bei Grün |
| **M10** | `-` | SMARTy | Szene 5 · nach Z2 „Fahren Autos dann vielleicht ganz allein?“ | Zukunftsprognose: Manche Autos könnten 2050 selbstständig fahren. Dafür brauchen sie Kameras, Sensoren, Computer – und sehr gute Sicherheitsregeln. | `audio/SMARTy_M10_Selbstfahrende_Autos.mp3` (10,4 s) | Szene 5 · nach M7 und Z2 „Fahren Autos dann vielleicht ganz allein?“ · Drehbuch 22.11.2026 |
| **M11** | `Q` | SMARTy | Szene 5 · nach Z1 „… dass nie etwas schiefgehen kann?“ | Negativ! Auch schlaue Autos können Fehler machen. Darum müssen Menschen Technik gründlich testen und klare Regeln festlegen. | `audio/SMARTy_M11_Fehler_moeglich.mp3` (7,5 s) | Szene 5 · nach M10 und Z1 „Aber heißt selbstfahrend auch, dass nie etwas schiefgehen kann?“ · Drehbuch 22.11.2026 |
| **M8** | `,` | SMARTy | Szene 6 · Abschluss und Rückkehr in die Zukunftsstadt | Mission Mobilität abgeschlossen. Zukunftsstadt verbessert. Danke, Zukunftsteam! | `audio/SMARTy_M8_Mission_Mobilitaet.mp3` (5,6 s) | Szene 6 · nach „Wer hat die Ideen geliefert?“ – Kinder: „Wir!“ |

## Wohnen – Sechs Familien

| Kennung | Taste | Sprecher | Szene | Text | Datei | Einsatz / Stand |
|---|---|---|---|---|---|---|
| **W1** | `G` | SMARTy | Szene 1 · Wie viel Platz brauchen sechs Wohnungen? | Bauauftrag erkannt. Sechs Familien. Sechs Wohnungen. Begrenzte Fläche. | `audio/SMARTy_W1_Bauauftrag.mp3` (5,1 s) | Szene 1 · nach „Aber jetzt ziehen sechs Familien hierher. Wo sollen sie wohnen?“ |
| **W2** | `H` | SMARTy | Szene 1 · Ein Grundstück, drei Wohnformen | Messung abgeschlossen. Gleich viele Wohnungen. Unterschiedliche bebaute Bodenfläche. | `audio/SMARTy_W2_Messung.mp3` (5,0 s) | Szene 1 · nach dem Stapeln im Wohnsimulator und „… mehr Platz frei!“ |
| **W3** | `J` | SMARTy | Szene 2 · Drei Wohnformen – drei Folgen | Sechs Familien, drei Bauweisen. Unterschiedlicher Platzbedarf – aber keine Lösung ist für alle Menschen gleich gut. | `audio/SMARTy_W3_Drei_Entwuerfe.mp3` (6,9 s) | Szene 2 · Drei Wohnformen – drei Folgen (Wortlaut 19.11.2026) |
| **W4** | `K` | SMARTy | Szene 3 · Aufstocken, Holz und CO₂ | Alternative erkannt: Bestehendes Haus erhalten und um zwei Geschosse aufstocken. | `audio/SMARTy_W4_Aufstocken.mp3` (4,9 s) | Szene 3 · nach „Oder können wir ein vorhandenes weiterverwenden?“ |
| **W5** | `L` | SMARTy | Szene 3 · Aufstocken, Holz und CO₂ | Klimacheck: Nicht nur das Material zählt. Auch Herkunft, Lebensdauer und Weiterverwenden sind wichtig. | `audio/SMARTy_W5_Klimacheck.mp3` (6,8 s) | Szene 3 · nach „… brauchen wir nicht alles neu herzustellen.“ |

## Kurze Wege – Wo liegt der Laden?

| Kennung | Taste | Sprecher | Szene | Text | Datei | Einsatz / Stand |
|---|---|---|---|---|---|---|
| **K1** | `Ö` | SMARTy | Ladenstandorte und Wegvergleich | Wegvergleich gestartet. Ein Ladenstandort entscheidet mit darüber, wie weit Menschen zu Fuß gehen müssen. | `audio/SMARTy_K1_Wegvergleich.mp3` (6,0 s) | nach „Welche Strecke sieht am kürzesten aus?“ – beim Zeigen der drei Wege |
| **K3** | `SS` | SMARTy | Ladenstandorte und Wegvergleich – vor der Abstimmung | Digitale Stadtplanung: Standorte und Fußwege vergleichen. So werden kurze und längere Wege sichtbar. | `audio/SMARTy_K3_Digitale_Stadtplanung.mp3` (6,6 s) | nach K1, wenn die Wege im Stadt-Konfigurator zu sehen sind (neu 19.11.2026) |
| **K2** | `Ä` | SMARTy | nach der Abstimmung | Stadt der kurzen Wege: Wohnen, Einkaufen und Freizeit möglichst gut erreichbar planen. | `audio/SMARTy_K2_Kurze_Wege.mp3` (5,4 s) | nach der Abstimmung A, B oder C |

## Bildung – Bildung, Freizeit und Teilhabe

| Kennung | Taste | Sprecher | Szene | Text | Datei | Einsatz / Stand |
|---|---|---|---|---|---|---|
| **B1** | `P` | SMARTy | Szene 1 · Ein Raum, zwei Nutzungen | Raumanalyse: Vormittags Unterricht. Nachmittags Werkstatt. Ein Gebäude, zwei Nutzungen. | `audio/SMARTy_B1_Raumanalyse.mp3` (6,5 s) | Szene 1 · nach „Könnte sie dann eine Werkstatt sein?“ |
| **B4** | `Umschalt + +` | SMARTy | Szene 1 · Ein Raum, zwei Nutzungen – vorhandene Gebäude nutzen | Stadtmodell aktualisiert. Bestehende Gebäude können neue Aufgaben bekommen. Das spart möglicherweise Baumaterial und Platz. | `audio/SMARTy_B4_Stadtmodell.mp3` (7,8 s) | Szene 1 · Ein Raum, zwei Nutzungen – nach „Vielleicht können wir Gebäude nutzen, die schon da sind.“ (Taste Umschalt + +) · Wortlaut Drehbuch 22.11.2026 |
| **B2** | `Ü` | SMARTy | Szene 2 · Welche Orte passen zu allen? | Zugang prüfen: Ist der Ort erreichbar, bezahlbar und auch ohne eigenes Smartphone nutzbar? | `audio/SMARTy_B2_Zugang.mp3` (5,9 s) | Szene 2 · nach der Frage, ob Eintritt oder Smartphone-Anmeldung für alle fair ist |
| **B3** | `+` | SMARTy | Szene 2 · nach der Abstimmung | Eine lebenswerte Stadt bietet nicht nur Räume. Sie macht das Mitmachen möglich. | `audio/SMARTy_B3_Mitmachen.mp3` (4,6 s) | Szene 2 · nach der Abstimmung A, B oder C |

## Finale – Unsere Stadt wird begehbar

| Kennung | Taste | Sprecher | Szene | Text | Datei | Einsatz / Stand |
|---|---|---|---|---|---|---|
| **F3** | `Umschalt + ß` | SMARTy | vor dem Minecraft-Rundgang | Digitale Stadtplanung abgeschlossen. Eure Entscheidungen wurden im Stadtmodell zusammengeführt. Bereit für den virtuellen Rundgang! | `audio/SMARTy_F3_Stadtplanung_abgeschlossen.mp3` (7,6 s) | Finale – vor dem Minecraft-Rundgang (Taste Umschalt + ß) · Wortlaut Drehbuch 22.11.2026 |
| **F4** | `Umschalt + -` | SMARTy | im Minecraft-Rundgang – nach Z1 „… die kamen heute von euch!“ | Computer können rechnen, messen und simulieren. Aber eine lebenswerte Stadt braucht Menschen, die mitdenken. | `audio/SMARTy_F4_Sensoren_Computer.mp3` (6,2 s) | Finale – im Minecraft-Rundgang, nach Z1 „… die kamen heute von euch!“ (Taste Umschalt + -) · Wortlaut Drehbuch 22.11.2026 |
| **F5a** | `Umschalt + #` | SMARTy | Zukunftscheck – nach Z1 „SMARTy, kannst du das überprüfen?“ | Zukunftscheck gestartet. Verbindung zum Jahr 2050 wird hergestellt. | `audio/SMARTy_F5a_Zukunftscheck.mp3` (5,2 s) | Szene 3 · Nachricht aus dem Jahr 2050 – zuerst F5a (Taste Umschalt + #) |
| **F5b** | `Umschalt + 6` | SMARTy | Nachricht aus dem Jahr 2050 – direkt vor dem Abschlussfilm | Nachricht aus dem Jahr 2050 empfangen. | `audio/SMARTy_F5b_Nachricht_2050.mp3` (3,0 s) | Szene 3 · direkt danach F5b (Taste Umschalt + 6), dann der Knopf „Abschlussfilm – Nachricht aus 2050“ (Erzähler-Bereich, nur per Klick) |
| – | | | *Danach: Abschlussfilm (Show-Zentrale), dann Bühnenabschied mit F6 und F7.* | | | |
| **F6** | `Umschalt + 1` | SMARTy | nach dem Abschlussfilm – nach Z2 „Und … was ist jetzt mit unserer Alterstransformation?“ | Altersumwandlung kann leider nicht rückgängig gemacht werden. … War nur ein Scherz! | `audio/SMARTy_F6_Altersumwandlung_Scherz.mp3` (5,7 s) | Finale nach dem Abschlussfilm – nach Z2 „Und … was ist jetzt mit unserer Alterstransformation?“, danach Z1 „SMARTy! Das war jetzt nicht lustig!“ (Taste Umschalt + 1) · Wortlaut Änderungsauftrag Nr. 04 · Sprechweise: erst sachlich, deutliche Pause, dann die Auflösung |
| **F7** | `Umschalt + 2` | SMARTy | nach dem Abschlussfilm – nach Z2 „Seid ihr bereit …?“ und PUBLIKUM „JAAA!“ | Zukunftsgestalter erkannt: ungefähr fünfhundert! Mission erfolgreich! | `audio/SMARTy_F7_Mission_erfolgreich.mp3` (5,3 s) | Finale nach dem Abschlussfilm – nach Z2 „Seid ihr bereit, auch in eurer eigenen Stadt Zukunftsgestalter zu sein?“ und PUBLIKUM „JAAA!“, danach Applaus und Abgang (Taste Umschalt + 2) · Wortlaut Änderungsauftrag Nr. 04 |
| – | | | *Danach: Applaus und Abgang → Abschlussfolie mit QR-Codes (Show-Zentrale).* | | | |

Reserve (nicht im aktuellen Drehbuch, bleibt erhalten):

| Kennung | Taste | Sprecher | Szene | Text | Datei | Einsatz / Stand |
|---|---|---|---|---|---|---|
| **F1** | `#` | SMARTy | frühere Finale-Fassung (Drehbuch 16.11.) | Zukunftsanalyse abgeschlossen. Diese Stadt ist nicht nur intelligent. Sie ist auch lebenswert. | `audio/SMARTy_F1_Zukunftsanalyse.mp3` (5,8 s) | nach „Der Bus kann sich an der Ampel anmelden … einen Ort, an dem Kinder nachmittags mitmachen können.“ · F2 (Schlusssatz) ist der vorhandene Clip 06 „Das Finale“ (Taste 6) · nicht in der Sprachtexte-Liste vom 19.11.2026 – nur bei Bedarf |
| **F2** | `6` | SMARTy | frühere Finale-Fassung (Drehbuch 16.11., Clip 06) | Mission erfolgreich! Danke, Zukunftscrew! Ich werde eure Ideen niemals vergessen! | `audio/SMARTy_06_Finale.mp3` (6,3 s) | Am Ende der Show. Nicht in der Sprachtexte-Liste vom 19.11.2026 (dort folgen auf F5b die Erzähler-Botschaft und der Abschlussfilm). |
