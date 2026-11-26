/* START IT SMART – Stadt-Konfigurator: REGIEANSICHT (Bedienung, Schritte, Karten, Tafeln).
 * Nichts schaltet von selbst weiter. Keine Pop-ups ohne Klick. Läuft ohne Internet. */
import { webglMoeglich, Ansicht } from './ansicht3d.js';
import { MISSIONEN, KAMERAS, TAFELN, BUCHSTABEN_FARBE, RUNDGANG, beschlussText } from './daten.js';
import { Zustand, SPEICHER_SCHLUESSEL } from './zustand.js';
import { BEREICHE, BEREICH_IDS, stadtFuer, vorlage, einsetzen, einkaufsweg, einkaufswege, bebauteFlaeche, wohnungen, LADEN, LAEDEN, ENERGIE_ORTE, wegMeter } from './stadtmodell.js';
import { befehle, bauauftrag, alleBauauftraege, stadtMcworld, ALLGEMEIN, tp, START, REGIERAUM } from './minecraft-ausgabe.js';
import { pruefeExport } from './weltleser.js';
import { Labor, laborAnsicht } from './labor.js';

const $ = (s) => document.querySelector(s);
function h(tag, attrs = {}, ...kinder) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style') el.style.cssText = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kinder.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c)));
  return el;
}

// ?test: eigener, leerer Speicher (die Abnahmetests verändern nie den Stand der Regie)
const TEST = new URLSearchParams(location.search).has('test');
if (TEST) try { localStorage.removeItem(SPEICHER_SCHLUESSEL + '-test'); } catch { /* ohne Speicher */ }
const Z = TEST ? new Zustand(undefined, SPEICHER_SCHLUESSEL + '-test') : new Zustand();
let ansicht = null, welt = null;
const angezeigt = {};                    // Bereich → aktuell in 3D gezeigte Variante
let pos = { mission: 0, schritt: 0 };
let vorschau = {};                       // Bereich → Variante (nur Ansicht, kein Beschluss)
let vorherAn = false, nacht = false, regenAn = false, regenModus = 'gruen', wegeGemessen = false;
let rundgang = { station: -1, timer: null };
let energieStufe = 0;                    // Energiecheck: Zustand 0–3 (angezeigt als 1–4); nur Licht und eingeblendete Modelle
let resetBereit = null;
let exportStand = null;                  // letzte erzeugte Minecraft-Welt: { name, datei, groesse, pruefung, beschluesse } oder { fehler }
const bilder = new Map(), wegeCache = new Map(), alleWegeCache = new Map();
// Calliope-Labor (Technik · 2/5): Programm und Test nur im Arbeitsspeicher – keine Speicherung, keine Beschlüsse
const LABOR_SCHRITT = MISSIONEN.flatMap((m) => m.schritte).find((x) => x.art === 'labor');
const labor = new Labor(LABOR_SCHRITT ? LABOR_SCHRITT.labor : {});
let laborSicht = null, laborTimer = null;
const uhr = () => performance.now();                  // monotone Zeitbasis
function laborStopp() { if (laborTimer) clearInterval(laborTimer); laborTimer = null; laborSicht = null; }
// Tafeln: feste aus daten.js + Ladentafeln aus dem Stadtmodell (eine Quelle für Bau, Tafel und Weg)
const TAFELN_ALLE = { ...TAFELN };
for (const v of ['A', 'B', 'C']) {
  TAFELN_ALLE['laden' + v] = { text: v, pos: LADEN[v].tafel, buchstabe: v, ziel: true };                       // großes Ziel A/B/C
  LAEDEN[v].forEach((l, i) => { TAFELN_ALLE[`laden${v}${i}`] = { text: v, pos: l.tafel, buchstabe: v, ziel: true, titel: l.name }; });
}
const ladenTafeln = (v) => LAEDEN[v].map((_, i) => `laden${v}${i}`);
// Energiecheck-Tafeln an den eingeblendeten Modellen
for (const [k, text] of [['solar', 'Solardach'], ['windrad', 'Windrad'], ['speicher', 'Batteriespeicher'], ['netz', 'Stromnetz']]) TAFELN_ALLE['e_' + k] = { text, pos: ENERGIE_ORTE.tafeln[k] };
// Vorschaubilder der Auswahlkarten: nur den Teil der Fläche zeigen, um den es geht
const BILD_AUSSCHNITT = { 'zukunft:A': [55, -18, 80, -1], 'zukunft:B': [80, -21, 95, -13] };

const mission = () => MISSIONEN[pos.mission];
const schritt = () => mission().schritte[pos.schritt];
const grund = (b) => BEREICHE[b].grund;
// Mission, zu der eine Baufläche gehört: Flächen späterer Missionen bleiben grau, bis ihre Mission erreicht ist
const MISSION_VON = Object.fromEntries(BEREICH_IDS.map((b) => [b, MISSIONEN.findIndex((m) => m.bereiche.includes(b))]));

/* ---------- Stand der Stadt ---------- */
// Bereiche mit einer Auswahl-Szene (Schwebebahn/Flugtaxi) erscheinen in ihrer Mission erst ab dieser Szene – die Wahl
// wird nicht vorweggenommen, auch nicht nach einer Probe mit gespeichertem Stand.
const AUSWAHL_AB = {};
MISSIONEN.forEach((mm, mi) => mm.schritte.forEach((st, si) => { if (st.auswahl) AUSWAHL_AB[st.auswahl.bereich] = [mi, si]; }));
const vorAuswahl = (b) => { const a = AUSWAHL_AB[b]; return !!a && pos.mission === a[0] && pos.schritt < a[1]; };
export function sollStand() {
  const m = mission(), s = schritt(), soll = {};
  for (const b of BEREICH_IDS) soll[b] = MISSION_VON[b] > pos.mission || vorAuswahl(b) ? grund(b) : Z.variante(b);
  if (s.zeige === 'vorher-alle') for (const b of BEREICH_IDS) soll[b] = grund(b);
  if (s.zeige === 'vorher') for (const b of (s.bereich ? [s.bereich] : m.bereiche)) soll[b] = grund(b);
  for (const [b, v] of Object.entries(vorschau)) soll[b] = v;
  if (vorherAn) for (const b of (m.bereiche.length ? m.bereiche : BEREICH_IDS)) soll[b] = grund(b);
  return soll;
}
function stadtAktualisieren() {
  const soll = sollStand();
  for (const b of BEREICH_IDS) {
    if (angezeigt[b] === soll[b]) continue;
    einsetzen(welt, b, vorlage(b, soll[b]));
    angezeigt[b] = soll[b];
    ansicht.setzeBereich(b, soll[b], welt);
  }
}

/* ---------- Kamera ---------- */
// Die 3D-Bühne ist frei (Titel, Karten und Seitenleiste liegen daneben). Jedes Preset hat einen „rahmen“:
// Ziel und Zoom werden so berechnet, dass dieser Quader ganz auf die Bühne passt – bei jeder Bildschirm- und Bühnengröße.
let kameraKey = null;
function kameraFuer(key) {
  const k = KAMERAS[key] || KAMERAS.gesamt;
  if (!k.rahmen) return k;
  ansicht.groesseAktualisieren();                      // Bühnengröße nach dem Umbau der Bedienfelder sofort übernehmen
  const m = Math.max(8, Math.round(ansicht.hoehePx * 0.03));
  return { ...k, ...ansicht.passend(k, k.rahmen, [m, m, ansicht.breite - m, ansicht.hoehePx - m]) };
}
function kameraZeigen(key, sofort = false) {
  kameraKey = key;
  ansicht.kamera(kameraFuer(key), sofort);
}

/* ---------- Navigation ---------- */
function verlassen() {
  vorschau = {}; vorherAn = false;
  if (regenAn) { regenAn = false; ansicht.setzeRegen(null); }
  if (ansicht.energie) ansicht.setzeEnergie(null);       // Energiecheck verlassen: Licht und Stadt wie vorher
  if (schritt().art === 'labor') { laborStopp(); labor.testZurueck(uhr()); }   // Labor verlassen: Timer und Test sauber beenden
  rundgangStopp();
  rundgang.station = -1;
}
function gehe(m, s = 0, { kamera = true, vonHinten = false } = {}) {
  m = Math.max(0, Math.min(MISSIONEN.length - 1, m));
  s = Math.max(0, Math.min(MISSIONEN[m].schritte.length - 1, s));
  const missionWechsel = m !== pos.mission;
  verlassen();
  pos = { mission: m, schritt: s };
  Z.setzePosition(m, s);
  if (missionWechsel) wegeGemessen = false;
  const st = schritt();
  if (st.art === 'loesung') vorschau = { [st.bereich]: st.variante };
  if (st.art === 'bilanz' && Z.beschluesse[st.bereich] !== st.variante) vorschau = { [st.bereich]: st.variante };   // Ergebnis der Verkehrssimulation, noch nicht übernommen
  if (st.art === 'regen') regenVorschau();
  if (!st.tagNacht && nacht) nachtSetzen(false);
  if (st.art === 'energie') { energieStufe = vonHinten ? st.stufen.length - 1 : 0; ansicht.setzeEnergie(energieStufe + 1); }
  anzeigen();
  if (kamera) kameraZeigen(st.kamera);       // nach anzeigen(): Bedienfelder stehen, Versatz ist gesetzt
}
function weiter() {
  if (schritt().art === 'finale' && rundgang.station >= 0 && rundgang.station < RUNDGANG.length - 1) return station(rundgang.station + 1);
  if (schritt().art === 'energie' && energieStufe < schritt().stufen.length - 1) return energieSetzen(energieStufe + 1);
  if (pos.schritt < mission().schritte.length - 1) gehe(pos.mission, pos.schritt + 1);
  else if (pos.mission < MISSIONEN.length - 1) gehe(pos.mission + 1, 0);
}
function zurueck() {
  if (schritt().art === 'finale' && rundgang.station > 0) return station(rundgang.station - 1);
  if (schritt().art === 'energie' && energieStufe > 0) return energieSetzen(energieStufe - 1);
  if (pos.schritt > 0) gehe(pos.mission, pos.schritt - 1, { vonHinten: true });
  else if (pos.mission > 0) gehe(pos.mission - 1, MISSIONEN[pos.mission - 1].schritte.length - 1, { vonHinten: true });
}
// Energiecheck: Zustand direkt setzen (Weiter/Zurück, Kacheln). Verändert keine Beschlüsse und nichts im Speicher.
function energieSetzen(i) {
  const st = schritt();
  if (st.art !== 'energie') return;
  energieStufe = Math.max(0, Math.min(st.stufen.length - 1, i));
  ansicht.setzeEnergie(energieStufe + 1);
  anzeigen();
}
// Kompakte Auswahl (Schwebebahn/Flugtaxi): ein Klick wählt und speichert
function auswahlSetzen(b, v) {
  if (Z.beschluesse[b] === v) { melden(`Schon gewählt: ${beschlussText(b, v) || v}`); return; }
  uebernehmen(b, v);
}

/* ---------- Aktionen ---------- */
function melden(text) {
  const el = $('#meldung');
  el.textContent = text; el.classList.add('an');
  clearTimeout(melden.t); melden.t = setTimeout(() => el.classList.remove('an'), 2200);
}
function vorschauSetzen(b, v) {
  vorschau[b] = v;
  vorherAn = false;
  anzeigen();
}
function uebernehmen(b, v) {
  if (!b || !v) return;
  if (Z.nurVorschau(b, v)) { melden('Das ist nur ein Diskussionsbild – gebaut wird die gemeinsame Lösung.'); return; }
  Z.uebernehmen(b, v);
  delete vorschau[b];
  const t = beschlussText(b, v) || BEREICHE[b].titel;
  melden(`In die Stadt übernommen: ${t}`);
  anzeigen();
}
function nachtSetzen(an) {
  nacht = !!an;
  ansicht.setzeNacht(nacht);
  document.querySelector('[data-aktion="nacht"]').setAttribute('aria-pressed', String(nacht));
}
function regenSetzen(an, modus = regenModus) {
  regenModus = modus;
  regenAn = !!an;
  if (schritt().art === 'regen') regenVorschau();
  ansicht.setzeRegen(regenAn ? modus : null);
  anzeigen();
}
function regenVorschau() {
  const ziel = regenModus === 'grau' ? 'grau' : 'gruen';
  vorschau = ziel === Z.variante('spielplatz') ? {} : { spielplatz: ziel };
}
function resetMission() {
  const m = mission();
  if (!m.bereiche.length) { melden('Diese Szene hat keine Baufläche. „Neu beginnen“ im Regie-Menü.'); return; }
  const k = $('[data-aktion="reset"]');
  if (resetBereit !== m.id) {
    resetBereit = m.id; k.textContent = `${m.kurz} wirklich zurücksetzen?`; k.classList.add('sicher');
    clearTimeout(resetMission.t); resetMission.t = setTimeout(() => { resetBereit = null; k.textContent = 'Mission zurücksetzen'; k.classList.remove('sicher'); }, 3500);
    return;
  }
  resetBereit = null; k.textContent = 'Mission zurücksetzen'; k.classList.remove('sicher');
  Z.zuruecksetzenMission(m.id);
  vorschau = {};
  melden(`${m.kurz}: zurückgesetzt – Fläche wieder grau, andere Missionen bleiben`);
  anzeigen();
}
function neuBeginnen() {
  // alles auf Anfang: Beschlüsse, Mehrheiten, Vorschauen, Rundgang, Regen, Nacht, Export, Ansicht und Kamera
  Z.neuBeginnen();
  vorschau = {}; vorherAn = false; wegeGemessen = false; exportStand = null;
  laborStopp(); labor.neu(uhr());
  if (regenAn) { regenAn = false; ansicht.setzeRegen(null); }
  rundgangStopp(); rundgang.station = -1;
  nachtSetzen(false);
  document.body.classList.remove('ohne-seite', 'ohne-bedienung');
  gehe(0, 0);
  melden('Neu begonnen: graue Stadt');
}

/* ---------- Vorschaubilder für Karten ---------- */
function bildFuer(b, v) {
  const k = `${b}:${v}`;
  if (!bilder.has(k)) { try { bilder.set(k, ansicht.vorschaubild(b, v, 520, 300, BILD_AUSSCHNITT[k] || null)); } catch { bilder.set(k, ''); } }
  return bilder.get(k);
}
const SVG_LATERNE = (sonne, an1, an2) => `<svg viewBox="0 0 220 120" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="110" height="120" fill="#cfe8f6"/><rect x="110" y="0" width="110" height="120" fill="#1d2b49"/>
  <circle cx="30" cy="26" r="13" fill="#ffd15c"/><path d="M178 16a14 14 0 1 0 14 22a11 11 0 1 1 -14 -22z" fill="#e8eefc"/>
  ${[[70, an1, false], [180, an2, true]].map(([x, an, dunkel]) => `
  ${an ? `<ellipse cx="${x}" cy="112" rx="34" ry="7" fill="${dunkel ? '#ffd98666' : '#ffd98699'}"/>` : ''}
  <rect x="${x - 3}" y="48" width="6" height="64" fill="#4a4d57"/>
  <rect x="${x - 11}" y="34" width="22" height="16" rx="3" fill="${an ? '#ffd986' : '#8a6446'}" ${an ? 'stroke="#fff2c4" stroke-width="2"' : ''}/>
  ${sonne ? `<rect x="${x - 10}" y="28" width="20" height="6" fill="#d8ccaf"/>` : ''}`).join('')}
  <rect x="0" y="112" width="220" height="8" fill="#9ea5ab"/></svg>`;
function kartenBild(b, v) {
  if (b === 'laternen') return h('div', { class: 'bild', html: v === 'immer' ? SVG_LATERNE(false, true, true) : SVG_LATERNE(true, false, true) });
  const img = h('img', { alt: '' });
  const bild = h('div', { class: 'bild' }, img);
  const k = `${b}:${v}`;
  if (bilder.has(k)) img.src = bilder.get(k);
  else setTimeout(() => { img.src = bildFuer(b, v); }, 20);
  return bild;
}

/* ---------- Wege (Kurze Wege) ---------- */
function weg(v) { if (!wegeCache.has(v)) wegeCache.set(v, einkaufsweg(v)); return wegeCache.get(v); }
const wegLaenge = (v) => { const w = weg(v); return w ? w.length - 1 : null; };
const meterText = (v) => `${wegMeter(wegLaenge(v)).toLocaleString('de-DE')} m`;   // ungefähre Meter aus der gemessenen Weglänge
function alleWege(v) { if (!alleWegeCache.has(v)) alleWegeCache.set(v, einkaufswege(v)); return alleWegeCache.get(v); }
const WEISS = '#ffffff';

/* ---------- Anzeige ---------- */
function leisteZeichnen() {
  const ol = $('#missionen');
  ol.replaceChildren(...MISSIONEN.map((m, i) => {
    const st = Z.status(m.id);
    return h('li', {}, h('button', {
      type: 'button', class: `mission-knopf ${st}`, 'aria-current': i === pos.mission ? 'step' : null, title: `${m.titel} (Taste ${i})`,
      onclick: () => gehe(i, 0),
    }, h('span', { class: 'nr' }, st === 'beschlossen' ? '✓' : String(i)), h('span', { class: 'name' }, m.navi || m.kurz)));
  }));
}
function markenFuer(m) {
  const out = [];
  for (const b of m.bereiche) {
    const v = Z.beschluesse[b];
    if (v && !vorAuswahl(b)) out.push(h('span', { class: 'marke gold' }, '✓ ', beschlussText(b, v) || v));
  }
  return out;
}
function statusMarke(b) {
  // klarer Status je Abstimmung: Noch offen · Vorschau · Übernommen
  const v = vorschau[b], neu = v && v !== Z.variante(b);
  if (neu) return h('span', { class: 'status-marke' }, 'Vorschau – noch nicht übernommen');
  if (Z.beschluesse[b]) return h('span', { class: 'status-marke ok' }, `✓ Übernommen: ${beschlussText(b, Z.beschluesse[b]) || Z.beschluesse[b]}`);
  return h('span', { class: 'status-marke' }, 'Noch offen');
}
function seiteListe(titel, punkte, modell) {
  return [h('h2', {}, titel), modell ? h('div', { class: 'modell' }, modell) : null, h('ul', {}, ...punkte.map((p) => h('li', {}, h('span', { class: 'zeichen' }, '•'), h('span', {}, p))))].filter(Boolean);
}
function anzeigen() {
  const m = mission(), s = schritt();
  leisteZeichnen();
  // Kopfzone: Kicker, Titel (Leitfrage), eine Unterzeile, Beschluss-Marken
  const hero = $('#hero');
  hero.classList.toggle('loesung', s.art === 'loesung');
  const es = s.art === 'energie' ? s.stufen[energieStufe] : null;
  $('#kicker').textContent = es ? `${s.kicker} · ${energieStufe + 1}/${s.stufen.length}` : (s.kicker || m.titel);
  $('#titel').textContent = es ? es.titel : s.titel;
  const unterzeile = es ? es.text : s.text;
  $('#intro').textContent = unterzeile || '';
  $('#intro').hidden = !unterzeile;
  $('#marken').replaceChildren(...(['finale', 'export'].includes(s.art) ? [] : markenFuer(m)));
  // Fußleiste: Hinweise
  const fn = $('#fussnote');
  const teile = [];
  if (vorherAn) teile.push(h('b', {}, 'Vorher: '), 'so sah die Stadt grau aus. ');
  else if (Object.entries(vorschau).some(([b, v]) => v !== Z.variante(b))) teile.push(h('b', {}, 'Vorschau – noch nicht übernommen. '));
  if (s.fussnote) teile.push(s.fussnote);
  fn.replaceChildren(...teile);   // Publikumsansicht: keine Bedienhinweise – „Gespeicherter Stand“ steht in der Regie (Taste I)
  // Bereiche je Schrittart
  const panel = $('#panel'), seite = $('#seite');
  panel.replaceChildren(); seite.replaceChildren();
  panel.hidden = true; seite.hidden = true;
  const wege = [];
  const reihe = h('div', { class: 'knopfreihe' });
  const tafelKeys = [...(s.tafeln || [])];
  // Calliope-Labor ersetzt in seiner Szene die 3D-Stadt; in allen anderen Szenen ist es aus
  const laborEl = $('#labor'), istLabor = s.art === 'labor';
  $('#szene').classList.toggle('labor-an', istLabor);
  laborEl.hidden = !istLabor;
  if (!istLabor && laborEl.firstChild) { laborStopp(); laborEl.replaceChildren(); }

  if (s.art === 'bild' && s.punkte) { seite.append(...seiteListe(s.seiteTitel || 'Stichpunkte', s.punkte)); seite.hidden = false; }
  if (s.art === 'bild' && s.link) {
    // eigenständiges Programm (z. B. Verkehrstool) in einem neuen Tab; der Konfigurator bleibt auf dieser Szene stehen.
    // Der Rückweg (Tab schließen) steht nur in der Regie, nicht auf der Leinwand.
    reihe.append(h('button', { type: 'button', class: 'haupt gross extern-link', onclick: () => window.open(s.link.href, '_blank') }, s.link.text + ' ↗'));
    panel.append(reihe); panel.hidden = false;
  }

  if (s.art === 'bilanz') {
    // Entscheidungen der Mission zusammen im Stadtbild – keine Umschalter, keine zweite Ampeldemonstration
    const kacheln = h('div', { class: 'bilanz', style: `--n:${s.ergebnis.length}` });
    for (const e of s.ergebnis) {
      const v = e.bereich === s.bereich ? (vorschau[e.bereich] || Z.beschluesse[e.bereich]) : Z.beschluesse[e.bereich];
      const vorschauNoch = e.bereich === s.bereich && vorschau[e.bereich] && vorschau[e.bereich] !== Z.beschluesse[e.bereich];
      kacheln.append(h('button', {
        type: 'button', class: `bilanz-kachel ${v ? (vorschauNoch ? 'vorschau' : 'ok') : 'offen'}`,
        title: `${KAMERAS[e.kamera].titel} zeigen`, onclick: () => kameraZeigen(e.kamera),
      }, h('span', { class: 'zeichen' }, v ? (vorschauNoch ? '…' : '✓') : '–'),
      h('span', { class: 'text' }, h('b', {}, e.titel), h('span', {}, v ? beschlussText(e.bereich, v) : e.offen || 'noch offen'))));
      // gewählte Zukunftsoption mit ihrer Tafel (Schwebebahn bzw. Flugtaxi)
      const ab = AUSWAHL_AB[e.bereich], o = v && ab && MISSIONEN[ab[0]].schritte[ab[1]].auswahl.optionen.find((x) => x.v === v);
      if (o && o.tafel) tafelKeys.push(o.tafel);
    }
    panel.append(kacheln);
    const fertig = Z.beschluesse[s.bereich] === s.variante;
    reihe.append(h('button', { type: 'button', onclick: () => kameraZeigen(s.kamera) }, 'Ganze Straße zeigen'),
      fertig ? h('span', { class: 'status-marke ok' }, `✓ Übernommen: ${beschlussText(s.bereich, s.variante)}`)
        : h('button', { type: 'button', class: 'haupt', title: 'Ergebnis der Verkehrssimulation in die Stadt übernehmen (Enter)', onclick: () => uebernehmen(s.bereich, s.variante) }, 'Busanmeldung in Stadt übernehmen'));
    panel.append(reihe); panel.hidden = false;
    tafelKeys.push('wohnstrasse', 'kreuzung');
  }

  if (s.auswahl) {
    // kompakter Auswahlbereich: zwei Karten, ein Klick wählt und speichert (Priorisierung – das andere bleibt eine Idee)
    const a = s.auswahl, b = a.bereich, gewaehlt = Z.beschluesse[b];
    const karten = h('div', { class: 'karten zwei auswahl', style: '--n:2' });
    for (const o of a.optionen) {
      const ist = gewaehlt === o.v;
      karten.append(h('button', {
        type: 'button', class: `karte ${ist ? 'beschluss' : ''}`, 'aria-pressed': String(ist), style: `--farbe:${BUCHSTABEN_FARBE[o.b]}`,
        title: `${o.titel} wählen (Taste ${o.b})`, onclick: () => auswahlSetzen(b, o.v),
      },
      kartenBild(b, o.v),
      h('span', { class: 'buchstabe' }, o.b),
      h('span', { class: 'stempel beschluss' }, '✓ Unsere Wahl'),
      h('div', { class: 'text' }, h('h2', {}, o.titel), h('p', { class: 'kurztext' }, o.text))));
    }
    panel.append(h('div', { class: 'auswahl-kopf' }, h('b', {}, a.frage), gewaehlt ? h('span', {}, a.hinweis) : null), karten);
    panel.hidden = false;
    const t = a.optionen.find((o) => o.v === Z.variante(b));
    if (t && t.tafel) tafelKeys.push(t.tafel);
  }

  if (s.art === 'energie') {
    const i = energieStufe, n = s.stufen.length;
    panel.append(h('div', { class: 'energie-stufen', style: `--n:${n}` }, ...s.stufen.map((st, k) => h('button', {
      type: 'button', class: `stufe-kachel s${k + 1}`, 'aria-pressed': String(k === i), 'aria-current': k === i ? 'step' : null, title: `Zustand ${k + 1}: ${st.kurz}`, onclick: () => energieSetzen(k),
    }, h('span', { class: 'n' }, String(k + 1)), h('span', { class: 'kurz' }, st.kurz)))));
    reihe.append(
      h('button', { type: 'button', disabled: i === 0 || null, onclick: () => zurueck() }, '← Zurück'),
      h('span', { class: 'luecke' }),   // Zustand steht schon in der Kopfzeile (1/4), „vereinfacht“ in der Fußnote
      h('button',{ type: 'button', class: 'haupt gross', onclick: () => weiter() }, i < n - 1 ? `Weiter: ${s.stufen[i + 1].kurz} →` : 'Weiter zur Mobilität →'));
    panel.append(reihe); panel.hidden = false;
    if (i >= 1) tafelKeys.push('e_solar', 'e_windrad');
    if (i >= 2) tafelKeys.push('e_speicher', 'e_netz');
  }

  if (s.art === 'wahl') {
    const b = s.bereich;
    const karten = h('div', { class: `karten ${s.optionen.length === 2 ? 'zwei' : 'drei'}`, style: `--n:${s.optionen.length}` });
    for (const o of s.optionen) {
      const beschluss = Z.beschluesse[b] === o.v;
      const aktiv = vorschau[b] ? vorschau[b] === o.v : beschluss;
      const k = h('button', {
        type: 'button', class: `karte ${beschluss ? 'beschluss' : ''} ${Z.mehrheit[m.id] === o.b ? 'mehrheit' : ''}`, 'aria-pressed': String(aktiv),
        style: `--farbe:${BUCHSTABEN_FARBE[o.b]}`, title: `Vorschau ${o.b} (Taste ${o.b})`, onclick: () => vorschauSetzen(b, o.v),
      },
      kartenBild(b, o.v),
      h('span', { class: 'buchstabe' }, o.b),
      h('span', { class: 'stempel vorschau' }, 'Vorschau'), h('span', { class: 'stempel beschluss' }, '✓ Übernommen'),
      h('div', { class: 'text' },
        h('h2', {}, o.titel),
        h('div', { class: 'handel' }, h('span', { class: 'z' }, '+'), h('span', {}, o.pro)),
        h('div', { class: 'handel contra' }, h('span', { class: 'z' }, '−'), h('span', {}, o.contra)),
        s.wohnwerte ? h('div', { class: 'wert' }, h('b', {}, `${wohnungen(o.v)} Wohnungen`), ` · bebaute Fläche im Modell: `, h('b', {}, `${bebauteFlaeche(o.v)} Felder`)) : null,
        s.wege && wegeGemessen ? h('div', { class: 'wert weg' }, 'Weg von unserem Haus: ', h('b', {}, `etwa ${meterText(o.v)}`)) : null,
      ));
      karten.append(k);
    }
    panel.append(karten);
    if (s.fragen) panel.append(h('div', { class: 'fragen' }, ...s.fragen.map((f) => h('span', {}, f))));
    if (s.tagNacht) reihe.append(tagNachtGruppe());
    if (s.wege) reihe.append(h('button', { type: 'button', onclick: () => { wegeGemessen = !wegeGemessen; anzeigen(); }, 'aria-pressed': String(wegeGemessen) }, wegeGemessen ? 'Längen ausblenden' : 'Wege messen'));
    if (s.denkimpuls) reihe.append(h('span', { class: 'status-marke' }, vorschau[b] ? 'Vorschau – Diskussionsbild, wird nicht gebaut' : 'Diskussionsbilder – gebaut wird die gemeinsame Lösung'));
    else {
      const v = vorschau[b];
      reihe.append(statusMarke(b));
      reihe.append(h('button', { type: 'button', class: 'haupt', disabled: !v || (v === Z.variante(b) && Z.beschluesse[b] === v) || null, onclick: () => uebernehmen(b, v), title: 'In die Stadt übernehmen (Enter)' }, 'In Stadt übernehmen'));
    }
    panel.append(reihe);
    panel.hidden = false;
    if (s.wege) {
      const v = vorschau[b] || Z.beschluesse[b];
      if (v) for (const w of alleWege(v)) wege.push({ punkte: w.punkte, farbe: BUCHSTABEN_FARBE[v], start: WEISS, breit: true });
      tafelKeys.push('hierWohnen', ...(v ? ladenTafeln(v) : ['ladenA', 'ladenB', 'ladenC']));
    }
  }

  if (s.art === 'loesung') {
    panel.append(h('div', { class: 'loesung-band' }, ...s.punkte.map((p) => h('span', {}, p))));
    const fertig = Z.beschluesse[s.bereich] === s.variante;
    reihe.append(fertig ? h('span', { class: 'hinweis' }, 'Der grüne Natur-Abenteuerspielplatz ist in unserer Stadt.') : h('span', { class: 'luecke' }));
    reihe.append(fertig ? h('span', { class: 'status-marke ok' }, '✓ Übernommen') : h('button', { type: 'button', class: 'haupt', title: 'In die Stadt übernehmen (Enter)', onclick: () => uebernehmen(s.bereich, s.variante) }, 'In Stadt übernehmen'));
    panel.append(reihe); panel.hidden = false;
  }

  if (s.art === 'regen') {
    seite.append(...seiteListe('Was passiert mit dem Regen?', s.punkte, 'Vereinfachtes Modell · Zeit gerafft · ohne Mengen'));
    seite.hidden = false;
    reihe.append(
      h('span', { class: 'gruppe' },
        h('button', { type: 'button', 'aria-pressed': String(regenModus === 'grau'), onclick: () => regenSetzen(regenAn, 'grau') }, 'Versiegelt (grau)'),
        h('button', { type: 'button', 'aria-pressed': String(regenModus === 'gruen'), onclick: () => regenSetzen(regenAn, 'gruen') }, 'Mit Grün')),
      h('button', { type: 'button', class: 'haupt', title: 'Taste R', onclick: () => regenSetzen(!regenAn) }, regenAn ? 'Regen stoppen' : 'Starkregen starten'),
      s.link ? h('button', { type: 'button', onclick: () => window.open(s.link.href, '_blank') }, s.link.text + ' ↗') : null,
    );
    panel.append(reihe); panel.hidden = false;
  }

  if (s.art === 'schalter') {
    const b = s.bereich, gezeigt = vorschau[b] || Z.variante(b);
    const knopf = (v, text) => h('button', { type: 'button', 'aria-pressed': String(gezeigt === v), onclick: () => vorschauSetzen(b, v) }, text);
    reihe.append(h('span', { class: 'gruppe' }, knopf(s.vorher, s.vorherText || 'Vorher'), knopf(s.nachher, s.nachherText || 'Nachher')));
    if (s.tagNacht) reihe.append(tagNachtGruppe());
    if (s.weitereKamera) reihe.append(h('button', { type: 'button', onclick: () => kameraZeigen(s.weitereKamera) }, KAMERAS[s.weitereKamera].titel + ' zeigen'), h('button', { type: 'button', onclick: () => kameraZeigen(s.kamera) }, KAMERAS[s.kamera].titel + ' zeigen'));
    reihe.append(statusMarke(b));
    const v = vorschau[b];
    if (v && v !== Z.variante(b)) reihe.append(h('button', { type: 'button', class: 'haupt', title: 'In die Stadt übernehmen (Enter)', onclick: () => uebernehmen(b, v) }, 'In Stadt übernehmen'));
    panel.append(reihe); panel.hidden = false;
    if (s.material) { seite.append(h('h2', {}, 'Material und Klima'), h('div', { class: 'material' }, ...s.material.map(([t, x]) => h('div', {}, h('b', {}, t), x)))); seite.hidden = false; }
  }

  if (s.art === 'extern') {
    if (s.kette) panel.append(h('div', { class: 'kette' }, ...s.kette.flatMap((t, i) => [i ? h('i', {}, '→') : null, h('span', {}, t)])));
    panel.append(h('div', { class: 'live' }, h('span', { class: 'punkt' }), h('div', {}, h('b', {}, 'Jetzt live'), h('span', {}, s.live)),
      s.link ? h('button', { type: 'button', class: 'haupt', onclick: () => window.open(s.link.href, '_blank') }, s.link.text + ' ↗') : h('span')));
    panel.hidden = false;
  }

  if (s.art === 'wege') {
    const liste = h('div', { class: 'wegliste gross' });
    for (const v of ['A', 'B', 'C']) {
      const w = weg(v);
      if (w) wege.push({ punkte: w, farbe: BUCHSTABEN_FARBE[v], start: WEISS, breit: true });
      liste.append(h('div', {}, h('i', { style: `background:${BUCHSTABEN_FARBE[v]}` }, v), h('span', {}, LADEN[v].titel), wegeGemessen ? h('b', { class: 'meter' }, meterText(v)) : null));
    }
    panel.append(liste);
    reihe.append(h('span', { class: 'hinweis' }, wegeGemessen ? 'Ungefähre Entfernungen im Stadtmodell' : 'Erst schätzen: Welcher Weg ist am kürzesten?'),
      h('button', { type: 'button', class: wegeGemessen ? '' : 'haupt', onclick: () => { wegeGemessen = !wegeGemessen; anzeigen(); } }, wegeGemessen ? 'Längen ausblenden' : 'Wege messen'));
    panel.append(reihe); panel.hidden = false;
  }

  if (s.art === 'finale') {
    seite.append(h('h2', {}, 'SMARTys Zukunftscheck'));
    const ul = h('ul');
    for (const mm of MISSIONEN.filter((x) => x.bereiche.length)) for (const b of mm.bereiche) {
      const v = Z.beschluesse[b], t = v ? beschlussText(b, v) : null;
      ul.append(h('li', { class: v ? '' : 'nein' }, h('span', { class: 'zeichen' }, v ? '✓' : '–'), h('span', {}, t || `${BEREICHE[b].titel}: nicht entschieden`, h('small', {}, mm.kurz + (Z.mehrheit[mm.id] ? ` · Abstimmung: Mehrheit ${Z.mehrheit[mm.id]}` : '')))));
    }
    seite.append(ul); seite.hidden = false;
    const st = rundgang.station >= 0 ? RUNDGANG[rundgang.station] : null;
    reihe.append(
      h('button', { type: 'button', 'aria-pressed': String(vorherAn), title: 'Taste V', onclick: () => { vorherAn = !vorherAn; anzeigen(); } }, vorherAn ? 'Nachher zeigen' : 'Vorher zeigen'),
      h('button', { type: 'button', onclick: () => station(Math.max(0, rundgang.station - 1)) }, '◀ Station'),
      h('button', { type: 'button', class: 'haupt', onclick: () => (rundgang.timer ? rundgangStopp() : rundgangStart()) }, rundgang.timer ? '■ Vorschau anhalten' : '▶ Vorschau-Rundgang'),
      h('button', { type: 'button', onclick: () => station(rundgang.station + 1) }, 'Station ▶'),
      st ? h('span', { class: 'hinweis' }, `Vorschau ${rundgang.station + 1}/${RUNDGANG.length}: ${st.text}`) : h('span', { class: 'luecke' }),
      h('button', { type: 'button', onclick: () => gehe(pos.mission, pos.schritt + 1) }, 'Weiter zur Minecraft-Welt →'),
    );
    panel.append(reihe); panel.hidden = false;
    if (st && st.mission === 'einkaufen' && Z.beschluesse.einkaufen) tafelKeys.push(...ladenTafeln(Z.beschluesse.einkaufen));
    if (st && st.tafel) tafelKeys.push(st.tafel);
    if (Z.beschluesse.einkaufen) wege.push({ punkte: weg(Z.beschluesse.einkaufen), farbe: BUCHSTABEN_FARBE[Z.beschluesse.einkaufen] });
  }

  if (s.art === 'export') exportZeichnen(panel, seite);

  if (istLabor) {
    if (s.kette) panel.append(h('div', { class: 'kette' }, ...s.kette.flatMap((t, i) => [i ? h('i', {}, '→') : null, h('span', {}, t)])));
    laborSicht = laborAnsicht(labor, { uhr, geaendert: () => { if (!$('#regie').hidden) regieZeichnen(); } });
    laborEl.replaceChildren(laborSicht.szene);
    panel.append(laborSicht.steuerung); panel.hidden = false;
    if (!laborTimer) laborTimer = setInterval(() => { if (laborSicht) laborSicht.aktualisieren(uhr()); }, 50);
  }

  // Tafeln, Wege, Hervorhebung
  tafelnSetzen(tafelKeys);
  ansicht.setzeWege(wege);
  const markiert = ['wahl', 'schalter', 'loesung'].includes(s.art) ? [s.bereich] : s.auswahl ? [s.auswahl.bereich] : s.art === 'bilanz' ? s.ergebnis.map((e) => e.bereich).filter((b) => Z.beschluesse[b] || vorschau[b]) : [];
  ansicht.setzeMarkierung(markiert);
  ansicht.setzeVersatz(0);
  // Seitenleiste ein/aus (nur wenn es eine gibt)
  const sk = $('[data-aktion="seite"]');
  sk.hidden = seite.hidden;
  sk.setAttribute('aria-pressed', String(!document.body.classList.contains('ohne-seite')));
  // Navigation
  $('#schrittInfo').textContent = `${m.kurz} · ${pos.schritt + 1}/${m.schritte.length}`;
  $('[data-aktion="vorher"]').setAttribute('aria-pressed', String(vorherAn));
  $('[data-aktion="vorher"]').textContent = vorherAn ? 'Nachher' : 'Vorher';
  $('[data-aktion="zurueck"]').disabled = pos.mission === 0 && pos.schritt === 0;
  $('[data-aktion="weiter"]').disabled = pos.mission === MISSIONEN.length - 1 && pos.schritt === m.schritte.length - 1;
  stadtAktualisieren();
  if (!$('#regie').hidden) regieZeichnen();
}

/* ---------- Finale: Minecraft-Welt erstellen ---------- */
const ERSATZWELT = 'START-IT-SMART_Ersatzwelt_Stadt-2050.mcworld';
function exportAktuell() { return exportStand && exportStand.beschluesse && JSON.stringify(exportStand.beschluesse) === JSON.stringify(Z.beschluesse); }
async function weltErstellen({ laden = !TEST } = {}) {
  exportStand = { laeuft: true };
  anzeigen();
  await new Promise((res) => setTimeout(res, 30));
  const beschl = { ...Z.beschluesse };              // nur übernommene Beschlüsse – keine Vorschau
  try {
    const t0 = performance.now(), ex = await stadtMcworld(beschl, new Date());
    const pruefung = await pruefeExport(ex.daten, beschl);
    exportStand = { name: ex.name, datei: ex.datei, groesse: ex.daten.length, ms: Math.round(performance.now() - t0), pruefung, beschluesse: beschl, daten: ex.daten };
    if (pruefung.ok && laden) herunterladen(ex.daten, ex.datei, 'application/octet-stream');
  } catch (e) {
    exportStand = { fehler: String((e && e.message) || e) };
  }
  anzeigen();
  return exportStand;
}
function exportZeichnen(panel, seite) {
  const n = Object.keys(Z.beschluesse).length, gesamt = BEREICH_IDS.length, x = exportStand, aktuell = exportAktuell();
  const stufe = (nr, titel, fertig, ...inhalt) => h('div', { class: `stufe ${fertig ? 'fertig' : ''}` }, h('h3', {}, h('span', { class: 'n' }, fertig ? '✓' : String(nr)), titel), ...inhalt);
  let ergebnis = null;
  if (x && x.laeuft) ergebnis = h('div', { class: 'ergebnis' }, 'Welt wird erstellt und geprüft …');
  else if (x && x.fehler) ergebnis = h('div', { class: 'ergebnis falsch' }, h('b', {}, 'Fehler – keine Datei erstellt: '), x.fehler, ' Für die Show die geprüfte Ersatzwelt verwenden.');
  else if (x && x.pruefung && !x.pruefung.ok) ergebnis = h('div', { class: 'ergebnis falsch' }, h('b', {}, 'Prüfung fehlgeschlagen – Datei wird nicht angeboten:'), h('ul', {}, ...x.pruefung.punkte.filter((q) => !q[1]).map((q) => h('li', {}, `${q[0]} ${q[2] || ''}`))), 'Für die Show die geprüfte Ersatzwelt verwenden.');
  else if (x && x.pruefung) ergebnis = h('div', { class: 'ergebnis' },
    h('b', {}, aktuell ? '✓ Welt erstellt und geprüft' : 'Welt erstellt – die Beschlüsse haben sich seitdem geändert, bitte neu erstellen'),
    h('button', { type: 'button', onclick: () => herunterladen(x.daten, x.datei, 'application/octet-stream') }, '⬇ Noch einmal herunterladen'));
  // Publikumsansicht: nur der Ablauf. Dateiname, Prüfdetails, Öffnen-Anleitung, Regieraum und Ersatzwelt stehen in der Regie (Taste I).
  panel.append(h('div', { class: 'ablauf' },
    stufe(1, 'Stadt fertig', n > 0, h('p', {}, `${n} von ${gesamt} Bauflächen übernommen. Nur übernommene Beschlüsse kommen in die Welt – offene Flächen bleiben grau.`)),
    stufe(2, 'Minecraft-Welt erstellen', aktuell && x.pruefung && x.pruefung.ok,
      h('button', { type: 'button', class: 'haupt', disabled: (x && x.laeuft) || null, onclick: () => weltErstellen() }, x && x.laeuft ? 'Wird erstellt …' : aktuell ? 'Neu erstellen' : '⬇ Minecraft-Welt erstellen'), ergebnis),
    stufe(3, 'In Minecraft Education öffnen', false),
  ));
  panel.hidden = false;
}
// Regie (Taste I) im Export-Schritt: Datei, Prüfung, Öffnen-Anleitung, Regieraum, Sicherheitsnetz
function exportRegie() {
  const x = exportStand, ok = x && x.pruefung;
  const name = x && x.name ? `„${x.name}“` : '„START IT SMART Stadt 2050 · Datum Uhrzeit“';
  return [
    ok ? [h('h3', {}, 'Erstellte Welt'), h('ul', {}, h('li', {}, `Datei: ${x.datei} (${Math.max(1, Math.round(x.groesse / 1024))} KB) im Download-Ordner`), h('li', {}, `Name in Minecraft: „${x.name}“`),
      h('li', {}, `Geprüft: Start draußen am Platz, Kreativmodus, ${x.pruefung.punkte.length - 4} Bauflächen Block für Block wie beschlossen`))] : null,
    h('h3', {}, 'So öffnet ihr die Welt'),
    h('ol', { class: 'anleitung' },
      h('li', {}, 'Die Datei im Download-Ordner doppelklicken. Minecraft Education importiert die Welt. (Oder in Minecraft Education: Spielen › Importieren.)'),
      h('li', {}, `In der Weltenliste ${name} öffnen – Datum und Uhrzeit zeigen die neueste Datei.`),
      h('li', {}, `Ihr startet draußen am ${START.titel}, Blick über den grünen Platz. Fliegen: zweimal Leertaste.`),
      h('li', {}, 'Nach wenigen Sekunden erscheinen von selbst Bewohner, Kinder, Verkaufspersonal und Tiere (einmal, sobald die ganze Stadt geladen ist). Falls nicht: im Regieraum der Knopf im Boden beim Schild „FIGUREN“.'),
      h('li', {}, 'Regieraum mit ', h('code', {}, ALLGEMEIN.regieraum), ', zurück zum Start mit ', h('code', {}, `/tp @s ${START.stand.join(' ')}`), '.')),
    h('p', {}, h('b', {}, 'Sicherheitsnetz: '), 'Bei der Probe eine Welt erstellen, in Minecraft Education öffnen und prüfen – diese Datei für die Show bereithalten. Vorbereitet: ',
      h('a', { href: ERSATZWELT, download: ERSATZWELT }, 'Ersatzwelt mit typischen Beschlüssen'), ' (ebenfalls vorher prüfen).'),
    h('p', {}, 'Bauaufträge von Hand (nur für Änderungen in einer schon geöffneten Welt): Knopf „⛏ Minecraft (M)“ unten.'),
  ];
}
function tagNachtGruppe() {
  return h('span', { class: 'gruppe' },
    h('button', { type: 'button', 'aria-pressed': String(!nacht), onclick: () => { nachtSetzen(false); anzeigen(); } }, '☀ Tag'),
    h('button', { type: 'button', 'aria-pressed': String(nacht), onclick: () => { nachtSetzen(true); anzeigen(); } }, '☾ Nacht'));
}

/* ---------- Gebäudetafeln ---------- */
let tafelEls = [];
function tafelnSetzen(keys) {
  const box = $('#tafeln');
  tafelEls = keys.filter((k) => TAFELN_ALLE[k]).map((k) => {
    const t = TAFELN_ALLE[k];
    let el;
    if (t.ziel && !t.name) el = h('div', { class: 'tafel ziel', style: `background:${BUCHSTABEN_FARBE[t.buchstabe]}`, title: t.titel || null }, t.buchstabe);
    else if (t.ziel) el = h('div', { class: 'tafel ziel mitname', style: `background:${BUCHSTABEN_FARBE[t.buchstabe]}` }, h('span', { class: 'b' }, t.buchstabe), t.text);
    else el = h('div', { class: `tafel ${t.gross ? 'gross' : ''}` }, t.buchstabe ? h('span', { class: 'b', style: `background:${BUCHSTABEN_FARBE[t.buchstabe]}` }, t.buchstabe) : null, t.text);
    return { el, pos: t.pos };
  });
  box.replaceChildren(...tafelEls.map((t) => t.el));
  positionieren();
}
function positionieren() {
  for (const t of tafelEls) {
    const p = ansicht.projiziere(...t.pos);
    t.el.style.left = `${p.x}px`; t.el.style.top = `${p.y}px`;
    t.el.style.visibility = p.sichtbar ? 'visible' : 'hidden';
  }
}

/* ---------- Rundgang (Finale) ---------- */
function station(i) {
  if (i < 0) i = 0;
  if (i >= RUNDGANG.length) { rundgangStopp(); i = RUNDGANG.length - 1; }
  rundgang.station = i;
  const st = RUNDGANG[i];
  nachtSetzen(!!st.nacht && Z.beschluesse.laternen === 'sensor');
  anzeigen();
  kameraZeigen(st.kamera);
}
function rundgangStart() {
  rundgangStopp();
  station(rundgang.station < 0 || rundgang.station >= RUNDGANG.length - 1 ? 0 : rundgang.station + 1);
  rundgang.timer = setInterval(() => { if (rundgang.station >= RUNDGANG.length - 1) { rundgangStopp(); anzeigen(); } else station(rundgang.station + 1); }, 6000);   // endet an der letzten Station; „Weiter“ führt dann zur Minecraft-Welt
  anzeigen();
}
function rundgangStopp() { if (rundgang.timer) clearInterval(rundgang.timer); rundgang.timer = null; }

/* ---------- Regie ---------- */
function regieZeichnen() {
  const m = mission(), s = schritt(), r = $('#regie');
  const smarty = (s.smarty || []).map(([t, k]) => h('li', {}, t, ' – ', k === '–' ? h('i', {}, 'noch nicht im Soundboard') : h('span', {}, 'Soundboard-Taste ', h('kbd', {}, k))));
  const tabelle = h('table', {}, ...BEREICH_IDS.map((b) => {
    const v = Z.variante(b), bf = befehle(b, v);
    return h('tr', {}, h('td', {}, BEREICHE[b].titel), h('td', {}, Z.beschluesse[b] ? h('b', {}, beschlussText(b, v) || v) : h('span', { style: 'color:#6b7f7d' }, 'grau / Ausgang')), h('td', {}, bf ? h('code', { style: 'font-size:1.4cqh' }, bf.bauen) : null));
  }));
  const mehrheit = m.schritte.some((x) => x.art === 'wahl') ? h('div', { class: 'reihe' }, 'Mehrheit merken:', ...['A', 'B', 'C'].slice(0, (m.schritte.find((x) => x.art === 'wahl').optionen || []).length).map((b) =>
    h('button', { type: 'button', 'aria-pressed': String(Z.mehrheit[m.id] === b), onclick: () => { Z.merkeMehrheit(m.id, Z.mehrheit[m.id] === b ? null : b); anzeigen(); } }, b))) : null;
  r.replaceChildren(...[    // flach und ohne null: replaceChildren würde Listen als „[object …]“ und null als „null“ schreiben
    h('h2', {}, m.titel), h('div', { class: 'mono', style: 'font-size:1.4cqh;color:#44666c' }, `Typ: ${m.typ}`),
    h('h3', {}, 'Drehbuch-Stichworte'), h('ul', {}, ...(s.regie || ['—']).map((x) => h('li', {}, x))),
    s.art === 'export' ? exportRegie() : null,
    s.art === 'labor' ? [h('h3', {}, 'Calliope-Labor'), h('p', { class: 'stand' }, `Programm: ${labor.stufe} von 4 Blöcken · Versuch ${labor.modus}${labor.verbessert ? '' : ' (Zeitblock noch nicht ergänzt)'} · ${labor.sekunden} Sekunden`),
      h('div', { class: 'reihe' }, h('button', { type: 'button', onclick: () => { labor.neu(uhr()); anzeigen(); } }, 'Programm neu aufbauen'))] : null,
    smarty.length ? [h('h3', {}, 'SMARTy (Soundboard, extern)'), h('ul', {}, ...smarty)] : null,
    mehrheit,
    h('h3', {}, 'Beschlüsse und Minecraft-Befehl der aktuellen Variante'),
    h('p', { class: 'stand' }, `Gespeicherter Stand: ${Object.keys(Z.beschluesse).length} von ${BEREICH_IDS.length} Beschlüssen – „Neu beginnen …“ setzt für eine neue Vorlesung alles zurück.`),
    tabelle,
    h('div', { class: 'reihe' },
      h('button', { type: 'button', onclick: () => bauauftragOeffnen() }, '⛏ Minecraft (M)'),
      h('button', { type: 'button', onclick: () => resetMission() }, 'Mission zurücksetzen'),
      h('button', { type: 'button', onclick: () => $('#neu').showModal() }, 'Neu beginnen …')),
    h('h3', {}, 'Tasten'),
    h('div', { class: 'tasten' }, ...[['0–7', 'Szene/Mission'], ['← →', 'Schritt / Energiecheck-Zustand'], ['A B C', 'Vorschau / Auswahl / Labor-Versuch'], ['Enter', 'In Stadt übernehmen / Labor: nächster Block'], ['V', 'Vorher/Nachher'], ['G', 'Gesamtansicht'], ['S', 'Zur Szene'], ['N', 'Tag/Nacht'], ['R', 'Regen'], ['M', 'Minecraft'], ['H', 'Bedienung aus/an'], ['I', 'Regie'], ['F', 'Vollbild'], ['Esc', 'Vorschau weg']].map(([k, t]) => h('div', {}, h('kbd', {}, k), ' ', t))),
    h('h3', {}, 'Verlauf'), h('ul', {}, ...Z.verlauf.slice(-8).reverse().map(([t, x]) => h('li', {}, `${t} ${x}`))),
  ].flat(2).filter((x) => x != null));
}

/* ---------- Minecraft-Bauauftrag ---------- */
function kopieren(text, knopf) {
  const fertig = () => { const alt = knopf.textContent; knopf.textContent = 'kopiert'; setTimeout(() => (knopf.textContent = alt), 1200); };
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(fertig, () => { prompt('Kopieren:', text); });
  else prompt('Kopieren:', text);
}
function befehlZeile(name, text) {
  const k = h('button', { type: 'button' }, 'Kopieren');
  k.addEventListener('click', () => kopieren(text, k));
  return h('div', { class: 'befehl' }, h('small', {}, name), h('code', {}, text), k);
}
function bauauftragOeffnen() {
  const m = mission(), inhalt = $('#bauInhalt');
  const bereiche = m.bereiche.length ? m.bereiche : BEREICH_IDS;
  $('#bauTitel').textContent = m.bereiche.length ? `Bauauftrag · ${m.kurz}` : 'Bauaufträge · ganze Stadt';
  inhalt.replaceChildren(
    h('div', { class: 'auftrag' }, h('h3', {}, 'Einmal vor der Vorlesung'),
      h('p', {}, `Nur nötig, wenn ihr in einer schon geöffneten Welt etwas von Hand ändern wollt. Für die Show im Finale „Minecraft-Welt erstellen“ – sie enthält alle Beschlüsse.`),
      befehlZeile('Einrichten', ALLGEMEIN.ticking), befehlZeile('Regieraum', ALLGEMEIN.regieraum), befehlZeile('Ruhig', ALLGEMEIN.ruhe)),
    ...bereiche.map((b) => {
      const box = h('div', { class: 'auftrag' });
      const aktuell = Z.variante(b), sb = befehle(b, BEREICHE[b].mc[0]);
      box.append(h('h3', {}, BEREICHE[b].titel, Z.beschluesse[b] ? h('span', { class: 'marke2' }, `Beschluss: ${beschlussText(b, aktuell) || aktuell}`) : null),
        h('p', {}, `Baufläche ${sb.flaeche} · ${sb.bloecke.toLocaleString('de-DE')} Blöcke · Ansicht: `, h('code', {}, tp(KAMERA_ZU_BEREICH[b] || 'gesamt'))));
      const liste = h('div', { class: 'varianten' });
      for (const v of BEREICHE[b].mc) {
        const bf = befehle(b, v);
        liste.append(h('div', { class: `variante-zeile ${v === aktuell ? 'aktiv' : ''}` },
          h('b', {}, (beschlussText(b, v) || (v === grund(b) ? 'Ausgangszustand (grau)' : v)) + (v === aktuell ? ' – aktueller Stand' : '')),
          h('p', {}, `Vorlage in der Kammer ${bf.kammer}`),
          befehlZeile('Bauen', bf.bauen), befehlZeile('Prüfen', bf.pruefen)));
      }
      if (b === 'spielplatz') liste.append(h('p', {}, 'Die Diskussionsbilder A und B gibt es nur im Browser – in Minecraft wird nur die gemeinsame Lösung gebaut.'));
      if (BEREICHE[b].mcFest) liste.append(h('p', {}, 'In der Minecraft-Welt stehen immer Schwebebahn UND Flugtaxi – unabhängig von der Abstimmung im Konfigurator.'));
      box.append(liste);
      return box;
    }),
    h('div', { class: 'auftrag' }, h('h3', {}, 'Tag und Nacht (Laternen)'), befehlZeile('Tag', ALLGEMEIN.tag), befehlZeile('Nacht', ALLGEMEIN.nacht)),
  );
  $('#bauStatus').textContent = '';
  $('#bauauftrag').showModal();
}
const KAMERA_ZU_BEREICH = { spielplatz: 'platz', laternen: 'laternen', parken: 'wohnstrasse', kreuzung: 'kreuzung', zukunft: 'zukunft', wohnen: 'wohnen', aufstocken: 'aufstocken', einkaufen: 'einkaufen', bildung: 'bildung' };
function herunterladen(daten, name, typ) {
  const url = URL.createObjectURL(new Blob([daten], { type: typ }));
  const a = h('a', { href: url, download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* ---------- Tasten und Knöpfe ---------- */
function aktion(a) {
  if (a === 'gesamt') kameraZeigen('gesamt');
  else if (a === 'szene') kameraZeigen(schritt().kamera);
  else if (a === 'nacht') { nachtSetzen(!nacht); anzeigen(); }
  else if (a === 'minecraft') bauauftragOeffnen();
  else if (a === 'regie') { const r = $('#regie'); r.hidden = !r.hidden; $('[data-aktion="regie"]').setAttribute('aria-pressed', String(!r.hidden)); if (!r.hidden) regieZeichnen(); }
  else if (a === 'vollbild') { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.().catch(() => {}); }
  else if (a === 'vorher') { vorherAn = !vorherAn; anzeigen(); }
  else if (a === 'seite') { document.body.classList.toggle('ohne-seite'); anzeigen(); }
  else if (a === 'reset') resetMission();
  else if (a === 'zurueck') zurueck();
  else if (a === 'weiter') weiter();
}
function tasten(e) {
  const ziel = e.target instanceof Element ? e.target : null;
  if (ziel?.closest('dialog') || ziel?.closest('input, select, textarea') || e.ctrlKey || e.metaKey || e.altKey) return;   // Regler/Auswahl im Labor behalten ihre Tasten
  const s = schritt(), k = e.key;
  if (/^[0-7]$/.test(k)) { gehe(Number(k), 0); e.preventDefault(); return; }
  const map = { ArrowRight: 'weiter', PageDown: 'weiter', ' ': 'weiter', ArrowLeft: 'zurueck', PageUp: 'zurueck', g: 'gesamt', s: 'szene', n: 'nacht', m: 'minecraft', i: 'regie', f: 'vollbild', v: 'vorher' };
  const lk = k.length === 1 ? k.toLowerCase() : k;
  if (map[lk]) { aktion(map[lk]); e.preventDefault(); return; }
  if (s.art === 'wahl' && /^[abc]$/i.test(k)) { const o = s.optionen.find((x) => x.b === k.toUpperCase()); if (o) vorschauSetzen(s.bereich, o.v); e.preventDefault(); return; }
  if (s.auswahl && /^[ab]$/i.test(k)) { const o = s.auswahl.optionen.find((x) => x.b === k.toUpperCase()); if (o) auswahlSetzen(s.auswahl.bereich, o.v); e.preventDefault(); return; }
  if (s.art === 'labor' && laborSicht) {
    if (k === 'Enter') { laborSicht.blockErgaenzen(); e.preventDefault(); return; }
    if (/^[ab]$/i.test(k)) { if (labor.fertig) laborSicht.modus(k.toUpperCase()); e.preventDefault(); return; }
  }
  if (k === 'Enter') {
    if (s.art === 'wahl' && !s.denkimpuls && vorschau[s.bereich]) uebernehmen(s.bereich, vorschau[s.bereich]);
    else if (s.art === 'loesung' || s.art === 'bilanz') uebernehmen(s.bereich, s.variante);
    else if (s.art === 'schalter' && vorschau[s.bereich]) uebernehmen(s.bereich, vorschau[s.bereich]);
    e.preventDefault(); return;
  }
  if (lk === 'r' && s.art === 'regen') { regenSetzen(!regenAn); e.preventDefault(); return; }
  if (lk === 'h') { document.body.classList.toggle('ohne-bedienung'); if (KAMERAS[kameraKey]?.rahmen) kameraZeigen(kameraKey); e.preventDefault(); return; }
  if (k === 'Escape') { if (Object.keys(vorschau).length && s.art !== 'loesung' && s.art !== 'regen' && s.art !== 'bilanz') { vorschau = {}; anzeigen(); } }
}

/* ---------- Start ---------- */
async function start() {
  if (!webglMoeglich()) {
    $('#laden').hidden = true;
    const f = $('#fehler'); f.hidden = false;
    f.replaceChildren(h('div', {}, h('b', {}, 'Dieser Browser kann keine 3D-Grafik (WebGL) anzeigen.'), h('span', {}, 'Bitte einen aktuellen Chrome, Edge oder Firefox verwenden.')));
    return;
  }
  // Ladehinweis zuerst zeichnen (Rückfall nach 300 ms: Hintergrund-Tabs liefern kein requestAnimationFrame)
  await new Promise((r) => { requestAnimationFrame(() => setTimeout(r, 30)); setTimeout(r, 300); });
  ansicht = new Ansicht($('#welt'));
  ansicht.nachBild = positionieren;
  const zustand = Z.alle();
  welt = stadtFuer(zustand);
  Object.assign(angezeigt, zustand);
  ansicht.setzeStadt(welt, zustand);
  pos = { ...Z.position };
  if (!MISSIONEN[pos.mission] || !MISSIONEN[pos.mission].schritte[pos.schritt]) pos = { mission: 0, schritt: 0 };
  const st = MISSIONEN[pos.mission].schritte[pos.schritt];
  gehe(pos.mission, pos.schritt, { kamera: false });
  kameraZeigen(st.kamera, true);
  // Fenstergröße oder Bedienung (Taste H) geändert: Rahmen-Kamera neu einpassen
  ansicht.nachResize = () => { if (kameraKey && KAMERAS[kameraKey]?.rahmen && !ansicht.flug) ansicht.kamera(kameraFuer(kameraKey), true); };
  document.querySelectorAll('[data-aktion]').forEach((b) => b.addEventListener('click', () => aktion(b.dataset.aktion)));
  document.addEventListener('keydown', tasten);
  document.querySelectorAll('dialog .schliessen').forEach((b) => b.addEventListener('click', () => b.closest('dialog').close()));
  $('#neuJa').addEventListener('click', () => { $('#neu').close(); neuBeginnen(); });
  $('#textLaden').addEventListener('click', () => herunterladen(alleBauauftraege(), 'START-IT-SMART_Bauauftraege.txt', 'text/plain;charset=utf-8'));
  $('#mcworldLaden').addEventListener('click', async () => {
    const st2 = $('#bauStatus');
    st2.textContent = 'Welt wird erstellt und geprüft …';
    const x = await weltErstellen();
    st2.textContent = x.fehler ? `Fehler: ${x.fehler}` : !x.pruefung.ok ? 'Prüfung fehlgeschlagen – Details im Finale (Schritt „Minecraft-Welt“).' : `Fertig und geprüft: ${x.datei} (${Math.round(x.groesse / 1024)} KB). Doppelklick öffnet sie in Minecraft Education.`;
  });
  $('#laden').classList.add('weg');
  setTimeout(() => ($('#laden').hidden = true), 450);
  // Vorschaubilder im Leerlauf vorbereiten (Karten erscheinen dann sofort)
  const vorbereiten = [];
  for (const m of MISSIONEN) for (const s of m.schritte) {
    if (s.art === 'wahl' && s.bereich !== 'laternen') for (const o of s.optionen) vorbereiten.push([s.bereich, o.v]);
    if (s.auswahl) for (const o of s.auswahl.optionen) vorbereiten.unshift([s.auswahl.bereich, o.v]);
  }
  const naechstes = () => { const x = vorbereiten.shift(); if (!x) return; bildFuer(...x); setTimeout(naechstes, 60); };
  setTimeout(naechstes, 800);
  window.__stadt = { Z, ansicht: () => ansicht, welt: () => welt, gehe, weiter, zurueck, uebernehmen, vorschauSetzen, sollStand, angezeigt, pos: () => ({ ...pos }), vorschau: () => ({ ...vorschau }), nachtSetzen, neuBeginnen, resetMission, aktion, wegLaenge, alleWege, station, tafeln: () => tafelEls.map((t) => t.el.textContent), weltErstellen, exportStand: () => exportStand, sollStand, kameraKey: () => kameraKey, energieSetzen, energieStufe: () => energieStufe, auswahlSetzen, labor, laborLaeuft: () => !!laborTimer };
  window.__stadtOk = true;
}
start().catch((e) => {
  console.error(e);
  const f = $('#fehler'); f.hidden = false;
  f.replaceChildren(h('div', {}, h('b', {}, 'Die Stadt konnte nicht gebaut werden.'), h('span', {}, String(e && e.message || e))));
  $('#laden').hidden = true;
  window.__stadtFehler = String(e && e.stack || e);
});
