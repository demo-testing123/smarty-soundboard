import { erzeugeWelt, befehle, PLATZ, VORLAGEN, REGIE, BLOECKE, NAMEN, ID, GRUEN_TEILE, platzBox, vorlageBox, kontrollBox, kontrollKopieBox, istPflanze } from './welt.js';
import { mcworld, mcstructure } from './mcworld.js';

const $ = (s) => document.querySelector(s);
function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else el.setAttribute(k, v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) el.append(k.nodeType ? k : document.createTextNode(String(k)));
  return el;
}
const zahl = (n) => n.toLocaleString('de-DE');
const bereich = ([a, e]) => `x ${a[0]} bis ${e[0]} · y ${a[1]} bis ${e[1]} · z ${a[2]} bis ${e[2]}`;
const volumen = ([a, e]) => (e[0] - a[0] + 1) * (e[1] - a[1] + 1) * (e[2] - a[2] + 1);

const BF = befehle();
const { welt, vorlagen } = erzeugeWelt();
const NAME = 'START IT SMART Spielplatz-Test';

/* ---------- Befehlszeile mit Kopierknopf ---------- */
async function kopiere(text, knopf) {
  try { await navigator.clipboard.writeText(text); }
  catch {
    const t = h('textarea', {}, text); document.body.append(t); t.select();
    try { document.execCommand('copy'); } catch { /* bleibt markiert */ }
    t.remove();
  }
  knopf.textContent = 'Kopiert ✓'; knopf.classList.add('kopiert');
  setTimeout(() => { knopf.textContent = 'Kopieren'; knopf.classList.remove('kopiert'); }, 1600);
}
function befehl(text) {
  const knopf = h('button', { type: 'button', title: 'In die Zwischenablage; in Minecraft mit T oder / den Chat öffnen und Strg+V' }, 'Kopieren');
  knopf.addEventListener('click', () => kopiere(text, knopf));
  return h('div', { class: 'befehl' }, h('code', {}, text), knopf);
}

/* ---------- Eckdaten ---------- */
const pb = platzBox();
$('#eckdaten').append(
  h('li', {}, h('b', {}, 'Platz: '), bereich(pb), ` (${PLATZ.dx} × ${PLATZ.dy} × ${PLATZ.dz} = ${zahl(volumen(pb))} Blöcke; Boden y ${pb[0][1] + PLATZ.boden})`),
  h('li', {}, h('b', {}, 'Vorlage Grau: '), bereich(vorlageBox('grau'))),
  h('li', {}, h('b', {}, 'Vorlage Grün: '), bereich(vorlageBox('gruen'))),
  h('li', {}, h('b', {}, 'Kontrollkopie '), '(Platz + 4 Blöcke Rand im Ausgangszustand): ', bereich(kontrollKopieBox())),
  h('li', {}, h('b', {}, 'Regieplatz '), `(Startpunkt): ${REGIE.stand.join(' ')}`),
  h('li', {}, h('b', {}, 'Grenzen in Bedrock: '), `/clone bis ${zahl(655360)} Blöcke, /structure bis 64 × 384 × 64. Der Platz braucht ${zahl(volumen(pb))}.`),
);

/* ---------- Downloads ---------- */
function speichere(daten, name) {
  const url = URL.createObjectURL(new Blob([daten], { type: 'application/octet-stream' }));
  const a = h('a', { href: url, download: name }); document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
$('#ladeWelt').addEventListener('click', async (e) => {
  const k = e.currentTarget; k.disabled = true; const alt = k.textContent; k.textContent = 'Welt wird erzeugt …';
  try {
    const t0 = performance.now(), daten = await mcworld(welt, NAME, REGIE.stand);
    speichere(daten, 'Spielplatz-Test.mcworld');
    $('#weltInfo').textContent = `${(daten.length / 1024).toFixed(0)} KB, erzeugt in ${((performance.now() - t0) / 1000).toFixed(1)} s. Doppelklick auf die Datei öffnet sie in Minecraft Education.`;
  } catch (err) { $('#weltInfo').textContent = 'Fehler beim Erzeugen: ' + err.message; }
  k.disabled = false; k.textContent = alt;
});
for (const k of document.querySelectorAll('[data-struktur]')) k.addEventListener('click', () => {
  const n = k.dataset.struktur;
  speichere(mcstructure(vorlagen[n], VORLAGEN[n].ursprung), `spielplatz_${n}.mcstructure`);
});

/* ---------- Vorbereiten ---------- */
const schritt = (titel, ...inhalt) => h('li', {}, h('b', {}, titel), ...inhalt);
$('#vorbereiten').append(
  schritt('Welt öffnen.', h('p', {}, 'Die .mcworld-Datei doppelklicken, oder in Minecraft Education „Spielen“ › „Importieren“ wählen. Die Welt öffnet sich im Kreativmodus auf dem Regieplatz, mit Blick auf den grauen Platz. Befehle sind in der Welt eingeschaltet. Falls ein Befehl abgelehnt wird: Welteinstellungen › „Cheats aktivieren“.')),
  schritt('Platz dauerhaft geladen halten (einmal).', h('p', {}, 'Dieser Befehl legt einen „Ticking-Bereich“ an. Er hält Platz, Vorlagen-Kammern und Rand immer geladen, auch wenn die Kamera woanders steht, und bleibt in der Welt gespeichert.'), befehl(BF.ticking)),
  schritt('Ausgangszustand prüfen.', h('p', {}, `Erwartet: Erfolgsmeldung mit ${zahl(volumen(kontrollBox()))} verglichenen Blöcken. Damit ist auch geprüft, dass die Welt richtig angekommen ist.`), befehl(BF.pruefeGrau)),
  schritt('Für die Leinwand (am Vorlesungstag).', h('p', {}, 'Koordinaten und Befehlsmeldungen ausblenden, dann F1 drücken. Für Tests wieder auf true stellen.'), befehl('/gamerule showcoordinates false'), befehl(BF.gamerule)),
);

/* ---------- Ablauf ---------- */
const knopf = (n) => h('span', { class: 'knopfname' }, n);
const zeile = (moment, aktion, ...befehle2) => h('tr', {}, h('td', {}, moment), h('td', {}, aktion, ...befehle2.map(befehl)));
$('#ablauf').append(
  h('tr', {}, h('th', {}, 'Drehbuch: Mission Natur'), h('th', {}, 'In Minecraft (Knopf auf dem Regieplatz oder Chatbefehl)')),
  zeile('„Da ist sie. Unsere Stadt im Jahr 2050. Und mitten drin … dieser riesige graue Platz.“', h('div', {}, knopf('GRAU'), ' falls noch nicht grau, dann ', knopf('ANSICHT Übersicht')), BF.grau, BF.uebersicht),
  zeile('Abstimmung A = großer Abenteuerspielplatz, B = grüner Abenteuerpark (Leinwand)', h('div', {}, 'In Minecraft nichts tun: Laut Drehbuch folgt in jedem Fall „Beides gemeinsam!“.')),
  zeile('LEINWAND „DIE LÖSUNG: BEIDES GEMEINSAM!“ · MINECRAFT: Grünversion einblenden', h('div', {}, knopf('GRÜN'), ' kopiert den Natur-Abenteuerspielplatz auf den Platz.'), BF.gruen),
  zeile('Wasserteil: „Schaut: Dieser Teil liegt ein bisschen tiefer …“ (vorbereitete Ansicht)', h('div', {}, knopf('ANSICHT Wasser'), ' zeigt Regenmulde, tiefen Spielbereich und Zisterne. Es gibt keine echte Überflutung, wie im Drehbuch.'), BF.wasser),
  zeile('Endbild Natur-Abenteuerspielplatz', h('div', {}, knopf('ZURÜCK'), ' am Aussichtspunkt bringt die Kamera auf den Regieplatz zurück.'), BF.uebersicht),
  zeile('Nach der Probe oder Vorlesung', h('div', {}, knopf('GRAU'), ' setzt den Platz zurück. Das lässt sich beliebig oft wiederholen.'), BF.grau),
);
$('#animation').append(
  h('summary', {}, 'Optional: Aufbau-Animation statt Sofortwechsel (/structure)'),
  h('p', {}, 'Mit gespeicherten Strukturen wächst der Spielplatz Schicht für Schicht in etwa 3 Sekunden. Dafür beide Vorlagen einmal als Struktur in der Welt speichern. Die Strukturen bleiben in der Welt erhalten. Nach Änderungen an einer Vorlagen-Kammer neu speichern.'),
  befehl(BF.strukturSpeichern('grau')), befehl(BF.strukturSpeichern('gruen')),
  h('p', {}, 'In der Vorlesung statt GRÜN und GRAU:'), befehl(BF.strukturLaden('gruen', 3)), befehl(BF.strukturLaden('grau')),
  h('p', { class: 'hinweis' }, 'Ungeprüft in Education. Test 11 klärt, ob beim Laden auch Luft geschrieben wird (alte Bäume verschwinden) und ob die Animation flüssig läuft. Der /clone-Weg oben funktioniert unabhängig davon.'),
);

$('#aendern').append(
  h('summary', {}, 'So ändert ihr den Grün-Entwurf in Minecraft'),
  h('p', {}, 'In die Grün-Kammer springen, dort wie gewohnt bauen und dann GRÜN drücken. Die Kammer ist genau so groß wie der Platz: Wände, Boden und Decke der Kammer nicht abbauen. Alles, was in der Kammer steht, landet beim Wechsel auf dem Platz.'),
  befehl(BF.zuKammer('gruen')),
  h('p', {}, 'Zurück zum Regieplatz:'), befehl(BF.uebersicht),
  h('p', {}, 'Wird der Rand um den Platz bewusst umgebaut (Bordstein, Gehweg), danach bei GRAUEM Platz die Kontrollkopie erneuern. Sonst meldet die Prüfung eine Abweichung:'),
  befehl(BF.kontrollNeu),
  h('p', { class: 'hinweis' }, 'Wenn ihr Wasser einbaut: nur in rundum geschlossenen Becken, damit beim Wechsel nichts ausläuft. Bei Bäumen kein Laub über die Kammer hinaus.'),
);

/* ---------- Testplan ---------- */
const kv = volumen(kontrollBox()), pv = volumen(pb);
const TESTS = [
  ['t0', 'Version notieren', 'Minecraft Education starten und die Versionsnummer unten rechts im Hauptmenü notieren (aktuell ist 26.30).', []],
  ['t1', 'Welt öffnet sich', 'Die Welt importieren und öffnen. Erwartet: keine Fehlermeldung. Grauer Platz zwischen grauen Hochhäusern, links auf dem Regieplatz vier Knöpfe mit Schildern.', []],
  ['t2', 'Ausgangszustand stimmt', `Erwartet: ${zahl(kv)} Blöcke verglichen.`, [BF.pruefeGrau]],
  ['t3', 'GRÜN wechselt sofort und vollständig', `Knopf GRÜN drücken. Erwartet: Der Platz ist in unter 1 Sekunde grün. Erste Prüfung: ${zahl(pv)} Blöcke verglichen. Die vier Randstreifen bestehen ebenfalls (Nachbarn unverändert).`, [BF.pruefeGruen, ...BF.pruefeRand.map(([, c]) => c)]],
  ['t4', 'Wasser bleibt in der Zisterne', 'Knopf ANSICHT Wasser, 10 Sekunden warten. Erwartet: Wasser nur unter dem Glas, nirgends fließendes Wasser. Danach ZURÜCK.', []],
  ['t5', 'GRAU setzt sauber zurück', `Knopf GRAU drücken. Erwartet: ${zahl(kv)} Blöcke verglichen. Dann sind auch Bäume, Wasser, Schilder und der Rand ringsum wieder genau wie am Anfang.`, [BF.pruefeGrau]],
  ['t6', 'Zehnmal wechseln', 'Abwechselnd GRÜN und GRAU, zehnmal, zum Schluss GRAU. Erwartet: Prüfung wie in Test 5 besteht.', [BF.pruefeGrau]],
  ['t7', 'Fremde Blöcke verschwinden, Nachbarn bleiben', 'Einen beliebigen Block mitten auf den grauen Platz setzen und einen auf den Bordstein daneben (zum Beispiel x −1, y 64, z 10). Dann GRÜN und GRAU drücken. Erwartet: Der Block auf dem Platz ist weg, der auf dem Bordstein steht noch. Diesen dann von Hand abbauen und prüfen.', [BF.pruefeGrau]],
  ['t8', 'Speichern und wieder öffnen', 'Welt verlassen, Minecraft schließen, Welt wieder öffnen. Erwartet: Zustand wie zuvor. Danach GRÜN, GRAU und die Prüfung erneut.', [BF.pruefeGrau]],
  ['t9', 'Chat statt Knöpfe', 'Dieselben Wechsel per Chatbefehl. Erwartet: gleiches Ergebnis wie mit den Knöpfen. Das ist der Ausweg, falls die Befehlsblöcke in eurer Version nicht auslösen.', [BF.gruen, BF.grau, BF.pruefeGrau]],
  ['t10', 'Bühnenbild', 'Beamer anschließen, Vollbild, Befehle für die Leinwand (Vorbereitung 4), F1. Erwartet: Übersicht und Wasser-Ansicht zeigen alles Wichtige. Die Knöpfe sind beim Drücken kurz im Bild.', [BF.uebersicht, BF.wasser]],
  ['t11', 'Optional: Struktur mit Animation', 'Beide Strukturen speichern (Abschnitt 3, „Optional“). Dann grün animiert laden und prüfen, danach grau laden und prüfen.', [BF.strukturLaden('gruen', 3), BF.pruefeGruen, BF.strukturLaden('grau'), BF.pruefeGrau]],
];
let erledigt = {};
try { erledigt = JSON.parse(localStorage.getItem('minecraft.testplan') || '{}'); } catch { erledigt = {}; }
const merke = () => { try { localStorage.setItem('minecraft.testplan', JSON.stringify(erledigt)); } catch { /* nur Komfort */ } };
for (const [id, titel, text, cmds] of TESTS) {
  const box = h('input', { type: 'checkbox', id });
  box.checked = !!erledigt[id];
  const li = h('li', { class: box.checked ? 'erledigt' : '' }, h('label', { for: id }, box, `${id.toUpperCase()} · ${titel}`), h('p', { class: 'erwartet' }, text), ...cmds.map(befehl));
  box.addEventListener('change', () => { erledigt[id] = box.checked; li.classList.toggle('erledigt', box.checked); merke(); });
  $('#testplan').append(li);
}
$('#testReset').addEventListener('click', () => { erledigt = {}; merke(); for (const b of document.querySelectorAll('#testplan input')) { b.checked = false; b.closest('li').classList.remove('erledigt'); } });

/* ---------- Grenzen ---------- */
for (const t of [
  'In Minecraft Education noch nicht ausprobiert. Geprüft ist der Aufbau der Datei: Sie wird zurückgelesen und Block für Block verglichen. Auch die Tauschlogik ist im Modell geprüft (Selbsttests).',
  'Blocknamen und Weltformat übernehme ich aus dem Education-Export des Stadt-Konfigurators (Stand 1.20.70). Minecraft wandelt sie beim Öffnen in die aktuelle Fassung um.',
  'Befehlsblöcke sind neu gegenüber dem Konfigurator. Falls ein Knopf nichts tut, funktionieren die Chatbefehle. Man kann den Befehl auch im Befehlsblock neu eintragen.',
  'Diese Webseite ist nicht mit Minecraft verbunden. Ausgelöst wird in Minecraft selbst, per Knopf oder Chat.',
  'Das ist eine eigene Testwelt. Für die Show-Welt der Stadt müssen Platz und Vorlagen-Kammern an deren Koordinaten angelegt werden (LIESMICH, Abschnitt 7).',
  'Steht eine Spielfigur beim Wechsel auf dem Platz, kann sie in Blöcken stecken. Deshalb steht die Kamera auf dem Regieplatz.',
]) $('#grenzen').append(h('li', {}, t));

/* ---------- Zeichnungen ---------- */
const farbe = (id) => BLOECKE[NAMEN[id]][2];
function draufsicht(canvas, v, beschriftungen) {
  const c = canvas.getContext('2d'), s = canvas.width / v.dx;
  for (let z = 0; z < v.dz; z++) for (let x = 0; x < v.dx; x++) {
    let y = v.dy - 1; while (y > 0 && v.hole(x, y, z) === ID.luft) y--;
    const id = v.hole(x, y, z);
    if (istPflanze(id)) {
      c.fillStyle = shade(farbe(v.hole(x, y - 1, z)), y - 1 - PLATZ.boden); c.fillRect(x * s, z * s, s, s);
      c.fillStyle = farbe(id); c.beginPath(); c.arc(x * s + s / 2, z * s + s / 2, s * 0.28, 0, 7); c.fill();
    } else { c.fillStyle = shade(farbe(id) || '#000', y - PLATZ.boden); c.fillRect(x * s, z * s, s, s); }
  }
  c.strokeStyle = 'rgba(0,0,0,.08)'; c.lineWidth = 1;
  for (let k = 0; k <= v.dx; k++) { c.beginPath(); c.moveTo(k * s + .5, 0); c.lineTo(k * s + .5, canvas.height); c.stroke(); c.beginPath(); c.moveTo(0, k * s + .5); c.lineTo(canvas.width, k * s + .5); c.stroke(); }
  c.font = `800 ${Math.round(s * 1.05)}px system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  for (const [t, x, z] of beschriftungen) { c.lineWidth = 4; c.strokeStyle = 'rgba(255,255,255,.9)'; c.strokeText(t, x * s, z * s); c.fillStyle = '#10241a'; c.fillText(t, x * s, z * s); }
  c.fillStyle = 'rgba(0,0,0,.55)'; c.font = `600 ${Math.round(s * 0.9)}px system-ui`; c.textAlign = 'right'; c.fillText('N ↑', canvas.width - 6, s);
}
// tiefer gelegenes etwas dunkler, höheres heller
function shade(hex, dy) {
  const n = parseInt(hex.slice(1), 16), f = Math.max(-0.35, Math.min(0.25, dy * 0.06));
  const ch = (v) => Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f);
  return `rgb(${ch(n >> 16)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}
const mitte = ([x1, z1, x2, z2]) => [(x1 + x2 + 1) / 2, (z1 + z2 + 1) / 2];
draufsicht($('#sichtGrau'), vorlagen.grau, [['Betonplatten', 16, 11.5]]);
draufsicht($('#sichtGruen'), vorlagen.gruen, [
  ['Mulde', ...mitte(GRUEN_TEILE.mulde)], ['tief', ...mitte(GRUEN_TEILE.tieferSpielbereich)], ['Zisterne', ...mitte(GRUEN_TEILE.zisterne)],
  ['Turm', 14, 1.2], ['Schaukel', 23, 4.6], ['wild', 4.5, 5.5],
]);

// Schnitt durch die Welt bei z = 16: Platz oben, Kammern darunter
(function schnitt() {
  const cv = $('#schnitt'), c = cv.getContext('2d'), z = 16, xa = -6, xe = 37, ya = -3, ye = 80, s = 4.6, ox = 16, oy = 8;
  c.fillStyle = '#cfe3f3'; c.fillRect(0, 0, cv.width, cv.height);
  for (let y = ya; y <= ye; y++) for (let x = xa; x <= xe; x++) {
    const id = welt.hole(x, y, z); if (!id) continue;
    c.fillStyle = istPflanze(id) ? '#79b04a' : farbe(id) || '#000';
    c.fillRect(ox + (x - xa) * s, oy + (ye - y) * s, s + .4, s + .4);
  }
  const box = ([a, e], farbeR, text, unter) => {
    const x1 = ox + (a[0] - xa) * s, x2 = ox + (e[0] - xa + 1) * s, y1 = oy + (ye - e[1]) * s, y2 = oy + (ye - a[1] + 1) * s;
    c.strokeStyle = farbeR; c.lineWidth = 2.5; c.setLineDash(unter ? [6, 4] : []); c.strokeRect(x1, y1, x2 - x1, y2 - y1); c.setLineDash([]);
    const tx = ox + (xe - xa + 1) * s + 18;
    c.beginPath(); c.moveTo(x2, (y1 + y2) / 2); c.lineTo(tx - 6, (y1 + y2) / 2); c.stroke();
    c.fillStyle = '#10241a'; c.font = '700 15px system-ui'; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText(text[0], tx, (y1 + y2) / 2 - 9); c.font = '13px system-ui'; c.fillStyle = '#34463a'; c.fillText(text[1], tx, (y1 + y2) / 2 + 9);
  };
  const y = (b) => `y ${b[0][1]} bis ${b[1][1]}`;
  box(platzBox(), '#c0392b', ['Platz (sichtbar)', y(platzBox()) + ', wird überschrieben'], false);
  box(vorlageBox('grau'), '#555', ['Vorlage GRAU', y(vorlageBox('grau'))], false);
  box(vorlageBox('gruen'), '#2f7d32', ['Vorlage GRÜN', y(vorlageBox('gruen'))], false);
  box(kontrollKopieBox(), '#1f6fae', ['Kontrollkopie', y(kontrollKopieBox()) + ' (nur zum Prüfen)'], true);
  c.fillStyle = '#10241a'; c.font = '600 13px system-ui'; c.textAlign = 'left';
  c.fillText('Schnitt bei z = 16, Blick nach Norden', ox, cv.height - 10);
})();
