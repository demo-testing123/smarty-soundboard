/* „Aus Grau wird Grün“ – Mission Natur. Texte, Abläufe und Zeiten an einer Stelle.
 *
 * Inhaltliche Quelle: Drehbuch START IT SMART, Arbeitsfassung 16.11.2026, Abschnitt 3 „Mission Natur – Aus Grau wird Grün“.
 * Zitate stehen wörtlich wie im Drehbuch. Die Spielplatz-Gestaltung kommt aus ../minecraft/welt.js
 * (dieselbe Vorlage wie in der Minecraft-Testwelt), damit Leinwand und Minecraft dasselbe zeigen.
 */
export const CONFIG = {
  titel: 'Aus Grau wird Grün',
  untertitel: 'Mission Natur: Was braucht ein guter Platz zum Spielen?',

  // Zeiten in Sekunden (Bühne: ruhig, nichts schaltet von selbst weiter)
  dauer: { verwandeln: 4.5, wasserFuellen: 14, versickern: 18, giessen: 6 },

  grau: {
    titel: 'Unsere Stadt im Jahr 2050',
    fragen: [
      'Würdet ihr hier nachmittags gerne spielen?',
      'Was braucht ihr draußen zum Spielen?',
    ],
    schritte: ['Frage 1', 'Frage 2'],
  },

  abstimmung: {
    titel: 'Abstimmung',
    karten: [
      { id: 'A', titel: 'Großer Abenteuerspielplatz' },
      { id: 'B', titel: 'Grüner Abenteuerpark' },
    ],
    entschieden: 'Ihr habt entschieden!',
    frage: 'Müssen wir uns wirklich zwischen Spielen und Natur entscheiden?',
    schritte: ['Abstimmen', 'Frage'],
  },

  beides: {
    titel: 'Die Lösung: Beides gemeinsam!',
    knopf: 'Verwandeln',
    // „Warum bauen wir nicht einen Abenteuerspielplatz MIT Bäumen, Wiesen und wilden Ecken?“
    labels: { spielen: 'Abenteuer-Spielplatz', baeume: 'Bäume', wiese: 'Wiesen', wild: 'Wilde Ecke' },
    schritte: ['Grau', 'Verwandeln'],
  },

  sommer: {
    titel: 'Ein heißer Sommertag',
    frage: 'Wo würdet ihr euch an einem heißen Sommertag lieber aufhalten – auf blankem Stein oder unter Bäumen?',
    labels: { stein: 'Blanker Stein: kaum Schatten', schatten: 'Unter den Blättern ist es schattig', tiere: 'Platz für Vögel, Käfer und andere Tiere' },
    waerme: { knopf: 'Wärme zeigen', legende: [['heiss', 'heiß: Stein in der Sonne'], ['warm', 'warm: Sonne'], ['kuehl', 'kühler: Schatten']], hinweis: 'Vereinfachte Darstellung, keine Messwerte.' },
    schritte: ['Blanker Stein', 'Unter Bäumen', 'Tiere'],
  },

  regen: {
    titel: 'Starkregen',
    frage: 'Wenn es richtig doll regnet – wohin fließt das ganze Wasser?',
    // Leinwand laut Drehbuch: „einfache Gegenüberstellung – versiegelter Boden: Wasser fließt ab; offener Boden: ein Teil kann versickern“
    versiegelt: 'Versiegelter Boden: Wasser fließt ab',
    offen: 'Offener Boden: Ein Teil kann versickern',
    labels: {
      abfluss: 'In die Abflüsse',
      tief: 'Hier darf sich Wasser sammeln',
      mulde: 'Regenmulde',
      zisterne: 'Zisterne: Regenwasser sammeln',
      gesperrt: 'Voll Wasser – hier wird jetzt nicht gespielt',
      frei: 'Wasser weg – wieder Platz zum Toben',
      giessen: 'Gesammeltes Regenwasser gießt die Bäume',
    },
    schritte: ['Grauer Platz', 'Grüner Platz', 'Regen vorbei', 'Gießen'],
    hinweis: 'Vereinfachtes Modell, Zeit gerafft: Mulde und tiefer Bereich leeren sich in Sekunden statt in Stunden.',
  },

  ende: {
    titel: 'Unser Natur-Abenteuerspielplatz',
    // „Also: Schatten im Sommer, Platz für Tiere, Spielen mit Freunden – und Hilfe bei Starkregen. Eine Fläche kann richtig viel!“
    punkte: ['Schatten im Sommer', 'Platz für Tiere', 'Spielen mit Freunden', 'Hilfe bei Starkregen'],
    satz: 'Eine Fläche kann richtig viel!',
  },

  // Info für Moderation (Taste I): Ablauf, SMARTy-Einsätze (Tasten im Soundboard), Hinweise
  moderation: {
    start: ['Hauptknöpfe 1–6 oder unten anklicken. Nichts schaltet von selbst weiter.', 'Gleiche Spielplatz-Gestaltung wie in der Minecraft-Testwelt (Seite „⛏ Minecraft“).'],
    grau: ['ZEITREISENDE 1: „Da ist sie. Unsere Stadt im Jahr 2050. Und mitten drin … dieser riesige graue Platz.“', 'Publikum: zwei bis drei Kinderideen zulassen.', 'SMARTy N1 „Die Frage“ – Soundboard Taste 3.', '→ Pfeil: zweite Frage „Was braucht ihr draußen zum Spielen?“'],
    abstimmung: ['Handabstimmung im Saal. Ergebnis mit A oder B markieren (optional).', 'Danach → : „Müssen wir uns wirklich zwischen Spielen und Natur entscheiden?“', 'Weiter mit 3 „Beides gemeinsam“.'],
    beides: ['ZEITREISENDER 2: „Warum bauen wir nicht einen Abenteuerspielplatz MIT Bäumen, Wiesen und wilden Ecken?“', 'Leertaste/→ verwandelt den Platz (Schicht für Schicht, etwa 4 Sekunden).', 'SMARTy N2 „Der Aha-Moment“ – Soundboard Taste 4.'],
    sommer: ['„Unter ihren Blättern ist es schattig. Pflanzen geben Wasser an die Luft ab und helfen so beim Kühlen.“', 'W schaltet die vereinfachte Wärme-Ansicht ein und aus (keine Messwerte).', 'Schritt „Tiere“: Schmetterlinge und Vögel in der wilden Ecke.'],
    regen: ['SMARTy N3 „Wetterwarnung“ – Soundboard Taste W (Textvorschlag, erst nach Freigabe aufnehmen).', 'Schritte: grauer Platz (fließt ab) → grüner Platz (versickert, Mulde, tiefer Bereich, Zisterne) → Regen vorbei → Gießen.', '„Wichtig: Wenn der Bereich voll Wasser ist, wird dort natürlich nicht gespielt.“', 'SMARTy N4 „Regenwasser auffangen“ – Soundboard Taste E.'],
    ende: ['„Also: Schatten im Sommer, Platz für Tiere, Spielen mit Freunden – und Hilfe bei Starkregen. Eine Fläche kann richtig viel!“', 'Übergang: Abstimmungsfolie „Wann sollen unsere Laternen leuchten?“ (Mission Technik).'],
  },

  knoepfe: { start: 'Start', grau: 'Grauer Platz', abstimmung: 'Abstimmung', beides: 'Beides gemeinsam', sommer: 'Sommertag', regen: 'Starkregen', ende: 'Endbild' },
  keinWebGL: 'Dieses Gerät kann keine 3D-Grafik (WebGL) anzeigen. Bitte in einem aktuellen Chrome oder Edge öffnen und die Hardwarebeschleunigung einschalten.',
  ladefehler: 'Die Anwendung konnte nicht geladen werden. Bitte über GitHub Pages oder einen lokalen Webserver öffnen (nicht per Doppelklick auf die Datei).',
};
