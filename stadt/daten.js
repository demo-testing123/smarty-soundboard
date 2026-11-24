/* START IT SMART – Stadt-Konfigurator: INHALT (Texte, Missionen, Schritte, Kameras).
 * Quelle: Drehbuch-Arbeitsfassung vom 16.11.2026, Entwicklungsauftrag und Ergänzung „Kurze Wege“ vom 17.11.2026,
 * Korrekturauftrag vom 19.11.2026 (Calliope vor der Laternenwahl, Export-Schritt im Finale).
 * Änderungsaufträge vom 23.11.2026: Energiecheck nach der Technikmission (4 Zustände, keine Abstimmung); Mobilität ohne
 * mBot- und Ampelvergleichs-Szene (beides läuft außerhalb: Live-mBot, separates Verkehrstool) → 5 Szenen; Szene 4
 * „Fahren 2050 Autos von allein?“ mit kompakter A/B-Auswahl Schwebebahn/Flugtaxi. Keine neuen SMARTy-Sätze.
 * Korrektur vom 23.11.2026: Szene 3 öffnet wieder das eigenständige Verkehrstool (../verkehr/, wie früher); Szene 5 zeigt
 * ohne Ampel-Umschalter die Entscheidungen der Mission zusammen; Schwebebahn/Flugtaxi erst ab Szene 4 im Bild.
 * Aufträge vom 24.11.2026: Publikumsansicht ohne Bedienhinweise, Tastenkürzel und Regieanweisungen (die stehen nur in
 * „regie“, Taste I); Kurze Wege zeigt ungefähre Meter (vereinfachter Modellmaßstab: ein Feld = zehn Meter, METER_PRO_FELD).
 * Die Figur „Mika“ ist überholt und kommt nicht vor. Sätze der Zeitreisenden stehen hier nur als Regie-Stichwort;
 * auf der Leinwand stehen ein kurzer Titel (Leitfrage) und höchstens eine Unterzeile. Längeres steht im Regie-Bereich (Taste I).
 * Keine erfundenen Zahlen: Messwerte (Wege, bebaute Fläche) rechnet das Stadtmodell aus und kennzeichnet sie als Modellwerte.
 */

// Kamerapresets: Blickrichtung (Azimut 0 = von Süden) und Höhe in Grad. rahmen = Quader [x1, y1, z1, x2, y2, z2], der ganz
// auf die 3D-Bühne passen soll; Ziel und Zoom werden beim Anzeigen für die tatsächliche Bühnengröße berechnet.
// ziel/zoom sind nur Startwerte (und die Grundlage der Minecraft-Ansichtspunkte).
const STADT_RAHMEN = [-64, 63, -64, 95, 84, 95];
export const KAMERAS = {
  gesamt: { titel: 'Gesamtansicht', ziel: [16, 64, 16], zoom: 92, azimut: 45, hoehe: 36, rahmen: STADT_RAHMEN },
  finale: { titel: 'Zukunftsstadt', ziel: [36, 64, -4], zoom: 80, azimut: 45, hoehe: 38, rahmen: STADT_RAHMEN },
  start: { titel: 'Startkamera', ziel: [14, 64, 12], zoom: 84, azimut: 40, hoehe: 34, rahmen: STADT_RAHMEN },
  platz: { titel: 'Spielplatz', ziel: [16, 64, 16], zoom: 31, azimut: 38, hoehe: 40, rahmen: [-6, 63, -6, 37, 72, 37] },
  regen: { titel: 'Spielplatz bei Regen', ziel: [14, 63, 18], zoom: 19, azimut: 28, hoehe: 44, rahmen: [0, 63, 2, 31, 68, 31] },
  laternen: { titel: 'Hauptstraße', ziel: [40, 64, 36], zoom: 34, azimut: 296, hoehe: 32, rahmen: [32, 63, 0, 45, 70, 80] },
  wohnstrasse: { titel: 'Wohnstraße', ziel: [-20, 64, -44], zoom: 46, azimut: 8, hoehe: 62, rahmen: [-64, 63, -46, 31, 70, -24] },
  parkhaus: { titel: 'Quartiersrand', ziel: [-50, 66, -40], zoom: 24, azimut: 20, hoehe: 50, rahmen: [-64, 63, -46, -38, 76, -24] },
  kreuzung: { titel: 'Kreuzung', ziel: [40, 64, -22], zoom: 22, azimut: 30, hoehe: 46, rahmen: [30, 63, -28, 53, 72, 1] },
  zukunft: { titel: 'Zukunftsverkehr', ziel: [62, 66, -10], zoom: 30, azimut: 200, hoehe: 36, rahmen: [32, 63, -26, 95, 76, 3] },
  mobilitaet: { titel: 'Wohnstraße bis Zukunftsverkehr', ziel: [16, 64, -22], zoom: 40, azimut: 10, hoehe: 56, rahmen: [-64, 63, -46, 95, 76, 3] },
  energie: { titel: 'Energie der Stadt', ziel: [62, 72, 58], zoom: 40, azimut: 322, hoehe: 33, rahmen: [32, 63, 30, 95, 104, 90] },
  wohnen: { titel: 'Wohngrundstück', ziel: [71, 66, -40], zoom: 27, azimut: 38, hoehe: 38, rahmen: [52, 63, -60, 91, 76, -21] },
  aufstocken: { titel: 'Bestandshaus', ziel: [64, 75, 14], zoom: 22, azimut: 292, hoehe: 26, rahmen: [52, 63, 6, 71, 85, 25] },
  einkaufen: { titel: 'Westviertel', ziel: [-40, 64, 4], zoom: 38, azimut: 270, hoehe: 55, rahmen: [-63, 63, -23, -18, 79, 31] },
  wohnhaus: { titel: 'Unser Wohnhaus', ziel: [-42, 67, -17], zoom: 13, azimut: 18, hoehe: 28, rahmen: [-48, 63, -24, -36, 76, -12] },
  schule: { titel: 'Schule', ziel: [-46, 66, 64], zoom: 22, azimut: 36, hoehe: 38, rahmen: [-62, 63, 46, -20, 78, 66] },
  bildung: { titel: 'Südviertel', ziel: [-16, 66, 66], zoom: 40, azimut: 30, hoehe: 42, rahmen: [-64, 63, 46, 31, 78, 84] },
  bahnhof: { titel: 'Alter Bahnhof', ziel: [15, 67, 70], zoom: 19, azimut: 40, hoehe: 34, rahmen: [2, 63, 62, 28, 78, 82] },
};

// Gebäudetafeln, je Schritt eine Auswahl. gross = großer Startpunkt (Kurze Wege, für Klasse 1–2 gut lesbar)
export const TAFELN = {
  wohnhaus: { text: 'Unser Wohnhaus', pos: [-42, 75, -20] },
  hierWohnen: { text: 'Hier wohnen wir', pos: [-42, 64, -26], gross: true },      // links neben dem Haus (Kamera von Westen), verdeckt keine Wege
  platz: { text: 'Spielplatz', pos: [16, 69, 16] },
  hauptstrasse: { text: 'Hauptstraße', pos: [39, 70, 40] },
  wohnstrasse: { text: 'Wohnstraße', pos: [-10, 68, -35] },
  rand: { text: 'Rand des Viertels', pos: [-56, 70, -34] },
  kreuzung: { text: 'Kreuzung', pos: [45, 70, -6] },
  grundstueck: { text: 'Grundstück für sechs Familien', pos: [71, 72, -40] },
  bestand: { text: 'Bestandshaus', pos: [62, 84, 16] },
  // Ladentafeln (ladenA/B/C = mögliche Standorte, ladenA0 … = Läden einer Variante) kommen aus LADEN/LAEDEN im Stadtmodell
  schule: { text: 'Schule', pos: [-48, 80, 56] },
  bahnhof: { text: 'Alter Bahnhof', pos: [15, 80, 72] },
  brache: { text: 'freie Fläche', pos: [-10, 68, 64] },
  mulde: { text: 'Regenmulde', pos: [5, 67, 17] },
  tief: { text: 'tieferer Spielbereich', pos: [16, 67, 17] },
  zisterne: { text: 'Zisterne', pos: [25, 67, 15] },
  schwebebahn: { text: 'Schwebebahn', pos: [67, 82, -8] },
  flugtaxi: { text: 'Flugtaxi', pos: [90, 75, -18] },
  // Energiecheck-Tafeln (solar, windrad, speicher, netz) kommen aus ENERGIE_ORTE im Stadtmodell (eine Quelle für Modell und Tafel)
};

// Farben für A/B/C (Karten, Wege, Tafeln)
export const BUCHSTABEN_FARBE = { A: '#e2846b', B: '#1f8a8a', C: '#e3a630' };

/* Schrittarten:
 *  bild     – Kamera + Überschrift (punkte erscheinen in der Seitenleiste neben der Bühne)
 *  wahl     – große A/B(/C)-Karten; Klick = Vorschau, „In Stadt übernehmen“ = Beschluss (bei Natur nur Denkimpuls)
 *  loesung  – Natur: „Beides gemeinsam!“ als bewusste gemeinsame Verbesserung
 *  regen    – Natur: Starkregen-Ansicht grau / grün
 *  schalter – Vorher/Nachher einer Baufläche (+ optional Tag/Nacht)
 *  extern   – Übergang zu einem echten Showelement (Calliope, mBot, Verkehrssimulation, Wohnsimulator)
 *  bilanz   – Mobilität: Entscheidungen der Mission zusammen im Stadtbild (keine zweite Ampel-/Busdemonstration)
 *  link     – (bei bild/regen/extern) Knopf, der ein eigenständiges Programm in einem neuen Tab öffnet (Rückweg nur in „regie“)
 *  wege     – Kurze Wege: drei Wege von „Hier wohnen wir“ zu den möglichen Standorten; Meter = gemessene Felder × METER_PRO_FELD
 *  finale   – Zukunftscheck, Vorschau-Rundgang, Vorher/Nachher der ganzen Stadt
 *  export   – Minecraft-Welt aus den übernommenen Beschlüssen erstellen, prüfen, herunterladen, Anleitung
 * zeige: welcher Stand der Bauflächen dieses Schritts gezeigt wird – 'vorher' (grau), 'beschluss' (übernommen).
 * Bauflächen späterer Missionen bleiben immer im Ausgangszustand, bis ihre Mission erreicht ist. */
export const MISSIONEN = [
  {
    id: 'start', nr: 0, kurz: 'Graue Stadt', navi: 'Start', titel: 'Szene 0 – Die graue Zukunftsstadt', typ: 'Einstieg', bereiche: [],
    schritte: [
      {
        art: 'bild', kicker: 'Szene 0 · Stadt im Jahr 2050', titel: 'Unsere Stadt im Jahr 2050', kamera: 'start', zeige: 'vorher-alle',
        text: 'Viel Asphalt, wenig Schatten, volle Straßen – und kaum Platz zum Spielen.',
        tafeln: ['wohnhaus', 'platz', 'kreuzung', 'schule', 'bahnhof'],
        regie: ['Introfilm, Live-Ankunft, Zeitmaschinen-KI und SMARTy kommen von außen (Film, Soundboard).', 'Diese Ansicht ist der Startzustand: graue Stadt, feste Startkamera.', '„Neu beginnen“ (Regie-Menü) setzt alle Beschlüsse für eine neue Vorlesung zurück.'],
        smarty: [['01 Die Landung', '1'], ['05 Zukunftsalarm', '5']],
      },
      {
        art: 'bild', kicker: 'Mission aktiviert', titel: 'Die Stadt der Zukunft', kamera: 'gesamt', zeige: 'vorher-alle',
        text: 'Ihr seid unser Zukunftsteam – helft uns, die Stadt besser zu machen!',
        tafeln: ['platz', 'wohnstrasse', 'hauptstrasse', 'grundstueck'],
        regie: ['Leinwand laut Drehbuch: „MISSION AKTIVIERT – DIE STADT DER ZUKUNFT“.', 'Z1: „Ihr seid ab sofort unser Zukunftsteam. Wir zeigen euch die Stadt – und ihr helft, sie besser zu machen.“'],
      },
    ],
  },
  {
    id: 'natur', nr: 1, kurz: 'Natur', titel: 'Mission Natur – Aus Grau wird Grün', typ: 'A/B-Denkimpuls, danach gemeinsame Lösung', bereiche: ['spielplatz'],
    kamera: 'platz',
    schritte: [
      {
        art: 'bild', kicker: 'Mission Natur · Szene 1', titel: 'Hier ist unser erster Ort. Was fällt euch auf?', kamera: 'platz', zeige: 'vorher',
        text: 'Ein grauer Platz: viel Stein, wenig Schatten.',
        regie: ['Z1/Z2: Platz beschreiben, Kinder antworten lassen („kaum Platz für Tiere und Menschen“).', 'Danach: Bäume spenden Schatten · Pflanzen verdunsten Wasser · Vögel und Insekten brauchen Platz.'],
        smarty: [['N1 · 327 Computerspiele', '3']],
      },
      {
        art: 'wahl', kicker: 'Mission Natur · Szene 2 · Abstimmung', titel: 'Park oder Spielplatz?', kamera: 'platz', bereich: 'spielplatz', denkimpuls: true,
        text: 'Wir haben nur diesen einen Platz. Was sollen wir bauen?',
        optionen: [
          { v: 'A', b: 'A', titel: 'Großer Abenteuerspielplatz', pro: 'Viel Platz zum Toben und Klettern', contra: 'Wenig Bäume, kaum Schatten' },
          { v: 'B', b: 'B', titel: 'Grüner Abenteuerpark', pro: 'Bäume, Schatten und Natur', contra: 'Kaum Spielgeräte' },
        ],
        regie: ['Handzeichen: „Wer ist für A? Wer für B?“', 'Klick auf eine Karte zeigt das Diskussionsbild auf dem Platz – nur Vorschau, es wird nichts gespeichert.', 'Optional die Mehrheit mit „Mehrheit A/B merken“ festhalten.', 'Z2: „Könnte man beide Ideen irgendwie verbinden?“ → weiter zur Lösung.'],
      },
      {
        art: 'loesung', kicker: 'Mission Natur · Die Lösung', titel: 'Die Lösung: Beides gemeinsam!', kamera: 'platz', bereich: 'spielplatz', variante: 'gruen',
        text: 'Ein grüner Natur-Abenteuerspielplatz – zum Spielen und für Tiere.',
        punkte: ['Kletterturm, Schaukel, Balancieren', 'Bäume und schattige Plätze', 'Wiese, wilde Ecke, Insektenhotel', 'Regenmulde, tiefer Spielbereich, Zisterne'],
        regie: ['Keine A/B-Siegervariante: bewusst beides verbunden.', '„In Stadt übernehmen“ baut den grünen Platz in unsere Stadt. In Minecraft kommt er erst mit dem Export im Finale (oder von Hand: SPIELPLATZ GRUEN).'],
        smarty: [['N2 · Aha-Moment', '4']],
      },
      {
        art: 'regen', kicker: 'Mission Natur · Szene 3', titel: 'Was passiert bei Starkregen?', kamera: 'regen', bereich: 'spielplatz',
        text: 'Wohin läuft das Wasser – auf Stein und auf offener Erde?',
        punkte: ['Stein und Asphalt: Wasser fließt schnell ab.', 'Offener Boden nimmt einen Teil auf.', 'Der tiefere Spielbereich sammelt kurz Wasser – nur bei Starkregen.', 'Gesammeltes Regenwasser gießt später Bäume.'],
        regie: ['Knöpfe „grau“ / „grün“ zeigen den Unterschied; Regen startet mit dem Knopf (Taste R).', 'Ausführlich: Natur-Simulation (eigene Seite).', 'Optional SMARTy-Bewässerungsrätsel – keine Messwerte als echte Sensordaten zeigen.'],
        smarty: [['N3 · Wetterwarnung – nach Z2s Frage, vor der Simulation', 'W'], ['N5 · Technikidee Bodenfeuchte', '<'], ['N4 · Regenwasser auffangen – vor dem Szenenabschluss', 'E']],
        link: { text: 'Natur-Simulation öffnen', href: '../natur/' },
      },
      {
        art: 'bild', kicker: 'Mission Natur · Szene 4', titel: 'Die erste Mission ist geschafft!', kamera: 'platz', zeige: 'beschluss',
        text: 'Spielen, Schatten, Lebensraum – und Hilfe bei Regen.',
        tafeln: ['mulde', 'tief', 'zisterne'],
        regie: ['Übergang: „Aber ich sehe da noch ein Problem … unsere Straßenlaternen.“'],
      },
    ],
  },
  {
    id: 'technik', nr: 2, kurz: 'Technik', titel: 'Mission Technik – Intelligente Straßenlaternen', typ: 'Experiment, danach A/B-Abstimmung', bereiche: ['laternen'],
    kamera: 'laternen',
    schritte: [
      {
        art: 'bild', kicker: 'Mission Technik · Frage', titel: 'Woher weiß eine Lampe, dass es dunkel ist?', kamera: 'laternen', zeige: 'vorher',
        text: 'Unsere Laternen leuchten Tag und Nacht.',
        regie: ['Bühnendialog „Liebe Straßenlaternen, bitte nur leuchten, wenn es dunkel ist!“ – danach SMARTy T1.', 'Die Abstimmung kommt erst nach dem Experiment.'],
        smarty: [['T1 · Sprachbefehl', 'R']],
      },
      {
        art: 'extern', kicker: 'Mission Technik · Experiment', titel: 'Jetzt live: Calliope mini', kamera: 'laternen', zeige: 'vorher',
        text: 'Ein Lichtsensor, ein Programm und eine LED.',
        kette: ['Sensor misst die Helligkeit', 'Programm prüft die Regel', 'LED geht an'],
        live: 'Calliope mini mit Lichtsensor und LED',
        regie: ['Live-Bild über die Dokumentenkamera: Calliope mini, Lichtsensor, externe LED.', 'Regel 1: WENN dunkel, DANN LED an, SONST aus.', 'Regel 2 (verbessert): LED erst nach etwa 5 Sekunden UNUNTERBROCHENER Dunkelheit an – ein kurzer Schatten löst kein Flackern aus.', 'Programmier- und Verbesserungsfolie kommen aus der Präsentation (ohne Roboterbild).', 'Keine Kopplung zwischen Calliope und Stadt: Hier zählt das echte Experiment.'],
        smarty: [['T2 · Programm verstanden', 'T'], ['T3 · Programmoptimierung', 'Z'], ['T4 · Experiment erfolgreich', 'U']],
      },
      {
        art: 'wahl', kicker: 'Mission Technik · Abstimmung', titel: 'Wann sollen unsere 1.000 Laternen leuchten?', kamera: 'laternen', bereich: 'laternen', tagNacht: true,
        text: 'Jetzt übertragen wir das Experiment auf unsere Stadt.',
        optionen: [
          { v: 'immer', b: 'A', titel: 'Immer an – Tag und Nacht', pro: 'Es ist immer hell', contra: 'Leuchtet auch, wenn es schon hell ist' },
          { v: 'sensor', b: 'B', titel: 'Nur bei Dunkelheit – automatisch', pro: 'Licht nur, wenn es gebraucht wird', contra: 'Braucht Sensor und Programm' },
        ],
        regie: ['Im Modell stehen die Laternen der Hauptstraße für alle 1.000. Mit „Tag / Nacht“ den Unterschied zeigen.', 'Nach dem Handzeichen „In Stadt übernehmen“.'],
      },
      {
        art: 'schalter', kicker: 'Mission Technik · Ergebnis', titel: 'Was bewirkt unsere Idee im Jahr 2050?', kamera: 'laternen', bereich: 'laternen', tagNacht: true,
        text: 'Tagsüber aus – bei Dunkelheit an.',
        vorher: 'immer', nachher: 'sensor', vorherText: 'Immer an', nachherText: 'Nur bei Dunkelheit',
        fussnote: 'Keine Energiezahlen im Modell.',
        regie: ['Erst Tag zeigen, dann „Nacht“.', 'Gespart wird nur, solange es hell ist und die Lampen sonst brennen würden.', 'Minecraft von Hand: LATERNEN SENSOR, dann ZEIT NACHT.', 'Danach: kurzer Energiecheck (Weiter).'],
        smarty: [['T5 · Mission abgeschlossen', 'I']],
      },
      {
        // Kurzer Unterabschnitt, KEINE Mission und KEINE Abstimmung: vier Zustände nacheinander mit „Weiter“ (auch → / Leertaste).
        // Die Effekte liegen nur über der Stadt (Licht, eingeblendete Modelle) – Beschlüsse und gespeicherte Stadt bleiben unverändert.
        art: 'energie', kicker: 'Mission Technik · Energiecheck', titel: 'Woher bekommt unsere Stadt Strom?', kamera: 'energie',
        stufen: [
          { kurz: 'Strom aus', titel: 'Der Strom ist weg!', text: 'Fenster und Laternen bleiben dunkel.' },
          { kurz: 'Sonne + Wind', titel: 'Strom aus Sonne und Wind', text: 'Solardächer und ein Windrad können Strom liefern.' },
          { kurz: 'Abend + Speicher', titel: 'Es wird Abend', text: 'Nachts liefert die Sonne keinen Strom. Speicher und Stromnetz helfen aus.' },
          { kurz: 'Stadt leuchtet', titel: 'Unsere Stadt leuchtet wieder', text: 'Energie erzeugen, speichern und zuverlässig bereitstellen.' },
        ],
        fussnote: 'Vereinfachte Animation, keine echte Stromnetz-Simulation. Ein Speicher erzeugt keinen Strom: Er gibt vorher gespeicherte Energie wieder ab.',
        regie: ['Etwa 90–120 Sekunden. „Weiter“ (oder → / Leertaste) schaltet Zustand 1 → 2 → 3 → 4; „Zurück“ geht einen Zustand zurück. Die Kacheln springen direkt.',
          'Z2: „Unsere Straßenlaternen sind jetzt schlau. Aber was passiert eigentlich, wenn der Strom weg ist?“ [1 Strom aus]',
          'Z1: „Dann hilft uns auch die schlauste Laterne nicht. Schauen wir, woher unsere Stadt Strom bekommt.“ → [2 Sonne + Wind]',
          'Z2: „Und wenn die Sonne untergeht? Müssen wir dann alle ins Bett?“ → [3 Abend + Speicher]',
          'Z1: „Nein. Gespeicherter Strom und das Stromnetz können helfen, wenn gerade wenig Sonne und Wind da sind.“ → [4 Stadt leuchtet]',
          'Z2: „Gut! Dann können wir unsere Zukunftsstadt weiterbauen.“ – Weiter führt zur Mission Mobilität.',
          'Bewusst vereinfacht: Die Dunkelheit ist ein Bühneneffekt; nicht alle Geräte reagieren bei einem Stromausfall gleich. Keine Zahlen.'],
        smarty: [['T6 · Verkehrsproblem (Übergang zur Mobilität, nach dem Energiecheck)', 'O']],
      },
    ],
  },
  {
    id: 'mobilitaet', nr: 3, kurz: 'Mobilität', titel: 'Mission Mobilität – Platz für alle und eine Ampel, die mitdenkt', typ: 'A/B/C Parken, Busproblem mit Knopf zum eigenständigen Verkehrstool (danach Live-mBot außerhalb), Ausblick 2050 mit A/B Schwebebahn/Flugtaxi, Ergebnis im Stadtbild', bereiche: ['parken', 'kreuzung', 'zukunft'],
    kamera: 'wohnstrasse',
    schritte: [
      {
        art: 'bild', kicker: 'Mission Mobilität · Szene 1', titel: 'Die Straße ist voll', kamera: 'wohnstrasse', zeige: 'vorher',
        text: 'Autos, Autos, Autos! Wo können hier Kinder sicher laufen?',
        tafeln: ['wohnstrasse', 'rand'],
        regie: ['Z1: „Wer kommt zu Fuß zur Schule? Hände hoch!“'],
        smarty: [['M1 · Verkehrsanalyse', 'Y']],
      },
      {
        art: 'wahl', kicker: 'Mission Mobilität · Szene 2 · Abstimmung', titel: 'Wo sollen die Autos parken?', kamera: 'wohnstrasse', bereich: 'parken',
        text: 'Ihr seid jetzt unser Zukunftsstadtrat.',
        optionen: [
          { v: 'A', b: 'A', titel: 'Parkplätze direkt vor den Häusern', pro: 'Das Auto ist ganz nah', contra: 'Die Straße bleibt voll' },
          { v: 'B', b: 'B', titel: 'Parkplätze nur in ausgewählten Straßen', pro: 'Andere Straßen werden frei zum Spielen', contra: 'Manche laufen weiter zum Auto' },
          { v: 'C', b: 'C', titel: 'Parkhaus am Rand des Wohnviertels', pro: 'Platz für Gehwege, Grün und Spiel', contra: 'Mit Einkäufen weiter laufen' },
        ],
        regie: ['Handzeichen: A, B oder C? Jede Variante bekommt eine sichere Querung.', 'SMARTy M2/M3: „Parkplätze bündeln, Gehwege verbreitern und sichere Übergänge schaffen.“', 'Die gezeigte Variante ist genau die gewählte – nicht mehr behaupten.'],
        smarty: [['M2 · Jeder Parkplatz braucht Fläche', 'X'], ['M3 · Vorschlag', 'C'], ['M9 · Simulation erkannt', '.']],
      },
      {
        // Überleitung: das Busproblem zeigen. Den Vergleich normale Ampel / Busanmeldung macht das eigenständige Verkehrstool
        // (eigene Seite, unverändert) – im Konfigurator gibt es dafür KEINE eigene Ampelsimulation.
        art: 'bild', kicker: 'Mission Mobilität · Szene 3', titel: 'Der Bus wartet', kamera: 'kreuzung', zeige: 'vorher', bereich: 'kreuzung',
        text: 'Könnte eine schlaue Ampel unserem Bus helfen?',
        tafeln: ['kreuzung'],
        link: { text: 'Verkehrssimulation öffnen', href: '../verkehr/' },
        regie: ['Z2: „Könnte der Bus der Ampel sagen: Hallo, ich komme?“',
          'Knopf „Verkehrssimulation öffnen ↗“: Das eigenständige Verkehrstool öffnet sich in einem neuen Tab (Vollbild dort mit F). Normale Ampel und Busanmeldung vergleichen.',
          'Zurück zum Konfigurator: Tab des Verkehrstools schließen (Strg + W). Der Konfigurator steht noch auf Szene 3; Vollbild wieder mit F.',
          'Danach Live-mBot (LED-Ampel von Hand, NICHT mit dem mBot verbunden), dann Weiter → Szene 4 „Fahren 2050 Autos von allein?“.',
          'Ersatzweg: Show-Zentrale → Verkehrssimulation.'],
        smarty: [['M4 · Geduld nicht erkannt', 'V'], ['M5 · Funkverbindung – in der Verkehrssimulation', 'B'], ['M6 · Niemand gefährden – in der Verkehrssimulation', 'N'], ['M7 · Test erfolgreich – beim Live-mBot', 'M']],
      },
      {
        art: 'bild', kicker: 'Mission Mobilität · Szene 4 · Blick nach vorn', titel: 'Fahren 2050 Autos von allein?', kamera: 'zukunft', zeige: 'vorher', bereich: 'kreuzung',
        text: 'Niemand weiß das heute sicher.',
        seiteTitel: 'Möglichkeiten und Grenzen',
        punkte: ['Sensoren und Kameras erkennen Straße, Ampeln und Menschen.', 'Ein Computer entscheidet: bremsen, warten, fahren.', 'Das könnte Menschen helfen, die nicht selbst fahren können.', 'Grenzen: Schnee, Baustellen, unklare Lagen – Menschen müssen eingreifen können.', 'Ein Auto ohne Fahrer ist trotzdem ein Auto: weniger Verkehr gibt es nur mit Bus, Rad und Fußwegen.'],
        // Kompakte A/B-Auswahl: ein Klick wählt und speichert (Priorisierung, kein Ausschluss). Keine Untermenüs, keine weitere Abstimmungslogik.
        auswahl: {
          bereich: 'zukunft', frage: 'Wie bewegen wir uns im Jahr 2050?',
          optionen: [
            { v: 'A', b: 'A', titel: 'Schwebebahn', text: 'Viele Menschen fahren gemeinsam über der Straße.', tafel: 'schwebebahn' },
            { v: 'B', b: 'B', titel: 'Flugtaxi', text: 'Ein kleines Fluggerät startet und landet an festen Plätzen.', tafel: 'flugtaxi' },
          ],
          hinweis: 'Beides sind Zukunftsideen. Unsere Wahl zeigt, was wir zuerst ausprobieren.',
        },
        regie: ['Kurzer Ausblick, etwa eine Minute: Möglichkeiten und Grenzen, keine Vorhersage.', 'Frage ans Publikum: „Was müsste so ein Auto alles erkennen?“',
          'Z2: „Wir kommen aus dem Jahr 2050. Und jetzt mal ehrlich: Ich dachte, da fliegen längst alle Autos!“',
          'Z1: „Vielleicht gibt es Flugtaxis. Und es gibt Bahnen, die über den Straßen schweben. Aber was passt zu unserer Zukunftsstadt?“',
          'Z2: „Was findet ihr spannender: eine Schwebebahn oder ein Flugtaxi?“ – Abstimmen lassen und die gewählte Karte anklicken (oder Taste A / B). Ein Klick speichert.',
          'Fachlich: hängende Schwebebahn ≠ Magnetschwebebahn; ob es 2050 Flugtaxis gibt, ist ungewiss; ein Flugtaxi ist kein fliegendes Auto.',
          'In der Minecraft-Welt stehen immer BEIDE (unabhängig von der Wahl).'],
        smarty: [['M10 · Zukunftsprognose: selbstfahrende Autos', '-'], ['M11 · Auch schlaue Autos machen Fehler', 'Q']],
      },
      {
        // Abschluss ohne zweite Ampel-/Busdemonstration: Parken (Szene 2), Busanmeldung (Ergebnis der Verkehrssimulation) und
        // Zukunftsidee (Szene 4) stehen zusammen im Stadtbild. Die Busanmeldung wird mit EINEM Klick übernommen.
        art: 'bilanz', kicker: 'Mission Mobilität · Szene 5', titel: 'Zurück in der Zukunftsstadt', kamera: 'mobilitaet', bereich: 'kreuzung', variante: 'bus',
        text: 'Mehr Platz auf der Straße – und der Bus meldet sich an.',
        ergebnis: [
          { bereich: 'parken', titel: 'Parken', kamera: 'wohnstrasse', offen: 'noch offen' },
          { bereich: 'kreuzung', titel: 'Ampel', kamera: 'kreuzung' },
          { bereich: 'zukunft', titel: 'Zukunft 2050', kamera: 'zukunft', offen: 'noch nicht gewählt' },
        ],
        regie: ['Keine zweite Ampel- oder Busdemonstration: Die Stadt zeigt zusammen, was wir entschieden haben.',
          '„Busanmeldung in Stadt übernehmen“ (oder Enter) setzt das Ergebnis der Verkehrssimulation in unsere Stadt.',
          'Ein Klick auf Parken, Ampel oder Zukunft 2050 fliegt dorthin; „Ganze Straße zeigen“ wieder zurück.',
          'Steht bei Parken „noch offen“ oder bei Zukunft 2050 „noch nicht gewählt“: Szene 2 bzw. Szene 4 nachholen.',
          'Z1: „Wer hat die Ideen geliefert?“ – Kinder: „Wir!“'],
        smarty: [['M8 · Mission abgeschlossen', ',']],
      },
    ],
  },
  {
    id: 'wohnen', nr: 4, kurz: 'Wohnen', titel: 'Mission Wohnen und Bauen – Sechs Familien, ein Grundstück', typ: 'A/B/C, Aufstocken als zusätzliche Bauidee', bereiche: ['wohnen', 'aufstocken'],
    kamera: 'wohnen',
    schritte: [
      {
        art: 'extern', kicker: 'Mission Wohnen · Szene 1', titel: 'Wie viel Platz brauchen sechs Wohnungen?', kamera: 'wohnen', zeige: 'vorher', bereich: 'wohnen',
        text: 'Sechs Familien ziehen hierher.',
        tafeln: ['grundstueck'],
        live: 'Experiment im Wohnsimulator: nebeneinander – gestapelt',
        link: { text: 'Wohnsimulator öffnen', href: '../wohnen/' },
        regie: ['Frage: „Brauchen sechs Wohnungen immer gleich viel Platz auf dem Boden?“', 'Das Experiment läuft im eigenen Wohnsimulator (nicht ersetzen).'],
        smarty: [['W1 · Bauauftrag erkannt', 'G'], ['W2 · Messung abgeschlossen', 'H']],
      },
      {
        art: 'wahl', kicker: 'Mission Wohnen · Szene 2 · Abstimmung', titel: 'Drei Wohnformen – sechs Familien', kamera: 'wohnen', bereich: 'wohnen', wohnwerte: true,
        text: 'Jede Variante: sechs gleich große Wohnungen auf demselben Grundstück.',
        optionen: [
          { v: 'A', b: 'A', titel: 'Sechs Häuser mit eigenem Garten', pro: 'Jede Familie hat einen Garten', contra: 'Braucht am meisten Boden' },
          { v: 'B', b: 'B', titel: 'Kompakte Häuser mit gemeinsamem Hof', pro: 'Ein Hof für alle Nachbarn', contra: 'Den Hof teilen sich alle' },
          { v: 'C', b: 'C', titel: 'Höheres Haus mit großem Park', pro: 'Ein großer Park für alle', contra: 'Oben ist der Weg nach draußen länger' },
        ],
        regie: ['Fragen: „Wo gibt es private Grünflächen? Wo treffen sich Nachbarn? Wo ist Platz für einen Park, den alle nutzen?“', 'Sachlich vergleichen – keine Variante ist „gut“ oder „schlecht“.', 'SMARTy W3: „Sechs Familien, drei Bauweisen … keine Lösung ist für alle Menschen gleich gut.“'],
        smarty: [['W3 · Drei Bauweisen', 'J']],
      },
      {
        art: 'schalter', kicker: 'Mission Wohnen · Szene 3 · zusätzliche Bauidee', titel: 'Aufstocken statt neu bauen?', kamera: 'aufstocken', bereich: 'aufstocken',
        text: 'Ein vorhandenes Haus bleibt stehen und bekommt zwei Geschosse aus Holz.',
        vorher: 'bestand', nachher: 'holz', vorherText: 'Bestand', nachherText: '+ 2 Holzgeschosse',
        material: [
          ['Holz', 'Enthält Kohlenstoff, den der Baum beim Wachsen aus der Luft aufgenommen hat.'],
          ['Zement und Beton', 'Bei der Herstellung von Zement entsteht CO₂.'],
          ['Bestand erhalten', 'Was schon steht, muss nicht neu hergestellt werden.'],
          ['Grenzen', 'Ob ein Haus aufgestockt werden kann, hängt von seiner Tragfähigkeit ab.'],
        ],
        fussnote: 'Vereinfachtes Modell, keine CO₂-Zahlen.',
        regie: ['Zusätzliche Bauidee neben den drei Wohnformen. Reales Beispiel im Konzept: Frankfurter Platensiedlung.', 'Holz ist nicht automatisch klimaneutral. SMARTy W5: Herkunft, Lebensdauer und Weiterverwenden zählen auch.'],
        smarty: [['W4 · Alternative erkannt', 'K'], ['W5 · Klimacheck', 'L']],
      },
    ],
  },
  {
    id: 'einkaufen', nr: 5, kurz: 'Kurze Wege', navi: 'Wege', titel: 'Mission Kurze Wege – Wo liegt der Laden?', typ: 'A/B/C', bereiche: ['einkaufen'],
    kamera: 'einkaufen',
    schritte: [
      {
        art: 'wege', kicker: 'Mission Kurze Wege', titel: 'Wo sind die Brötchen am nächsten?', kamera: 'einkaufen', zeige: 'vorher', bereich: 'einkaufen',
        text: 'Stellt euch vor, ihr wohnt hier und wollt morgens frische Brötchen holen.',
        tafeln: ['hierWohnen', 'ladenA', 'ladenB', 'ladenC'],
        regie: ['Z1: „Stellt euch vor, ihr wohnt hier und wollt morgens frische Brötchen holen. Wie weit müsstet ihr bis zum nächsten Laden laufen?“', 'Z2: „Welche Strecke sieht am kürzesten aus? Und wo gibt es vielleicht die größte Auswahl?“', 'Erst schätzen lassen, dann „Wege messen“: Die Meter rechnet der Konfigurator aus den gemessenen Wegen im Modell (vereinfachter Maßstab: ein Feld = zehn Meter, also ungefähre Werte). Keine Minuten.'],
        smarty: [['K1 · Wegvergleich', 'Ö'], ['K3 · Digitale Stadtplanung', 'ß']],
      },
      {
        art: 'wahl', kicker: 'Mission Kurze Wege · Abstimmung', titel: 'Welchen Laden wählt ihr für unser Viertel?', kamera: 'einkaufen', bereich: 'einkaufen', wege: true,
        text: 'Die Linien zeigen die Wege von den Häusern zum nächsten Laden.',
        optionen: [
          { v: 'A', b: 'A', titel: 'Großer Supermarkt am Stadtrand', pro: 'Viel Auswahl an einem Ort', contra: 'Für viele Bewohner längere Wege' },
          { v: 'B', b: 'B', titel: 'Markthalle in der Mitte', pro: 'Von vielen Häusern zu Fuß erreichbar', contra: 'Braucht einen freien Platz in der Mitte' },
          { v: 'C', b: 'C', titel: 'Kleine Läden im Wohnviertel', pro: 'Bäcker, Lebensmittel, Gemüse – um die Ecke', contra: 'Weniger Auswahl in jedem Laden' },
        ],
        regie: ['Z1: „Kurze Wege helfen Kindern und Menschen ohne Auto. Ein großer Markt hat dafür vieles an einem Ort.“', 'A, B oder C anklicken (Tasten A B C): Die Variante erscheint in derselben Stadt – Wohnhäuser, Straßen und frühere Beschlüsse bleiben.', 'Nach der Handabstimmung SMARTy K2, dann „In Stadt übernehmen“: Die Wahl bleibt bis zum Finale in der Stadt.'],
        smarty: [['K2 · Stadt der kurzen Wege', 'Ä']],
      },
    ],
  },
  {
    id: 'bildung', nr: 6, kurz: 'Bildung', titel: 'Mission Bildung und Teilhabe – Eine Stadt für alle', typ: 'A/B/C', bereiche: ['bildung'],
    kamera: 'bildung',
    schritte: [
      {
        art: 'bild', kicker: 'Mission Bildung · Szene 1', titel: 'Ein Raum, zwei Nutzungen', kamera: 'schule', zeige: 'vorher',
        text: 'Vormittags Unterricht – nachmittags eine Werkstatt?',
        seiteTitel: 'Ein Gebäude, zwei Nutzungen',
        punkte: ['Vormittags: Unterricht', 'Nachmittags: Werkstatt oder Treffpunkt?', 'Was brauchen wir dafür? Betreuung, Material, Aufräumen, Öffnungszeiten'],
        tafeln: ['schule', 'bahnhof', 'brache'],
        regie: ['Z1: „Unsere Schule steht nachmittags teilweise leer. Könnte sie dann eine Werkstatt sein?“', 'Was brauchen wir dafür? Betreuung, Materialien, Aufräumen, Öffnungszeiten.'],
        smarty: [['B1 · Raumanalyse', 'P'], ['B4 · Stadtmodell aktualisiert (Umschalt + +)', '*']],
      },
      {
        art: 'wahl', kicker: 'Mission Bildung · Szene 2 · Abstimmung', titel: 'Welche Orte passen zu allen?', kamera: 'bildung', bereich: 'bildung',
        text: 'Drei Ideen für unseren Zukunftsstadtrat.',
        optionen: [
          { v: 'A', b: 'A', titel: 'Schule nachmittags öffnen', pro: 'Räume und Hof sind schon da', contra: 'Braucht Aufsicht am Nachmittag' },
          { v: 'B', b: 'B', titel: 'Alter Bahnhof wird Werkstatt', pro: 'Ein leeres Haus bekommt eine Aufgabe', contra: 'Erst muss umgebaut werden' },
          { v: 'C', b: 'C', titel: 'Kleine Treffpunkte im Viertel', pro: 'Viele haben einen Ort in der Nähe', contra: 'Betreuung verteilt sich auf viele Orte' },
        ],
        fragen: ['Wann ist geöffnet?', 'Wer betreut?', 'Barrierefrei erreichbar?', 'Was kostet es?', 'Auch ohne eigenes Smartphone?'],
        regie: ['Z1: „Was ist, wenn der Eintritt viel Geld kostet – oder man sich nur mit dem Smartphone anmelden kann? Ist das fair?“', 'SMARTy B2: „Ist der Ort erreichbar, bezahlbar und auch ohne eigenes Smartphone nutzbar?“'],
        smarty: [['B2 · Zugang prüfen', 'Ü'], ['B3 · Mitmachen möglich', '+']],
      },
    ],
  },
  {
    id: 'finale', nr: 7, kurz: 'Finale', titel: 'Finale – SMARTys Zukunftscheck und Minecraft-Welt', typ: 'Rückblick, Export', bereiche: [],
    kamera: 'gesamt',
    schritte: [
      {
        art: 'finale', kicker: 'Finale · Vorschau', titel: 'Schauen wir, was ihr verändert habt!', kamera: 'finale',
        text: 'Erst hier als Vorschau – gleich gehen wir in Minecraft durch die Stadt.',
        regie: ['Nur tatsächlich übernommene Beschlüsse sind zu sehen.', '„Vorher / Nachher“ vergleicht mit der grauen Stadt.', '„Vorschau-Rundgang“: Station für Station mit → oder automatisch. Nach der letzten Station führt „Weiter“ zur Minecraft-Welt.'],
        smarty: [['F1 · Zukunftsanalyse (frühere Fassung, bei Bedarf)', '#'], ['F3 · Digitale Stadtplanung abgeschlossen (Umschalt + ß)', '?'], ['F4 · Menschen, die mitdenken (Umschalt + -)', '_']],
      },
      {
        art: 'export', kicker: 'Finale · Minecraft Education', titel: 'Unsere Stadt wird eine Minecraft-Welt', kamera: 'finale',
        text: 'Aus euren Beschlüssen entsteht eine Welt, durch die wir gleich gehen.',
        regie: ['Showablauf: fertige Stadt → „Minecraft-Welt erstellen“ → Datei in Minecraft Education öffnen → etwa drei Minuten Rundgang in Minecraft → SMARTy F5b → Show-Zentrale: „Abschlussfilm starten“ (Vollbild, Ton im Film) → kurze Bühnenverabschiedung → Show-Zentrale: „Abschlussfolie mit QR-Codes zeigen“ (Download- und Feedback-QR-Code).', 'Vor dem Film Minecraft schließen oder minimieren, damit der Film vorn ist. Der Film zeigt eine vorab abgestimmte Stadtfassung (nicht automatisch die heutigen Beschlüsse).', 'Sicherheitsnetz: eine bei der Probe erstellte und in Minecraft Education geprüfte Welt auf dem Laptop bereithalten (oder die Ersatzwelt unten).', 'Bauaufträge (/clone) sind nur für Änderungen von Hand in einer schon geöffneten Welt.'],
        smarty: [['F5a · Zukunftscheck gestartet (Umschalt + #)', "'"], ['F5b · Nachricht aus 2050 empfangen (Umschalt + 6)', '&'], ['06 · Mission erfolgreich (frühere Fassung)', '6']],
      },
    ],
  },
];

// Vorschau-Rundgang im Finale (Drehbuch: Wohnung → Laden → grüner Platz/Regenwasser → sichere Kreuzung/Bus → Freizeitort)
export const RUNDGANG = [
  { kamera: 'wohnhaus', text: 'Unser Wohnhaus', tafel: 'wohnhaus' },
  { kamera: 'einkaufen', text: 'Einkaufen in unserem Viertel', mission: 'einkaufen' },
  { kamera: 'platz', text: 'Grüner Platz – Schatten, Spielen, Regenwasser', mission: 'natur' },
  { kamera: 'laternen', text: 'Laternen, die nur bei Dunkelheit leuchten', mission: 'technik', nacht: true },
  { kamera: 'kreuzung', text: 'Sichere Kreuzung – der Bus meldet sich an', mission: 'mobilitaet' },
  { kamera: 'wohnstrasse', text: 'Platz auf der Straße für Menschen', mission: 'mobilitaet' },
  { kamera: 'wohnen', text: 'Sechs Familien finden Wohnungen', mission: 'wohnen' },
  { kamera: 'bildung', text: 'Ein Ort, an dem Kinder nachmittags mitmachen können', mission: 'bildung' },
  { kamera: 'finale', text: 'Unsere Zukunftsstadt' },
];

// Wie ein Beschluss im Zukunftscheck heißt
export function beschlussText(bereich, v) {
  const T = {
    spielplatz: { gruen: 'Natur-Abenteuerspielplatz mit Regenmulde und Zisterne' },
    laternen: { immer: 'Laternen leuchten immer (Tag und Nacht)', sensor: 'Laternen leuchten nur bei Dunkelheit' },
    parken: { A: 'Parken vor den Häusern, Gehwege frei', B: 'Parken nur in ausgewählten Straßen, Spielstraße', C: 'Parkhaus am Rand, Straße für Menschen' },
    kreuzung: { normal: 'Normale Ampel (ohne Busanmeldung)', bus: 'Bus meldet sich an der Ampel an' },
    zukunft: { A: 'Zukunftsidee zuerst: Schwebebahn über der Straße', B: 'Zukunftsidee zuerst: Flugtaxi mit Landeplatz', beide: 'Schwebebahn und Flugtaxi' },
    wohnen: { A: 'Sechs Häuser mit eigenem Garten', B: 'Kompakte Häuser mit gemeinsamem Hof', C: 'Höheres Haus mit großem Park' },
    aufstocken: { bestand: 'Bestandshaus bleibt wie es ist', holz: 'Bestandshaus erhalten, zwei Holzgeschosse' },
    einkaufen: { A: 'Großer Supermarkt am Stadtrand', B: 'Markthalle in der Mitte', C: 'Kleine Läden im Wohnviertel: Bäckerei, Lebensmittel, Gemüse' },
    bildung: { A: 'Offene Schule am Nachmittag', B: 'Werkstatt im alten Bahnhof', C: 'Kleine Treffpunkte im Viertel' },
  };
  return (T[bereich] && T[bereich][v]) || null;
}
