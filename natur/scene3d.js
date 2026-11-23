/* 3D-Szene in Blockgrafik (Three.js, eigene schlichte Farben, feste isometrische Kamera) – Sensorlabor Regenwasser.
 * Wiederverwendet aus der früheren Natur-Simulation: grüner Spielplatz als Modell-Ausschnitt mit Bodenschnitt, Straßenplatte,
 * graue Hochhäuser, Regen, Versickern im Bodenschnitt, Füllstände von Regenmulde und Zisterne, Kinder.
 * Neu: Wasserstandsensor an der Zisterne, Bodenfeuchtesensor im Rasen, Zulauf Mulde → Zisterne, blaue Bewässerungsleitungen
 * (auch im Bodenschnitt), Rasenfarbe nach Bodenfeuchte. Alles wird einmal gebaut und danach nur gesetzt; feste Teilchenzahlen. */
import * as THREE from '../lib/three.module.min.js';
import { VORLAGE, GROESSE, GRUEN_TEILE, B, sichtbareBloecke, blockFarbe, rasenFelder } from './model.js';

export function webglMoeglich() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

// Vorlagen-Koordinaten (Block x, y, z) → Welt: Platz mittig, Oberfläche des Platzes bei y = 0
const OX = -GROESSE.dx / 2, OY = -(B + 1), OZ = -GROESSE.dz / 2;
const p = (x, y, z) => new THREE.Vector3(x + OX, y + OY, z + OZ);
const HIMMEL = new THREE.Color('#cfe8f6'), HIMMEL_REGEN = new THREE.Color('#8494a6'), HIMMEL_SONNE = new THREE.Color('#e3f1fb');
// zur Sonne hin: Süd-Südwest, hoch – die Hochhäuser im Norden und Westen werfen keinen Schatten auf den Platz
const SONNE = (() => { const v = [-0.3, 1.1, 0.62], l = Math.hypot(...v); return v.map((k) => k / l); })();

/* ---------- Texturen und Materialien ---------- */
function leinwand(w, h, malen) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  malen(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
// eine neutrale Kachel: hell mit leichtem Rand – wird je Block eingefärbt (eigene Gestaltung, keine Spieltexturen)
const KACHEL = leinwand(32, 32, (g) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 32, 32);
  g.fillStyle = 'rgba(0,0,0,.05)';
  for (let k = 0; k < 18; k++) g.fillRect((k * 13) % 30, (k * 7) % 30, 3, 3);
  g.strokeStyle = 'rgba(0,0,0,.16)'; g.lineWidth = 2; g.strokeRect(1, 1, 30, 30);
});
KACHEL.magFilter = THREE.NearestFilter;
const FASSADE = leinwand(64, 64, (g) => {
  g.fillStyle = '#c3c7cc'; g.fillRect(0, 0, 64, 64);
  for (let y = 6; y < 64; y += 16) for (let x = 6; x < 64; x += 16) { g.fillStyle = '#7f9cb0'; g.fillRect(x, y, 10, 8); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x, y, 10, 2); }
});
FASSADE.wrapS = FASSADE.wrapT = THREE.RepeatWrapping;

const M = {
  opak: new THREE.MeshLambertMaterial({ map: KACHEL }),
  laub: new THREE.MeshLambertMaterial({ map: KACHEL }),
  glas: new THREE.MeshLambertMaterial({ color: '#bfe6ff', transparent: true, opacity: 0.38, depthWrite: false }),
  wasser: new THREE.MeshLambertMaterial({ color: '#2f80d8', transparent: true, opacity: 0.62, depthWrite: false }),
  tropfen: new THREE.MeshBasicMaterial({ color: '#2563eb' }),
  versickern: new THREE.MeshBasicMaterial({ color: '#60a5fa' }),
  regen: new THREE.LineBasicMaterial({ color: '#dbeafe', transparent: true, opacity: 0.6 }),
  feuchte: new THREE.MeshBasicMaterial({ color: '#d9b44a', transparent: true, opacity: 0, depthWrite: false }),
  leitung: new THREE.MeshLambertMaterial({ color: '#93c5fd', transparent: true, opacity: 0.75, depthWrite: false }),
  leitungSchnitt: new THREE.MeshLambertMaterial({ color: '#3b82f6' }),
  sensor: new THREE.MeshLambertMaterial({ color: '#e5e7eb' }),
  pfosten: new THREE.MeshLambertMaterial({ color: '#334155' }),
  anzeigeWasser: new THREE.MeshBasicMaterial({ color: '#2f8fd8' }),
  anzeigeBoden: new THREE.MeshBasicMaterial({ color: '#f2c14e' }),
};
const farbMat = new Map();
const mat = (farbe) => { if (!farbMat.has(farbe)) farbMat.set(farbe, new THREE.MeshLambertMaterial({ color: farbe })); return farbMat.get(farbe); };

const GEO = {
  voll: new THREE.BoxGeometry(1, 1, 1),
  // diese drei stehen mit der Unterkante auf y = 0
  halb: new THREE.BoxGeometry(1, 0.5, 1).translate(0, 0.25, 0),
  klein: new THREE.BoxGeometry(0.42, 0.5, 0.42).translate(0, 0.25, 0),
  pflanze: new THREE.BoxGeometry(0.34, 0.5, 0.34).translate(0, 0.25, 0),
  duenn: new THREE.BoxGeometry(0.14, 1, 0.14),
  glas: new THREE.BoxGeometry(1, 1, 1),
  tropfen: new THREE.BoxGeometry(0.34, 0.12, 0.34),
  punkt: new THREE.BoxGeometry(0.22, 0.22, 0.06),
  feld: new THREE.BoxGeometry(0.98, 0.04, 0.98),
};

// wiederverwendete Hilfsobjekte: pro Bild entsteht kein neuer Speicher
const T = {
  m4: new THREE.Matrix4(), q: new THREE.Quaternion(), v: new THREE.Vector3(), s: new THREE.Vector3(),
  qOst: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2),
};

// Viele einfarbige Quader zu EINEM Objekt zusammenfassen: ein Zeichenaufruf statt vieler
function quaderVerbund(liste, material = null) {      // Einträge: [x1, y1, z1, x2, y2, z2, farbe]
  const pos = [], nor = [], col = [], idx = [], c = new THREE.Color();
  for (const [x1, y1, z1, x2, y2, z2, farbe] of liste) {
    const g = new THREE.BoxGeometry(x2 - x1, y2 - y1, z2 - z1).translate((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);
    const basis = pos.length / 3;
    pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array);
    c.set(farbe || '#ffffff');
    for (let k = 0; k < g.attributes.position.count; k++) col.push(c.r, c.g, c.b);
    for (const i of g.index.array) idx.push(basis + i);
    g.dispose();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  const m = new THREE.Mesh(geo, material || new THREE.MeshLambertMaterial({ vertexColors: true }));
  m.receiveShadow = true;
  return m;
}

// Fensterfassaden aller Hochhäuser als ein Objekt
function fassadenVerbund(haeuser) {    // Einträge: [xa, za, xb, zb, hoehe] in Weltkoordinaten
  const pos = [], nor = [], uv = [], idx = [], e = 0.02;
  const rechteck = (ecken, n, u, v) => {
    const b = pos.length / 3;
    for (const q of ecken) { pos.push(...q); nor.push(...n); }
    uv.push(0, 0, u, 0, u, v, 0, v);
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  };
  for (const [xa, za, xb, zb, h] of haeuser) {
    const bx = (xb - xa) / 4, bz = (zb - za) / 4, bh = h / 4;
    rechteck([[xa, 0, zb + e], [xb, 0, zb + e], [xb, h, zb + e], [xa, h, zb + e]], [0, 0, 1], bx, bh);
    rechteck([[xb, 0, za - e], [xa, 0, za - e], [xa, h, za - e], [xb, h, za - e]], [0, 0, -1], bx, bh);
    rechteck([[xb + e, 0, zb], [xb + e, 0, za], [xb + e, h, za], [xb + e, h, zb]], [1, 0, 0], bz, bh);
    rechteck([[xa - e, 0, za], [xa - e, 0, zb], [xa - e, h, zb], [xa - e, h, za]], [-1, 0, 0], bz, bh);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: FASSADE }));
  m.receiveShadow = true;
  return m;
}

const zufall = (x, y, z) => { const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453; return s - Math.floor(s); };
function blockFarbeVariiert(id, x, y, z, laub) {
  const c = new THREE.Color(blockFarbe(id) || '#888888'), r = zufall(x, y, z);
  return c.offsetHSL(0, 0, (r - 0.5) * (laub ? 0.12 : 0.06));
}

/* Der grüne Platz als wenige Instanz-Objekte (je Blockform und Höhe eines) */
function platzObjekte(vorlage) {
  const liste = sichtbareBloecke(vorlage), g = new THREE.Group();
  const art = (b) => (b.form === 'voll' ? (b.laub ? 'laub' : 'voll') : b.form);
  const gruppiert = new Map();
  for (const b of liste) { const k = art(b); if (!gruppiert.has(k)) gruppiert.set(k, []); gruppiert.get(k).push(b); }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3();
  for (const [a, bl] of gruppiert) {
    const geo = a === 'laub' ? GEO.voll : GEO[a], material = a === 'laub' ? M.laub : a === 'glas' ? M.glas : M.opak;
    const im = new THREE.InstancedMesh(geo, material, bl.length);
    bl.forEach((b, n) => {
      const pfl = a === 'pflanze', unten = a === 'halb' || a === 'klein' || pfl;
      v.set(b.x + 0.5 + OX, b.y + OY + (unten ? 0 : 0.5), b.z + 0.5 + OZ);
      s.setScalar(pfl ? 0.8 + zufall(b.x, b.y, b.z) * 0.5 : 1);
      im.setMatrixAt(n, m4.compose(v, q, s));
      if (a !== 'glas') im.setColorAt(n, blockFarbeVariiert(b.id, b.x, b.y, b.z, a === 'laub'));
    });
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.castShadow = a === 'voll' || a === 'laub' || a === 'halb';
    im.receiveShadow = true;
    g.add(im);
  }
  return g;
}

/* Figuren: schlichte Block-Kinder */
function kind(hemd, hose = '#334155') {
  const g = new THREE.Group();
  const teil = (w, h, d, f, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(f)); m.position.y = y; m.castShadow = true; g.add(m); return m; };
  teil(0.42, 0.55, 0.26, hose, 0.28);
  teil(0.5, 0.6, 0.3, hemd, 0.85);
  teil(0.42, 0.42, 0.42, '#f1c7a5', 1.37);
  teil(0.44, 0.12, 0.44, '#5b3a22', 1.62);
  return g;
}

// Linienzug in Vorlagen-Koordinaten → Punkte in Welt-Koordinaten mit Längen (für wandernde Tropfen)
function zug(punkte) {
  const pts = punkte.map(([x, y, z]) => p(x, y, z)), lang = [0];
  for (let k = 1; k < pts.length; k++) lang.push(lang[k - 1] + pts[k].distanceTo(pts[k - 1]));
  return { pts, lang, summe: lang.at(-1) };
}
function aufZug(w, s, v) {
  let k = 1; while (k < w.lang.length - 1 && w.lang[k] < s) k++;
  const f = (s - w.lang[k - 1]) / Math.max(1e-6, w.lang[k] - w.lang[k - 1]);
  return v.copy(w.pts[k - 1]).lerp(w.pts[k], Math.min(1, Math.max(0, f)));
}

/* Leitungen (Vorlagen-Koordinaten). Oberfläche des Rasens: y = B + 1. Zisterne [23, 13, 28, 18], Mulde [2, 13, 8, 21]. */
const YO = B + 1 + 0.06;                     // knapp über dem Rasen (wie „durch den Boden gesehen“)
const ZULAUF = [[5.5, YO, 21.5], [5.5, YO, 23.4], [25.5, YO, 23.4], [25.5, YO, 19.2]];
const BEWAESSERUNG = [
  [[27.6, YO, 19.2], [27.6, YO, 30.5], [2.5, YO, 30.5]],          // Hauptleitung: Zisterne → Süden → Westen
  [[27.6, YO, 22.5], [29.5, YO, 22.5]],                            // zum Baum rechts
  [[27.6, YO, 28.4], [25.5, YO, 28.4]],                            // zum Baum hinten rechts
  [[12.5, YO, 30.5], [12.5, YO, 27.5]],                            // zum Baum Mitte
  [[4.5, YO, 30.5], [4.5, YO, 27.5]],                              // zum Baum links
];
const SCHNITT_SUED = [[3, B - 0.6, GROESSE.dz + 0.08], [GROESSE.dx - 1, B - 0.6, GROESSE.dz + 0.08]];       // im Bodenschnitt vorne
const SCHNITT_OST = [[GROESSE.dx + 0.08, B - 0.6, GROESSE.dz - 1], [GROESSE.dx + 0.08, B - 0.6, 18]];

export class Welt {
  constructor(container) {
    this.container = container;
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    r.shadowMap.enabled = true;
    r.shadowMap.autoUpdate = false;                                 // Schatten nur bei Änderungen neu
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    container.append(r.domElement);
    r.domElement.style.width = '100%';
    r.domElement.style.height = '100%';

    const sc = this.scene = new THREE.Scene();
    sc.background = HIMMEL.clone();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 400);
    this.camera.position.set(58, 60, 58);
    this.camera.lookAt(0, -2, 0);
    this.halbeHoehe = 16;

    this.hemi = new THREE.HemisphereLight('#ffffff', '#8aa58e', 1.6);
    sc.add(this.hemi);
    const sonne = this.sonne = new THREE.DirectionalLight('#fff3dc', 2.4);
    sonne.position.set(SONNE[0] * 60, SONNE[1] * 60, SONNE[2] * 60);
    sonne.castShadow = true;
    sonne.shadow.mapSize.set(2048, 2048);
    Object.assign(sonne.shadow.camera, { left: -42, right: 42, top: 42, bottom: -42, near: 5, far: 200 });
    sonne.shadow.bias = -0.0006;
    sonne.shadow.normalBias = 0.02;
    sc.add(sonne);

    sc.add(this._umgebung());
    this.platz = platzObjekte(VORLAGE);
    sc.add(this.platz);
    this._feuchteFelder();
    this._wasserKoerper();
    this._teilchen();
    this._leitungen();
    this._sensoren();
    this._kinder();
    this.anker = this._anker();

    this.letzte = performance.now();
    this.zustand = { regen: false, sonne: false, wasser: 0.25, feuchte: 0.4, mulde: 0, bewaesserung: false, zufluss: false };
    this.regenStaerke = 0;
    this.sonnenStaerke = 0;
    this.statistik = { bilder: 0, schatten: 0 };
    this.dirty = true;
    this.schattenNeu = true;
    this.resize();
    this.vorwaermen();
  }

  /* ---------- Umgebung: Straßenplatte mit Bodenschnitt, graue Hochhäuser ---------- */
  _umgebung() {
    const g = new THREE.Group(), platte = [];
    const band = (a, b, farbe) => {
      for (const [x1, z1, x2, z2] of [[a, a, GROESSE.dx, b + 1], [a, b + 1, b + 1, GROESSE.dz]]) {
        platte.push([x1 + OX, OY, z1 + OZ, x2 + OX, B + OY, z2 + OZ, '#8b6a4a']);
        platte.push([x1 + OX, B + OY, z1 + OZ, x2 + OX, B + 1 + OY, z2 + OZ, farbe]);
      }
    };
    band(-22, -15, '#79b04a');
    band(-14, -13, '#b9b8b4');
    band(-12, -5, '#2c2d33');
    band(-4, -2, '#b9b8b4');
    band(-1, -1, '#8f979e');
    for (let k = -12; k < GROESSE.dx; k += 3) platte.push([k + OX + 0.2, 0, -8.6 + OZ, k + OX + 1.8, 0.03, -8.4 + OZ, '#e6e6e2']);
    for (let k = -4; k < GROESSE.dz; k += 3) platte.push([-8.6 + OX, 0, k + OZ + 0.2, -8.4 + OX, 0.03, k + OZ + 1.8, '#e6e6e2']);
    g.add(quaderVerbund(platte));
    const haeuser = [[-21, -21, -16, -16, 26], [-6, -21, 1, -16, 32], [8, -21, 14, -16, 22], [21, -21, 28, -16, 36],
      [-21, 0, -16, 6, 24], [-21, 13, -16, 20, 30], [-21, 26, -16, 31, 16]]
      .map(([x1, z1, x2, z2, h]) => [x1 + OX, z1 + OZ, x2 + 1 + OX, z2 + 1 + OZ, h]);
    const koerper = quaderVerbund(haeuser.map(([xa, za, xb, zb, h]) => [xa, 0, za, xb, h, zb, '#8e949b']));
    koerper.castShadow = true;
    g.add(koerper, fassadenVerbund(haeuser));
    return g;
  }

  /* ---------- Rasenfarbe nach Bodenfeuchte (trocken = gelblich, nass = dunkler) ---------- */
  _feuchteFelder() {
    const felder = rasenFelder(VORLAGE);
    const im = new THREE.InstancedMesh(GEO.feld, M.feuchte, felder.length), m4 = new THREE.Matrix4();
    felder.forEach((f, n) => im.setMatrixAt(n, m4.makeTranslation(f.x + 0.5 + OX, f.y + 1 + OY + 0.03, f.z + 0.5 + OZ)));
    im.instanceMatrix.needsUpdate = true;
    im.renderOrder = 3;
    this.scene.add(im);
    this.feuchteNetz = im;
  }

  /* ---------- Wasser als Füllstände: Regenmulde, Zisterne ---------- */
  _wasserKoerper() {
    const koerper = (x1, z1, x2, z2, yBoden, hMax) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(x2 - x1 + 1 - 0.04, 1, z2 - z1 + 1 - 0.04), M.wasser);
      m.position.set((x1 + x2 + 1) / 2 + OX, 0, (z1 + z2 + 1) / 2 + OZ);
      m.userData = { yBoden: yBoden + OY, hMax };
      m.renderOrder = 2;
      this.scene.add(m);
      return m;
    };
    const [mx1, mz1, mx2, mz2] = GRUEN_TEILE.mulde, [zx1, zz1, zx2, zz2] = GRUEN_TEILE.zisterne;
    this.wk = {
      mulde: koerper(mx1, mz1, mx2, mz2, B, 0.9),
      zisterne: koerper(zx1 + 1, zz1 + 1, zx2 - 1, zz2 - 1, 1, 2.96),
    };
  }
  _fuellstand(m, wert) {
    const h = Math.max(0.001, wert * m.userData.hMax);
    m.visible = wert > 0.002;
    m.scale.y = h;
    m.position.y = m.userData.yBoden + h / 2;
  }

  /* ---------- Teilchen: Regen, Versickern im Bodenschnitt, Tropfen in Zulauf und Bewässerung ---------- */
  _teilchen() {
    const N = 1400, pos = new Float32Array(N * 6), rnd = (a, b) => a + Math.random() * (b - a);
    this.regenDaten = { n: N, x: new Float32Array(N), y: new Float32Array(N), z: new Float32Array(N), v: new Float32Array(N) };
    for (let k = 0; k < N; k++) { this.regenDaten.x[k] = rnd(-38, 18); this.regenDaten.y[k] = rnd(-2, 46); this.regenDaten.z[k] = rnd(-38, 18); this.regenDaten.v[k] = rnd(26, 34); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.regen = new THREE.LineSegments(geo, M.regen);
    this.regen.frustumCulled = false;
    this.regen.visible = false;
    this.scene.add(this.regen);

    // Versickern: Punkte wandern im Bodenschnitt (Süd- und Ostseite) nach unten
    this.sickern = new THREE.InstancedMesh(GEO.punkt, M.versickern, 220);
    this.sickerDaten = Array.from({ length: 220 }, (_, k) => ({ seite: k % 2, a: Math.random() * GROESSE.dx, t: Math.random() }));
    this.sickern.visible = false;
    this.scene.add(this.sickern);

    // Tropfen auf Leitungen (Zulauf zur Zisterne, Bewässerung) – eine Instanzliste für alle
    this.tropfen = new THREE.InstancedMesh(GEO.tropfen, M.tropfen, 260);
    this.tropfen.count = 0;
    this.tropfen.frustumCulled = false;
    this.tropfen.renderOrder = 4;
    this.scene.add(this.tropfen);
  }

  /* ---------- Leitungen: Zulauf Mulde → Zisterne, Bewässerung (Rasen und Bodenschnitt) ---------- */
  _leitungen() {
    const strecke = (punkte, breite = 0.32, hoehe = 0.08) => {
      const q = [];
      for (let k = 1; k < punkte.length; k++) {
        const [a, b] = [punkte[k - 1], punkte[k]];
        const x1 = Math.min(a[0], b[0]) - breite / 2, x2 = Math.max(a[0], b[0]) + breite / 2;
        const z1 = Math.min(a[2], b[2]) - breite / 2, z2 = Math.max(a[2], b[2]) + breite / 2;
        q.push([x1 + OX, a[1] + OY, z1 + OZ, x2 + OX, a[1] + hoehe + OY, z2 + OZ, null]);
      }
      return q;
    };
    this.zulaufNetz = quaderVerbund(strecke(ZULAUF), M.leitung);
    this.bewaesserNetz = quaderVerbund(BEWAESSERUNG.flatMap((z) => strecke(z)), M.leitung);
    this.schnittNetz = quaderVerbund([...strecke(SCHNITT_SUED, 0.42, 0.42), ...strecke(SCHNITT_OST, 0.42, 0.42)], M.leitungSchnitt);
    for (const n of [this.zulaufNetz, this.bewaesserNetz]) { n.renderOrder = 3; n.receiveShadow = false; }
    this.scene.add(this.zulaufNetz, this.bewaesserNetz, this.schnittNetz);
    this.zuege = { zulauf: [zug(ZULAUF)], giessen: [...BEWAESSERUNG.map(zug), zug(SCHNITT_SUED), zug(SCHNITT_OST)] };
  }

  /* ---------- Sensoren (Modelle, keine echte Hardware) ---------- */
  _sensoren() {
    const [, zz1, zx2] = GRUEN_TEILE.zisterne;
    // Wasserstandsensor: Kasten am Rand der Zisterne, Messstab ins Wasser
    const ws = new THREE.Group();
    ws.position.copy(p(zx2 + 0.5, B + 1, zz1 - 0.5));
    const pf = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.5, 0.18).translate(0, 0.75, 0), M.pfosten);
    const kopf = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.9).translate(0, 1.8, 0), M.sensor);
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.06).translate(0, 1.85, 0.47), M.anzeigeWasser);
    const stab = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.4, 0.1).translate(-0.6, 0.2, 1.2), M.pfosten);
    ws.add(pf, kopf, led, stab);
    // Bodenfeuchtesensor: Messspieß im Rasen mit kleiner Anzeige (gelb = trocken, grün = feucht genug)
    const bs = new THREE.Group();
    bs.position.copy(p(20.5, B + 1, 26.5));
    const spiess = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.2, 0.16).translate(0, 0.4, 0), M.pfosten);
    const kasten = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.4).translate(0, 1.75, 0), M.sensor);
    const schirm = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.06).translate(0, 1.78, 0.22), M.anzeigeBoden);
    bs.add(spiess, kasten, schirm);
    bs.rotation.y = Math.PI / 4;              // Anzeige schaut zur Kamera
    for (const o of [ws, bs]) { o.traverse((x) => { if (x.isMesh) x.castShadow = true; }); this.scene.add(o); }
    this.sensorModelle = { wasser: ws, boden: bs };
  }

  _kinder() {
    const S = B + 1;
    this.kinder = [
      [kind('#ef4444'), 13.5, S + 4, 4.5, 0.5],
      [kind('#22c55e'), 22.5, S + 1.5, 2.5, 3.1, 'schaukel'],
      [kind('#3b82f6'), 24.5, S + 1, 8.5, 1.6],
      [kind('#eab308'), 14.5, B - 1, 15.5, 2.2],
      [kind('#ec4899'), 19.5, S, 4.5, -1.2],
      [kind('#14b8a6'), 19.5, S, 28.5, 3.4],
    ].map(([g, x, y, z, rot, wo]) => {
      g.position.copy(p(x, y, z)); g.rotation.y = rot; g.userData.wo = wo; g.visible = false;
      if (wo === 'schaukel') g.traverse((o) => { o.castShadow = false; });
      this.scene.add(g);
      return g;
    });
  }

  /* ---------- Beschriftungs-Punkte ---------- */
  _anker() {
    const mitte = ([x1, z1, x2, z2], y) => p((x1 + x2 + 1) / 2, y, (z1 + z2 + 1) / 2);
    const [, zz1, zx2] = GRUEN_TEILE.zisterne;
    return {
      mulde: mitte(GRUEN_TEILE.mulde, B + 1.4), zisterne: mitte(GRUEN_TEILE.zisterne, B + 1.6),
      wasserSensor: p(zx2 + 0.5, B + 3.4, zz1 - 0.5), bodenSensor: p(20.5, B + 3.5, 26.5), bewaesserung: p(9, B + 1.3, 30.5),
    };
  }

  /* ---------- Steuerung ---------- */
  // zustand: { regen, sonne, wasser 0…1, feuchte 0…1, mulde 0…1, bewaesserung, zufluss } – wird in jedem Bild aus dem Modell gesetzt
  setze(z) {
    const alt = this.zustand;
    if (alt.regen !== z.regen || alt.sonne !== z.sonne) this.schattenNeu = true;
    if (JSON.stringify(alt) !== JSON.stringify(z)) this.dirty = true;
    this.zustand = { ...z };
  }
  // neuer Schritt: Himmel sofort passend (kein langsames Überblenden beim direkten Anspringen)
  sofort() { this.regenStaerke = this.zustand.regen ? 1 : 0; this.sonnenStaerke = this.zustand.sonne ? 1 : 0; this._himmel(); this.dirty = true; this.schattenNeu = true; }
  _himmel() {
    const rs = this.regenStaerke, ss = this.sonnenStaerke;
    this.scene.background.copy(HIMMEL).lerp(HIMMEL_SONNE, ss).lerp(HIMMEL_REGEN, rs);
    this.sonne.intensity = 2.4 + 0.5 * ss - 1.7 * rs;
    this.hemi.intensity = 1.6 + 0.1 * ss - 0.4 * rs;
  }
  _feuchteFarbe(f) {
    // trocken (< 0,5): gelblich, umso kräftiger je trockener; feucht (> 0,5): etwas dunkler grün-blau
    if (f < 0.5) { M.feuchte.color.set('#d9b44a'); M.feuchte.opacity = 0.62 * (0.5 - f) / 0.5; }
    else { M.feuchte.color.set('#2c5a4e'); M.feuchte.opacity = 0.36 * (f - 0.5) / 0.5; }
    this.feuchteNetz.visible = M.feuchte.opacity > 0.01;
    M.anzeigeBoden.color.set(f < 0.3 ? '#f2c14e' : '#4cc26a');
  }

  /* Beim Laden alles einmal unsichtbar vorbereiten: Grafikprogramme übersetzen und Daten auf die Grafikkarte laden. */
  vorwaermen() {
    const alles = [...Object.values(this.wk), this.regen, this.sickern, this.tropfen, this.feuchteNetz, ...this.kinder];
    const vorher = alles.map((o) => o.visible);
    alles.forEach((o) => { o.visible = true; });
    this.renderer.compile(this.scene, this.camera);
    this.renderer.shadowMap.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
    alles.forEach((o, k) => { o.visible = vorher[k]; });
  }

  /* ---------- Bild ---------- */
  bildpunkt(name) {
    const a = this.anker[name];
    if (!a) return null;
    const v = T.v.copy(a).project(this.camera);
    const w = this.container.clientWidth, h = this.container.clientHeight;
    return { x: (v.x + 1) / 2 * w, y: (1 - v.y) / 2 * h };
  }
  resize() {
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    const a = w / h, H = this.halbeHoehe * 2, W = H * a;
    Object.assign(this.camera, { left: -0.5 * W, right: 0.5 * W, top: 0.6 * H, bottom: -0.4 * H });   // oben Platz für den Schritt-Text
    this.camera.updateProjectionMatrix();
    this.dirty = true;
  }

  /* Ein Bildschritt. Gezeichnet wird nur, wenn sich etwas bewegt oder geändert hat. Rückgabe: true = gezeichnet. */
  render(jetzt = performance.now()) {
    const dt = Math.min(0.1, (jetzt - this.letzte) / 1000);
    this.letzte = jetzt;
    const t = jetzt / 1000, z = this.zustand;
    let bewegt = this.dirty;
    this.dirty = false;

    this._fuellstand(this.wk.mulde, z.mulde);
    this._fuellstand(this.wk.zisterne, z.wasser);
    this._feuchteFarbe(z.feuchte);
    M.leitung.color.set(z.bewaesserung ? '#2563eb' : '#93c5fd');
    M.leitung.opacity = z.bewaesserung ? 0.95 : 0.6;
    this.zulaufNetz.visible = !!z.zufluss || z.regen;

    // Himmel und Licht weich überblenden
    const nah = (a, b) => { const n = a + (b - a) * Math.min(1, dt * 2); return Math.abs(b - n) < 0.003 ? b : n; };
    const rs = nah(this.regenStaerke, z.regen ? 1 : 0), ss = nah(this.sonnenStaerke, z.sonne ? 1 : 0);
    if (rs !== this.regenStaerke || ss !== this.sonnenStaerke) { this.regenStaerke = rs; this.sonnenStaerke = ss; this._himmel(); bewegt = true; }

    if (this._regenBewegen(dt, rs)) bewegt = true;
    if (this._sickernBewegen(dt, z.regen)) bewegt = true;
    if (this._tropfenBewegen(t, z)) bewegt = true;
    if (this._kinderBewegen(t, rs < 0.2)) bewegt = true;

    if (!bewegt) return false;
    if (this.schattenNeu) { this.renderer.shadowMap.needsUpdate = true; this.schattenNeu = false; this.statistik.schatten++; }
    this.renderer.render(this.scene, this.camera);
    this.statistik.bilder++;
    return true;
  }

  _regenBewegen(dt, rs) {
    const sichtbar = rs > 0.03;
    if (this.regen.visible !== sichtbar) { this.regen.visible = sichtbar; this.dirty = true; }
    if (!sichtbar) return false;
    M.regen.opacity = 0.6 * rs;
    const a = this.regen.geometry.attributes.position.array, d = this.regenDaten;
    for (let k = 0; k < d.n; k++) {
      d.y[k] -= d.v[k] * dt; d.x[k] += 2 * dt;
      if (d.y[k] < 0) { d.y[k] = 40 + Math.random() * 6; d.x[k] = -38 + Math.random() * 56; d.z[k] = -38 + Math.random() * 56; }
      const o = k * 6;
      a[o] = d.x[k]; a[o + 1] = d.y[k]; a[o + 2] = d.z[k];
      a[o + 3] = d.x[k] - 0.12; a[o + 4] = d.y[k] + 1.1; a[o + 5] = d.z[k];
    }
    this.regen.geometry.attributes.position.needsUpdate = true;
    return true;
  }
  _sickernBewegen(dt, an) {
    if (this.sickern.visible !== an) { this.sickern.visible = an; this.dirty = true; }
    if (!an) return false;
    const tiefe = B + 0.4;
    this.sickerDaten.forEach((d, k) => {
      d.t += dt * 0.28;
      if (d.t > 1) { d.t = 0; d.a = Math.random() * (d.seite ? GROESSE.dz : GROESSE.dx); }
      const y = OY + B + 0.7 - d.t * tiefe;
      if (d.seite === 0) T.v.set(d.a + OX, y, GROESSE.dz + OZ + 0.04); else T.v.set(GROESSE.dx + OX + 0.04, y, d.a + OZ);
      T.s.setScalar(1);
      if (d.seite) T.q.copy(T.qOst); else T.q.identity();
      this.sickern.setMatrixAt(k, T.m4.compose(T.v, T.q, T.s));
    });
    this.sickern.instanceMatrix.needsUpdate = true;
    return true;
  }
  // Tropfen wandern auf den Leitungen: Zulauf bei Regen, Bewässerung solange sie EIN ist
  _tropfenBewegen(t, z) {
    const aktiv = [...(z.zufluss && z.regen ? this.zuege.zulauf : []), ...(z.bewaesserung ? this.zuege.giessen : [])];
    let n = 0;
    for (const w of aktiv) for (let s = (t * 4.5) % 1.6; s < w.summe && n < this.tropfen.instanceMatrix.count; s += 1.6) {
      this.tropfen.setMatrixAt(n++, T.m4.makeTranslation(aufZug(w, s, T.v)));
    }
    const vorher = this.tropfen.count;
    this.tropfen.count = n;
    this.tropfen.instanceMatrix.needsUpdate = true;
    return n > 0 || vorher > 0;
  }
  _kinderBewegen(t, draussen) {
    let bewegt = false;
    this.kinder.forEach((g) => {
      if (g.visible !== draussen) { g.visible = draussen; bewegt = true; if (g.userData.wo !== 'schaukel') this.schattenNeu = true; }
      if (draussen && g.userData.wo === 'schaukel') { g.position.z = 2.5 + OZ + Math.sin(t * 2.2) * 0.35; bewegt = true; }
    });
    return bewegt;
  }

  info() {
    let objekte = 0;
    this.scene.traverse(() => objekte++);
    return {
      objekte, geometrien: this.renderer.info.memory.geometries, texturen: this.renderer.info.memory.textures,
      bilder: this.statistik.bilder, schatten: this.statistik.schatten, aufrufe: this.renderer.info.render.calls,
      tropfen: this.tropfen.count, regen: this.regen.visible, feuchteDeckkraft: M.feuchte.opacity, leitungAn: M.leitung.color.getHexString() === '2563eb',
      zisterne: this.wk.zisterne.visible ? this.wk.zisterne.scale.y / this.wk.zisterne.userData.hMax : 0,
    };
  }
}
