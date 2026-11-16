/* Verkehrssimulation – alle Zeiten, Strecken und Texte an einer Stelle.
 * Längen in Metern, Zeiten in Sekunden, Geschwindigkeiten in m/s (8,3 m/s ≈ 30 km/h).
 * Nach einer Änderung test.html öffnen: Dort steht, ob alles noch sicher und wiederholbar ist.
 */
export const CONFIG = {
  titel: 'Die schlaue Ampel',
  untertitel: 'Verkehrssimulation · START IT SMART – Mission Zukunft',

  // Simulation läuft in festen Schritten: gleiche Eingabe → immer gleiches Ergebnis
  schritt: 1 / 60,

  // Kreuzung: Hauptstraße (Bus) von links nach rechts, Querstraße von hinten nach vorn
  strasse: {
    breite: 7,          // zwei Fahrstreifen à 3,5 m
    halteAbstand: 8,    // Haltelinie: so weit vor der Kreuzungsmitte
    laenge: 95,         // sichtbare Straße ab Kreuzungsmitte in jede Richtung
  },

  ampel: {
    gelb: 3,            // Gelb vor Rot
    allesRot: 2,        // Räumzeit: alle Richtungen rot, die Kreuzung wird frei
    rotGelb: 1,         // Rot-Gelb vor Grün
    minGruen: 6,        // so lange bleibt Grün mindestens an, bevor umgeschaltet werden darf
    entscheidung: 1.5,  // intelligente Ampel: so lange „prüft“ sie nach dem Funksignal
    // fester Zyklus (beide Versuche starten hier)
    querGruen: 32,      // Grünzeit Querstraße
    hauptGruen: 20,     // Grünzeit Hauptstraße (Bus)
    startQuerGruenSeit: 10, // beim Start ist die Querstraße schon 10 s grün
  },

  bus: {
    start: -40,         // Startposition der Busfront (x) – links, gut im Bild
    tempo: 8.3,         // ≈ 30 km/h
    anfahren: 1.2,      // Beschleunigung
    bremsen: 2.2,       // angenehmes Bremsen
    laenge: 12,
    funkAbstand: 22,    // so weit vor der Haltelinie sendet der Bus sein Funksignal
    funkDauer: 0.8,     // so lange ist das Signal sichtbar unterwegs zur Ampel
    ende: 72,           // hier ist der Versuch vorbei
  },

  auto: { tempo: 10, anfahren: 2.2, bremsen: 3, laenge: 4.3 },

  // Autos: wann (Sekunden nach Start) sie wo auftauchen. Für beide Versuche identisch.
  // spur: 'ost' (wie der Bus), 'west' (Gegenrichtung), 'sued' (Querstraße nach vorn), 'nord' (nach hinten)
  // s: Startpunkt auf der Spur (0 = Anfang am Bildrand), farbe: Lackfarbe
  autos: [
    { t: 0, spur: 'ost', s: 2, farbe: '#3b82f6' },
    { t: 0, spur: 'west', s: 86, farbe: '#a78bfa', stehtSchon: true },
    { t: 0, spur: 'sued', s: 66, farbe: '#ef4444' },
    { t: 0, spur: 'nord', s: 40, farbe: '#22c55e' },
    { t: 2.5, spur: 'sued', s: 0, farbe: '#f97316' },
    { t: 4.5, spur: 'nord', s: 0, farbe: '#06b6d4' },
    { t: 8, spur: 'sued', s: 0, farbe: '#eab308' },
    { t: 11, spur: 'nord', s: 0, farbe: '#ec4899' },
    { t: 15, spur: 'west', s: 0, farbe: '#14b8a6' },
    { t: 17, spur: 'sued', s: 0, farbe: '#64748b' },
  ],

  texte: {
    modus: { normal: 'A · Normale Ampel', schlau: 'B · Intelligente Ampel' },
    modusInfo: {
      normal: 'Feste Zeiten: Die Ampel weiß nichts vom Bus.',
      schlau: 'Der Bus funkt der Ampel: „Ich komme!“',
    },
    bereit: 'Bereit · Start mit Leertaste',
    laeuft: 'Versuch läuft …',
    pause: 'Pause',
    fertig: (s) => `Gemessen: Der Bus hat ${s} ${s === 1 ? 'Sekunde' : 'Sekunden'} gewartet.`,
    stoppuhr: 'Wartezeit Bus',
    ampelBus: 'Ampel Bus',
    ampelQuer: 'Querstraße',
    kette: ['Information', 'Entscheidung', 'Wirkung'],
    schritte: {
      funk: 'Bus funkt: „Ich komme!“',
      pruefen: 'Ampel prüft: Kann ich sicher umschalten?',
      querGelb: 'Querstraße bekommt Gelb …',
      allesRot: '… dann Rot. Die Kreuzung wird frei.',
      rotGelb: 'Rot-Gelb: Gleich darf der Bus fahren …',
      busGruen: 'Bus bekommt Grün!',
      warten: 'Der Bus funkt, sobald er nah genug an der Ampel ist.',
    },
    labels: { funk: '📡 „Ich komme!“', empfangen: '✓ Signal empfangen', wartet: '⏱ Bus wartet', faehrt: 'Grün – los geht’s!' },
    ergebnis: {
      titel: 'Ergebnis',
      normal: 'Normale Ampel',
      schlau: 'Intelligente Ampel',
      spart: (s) => `Der Bus spart ${s} ${s === 1 ? 'Sekunde' : 'Sekunden'}`,
      fehlt: 'noch nicht gemessen',
      hinweis: 'Andere warten möglicherweise länger.',
    },
    keinWebGL: '3D-Grafik wird auf diesem Gerät nicht unterstützt. Die Simulation läuft deshalb in der 2D-Ansicht – mit genau derselben Logik.',
    ladefehler: 'Die Simulation konnte nicht geladen werden. Bitte über GitHub Pages oder einen lokalen Webserver öffnen (nicht per Doppelklick auf die Datei).',
  },
};
