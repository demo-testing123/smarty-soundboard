/* „Sensorlabor Regenwasser“ – Mission Natur, Bühnen-Simulation. Texte, Schritte, Grenzwerte und Zeiten an einer Stelle.
 *
 * Quelle: Änderungsauftrag „Natursimulation → Sensorlabor Regenwasser“ (23.11.2026). Die frühere Fassung „Aus Grau wird Grün“
 * (sechs Szenen, Abstimmung, Wärme) ist ersetzt: Grau → Grün und die Abstimmung laufen im Stadt-Konfigurator.
 * Die 3D-Spielplatzwelt kommt unverändert aus ../minecraft/welt.js (grüner Natur-Abenteuerspielplatz).
 *
 * Alle Prozentwerte sind modellierte Beispielwerte (keine echten Sensoren, keine Messgenauigkeit).
 * Die Steuerung ist eine feste Regel (WENN … UND … DANN), keine KI.
 */
export const CONFIG = {
  titel: 'Mission Natur · Sensorlabor Regenwasser',
  kennzeichnung: 'Vereinfachte Simulation · keine echten Messwerte',

  // Regel der Steuerung (Prozent, Beispielwerte)
  regel: {
    trocken: 30,       // Bodenfeuchte UNTER diesem Wert = „Boden trocken“ → Bewässerung darf starten
    feuchtGenug: 60,   // ab hier schaltet die Bewässerung wieder aus
    nass: 80,          // ab hier zeigt der Sensor „Boden nass“
    minWasser: 20,     // so viel Wasser muss mindestens in der Zisterne sein; darunter startet nichts (und es schaltet aus)
  },

  // Vier Schritte. start = Werte beim Betreten (jeder Schritt ist so immer gleich vorführbar),
  // ziel/tempo = Verlauf in Prozent pro Sekunde (Zeit gerafft).
  schritte: [
    {
      id: 'regen', kurz: 'Starkregen', titel: 'Starkregen',
      text: 'Es regnet stark. Über die Regenmulde fließt Wasser in die Zisterne.',
      start: { wasser: 25, feuchte: 40 }, ziel: { wasser: 85, feuchte: 92 }, tempo: { wasser: 5, feuchte: 6 },
      regen: true, zufluss: true, labels: ['mulde', 'zisterne', 'wasserSensor'],
    },
    {
      id: 'speichern', kurz: 'Speichern', titel: 'Wasser speichern',
      text: 'Der Regen ist vorbei. Wir heben das Regenwasser für trockene Tage auf.',
      start: { wasser: 85, feuchte: 92 }, ziel: { wasser: 85, feuchte: 75 }, tempo: { wasser: 0, feuchte: 3 },
      labels: ['zisterne', 'wasserSensor'],
    },
    {
      id: 'trocken', kurz: 'Trockenheit', titel: 'Trockenheit',
      text: 'Die Sonne scheint lange, die Erde trocknet aus. Wasser ist noch in der Zisterne.',
      start: { wasser: 85, feuchte: 75 }, ziel: { wasser: 85, feuchte: 18 }, tempo: { wasser: 0, feuchte: 5.5 },
      sonne: true, labels: ['bodenSensor', 'zisterne'],
    },
    {
      id: 'giessen', kurz: 'Bewässern', titel: 'Bewässern',
      text: 'Die Steuerung prüft ihre Regel.',
      textEin: 'Boden trocken UND Wasser vorhanden → Bewässerung EIN.',
      textAus: 'Der Boden ist wieder feucht → Bewässerung AUS.',
      start: { wasser: 85, feuchte: 18 }, tempo: { wasser: 2, feuchte: 4 },
      sonne: true, regelpruefung: true, labels: ['bewaesserung', 'bodenSensor', 'wasserSensor'],
    },
  ],

  // Dauer der sichtbaren Regelprüfung in Schritt 4 (Sekunden): erst Bedingung 1, dann Bedingung 2, dann Ergebnis
  pruefDauer: 2.6,

  anzeigen: {
    wasser: { titel: 'Zisterne: Wasserstand', sensor: 'Wasserstandsensor' },
    feuchte: { titel: 'Bodenfeuchte', sensor: 'Bodenfeuchtesensor' },
  },
  status: {
    trocken: 'Boden trocken', feucht: 'Boden feucht', nass: 'Boden nass',
    wasserDa: 'Wasser vorhanden', wasserLeer: 'Zisterne fast leer',
  },
  regelText: {
    titel: 'Regel der Steuerung',
    b1: 'Boden trocken',
    b2: 'Wasser in der Zisterne',
    ein: 'Bewässerung EIN',
    aus: 'Bewässerung AUS',
    grundFeucht: 'Boden feucht genug',
    grundLeer: 'zu wenig Wasser',
    grundNass: 'Boden ist nicht trocken',
  },
  labels: {
    mulde: 'Regenmulde', zisterne: 'Zisterne', wasserSensor: 'Wasserstandsensor', bodenSensor: 'Bodenfeuchtesensor', bewaesserung: 'Bewässerung',
  },

  keinWebGL: 'Dieses Gerät kann keine 3D-Grafik (WebGL) anzeigen. Bitte in einem aktuellen Chrome oder Edge öffnen und die Hardwarebeschleunigung einschalten.',
  ladefehler: 'Die Anwendung konnte nicht geladen werden. Bitte über GitHub Pages oder einen lokalen Webserver öffnen (nicht per Doppelklick auf die Datei).',
};
