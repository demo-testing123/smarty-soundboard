/* START IT SMART – Stadt-Konfigurator: INHALT (Texte, Missionen, Schritte, Kameras).
 * Quelle: Drehbuch-Arbeitsfassung vom 16.11.2026 und Entwicklungsauftrag vom 17.11.2026.
 * Die Figur „Mika“ ist überholt und kommt nicht vor. Sätze der Zeitreisenden stehen hier nur als Regie-Stichwort;
 * auf der Leinwand stehen Fragen, Abstimmungsoptionen und kurze Erklärungen.
 * Keine erfundenen Zahlen: Messwerte (Wege, bebaute Fläche) rechnet das Stadtmodell aus und kennzeichnet sie als Modellwerte.
 */

// Kamerapresets: Ziel (x, y, z), Zoom = halbe Bildhöhe in Blöcken, Blickrichtung (Azimut 0 = von Süden), Höhe in Grad
export const KAMERAS = {
  gesamt: { titel: 'Gesamtansicht', ziel: [16, 64, 16], zoom: 92, azimut: 45, hoehe: 36 },
  finale: { titel: 'Zukunftsstadt', ziel: [36, 64, -4], zoom: 80, azimut: 45, hoehe: 38 },
  start: { titel: 'Startkamera', ziel: [14, 64, 12], zoom: 84, azimut: 40, hoehe: 34 },
  platz: { titel: 'Spielplatz', ziel: [16, 64, 16], zoom: 31, azimut: 38, hoehe: 40 },
  regen: { titel: 'Spielplatz bei Regen', ziel: [14, 63, 18], zoom: 19, azimut: 28, hoehe: 44 },
  laternen: { titel: 'Hauptstraße', ziel: [40, 64, 36], zoom: 34, azimut: 296, hoehe: 32 },
  wohnstrasse: { titel: 'Wohnstraße', ziel: [-20, 64, -44], zoom: 46, azimut: 8, hoehe: 62 },
  parkhaus: { titel: 'Quartiersrand', ziel: [-50, 66, -40], zoom: 24, azimut: 20, hoehe: 50 },
  kreuzung: { titel: 'Kreuzung', ziel: [40, 64, -22], zoom: 22, azimut: 30, hoehe: 46 },
  wohnen: { titel: 'Wohngrundstück', ziel: [71, 66, -40], zoom: 27, azimut: 38, hoehe: 38 },
  aufstocken: { titel: 'Bestandshaus', ziel: [64, 75, 14], zoom: 22, azimut: 292, hoehe: 26 },
  einkaufen: { titel: 'Westviertel', ziel: [-38, 64, -13], zoom: 38, azimut: 10, hoehe: 72 },
  wohnhaus: { titel: 'Unser Wohnhaus', ziel: [-42, 67, -17], zoom: 13, azimut: 18, hoehe: 28 },
  schule: { titel: 'Schule', ziel: [-46, 66, 64], zoom: 22, azimut: 36, hoehe: 38 },
  bildung: { titel: 'Südviertel', ziel: [-16, 66, 66], zoom: 40, azimut: 30, hoehe: 42 },
  bahnhof: { titel: 'Alter Bahnhof', ziel: [15, 67, 70], zoom: 19, azimut: 40, hoehe: 34 },
};

// Gebäudetafeln (wie im Kollegen-Konfigurator), je Schritt eine Auswahl
export const TAFELN = {
  wohnhaus: { text: 'Unser Wohnhaus', pos: [-42, 75, -20] },
  platz: { text: 'Spielplatz', pos: [16, 69, 16] },
  hauptstrasse: { text: 'Hauptstraße', pos: [39, 70, 40] },
  wohnstrasse: { text: 'Wohnstraße', pos: [-10, 68, -35] },
  rand: { text: 'Rand des Viertels', pos: [-56, 70, -34] },
  kreuzung: { text: 'Kreuzung', pos: [45, 70, -6] },
  grundstueck: { text: 'Grundstück für sechs Familien', pos: [71, 72, -40] },
  bestand: { text: 'Bestandshaus aus Beton', pos: [62, 84, 16] },
  ladenA: { text: 'A · Rand', pos: [-57, 72, 12], buchstabe: 'A' },
  ladenB: { text: 'B · Mitte', pos: [-24, 74, 14], buchstabe: 'B' },
  ladenC: { text: 'C · Wohngasse', pos: [-40, 76, 6], buchstabe: 'C' },
  schule: { text: 'Schule', pos: [-48, 80, 56] },
  bahnhof: { text: 'Alter Bahnhof', pos: [15, 80, 72] },
  brache: { text: 'freie Fläche', pos: [-10, 68, 64] },
  mulde: { text: 'Regenmulde', pos: [5, 67, 17] },
  tief: { text: 'tieferer Spielbereich', pos: [16, 67, 17] },
  zisterne: { text: 'Zisterne', pos: [25, 67, 15] },
};

// Farben für A/B/C (Karten, Wege, Tafeln)
export const BUCHSTABEN_FARBE = { A: '#e2846b', B: '#1f8a8a', C: '#e3a630' };

/* Schrittarten:
 *  bild     – Kamera + Überschrift (+ Stichpunkte)
 *  wahl     – große A/B(/C)-Karten; Klick = Vorschau, „Übernehmen“ = Beschluss (bei Natur nur Denkimpuls)
 *  loesung  – Natur: „Beides gemeinsam!“ als bewusste gemeinsame Verbesserung
 *  regen    – Natur: Starkregen-Ansicht grau / grün
 *  schalter – Vorher/Nachher einer Baufläche (+ optional Tag/Nacht)
 *  extern   – Übergang zu einem echten Showelement (Calliope, Verkehrssimulation, mBot, Wohnsimulator)
 *  wege     – Kurze Wege: drei Wege vom Wohnhaus, gemessen im Modell
 *  finale   – Zukunftscheck, Rundgang, Vorher/Nachher der ganzen Stadt
 * zeige: welcher Stand der Bauflächen dieses Schritts gezeigt wird – 'vorher' (grau), 'beschluss' (übernommen) */
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
        text: 'Ihr seid ab sofort unser Zukunftsteam. Wir zeigen euch die Stadt – und ihr helft, sie besser zu machen.',
        tafeln: ['platz', 'wohnstrasse', 'hauptstrasse', 'grundstueck'],
        regie: ['Leinwand laut Drehbuch: „MISSION AKTIVIERT – DIE STADT DER ZUKUNFT“.', 'Minecraft zeigt dieselbe graue Stadt: Regieraum › ANSICHT Gesamt.'],
      },
    ],
  },
  {
    id: 'natur', nr: 1, kurz: 'Natur', titel: 'Mission Natur – Aus Grau wird Grün', typ: 'A/B-Denkimpuls, danach gemeinsame Lösung', bereiche: ['spielplatz'],
    kamera: 'platz',
    schritte: [
      {
        art: 'bild', kicker: 'Mission Natur · Szene 1', titel: 'Hier ist unser erster Ort. Was fällt euch auf?', kamera: 'platz', zeige: 'vorher',
        text: 'Ein grauer Platz zwischen hohen Häusern: viel Stein, wenig Schatten, kaum Platz für Tiere und Menschen.',
        regie: ['Z1/Z2: Platz beschreiben, Kinder antworten lassen.', 'Danach: Bäume spenden Schatten · Pflanzen verdunsten Wasser · Vögel und Insekten brauchen Platz.'],
        smarty: [['N1 · 327 Computerspiele', '3']],
      },
      {
        art: 'wahl', kicker: 'Mission Natur · Szene 2 · Abstimmung', titel: 'Park oder Spielplatz?', kamera: 'platz', bereich: 'spielplatz', denkimpuls: true,
        text: 'Wir haben nur diesen einen Platz. Was sollen wir bauen?',
        optionen: [
          { v: 'A', b: 'A', titel: 'Großer Abenteuerspielplatz', pro: 'Viel Platz zum Toben und Klettern', contra: 'Wenig Bäume, kaum Schatten' },
          { v: 'B', b: 'B', titel: 'Grüner Abenteuerpark', pro: 'Bäume, Schatten und Natur', contra: 'Kaum Spielgeräte' },
        ],
        hinweis: 'Handzeichen: Wer ist für A? Wer für B? – Die Bilder sind Diskussionsbilder, gebaut wird danach die gemeinsame Lösung.',
        regie: ['Klick auf eine Karte zeigt das Diskussionsbild auf dem Platz (nur Vorschau).', 'Optional die Mehrheit mit „Mehrheit A/B merken“ festhalten.', 'Z2: „Könnte man beide Ideen irgendwie verbinden?“ → weiter zur Lösung.'],
      },
      {
        art: 'loesung', kicker: 'Mission Natur · Die Lösung', titel: 'Die Lösung: Beides gemeinsam!', kamera: 'platz', bereich: 'spielplatz', variante: 'gruen',
        text: 'Ein grüner Natur-Abenteuerspielplatz: Spielen, Bäume und Schatten, Pflanzen – und Lebensraum für Tiere.',
        punkte: ['Kletterturm, Schaukel, Balancieren', 'Bäume und schattige Plätze', 'Wiese, wilde Ecke, Insektenhotel', 'Regenmulde, tiefer Spielbereich, Zisterne'],
        regie: ['Keine A/B-Siegervariante: bewusst beides verbunden.', '„Übernehmen“ baut den grünen Platz in die Stadt (Minecraft: GRÜN).'],
        smarty: [['N2 · Aha-Moment', '4']],
      },
      {
        art: 'regen', kicker: 'Mission Natur · Szene 3', titel: 'Was passiert bei Starkregen?', kamera: 'regen', bereich: 'spielplatz',
        text: 'Wohin läuft das Wasser auf Stein und Asphalt? Und was passiert, wenn Regen auf offene Erde fällt?',
        punkte: ['Auf versiegelten Flächen fließt Wasser schnell ab.', 'Offener Boden kann einen Teil aufnehmen.', 'Ein tieferer Spielbereich sammelt bei Starkregen vorübergehend Wasser – nicht, während Kinder darin spielen.', 'Gesammeltes Regenwasser kann später Bäume gießen.'],
        fussnote: 'Vereinfachte Darstellung: Wasserstände ohne Mengenangaben, Zeit gerafft.',
        regie: ['Knöpfe „grau“ / „grün“ zeigen den Unterschied; Regen startet mit dem Knopf.', 'Ausführlich: Natur-Simulation (eigene Seite).', 'Optional SMARTy-Bewässerungsrätsel – keine Messwerte als echte Sensordaten zeigen.'],
        smarty: [['N3 · Wetterwarnung', 'W'], ['N4 · Regenwasser', 'E']],
        link: { text: 'Natur-Simulation öffnen', href: '../natur/' },
      },
      {
        art: 'bild', kicker: 'Mission Natur · Szene 4', titel: 'Die erste Mission ist geschafft!', kamera: 'platz', zeige: 'beschluss',
        text: 'Unser Platz kann jetzt gleich mehrere Dinge: spielen, Schatten spenden, Lebensraum bieten und bei Regen helfen.',
        tafeln: ['mulde', 'tief', 'zisterne'],
        regie: ['Übergang: „Aber ich sehe da noch ein Problem … unsere Straßenlaternen.“'],
      },
    ],
  },
  {
    id: 'technik', nr: 2, kurz: 'Technik', titel: 'Mission Technik – Intelligente Straßenlaternen', typ: 'A/B, Demonstration (Vorher/Nachher)', bereiche: ['laternen'],
    kamera: 'laternen',
    schritte: [
      {
        art: 'wahl', kicker: 'Mission Technik · Abstimmung', titel: 'Wann sollen unsere Laternen leuchten?', kamera: 'laternen', bereich: 'laternen', tagNacht: true,
        text: 'In unserer Stadt stehen 1.000 Straßenlaternen.',
        optionen: [
          { v: 'immer', b: 'A', titel: 'Immer an – Tag und Nacht', pro: 'Es ist immer hell', contra: 'Leuchtet auch, wenn es schon hell ist' },
          { v: 'sensor', b: 'B', titel: 'Nur bei Dunkelheit – automatisch', pro: 'Licht nur, wenn es gebraucht wird', contra: 'Braucht Sensor und Programm' },
        ],
        hinweis: 'Im Modell: die Laternen der Hauptstraße als Beispiel. Mit „Tag / Nacht“ den Unterschied zeigen.',
        regie: ['Danach Bühnendialog „Liebe Straßenlaternen …“', 'SMARTy T1 (Taste R): Sprachbefehl nicht erkannt.'],
        smarty: [['T1 · Sprachbefehl', 'R']],
      },
      {
        art: 'extern', kicker: 'Mission Technik · Experiment', titel: 'Jetzt live: Calliope mini', kamera: 'laternen', zeige: 'beschluss',
        text: 'Sensor misst – Programm prüft die Regel – die Lampe reagiert.',
        live: 'Dokumentenkamera: Calliope mini, Lichtsensor, externe LED',
        regie: ['Programmierfolie und Verbesserungsfolie kommen aus der Präsentation (ohne Roboterbild).', 'Regel 1: WENN dunkel, DANN Licht an, SONST aus.', 'Regel 2: erst nach 5 Sekunden DURCHGEHENDER Dunkelheit an (keine bloße Wartezeit).', 'Hier keine Simulation – das echte Experiment zählt.'],
        smarty: [['T2 · Programm verstanden', 'T'], ['T3 · Programmoptimierung', 'Z']],
      },
      {
        art: 'schalter', kicker: 'Mission Technik · Ergebnis', titel: 'Was bewirkt unsere Idee im Jahr 2050?', kamera: 'laternen', bereich: 'laternen', tagNacht: true,
        text: 'Tagsüber bleiben die Laternen aus. Wird es dunkel, gehen sie an.',
        vorher: 'immer', nachher: 'sensor',
        fussnote: 'Gespart wird nur, solange es hell ist und die Lampen sonst brennen würden. Keine Energiezahlen im Modell.',
        regie: ['Erst Tag zeigen, dann „Nacht“.', 'Minecraft: LATERNEN SENSOR, dann ZEIT Nacht.'],
        smarty: [['T4 · Experiment erfolgreich', 'U'], ['T5 · Mission abgeschlossen', 'I'], ['T6 · Verkehrsproblem', 'O']],
      },
    ],
  },
  {
    id: 'mobilitaet', nr: 3, kurz: 'Mobilität', titel: 'Mission Mobilität – Platz für alle und eine Ampel, die mitdenkt', typ: 'A/B/C, danach Demonstration', bereiche: ['parken', 'kreuzung'],
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
        hinweis: 'Handzeichen: A, B oder C? Jede Variante bekommt eine sichere Querung.',
        regie: ['SMARTy M2/M3: „Parkplätze bündeln, Gehwege verbreitern und sichere Übergänge schaffen.“', 'Die gezeigte Variante ist genau die gewählte – nicht mehr behaupten.'],
        smarty: [['M2 · Jeder Parkplatz braucht Fläche', 'X'], ['M3 · Vorschlag', 'C']],
      },
      {
        art: 'bild', kicker: 'Mission Mobilität · Szene 3', titel: 'Der Bus wartet', kamera: 'kreuzung', zeige: 'vorher', bereich: 'kreuzung',
        text: 'Passen in einen Bus mehr Menschen als in ein Auto? Könnte der Bus der Ampel sagen: Hallo, ich komme?',
        tafeln: ['kreuzung'],
        smarty: [['M4 · Geduld nicht erkannt', 'V']],
      },
      {
        art: 'extern', kicker: 'Mission Mobilität · Szene 4', titel: '3D-Experiment: normale gegen schlaue Ampel', kamera: 'kreuzung', zeige: 'vorher', bereich: 'kreuzung',
        text: 'Gleiche Startbedingungen, eine Änderung: Der Bus darf sich per Funk anmelden.',
        live: 'Eigene 3D-Verkehrssimulation (kein Minecraft)',
        link: { text: 'Verkehrssimulation öffnen', href: '../verkehr/' },
        regie: ['Wartezeiten nur aus der Simulation ablesen – keine Zahlen erfinden.', 'Querverkehr bekommt sicher Rot, erst dann Bus Grün.'],
        smarty: [['M5 · Funkverbindung', 'B'], ['M6 · Niemand gefährden', 'N']],
      },
      {
        art: 'extern', kicker: 'Mission Mobilität · Szene 5', titel: 'Echte Robotik: der mBot als Bus', kamera: 'kreuzung', zeige: 'vorher', bereich: 'kreuzung',
        text: 'Was soll der Bus bei Rot machen? Und bei Grün?',
        live: 'Live-Kamera: mBot auf der A4-Spielfläche, Modellampel von Hand geschaltet',
        regie: ['mBot und Ampel sind NICHT verbunden: Ampel von Hand, mBot per IR-Fernbedienung.', 'Bei Ausfall: mBot an die Haltelinie stellen und das Prinzip erklären.'],
        smarty: [['M7 · Test erfolgreich', 'M']],
      },
      {
        art: 'schalter', kicker: 'Mission Mobilität · Szene 6', titel: 'Zurück in der Zukunftsstadt', kamera: 'kreuzung', bereich: 'kreuzung',
        text: 'Wir haben den Platz auf der Straße neu verteilt – und den Busverkehr verbessert.',
        vorher: 'normal', nachher: 'bus', nachherText: 'Bus meldet sich an', vorherText: 'Normale Ampel',
        weitereKamera: 'wohnstrasse',
        regie: ['„Übernehmen“ setzt die Busanmeldung in die Stadt (Minecraft: KREUZUNG BUS).', 'Z1: „Wer hat die Ideen geliefert?“ – Kinder: „Wir!“'],
        smarty: [['M8 · Mission abgeschlossen', ',']],
      },
    ],
  },
  {
    id: 'wohnen', nr: 4, kurz: 'Wohnen', titel: 'Mission Wohnen und Bauen – Sechs Familien, ein Grundstück', typ: 'A/B/C, Aufstocken als Zusatz', bereiche: ['wohnen', 'aufstocken'],
    kamera: 'wohnen',
    schritte: [
      {
        art: 'extern', kicker: 'Mission Wohnen · Szene 1', titel: 'Wie viel Platz brauchen sechs Wohnungen?', kamera: 'wohnen', zeige: 'vorher', bereich: 'wohnen',
        text: 'Sechs Familien ziehen hierher. Brauchen sechs Wohnungen immer gleich viel Platz auf dem Boden?',
        tafeln: ['grundstueck'],
        live: 'Experiment im Wohnsimulator: nebeneinander – gestapelt',
        link: { text: 'Wohnsimulator öffnen', href: '../wohnen/' },
        regie: ['Das Experiment läuft im eigenen Wohnsimulator (nicht ersetzen).'],
        smarty: [['W1 · Bauauftrag erkannt', 'G'], ['W2 · Messung abgeschlossen', 'H']],
      },
      {
        art: 'wahl', kicker: 'Mission Wohnen · Szene 2 · Abstimmung', titel: 'Drei Wohnformen – drei Folgen', kamera: 'wohnen', bereich: 'wohnen', wohnwerte: true,
        text: 'Jede Variante: sechs gleich große Wohnungen auf demselben Grundstück.',
        optionen: [
          { v: 'A', b: 'A', titel: 'Sechs Häuser mit eigenem Garten', pro: 'Jede Familie hat einen Garten', contra: 'Braucht am meisten Boden' },
          { v: 'B', b: 'B', titel: 'Kompakte Häuser mit gemeinsamem Hof', pro: 'Nachbarn treffen sich im Hof', contra: 'Den Hof teilen sich alle' },
          { v: 'C', b: 'C', titel: 'Höheres Haus mit großem Park', pro: 'Ein großer Park für alle', contra: 'Oben ist der Weg nach draußen länger' },
        ],
        hinweis: 'Wo gibt es private Grünflächen? Wo treffen sich Nachbarn? Wo ist Platz für einen Park, den alle nutzen?',
        regie: ['SMARTy W3: „Nicht jede Grünfläche ist für alle zugänglich.“'],
        smarty: [['W3 · Alle drei Entwürfe', 'J']],
      },
      {
        art: 'schalter', kicker: 'Mission Wohnen · Szene 3', titel: 'Aufstocken, Holz und CO₂', kamera: 'aufstocken', bereich: 'aufstocken',
        text: 'Müssen wir immer ganz neu bauen? Ein vorhandenes Haus bleibt stehen und bekommt zwei Geschosse aus Holz.',
        vorher: 'bestand', nachher: 'holz', vorherText: 'Bestand', nachherText: '+ 2 Holzgeschosse',
        material: [
          ['Holz', 'Enthält Kohlenstoff, den der Baum beim Wachsen aus der Luft aufgenommen hat.'],
          ['Zement und Beton', 'Bei der Herstellung von Zement entsteht CO₂.'],
          ['Bestand erhalten', 'Was schon steht, muss nicht neu hergestellt werden.'],
          ['Grenzen', 'Ob ein Haus aufgestockt werden kann, hängt von seiner Tragfähigkeit ab.'],
        ],
        fussnote: 'Vereinfachtes Modell (reales Beispiel im Konzept: Frankfurter Platensiedlung). Keine CO₂-Zahlen; Holz ist nicht automatisch klimaneutral.',
        regie: ['SMARTy W5: Herkunft, Lebensdauer und Weiterverwenden zählen auch.'],
        smarty: [['W4 · Alternative erkannt', 'K'], ['W5 · Klimacheck', 'L']],
      },
    ],
  },
  {
    id: 'einkaufen', nr: 5, kurz: 'Kurze Wege', navi: 'Wege', titel: 'Mission Kurze Wege – Wo liegt der Laden?', typ: 'A/B/C', bereiche: ['einkaufen'],
    kamera: 'einkaufen',
    schritte: [
      {
        art: 'wege', kicker: 'Mission Kurze Wege', titel: 'Wir brauchen Brot. Wie weit ist der Weg?', kamera: 'einkaufen', zeige: 'vorher', bereich: 'einkaufen',
        text: 'Von unserem Wohnhaus zu drei möglichen Läden. Welche Strecke sieht am kürzesten aus? Wo gibt es die größte Auswahl?',
        tafeln: ['wohnhaus', 'ladenA', 'ladenB', 'ladenC'],
        regie: ['Erst schätzen lassen, dann „Wege messen“: Die Längen werden im Modell gezählt (Blöcke).'],
        smarty: [['K1 · Wegvergleich', 'Ö']],
      },
      {
        art: 'wahl', kicker: 'Mission Kurze Wege · Abstimmung', titel: 'Welchen Standort wählt ihr für unser Viertel?', kamera: 'einkaufen', bereich: 'einkaufen', wege: true,
        text: 'Kurze Wege helfen Kindern und Menschen ohne Auto. Ein großer Markt hat dafür vieles an einem Ort.',
        optionen: [
          { v: 'A', b: 'A', titel: 'Großer Supermarkt am Rand', pro: 'Viel Auswahl an einem Ort', contra: 'Langer Weg zu Fuß' },
          { v: 'B', b: 'B', titel: 'Markthalle in der Mitte', pro: 'Viele Stände unter einem Dach', contra: 'Die Halle braucht Platz in der Mitte' },
          { v: 'C', b: 'C', titel: 'Kleine Läden in den Wohnstraßen', pro: 'Gleich um die Ecke', contra: 'Weniger Auswahl in jedem Laden' },
        ],
        hinweis: 'Handzeichen: A, B oder C?',
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
        text: 'Vormittags Unterricht – nachmittags steht die Schule teilweise leer. Könnte sie dann eine Werkstatt sein?',
        punkte: ['Vormittags: Unterricht', 'Nachmittags: Werkstatt oder Treffpunkt?'],
        tafeln: ['schule', 'bahnhof', 'brache'],
        regie: ['Was brauchen wir dafür? Betreuung, Materialien, Aufräumen, Öffnungszeiten.'],
        smarty: [['B1 · Raumanalyse', 'P']],
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
        hinweis: 'Ist der Ort erreichbar, bezahlbar und auch ohne eigenes Smartphone nutzbar?',
        regie: ['Z1: „Was ist, wenn der Eintritt viel Geld kostet – oder man sich nur mit dem Smartphone anmelden kann? Ist das fair?“'],
        smarty: [['B2 · Zugang prüfen', 'Ü'], ['B3 · Mitmachen möglich', '+']],
      },
    ],
  },
  {
    id: 'finale', nr: 7, kurz: 'Finale', titel: 'Finale – SMARTys Zukunftscheck', typ: 'Rückblick', bereiche: [],
    kamera: 'gesamt',
    schritte: [
      {
        art: 'finale', kicker: 'Finale · SMARTys Zukunftscheck', titel: 'Schauen wir, was ihr verändert habt!', kamera: 'finale',
        text: 'Ihr habt die Stadt verbessert – mit euren Ideen und Entscheidungen.',
        regie: ['Nur tatsächlich übernommene Beschlüsse sind zu sehen.', '„Vorher / Nachher“ vergleicht mit der grauen Stadt.', '„Rundgang“: Station für Station mit → oder automatisch.'],
        smarty: [['F1 · Zukunftsanalyse', '#'], ['F2 · Mission erfolgreich', '6'], ['Erzähler · Grüße aus dem Jahr 2050', '-']],
      },
    ],
  },
];

// Rundgang im Finale (Drehbuch: Wohnung → Laden → grüner Platz/Regenwasser → sichere Kreuzung/Bus → Freizeitort)
export const RUNDGANG = [
  { kamera: 'wohnhaus', text: 'Unser Wohnhaus', tafel: 'wohnhaus' },
  { kamera: 'einkaufen', text: 'Unser Laden', mission: 'einkaufen' },
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
    kreuzung: { bus: 'Bus meldet sich an der Ampel an' },
    wohnen: { A: 'Sechs Häuser mit eigenem Garten', B: 'Kompakte Häuser mit gemeinsamem Hof', C: 'Höheres Haus mit großem Park' },
    aufstocken: { holz: 'Bestandshaus erhalten, zwei Holzgeschosse' },
    einkaufen: { A: 'Großer Supermarkt am Rand', B: 'Markthalle in der Mitte', C: 'Kleine Läden in den Wohnstraßen' },
    bildung: { A: 'Offene Schule am Nachmittag', B: 'Werkstatt im alten Bahnhof', C: 'Kleine Treffpunkte im Viertel' },
  };
  return (T[bereich] && T[bereich][v]) || null;
}
