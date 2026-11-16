/* 3D-Szene in Blockgrafik (Three.js, eigene schlichte Farben, feste isometrische Kamera).
 * Der Platz ist ein Modell-Ausschnitt: vorne (Süden, Osten) sieht man den Boden im Schnitt – versiegelt oder offen.
 * Alles wird einmal gebaut und danach nur ein- und ausgeblendet; Teilchen haben feste Anzahlen.
 * Ein Wechsel hinterlässt deshalb keine Reste. */
import * as THREE from '../lib/three.module.min.js';
import { CONFIG } from './config.js';
import { VORLAGEN, GROESSE, GRUEN_TEILE, B, sichtbareBloecke, blockFarbe, waerme, SONNE, aufbau, schichtWuchs, Wasser } from './model.js';

export function webglMoeglich() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

// Vorlagen-Koordinaten (Block x, y, z) → Welt: Platz mittig, Oberfläche des Platzes bei y = 0
const OX = -GROESSE.dx / 2, OY = -(B + 1), OZ = -GROESSE.dz / 2;
const p = (x, y, z) => new THREE.Vector3(x + OX, y + OY, z + OZ);
const HIMMEL = new THREE.Color('#cfe8f6'), HIMMEL_REGEN = new THREE.Color('#8494a6');

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
  laub: new THREE.MeshLambertMaterial({ map: KACHEL, transparent: true, opacity: 1 }),
  glas: new THREE.MeshLambertMaterial({ color: '#bfe6ff', transparent: true, opacity: 0.38, depthWrite: false }),
  wasser: new THREE.MeshLambertMaterial({ color: '#2f80d8', transparent: true, opacity: 0.62, depthWrite: false }),
  tropfen: new THREE.MeshBasicMaterial({ color: '#2563eb' }),
  versickern: new THREE.MeshBasicMaterial({ color: '#60a5fa' }),
  regen: new THREE.LineBasicMaterial({ color: "#dbeafe", transparent: true, opacity: 0.6 }),
  waerme: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.62, depthWrite: false }),
};
const farbMat = new Map();
const mat = (farbe) => { if (!farbMat.has(farbe)) farbMat.set(farbe, new THREE.MeshLambertMaterial({ color: farbe })); return farbMat.get(farbe); };

const GEO = {
  voll: new THREE.BoxGeometry(1, 1, 1),
  // diese drei stehen mit der Unterkante auf y = 0 (wachsen beim Skalieren nach oben)
  halb: new THREE.BoxGeometry(1, 0.5, 1).translate(0, 0.25, 0),
  klein: new THREE.BoxGeometry(0.42, 0.5, 0.42).translate(0, 0.25, 0),
  pflanze: new THREE.BoxGeometry(0.34, 0.5, 0.34).translate(0, 0.25, 0),
  duenn: new THREE.BoxGeometry(0.14, 1, 0.14),
  glas: new THREE.BoxGeometry(1, 1, 1),
  tropfen: new THREE.BoxGeometry(0.34, 0.08, 0.34),
  punkt: new THREE.BoxGeometry(0.22, 0.22, 0.06),
  feld: new THREE.BoxGeometry(0.98, 0.04, 0.98),
};

// leichte, feste Farbschwankung je Block – wirkt natürlicher
const zufall = (x, y, z) => { const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453; return s - Math.floor(s); };
function blockFarbeVariiert(id, x, y, z, laub) {
  const c = new THREE.Color(blockFarbe(id) || '#888888'), r = zufall(x, y, z);
  return c.offsetHSL(0, 0, (r - 0.5) * (laub ? 0.12 : 0.06));
}

/* Eine Schicht (gleiches y) eines Zustands als eigene Gruppe – so kann die Verwandlung Schicht für Schicht laufen. */
function schichtGruppen(vorlage) {
  const liste = sichtbareBloecke(vorlage), schichten = [];
  for (let y = 0; y < vorlage.dy; y++) {
    const g = new THREE.Group();
    g.position.y = y + OY;              // Unterkante der Schicht
    schichten.push(g);
  }
  const art = (b) => (b.form === 'voll' ? (b.laub ? 'laub' : 'voll') : b.form);
  const gruppiert = new Map();
  for (const b of liste) { const k = b.y + '|' + art(b); if (!gruppiert.has(k)) gruppiert.set(k, []); gruppiert.get(k).push(b); }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3();
  for (const [k, bl] of gruppiert) {
    const [ys, a] = k.split('|'), y = Number(ys);
    const geo = a === 'laub' ? GEO.voll : GEO[a], material = a === 'laub' ? M.laub : a === 'glas' ? M.glas : M.opak;
    const im = new THREE.InstancedMesh(geo, material, bl.length);
    bl.forEach((b, n) => {
      const pfl = a === 'pflanze', unten = a === 'halb' || a === 'klein' || pfl;
      v.set(b.x + 0.5 + OX, unten ? 0 : 0.5, b.z + 0.5 + OZ);       // relativ zur Unterkante der Schicht
      s.setScalar(pfl ? 0.8 + zufall(b.x, b.y, b.z) * 0.5 : 1);
      im.setMatrixAt(n, m4.compose(v, q, s));
      if (a !== 'glas') im.setColorAt(n, blockFarbeVariiert(b.id, b.x, b.y, b.z, a === 'laub'));
    });
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.castShadow = a === 'voll' || a === 'laub' || a === 'halb';
    im.receiveShadow = true;
    schichten[y].add(im);
  }
  return schichten;
}

/* Figuren: schlichte Block-Kinder (Spielen mit Freunden) */
function kind(hemd, hose = '#334155') {
  const g = new THREE.Group();
  const teil = (w, h, d, f, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(f)); m.position.y = y; m.castShadow = true; g.add(m); return m; };
  teil(0.42, 0.55, 0.26, hose, 0.28);
  teil(0.5, 0.6, 0.3, hemd, 0.85);
  teil(0.42, 0.42, 0.42, '#f1c7a5', 1.37);
  teil(0.44, 0.12, 0.44, '#5b3a22', 1.62);
  return g;
}
function schmetterling(farbe) {
  const g = new THREE.Group(), flg = new THREE.PlaneGeometry(0.42, 0.3);
  const m = new THREE.MeshLambertMaterial({ color: farbe, side: THREE.DoubleSide });
  const l = new THREE.Mesh(flg, m), r = new THREE.Mesh(flg, m);
  l.position.x = -0.21; r.position.x = 0.21;
  const lp = new THREE.Group(), rp = new THREE.Group(); lp.add(l); rp.add(r);
  g.add(lp, rp);
  g.userData.fluegel = [lp, rp];
  return g;
}
function vogel() {
  const g = new THREE.Group(), flg = new THREE.PlaneGeometry(0.9, 0.28), m = mat('#334155');
  m.side = THREE.DoubleSide;
  const l = new THREE.Mesh(flg, m), r = new THREE.Mesh(flg, m);
  l.position.x = -0.45; r.position.x = 0.45;
  const lp = new THREE.Group(), rp = new THREE.Group(); lp.add(l); rp.add(r);
  g.add(lp, rp, new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.5), m));
  g.userData.fluegel = [lp, rp];
  return g;
}

export class Welt {
  constructor(container, c = CONFIG) {
    this.c = c;
    this.container = container;
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    container.append(r.domElement);
    r.domElement.style.width = '100%';
    r.domElement.style.height = '100%';

    const sc = this.scene = new THREE.Scene();
    sc.background = HIMMEL.clone();

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 400);
    this.camera.position.set(58, 60, 58);
    this.camera.lookAt(-4, -1, -4);
    this.halbeHoehe = 19.5;

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

    this.umgebung = this._umgebung();
    sc.add(this.umgebung);
    this.schichten = { grau: schichtGruppen(VORLAGEN.grau), gruen: schichtGruppen(VORLAGEN.gruen) };
    for (const z of ['grau', 'gruen']) for (const g of this.schichten[z]) sc.add(g);

    this._wasserKoerper();
    this._teilchen();
    this._waermeFelder();
    this._lebewesen();
    this.anker = this._anker();

    this.wasser = new Wasser(c.dauer);
    this.zustand = 'grau';
    this.verwandlung = null;      // { t0 }
    this.waermeAn = false;
    this.tiereAn = false;
    this.kinderAn = false;
    this.letzte = performance.now();
    this.setzeZustand('grau');
    this.resize();
  }

  /* ---------- Umgebung: Straßenplatte mit Bodenschnitt, graue Hochhäuser ---------- */
  _umgebung() {
    const g = new THREE.Group();
    const kasten = (x1, y1, z1, x2, y2, z2, m, schatten = false) => {
      const o = new THREE.Mesh(new THREE.BoxGeometry(x2 - x1, y2 - y1, z2 - z1), m);
      o.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);
      o.receiveShadow = true; o.castShadow = schatten;
      g.add(o);
      return o;
    };
    // Bänder rund um den Platz (Norden + Westen), in Blockkoordinaten der Vorlage
    const band = (a, b, farbe) => {
      for (const [x1, z1, x2, z2] of [[a, a, GROESSE.dx, b + 1], [a, b + 1, b + 1, GROESSE.dz]]) {
        kasten(x1 + OX, OY, z1 + OZ, x2 + OX, B + OY, z2 + OZ, mat('#8b6a4a'));           // Erde
        kasten(x1 + OX, B + OY, z1 + OZ, x2 + OX, B + 1 + OY, z2 + OZ, mat(farbe));       // Oberfläche
      }
    };
    band(-22, -15, '#79b04a');     // Grünstreifen mit Hochhäusern
    band(-14, -13, '#b9b8b4');     // Gehweg
    band(-12, -5, '#2c2d33');      // Fahrbahn
    band(-4, -2, '#b9b8b4');       // Gehweg
    band(-1, -1, '#8f979e');       // Bordstein
    const weiss = mat('#e6e6e2');
    for (let k = -12; k < GROESSE.dx; k += 3) kasten(k + OX + 0.2, 0, -8.6 + OZ, k + OX + 1.8, 0.03, -8.4 + OZ, weiss);
    for (let k = -4; k < GROESSE.dz; k += 3) kasten(-8.6 + OX, 0, k + OZ + 0.2, -8.4 + OX, 0.03, k + OZ + 1.8, weiss);
    // graue Hochhäuser („zentraler versiegelter Platz zwischen markanten Hochhäusern“)
    const haus = (x1, z1, x2, z2, h) => {
      const w = x2 - x1 + 1, d = z2 - z1 + 1;
      const seite = (n) => { const t = FASSADE.clone(); t.needsUpdate = true; t.repeat.set(n / 4, h / 4); return new THREE.MeshLambertMaterial({ map: t }); };
      const dach = mat('#8e949b');
      const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [seite(d), seite(d), dach, dach, seite(w), seite(w)]);
      o.position.set(x1 + w / 2 + OX, h / 2, z1 + d / 2 + OZ);
      o.castShadow = true; o.receiveShadow = true;
      g.add(o);
    };
    haus(-21, -21, -16, -16, 26);
    haus(-6, -21, 1, -16, 32);
    haus(8, -21, 14, -16, 22);
    haus(21, -21, 28, -16, 36);
    haus(-21, 0, -16, 6, 24);
    haus(-21, 13, -16, 20, 30);
    haus(-21, 26, -16, 31, 16);
    return g;
  }

  /* ---------- Wasser als Füllstände: Regenmulde, tiefer Spielbereich, Zisterne ---------- */
  _wasserKoerper() {
    const koerper = (x1, z1, x2, z2, yBoden, hMax) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(x2 - x1 + 1 - 0.04, 1, z2 - z1 + 1 - 0.04), M.wasser);
      m.position.set((x1 + x2 + 1) / 2 + OX, 0, (z1 + z2 + 1) / 2 + OZ);
      m.userData = { yBoden: yBoden + OY, hMax };
      m.renderOrder = 2;
      this.scene.add(m);
      return m;
    };
    const [mx1, mz1, mx2, mz2] = GRUEN_TEILE.mulde, [tx1, tz1, tx2, tz2] = GRUEN_TEILE.tieferSpielbereich, [zx1, zz1, zx2, zz2] = GRUEN_TEILE.zisterne;
    this.wk = {
      mulde: koerper(mx1, mz1, mx2, mz2, B, 0.9),
      tief: koerper(tx1 + 1, tz1 + 1, tx2 - 1, tz2 - 1, B - 1, 1.75),
      tiefRand: koerper(tx1, tz1, tx2, tz2, B, 0.75),
      zisterne: koerper(zx1 + 1, zz1 + 1, zx2 - 1, zz2 - 1, 1, 2.96),
    };
  }
  _fuellstand(m, wert) {
    const h = Math.max(0.001, wert * m.userData.hMax);
    m.visible = wert > 0.002;
    m.scale.y = h;
    m.position.y = m.userData.yBoden + h / 2;
  }

  /* ---------- Teilchen: Regen, Abfluss (grau), Versickern im Schnitt (grün), Gießen ---------- */
  _teilchen() {
    // Regen: Striche über dem ganzen Modell
    const N = 1400, pos = new Float32Array(N * 6), rnd = (a, b) => a + Math.random() * (b - a);
    this.regenDaten = [];
    for (let k = 0; k < N; k++) this.regenDaten.push({ x: rnd(-38, 18), y: rnd(-2, 46), z: rnd(-38, 18), v: rnd(26, 34) });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.regen = new THREE.LineSegments(geo, M.regen);
    this.regen.frustumCulled = false;
    this.regen.visible = false;
    this.scene.add(this.regen);

    // Abfluss auf dem grauen Platz: Tropfen wandern zum nächsten Abfluss
    const abfluesse = [[8, 16], [24, 16], [16, 8], [16, 24]];
    this.abflussZiele = abfluesse;
    this.tropfen = new THREE.InstancedMesh(GEO.tropfen, M.tropfen, 260);
    this.tropfenDaten = Array.from({ length: 260 }, () => this._neuerTropfen({}));
    this.tropfen.visible = false;
    this.scene.add(this.tropfen);

    // Versickern: Punkte wandern im Bodenschnitt (Süd- und Ostseite) nach unten
    this.sickern = new THREE.InstancedMesh(GEO.punkt, M.versickern, 220);
    this.sickerDaten = Array.from({ length: 220 }, (_, k) => ({ seite: k % 2, a: Math.random() * GROESSE.dx, t: Math.random() }));
    this.sickern.visible = false;
    this.scene.add(this.sickern);

    // Gießen: Tropfen laufen auf der Leitung von der Zisterne zum Baum
    this.giessTeile = new THREE.InstancedMesh(GEO.tropfen, M.tropfen, 18);
    this.giessTeile.visible = false;
    this.scene.add(this.giessTeile);
  }
  _neuerTropfen(d) {
    d.x = Math.random() * GROESSE.dx; d.z = Math.random() * GROESSE.dz;
    let best = null, bd = 1e9;
    for (const [ax, az] of this.abflussZiele) { const e = Math.hypot(ax + 0.5 - d.x, az + 0.5 - d.z); if (e < bd) { bd = e; best = [ax + 0.5, az + 0.5]; } }
    d.zx = best[0]; d.zz = best[1]; d.v = 2.5 + Math.random() * 2;
    return d;
  }

  /* ---------- Wärme-Ansicht (vereinfacht) ---------- */
  _waermeFelder() {
    const farbe = { heiss: new THREE.Color('#ef4444'), warm: new THREE.Color('#f59e0b'), kuehl: new THREE.Color('#38bdf8') };
    this.waermeNetz = {};
    for (const z of ['grau', 'gruen']) {
      const felder = waerme(VORLAGEN[z]);
      const im = new THREE.InstancedMesh(GEO.feld, M.waerme, felder.length), m4 = new THREE.Matrix4();
      felder.forEach((f, n) => { m4.makeTranslation(f.x + 0.5 + OX, f.y + 1 + OY + 0.03, f.z + 0.5 + OZ); im.setMatrixAt(n, m4); im.setColorAt(n, farbe[f.art]); });
      im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true;
      im.visible = false; im.renderOrder = 3;
      this.scene.add(im);
      this.waermeNetz[z] = im;
    }
  }

  /* ---------- Tiere und Kinder ---------- */
  _lebewesen() {
    this.falter = ['#f97316', '#facc15', '#a855f7', '#38bdf8'].map((f, k) => { const s = schmetterling(f); s.scale.setScalar(2); s.userData.k = k; this.scene.add(s); return s; });
    this.voegel = [0, 1].map((k) => { const v = vogel(); v.userData.k = k; this.scene.add(v); return v; });
    // Kinder an den Spielgeräten (Positionen in Vorlagen-Koordinaten, Füße auf der Fläche)
    const S = B + 1;
    this.kinder = [
      [kind('#ef4444'), 13.5, S + 4, 4.5, 0.5],          // auf dem Kletterturm
      [kind('#22c55e'), 22.5, S + 1.5, 2.5, 3.1],        // Schaukel
      [kind('#3b82f6'), 24.5, S + 1, 8.5, 1.6],          // Balancierbalken
      [kind('#eab308'), 14.5, B - 1, 15.5, 2.2, 'tief'], // im tiefen Spielbereich
      [kind('#ec4899'), 19.5, S, 4.5, -1.2],             // unten an der Rutsche
      [kind('#14b8a6'), 19.5, S, 28.5, 3.4],             // Picknick
    ].map(([g, x, y, z, rot, wo]) => { const v = p(x, y, z); g.position.copy(v); g.rotation.y = rot; g.userData.wo = wo; this.scene.add(g); return g; });
  }

  /* ---------- Beschriftungs-Punkte ---------- */
  _anker() {
    const mitte = ([x1, z1, x2, z2], y) => p((x1 + x2 + 1) / 2, y, (z1 + z2 + 1) / 2);
    return {
      turm: p(15, B + 7.5, 3.5), baeume: p(4.5, B + 10, 27.5), wiese: p(21, B + 1.6, 29.5), wild: p(2.5, B + 2.5, 8.5),
      stein: p(16, B + 1.2, 24), schatten: p(4.5, B + 8.5, 27.5), tiere: p(5, B + 6, 6.5),
      abfluss: p(24.5, B + 1.1, 16.5), mulde: mitte(GRUEN_TEILE.mulde, B + 1.2), tief: mitte(GRUEN_TEILE.tieferSpielbereich, B + 0.6),
      zisterne: mitte(GRUEN_TEILE.zisterne, B + 1.3), giessen: p(29.5, B + 10, 22.5),
      versickern: p(GROESSE.dx * 0.55, B - 2.5, GROESSE.dz + 0.2), versiegelt: p(GROESSE.dx * 0.55, B - 0.5, GROESSE.dz + 0.2),
    };
  }

  /* ---------- Steuerung ---------- */
  setzeZustand(z) {
    this.zustand = z;
    this.verwandlung = null;
    for (const k of ['grau', 'gruen']) for (const g of this.schichten[k]) { g.visible = k === z; g.scale.y = 1; }
    this._waermeAnzeigen();
  }
  verwandeln() {
    this.setzeZustand('grau');
    this.verwandlung = { t0: performance.now() };
  }
  verwandlungLaeuft() { return !!this.verwandlung; }
  setzeWaerme(an) { this.waermeAn = an; this._waermeAnzeigen(); }
  _waermeAnzeigen() {
    for (const k of ['grau', 'gruen']) this.waermeNetz[k].visible = this.waermeAn && k === this.zustand && !this.verwandlung;
    M.laub.opacity = this.waermeAn ? 0.22 : 1;
    M.laub.depthWrite = !this.waermeAn;
  }
  setzeTiere(an) { this.tiereAn = an; }
  setzeKinder(an) { this.kinderAn = an; }
  // Wasser: zustand des Platzes, Regen an/aus, Gießen, Startfüllung der Zisterne
  wasserSetzen({ regen = false, giessen = false, zisterne = null, neu = false } = {}) {
    if (neu) { this.wasser.reset(this.zustand, zisterne ?? 0.3); this.regenStaerke = regen ? 1 : 0; }   // neuer Abschnitt: Himmel sofort passend
    this.wasser.zustand = this.zustand;
    this.wasser.regen = regen;
    this.wasser.giessen = giessen;
  }
  wasserZiel(werte) { Object.assign(this.wasser, werte); }

  /* ---------- Bild ---------- */
  bildpunkt(name) {
    const a = this.anker[name];
    if (!a) return null;
    const v = a.clone().project(this.camera);
    const w = this.container.clientWidth, h = this.container.clientHeight;
    return { x: (v.x + 1) / 2 * w, y: (1 - v.y) / 2 * h };
  }
  resize() {
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    const a = w / h, H = this.halbeHoehe * 2, W = H * a;
    // Modell links der Mitte; rechts Platz für Texte, unten für die Bedienleisten
    Object.assign(this.camera, { left: -0.4 * W, right: 0.6 * W, top: 0.52 * H, bottom: -0.48 * H });
    this.camera.updateProjectionMatrix();
  }

  render(jetzt = performance.now()) {
    const dt = Math.min(0.1, (jetzt - this.letzte) / 1000);
    this.letzte = jetzt;
    const t = jetzt / 1000;

    // Verwandlung Schicht für Schicht
    if (this.verwandlung) {
      const pr = aufbau((jetzt - this.verwandlung.t0) / 1000, this.c.dauer.verwandeln);
      this.schichten.grau.forEach((g, L) => { g.visible = pr <= L; });
      this.schichten.gruen.forEach((g, L) => { const w = schichtWuchs(pr, L); g.visible = w > 0; g.scale.y = Math.max(0.02, w); });
      if (pr >= GROESSE.dy + 1) { this.verwandlung = null; this.zustand = 'gruen'; this.setzeZustand('gruen'); }
    }

    // Wasser
    const w = this.wasser;
    w.zustand = this.zustand;
    w.schritt(dt);
    const gruen = this.zustand === 'gruen' && !this.verwandlung;
    this._fuellstand(this.wk.mulde, gruen ? w.mulde : 0);
    this._fuellstand(this.wk.tief, gruen ? w.tief : 0);
    this._fuellstand(this.wk.tiefRand, gruen ? Math.max(0, (w.tief - 0.55) / 0.45) : 0);
    this._fuellstand(this.wk.zisterne, gruen ? w.zisterne : 0);

    // Himmel und Licht bei Regen
    const r = w.regen ? 1 : 0;
    this.regenStaerke = (this.regenStaerke ?? 0) + (r - (this.regenStaerke ?? 0)) * Math.min(1, dt * 2);
    const rs = this.regenStaerke;
    this.scene.background.copy(HIMMEL).lerp(HIMMEL_REGEN, rs);
    this.sonne.intensity = 2.4 - 1.7 * rs;
    this.hemi.intensity = 1.6 - 0.4 * rs;

    this._regenBewegen(dt, rs);
    this._abflussBewegen(dt, w);
    this._sickernBewegen(dt, w);
    this._giessenBewegen(t, w);
    this._lebewesenBewegen(t, gruen && rs < 0.2, w);

    this.renderer.render(this.scene, this.camera);
  }

  _regenBewegen(dt, rs) {
    this.regen.visible = rs > 0.03;
    if (!this.regen.visible) return;
    M.regen.opacity = 0.6 * rs;
    const a = this.regen.geometry.attributes.position.array;
    this.regenDaten.forEach((d, k) => {
      d.y -= d.v * dt; d.x += 2 * dt;
      if (d.y < (d.x > OX && d.z > OZ ? 0 : 0)) { d.y = 40 + Math.random() * 6; d.x = -38 + Math.random() * 56; d.z = -38 + Math.random() * 56; }
      a.set([d.x, d.y, d.z, d.x - 0.12, d.y + 1.1, d.z], k * 6);
    });
    this.regen.geometry.attributes.position.needsUpdate = true;
  }
  _abflussBewegen(dt, w) {
    const sichtbar = this.zustand === 'grau' && !this.verwandlung && w.abfluss > 0.02;
    this.tropfen.visible = sichtbar;
    if (!sichtbar) return;
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3();
    const n = Math.round(this.tropfenDaten.length * w.abfluss);
    this.tropfenDaten.forEach((d, k) => {
      const dx = d.zx - d.x, dz = d.zz - d.z, e = Math.hypot(dx, dz);
      if (e < 0.3) this._neuerTropfen(d); else { d.x += dx / e * d.v * dt; d.z += dz / e * d.v * dt; }
      const an = k < n ? 1 : 0;
      v.set(d.x + OX, 0.05, d.z + OZ); s.setScalar(an);
      this.tropfen.setMatrixAt(k, m4.compose(v, q, s));
    });
    this.tropfen.instanceMatrix.needsUpdate = true;
  }
  _sickernBewegen(dt, w) {
    const sichtbar = this.zustand === 'gruen' && !this.verwandlung && w.versickern > 0.02;
    this.sickern.visible = sichtbar;
    if (!sichtbar) return;
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3(), q2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
    const n = Math.round(this.sickerDaten.length * w.versickern), tiefe = B + 0.4;
    this.sickerDaten.forEach((d, k) => {
      d.t += dt * 0.28;
      if (d.t > 1) { d.t = 0; d.a = Math.random() * (d.seite ? GROESSE.dz : GROESSE.dx); }
      const y = OY + B + 0.7 - d.t * tiefe;
      if (d.seite === 0) v.set(d.a + OX, y, GROESSE.dz + OZ + 0.04); else v.set(GROESSE.dx + OX + 0.04, y, d.a + OZ);
      s.setScalar(k < n ? 1 : 0);
      this.sickern.setMatrixAt(k, m4.compose(v, d.seite ? q2 : q, s));
    });
    this.sickern.instanceMatrix.needsUpdate = true;
  }
  _giessenBewegen(t, w) {
    const sichtbar = this.zustand === 'gruen' && w.giessen && w.zisterne > 0.25 && !w.regen;
    this.giessTeile.visible = sichtbar;
    if (!sichtbar) return;
    const [, , zx2, zz2] = GRUEN_TEILE.zisterne, m4 = new THREE.Matrix4();
    for (let k = 0; k < 18; k++) {
      const f = (t * 0.6 + k / 18) % 1;
      m4.makeTranslation(zx2 + 0.5 + OX, B + 2.08 + OY, zz2 + 0.6 + f * 4.2 + OZ);
      this.giessTeile.setMatrixAt(k, m4);
    }
    this.giessTeile.instanceMatrix.needsUpdate = true;
  }
  _lebewesenBewegen(t, draussen, w) {
    const tiere = this.tiereAn && draussen;
    this.falter.forEach((f) => {
      f.visible = tiere;
      if (!tiere) return;
      const k = f.userData.k, cx = [4, 7, 20, 26][k], cz = [5, 3, 28, 12][k];
      f.position.copy(p(cx + Math.sin(t * 0.7 + k) * 2.2, B + 2.2 + Math.sin(t * 1.9 + k * 2) * 0.6, cz + Math.cos(t * 0.5 + k * 1.3) * 2.2));
      f.rotation.y = t * 0.7 + k;
      const a = Math.sin(t * 14 + k) * 0.9;
      f.userData.fluegel[0].rotation.z = a; f.userData.fluegel[1].rotation.z = -a;
    });
    this.voegel.forEach((v) => {
      v.visible = tiere;
      if (!tiere) return;
      const k = v.userData.k, wkl = t * 0.35 + k * Math.PI;
      v.position.copy(p(16 + Math.cos(wkl) * 13, B + 14 + k * 1.5, 16 + Math.sin(wkl) * 13));
      v.rotation.y = -wkl;
      const a = Math.sin(t * 6 + k) * 0.5;
      v.userData.fluegel[0].rotation.z = a; v.userData.fluegel[1].rotation.z = -a;
    });
    const kinder = this.kinderAn && draussen;
    this.kinder.forEach((g, k) => {
      g.visible = kinder && !(g.userData.wo === 'tief' && w.tief > 0.02);
      if (g.visible && k === 1) g.position.z = p(0, 0, 2.5).z + Math.sin(t * 2.2) * 0.35;   // schaukeln
    });
  }

  info() {
    let objekte = 0;
    this.scene.traverse(() => objekte++);
    return {
      objekte, geometrien: this.renderer.info.memory.geometries, texturen: this.renderer.info.memory.textures,
      zustand: this.zustand, verwandlung: !!this.verwandlung,
      sichtbarGrau: this.schichten.grau.filter((g) => g.visible).length, sichtbarGruen: this.schichten.gruen.filter((g) => g.visible).length,
    };
  }
}
