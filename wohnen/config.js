/* „Wie bauen wir unsere Zukunftsstadt?“ – Texte, Modellraster und Zeiten an einer Stelle.
 *
 * MODELLRASTER (alle Zahlen werden daraus berechnet, nichts ist fest eingetragen):
 *  - 1 Rasterfeld = 1 × 1 Einheit. Das Grundstück der Varianten ist 12 × 12 = 144 Rasterfelder groß.
 *  - 1 Wohnmodul = 1 Wohnung = Grundfläche 2 × 2 Rasterfelder, eine Etage hoch.
 *  - Experiment: Grundstück 3 × 3 Modulfelder; jedes Modulfeld ist so groß wie ein Wohnmodul.
 *  - Keine echten m²: Das Raster ist ein vereinfachtes Modell.
 *
 * Varianten-Pläne: eine Zeile je Rasterreihe (hinten → vorn), ein Zeichen je Rasterfeld:
 *   H = Haus (bebaute Bodenfläche)   P = privater Garten   G = gemeinsamer Hof (Grün)
 *   O = öffentlicher Park (Grün)     W = Weg
 */
export const CONFIG = {
  titel: 'Wie bauen wir unsere Zukunftsstadt?',
  untertitel: 'Sechs Familien. Sechs Wohnungen. Ein begrenztes Grundstück.',

  raster: { modul: 2, etage: 2, experimentFelder: 3 },
  // Das Experiment wird größer gezeigt als die Varianten (eigener Maßstab), damit es im Saal gut zu sehen ist.
  // versatz: in Rasterfeldern; schiebt das Modell nach rechts in die freie Mitte und etwas nach unten,
  // damit weder die Türme an den Titel noch die Frage unten links an das Modell stoßen
  experimentAnsicht: { groesse: 1.6, versatz: [4.4, 0, 0.6] },
  dauer: { stapeln: 2.8, aufstocken: 3.0 },   // Sekunden, ruhig und kurz

  experiment: {
    titel: 'Experiment: Sechs Wohnmodule',
    frage: 'Wir brauchen sechs Wohnungen. Brauchen sie immer gleich viel Platz am Boden?',
    vermutung: 'Bleibt die Zahl der Wohnungen gleich? Was passiert mit der freien Fläche?',
    hinweis: 'Vereinfachtes Modell: gleiche Modulgröße, ohne zusätzliche Wege, Abstände, Treppenhäuser oder Bauvorschriften.',
    // [x, z] Modulfeld je Wohnmodul 1–6 (Grundstück 3 × 3, hinten = z 0)
    nebeneinander: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]],
    // [x, z, Etage] – zwei Gebäude mit je drei Etagen
    gestapelt: [[1, 0, 1], [1, 0, 0], [1, 0, 2], [1, 1, 1], [1, 1, 0], [1, 1, 2]],
    zaehler: {
      wohnungen: 'Wohnungen',
      belegt: 'Belegte Modul-Grundflächen',
      frei: 'Frei gewordene Modul-Grundflächen',
    },
    buttons: { vermutung: 'Vermutung zeigen', neben: 'Nebeneinander', stapeln: 'Stapeln' },
  },

  varianten: {
    A: {
      titel: 'Häuser mit eigenen Gärten',
      kurz: 'Eigene Gärten',
      frage: 'Wer darf in die Gärten?',
      gruenTyp: 'privat',
      gruenText: '6 private Gärten',
      geschosse: 1, dach: 'sattel',
      plan: [
        'PPPPPPPPPPPP',
        'PPPPPPPPPPPP',
        'PPPPPPPPPPPP',
        'PHHPPHHPPHHP',
        'PHHPPHHPPHHP',
        'WWWWWWWWWWWW',
        'WWWWWWWWWWWW',
        'PHHPPHHPPHHP',
        'PHHPPHHPPHHP',
        'PPPPPPPPPPPP',
        'PPPPPPPPPPPP',
        'PPPPPPPPPPPP',
      ],
    },
    B: {
      titel: 'Häuser mit gemeinsamen Höfen',
      kurz: 'Gemeinsamer Hof',
      frage: 'Was können Nachbarn gemeinsam machen?',
      gruenTyp: 'gemeinsam',
      gruenText: 'Gemeinsamer Hof',
      geschosse: 2, dach: 'sattel',
      plan: [
        'GGGGGGGGGGGG',
        'GGGGGHHGGGGG',
        'GGGGGHHGGGGG',
        'GGGGGWWGGGGG',
        'GGGGGWWGGGGG',
        'GHHWWWWWWHHG',
        'GHHGGWWGGHHG',
        'GGGGGWWGGGGG',
        'GGGGGWWGGGGG',
        'GGGGGWWGGGGG',
        'GGGGGWWGGGGG',
        'GGGGGWWGGGGG',
      ],
    },
    C: {
      titel: 'Höhere Häuser mit zusammenhängendem Park',
      kurz: 'Park',
      frage: 'Wer kann den Park nutzen?',
      gruenTyp: 'öffentlich',
      gruenText: 'Park für alle',
      geschosse: 3, dach: 'flach',
      plan: [
        'OOOOOOOOOOOO',
        'OHHOOOOOOHHO',
        'OHHOOOOOOHHO',
        'OWWWWWWWWWWO',
        'OOOOOWWOOOOO',
        'OOOOOWWOOOOO',
        'OOOOOWWOOOOO',
        'OOOOOWWOOOOO',
        'OOOOOWWOOOOO',
        'OOOOOWWOOOOO',
        'OOOOOWWOOOOO',
        'OOOOOWWOOOOO',
      ],
    },
    zaehler: { wohnungen: 'Wohnungen', bebaut: 'Bebaute Bodenfläche', unbebaut: 'Unbebaute Fläche', gruen: 'Grünflächentyp', einheit: 'Rasterfelder' },
    vergleichen: 'Alle vergleichen',
    rasterInfo: 'Modellraster: Grundstück 12 × 12 = 144 Rasterfelder · 1 Wohnung = 2 × 2 Rasterfelder',
  },

  aufstocken: {
    titel: 'Aufstocken & CO₂',
    frage: 'Muss ein altes Haus immer abgerissen werden? Was passiert, wenn wir zwei Stockwerke ergänzen?',
    vorbild: 'Vorbild: Platensiedlung in Frankfurt – hier als schematisches Modell, nicht maßstabsgetreu.',
    labels: { alt: 'Vorhandenes Gebäude weiterverwenden', neu: 'Zwei neue Holzgeschosse', fundament: 'Fundament und Wände bleiben bestehen' },
    buttons: { bestand: 'Bestand', aufstocken: 'Aufstocken', material: 'Materialwissen', einsparen: 'Was wird eingespart?', check: 'Mini-Check' },
    karten: [
      { id: 'holz', titel: 'Holz', text: 'Bäume nehmen beim Wachsen CO₂ auf. Im verbauten Holz bleibt Kohlenstoff gespeichert, solange das Holz erhalten bleibt.' },
      { id: 'beton', titel: 'Beton/Zement', text: 'Bei der Zementherstellung entsteht CO₂ – durch Energiebedarf und chemische Prozesse.' },
      { id: 'bestand', titel: 'Bestand', text: 'Weiterverwenden kann Material und Emissionen eines vollständigen Neubaus vermeiden.' },
    ],
    abwaegen: 'Kein Baustoff ist immer gut oder immer schlecht: Herkunft, Haltbarkeit, Konstruktion und der ganze Lebenszyklus zählen.',
    einsparen: 'Diese Wände und das Fundament bleiben stehen. Sie müssen nicht abgerissen und neu gebaut werden.',
    bilanz: 'Wie viel CO₂ das genau spart, zeigt nur eine echte Klimabilanz mit genauen Daten.',
    check: { frage: 'Was kann beim Weiterbauen helfen?', antwort: 'Wir können vorhandene Bauteile weiterverwenden.', zeigen: 'Antwort zeigen' },
  },

  // Lernziel (max. zwei Sätze) und Notizen je Modus – beides nur in „Info für Moderation“ (Taste I), nicht auf der Leinwand
  moderation: {
    start: { lernziel: 'Sechs Familien brauchen sechs Wohnungen. Wir probieren aus, wie man sie auf ein Grundstück baut.', notizen: ['Hauptknöpfe 1–5 oder unten anklicken. Nichts läuft von allein weiter.', 'Abstimmungen im Saal per Handzeichen.'] },
    experiment: { lernziel: 'Gestapelt brauchen dieselben sechs Wohnungen weniger Bodenfläche. Die Zahl der Wohnungen bleibt gleich.', notizen: ['Frage: „Wir brauchen sechs Wohnungen. Brauchen sie immer gleich viel Platz am Boden?“', 'Erst Kinder vermuten lassen („Vermutung zeigen“), dann „Stapeln“.', 'Vereinfachtes Modell: Echte Hochhäuser sparen nicht immer genau so viel Boden (Wege, Abstände, Treppenhäuser).', 'Das Experiment ist größer dargestellt als die Varianten A/B/C (eigener Maßstab).'] },
    varianten: { lernziel: 'Gleiches Grundstück, gleich viele Wohnungen – aber verschiedene Freiflächen. Wichtig ist, wer sie nutzen darf.', notizen: ['Frage: „Alle drei bieten Platz für sechs Familien. Welche Grünflächen entstehen – und wer darf sie nutzen?“', 'Danach Handabstimmung A / B / C. Die Varianten sind keine Rangfolge.', 'Zahlen sind Rasterfelder des Modells (12 × 12), keine echten Quadratmeter.'] },
    aufstocken: { lernziel: 'Ein vorhandenes Haus kann weitergenutzt und erweitert werden. Höher bauen ist nicht automatisch klimafreundlicher.', notizen: ['Frage: „Muss ein altes Haus immer abgerissen werden? Was passiert, wenn wir zwei Stockwerke ergänzen?“', 'Reihenfolge: Bestand → Aufstocken → Materialwissen → Was wird eingespart? → Mini-Check.', 'Keine Prozentzahlen oder CO₂-Mengen nennen: Dafür bräuchte man eine echte Klimabilanz.'] },
  },

  knoepfe: { start: 'Start', experiment: 'Experiment', A: 'Variante A', B: 'Variante B', C: 'Variante C', aufstocken: 'Aufstocken & CO₂', reset: 'Zurücksetzen', info: 'Info für Moderation', vollbild: 'Vollbild' },
  keinWebGL: 'Dieses Gerät kann keine 3D-Grafik (WebGL) anzeigen. Bitte in einem aktuellen Chrome oder Edge öffnen und die Hardwarebeschleunigung einschalten.',
  ladefehler: 'Die Anwendung konnte nicht geladen werden. Bitte über GitHub Pages oder einen lokalen Webserver öffnen (nicht per Doppelklick auf die Datei).',
};
