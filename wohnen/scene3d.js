/* 3D-Modelle (Three.js, Low-Poly, feste isometrische Kamera).
 * Alle Szenen werden einmal gebaut und nur ein- und ausgeblendet: Ein Wechsel ist sofort da
 * und hinterlässt keine Reste. Animationen hängen nur von der verstrichenen Zeit ab. */
import * as THREE from '../lib/three.module.min.js';
import { CONFIG } from './config.js';
import { experimentModule, experimentZahlen, plan, gebaeude, gartenVon } from './model.js';

export function webglMoeglich() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

const F = {
  himmel: '#d7ecf5', wiese: '#b9dfae', grundstueck: '#e9eef3', rand: '#94a3b8', linie: '#ffffff',
  P: '#b5e39b', G: '#7fd27e', O: '#58bd6b', W: '#f1e4c6', H: '#c7ccd6',
  strasse: '#6b7280', gehweg: '#d6dbe3', zaun: '#ffffff', holz: '#c98b4f', putz: '#e3cfae', beton: '#9aa3ad',
  module: ['#f4a261', '#e76f51', '#2a9d8f', '#e9c46a', '#8ab17d', '#6d9dc5'],
};

const matCache = new Map();
const mat = (color, extra) => {
  const k = color + (extra ? JSON.stringify(extra) : '');
  if (!extra && matCache.has(k)) return matCache.get(k);
  const m = new THREE.MeshLambertMaterial({ color, flatShading: true, ...(extra || {}) });
  if (!extra) matCache.set(k, m);
  return m;
};

function leinwand(w, h, malen) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  malen(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const fassadenCache = new Map();
function fassade(wand, art = 'putz') {
  const k = wand + art;
  if (fassadenCache.has(k)) return fassadenCache.get(k);
  const t = leinwand(128, 128, (g) => {
    g.fillStyle = wand; g.fillRect(0, 0, 128, 128);
    if (art === 'holz') {
      g.strokeStyle = 'rgba(70,40,15,.28)'; g.lineWidth = 3;
      for (let x = 8; x < 128; x += 14) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 128); g.stroke(); }
    }
    g.fillStyle = 'rgba(30,41,59,.25)'; g.fillRect(0, 122, 128, 6);       // Geschossband
    for (const x of [18, 74]) {
      g.fillStyle = '#ffffff'; g.fillRect(x - 3, 33, 42, 50);
      g.fillStyle = '#9fd3ef'; g.fillRect(x, 36, 36, 44);
      g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(x + 17, 36, 3, 44);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  fassadenCache.set(k, t);
  return t;
}

const nummerCache = new Map();
function nummer(n) {
  if (nummerCache.has(n)) return nummerCache.get(n);
  const t = leinwand(128, 128, (g) => {
    g.fillStyle = '#ffffff'; g.strokeStyle = '#1f2937'; g.lineWidth = 9;
    g.beginPath(); g.arc(64, 64, 54, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#111827'; g.font = 'bold 76px system-ui, Segoe UI, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), 64, 70);
  });
  nummerCache.set(n, t);
  return t;
}
function nummerSprite(n, s = 0.95) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: nummer(n), depthTest: false, transparent: true }));
  sp.scale.set(s, s, 1);
  sp.renderOrder = 10;
  return sp;
}

function kasten(w, h, d, m, x = 0, y = 0, z = 0, schatten = true) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y, z);
  o.castShadow = schatten;
  o.receiveShadow = true;
  return o;
}

/* Baustein: Etagenblock mit Fenstern (Fassade an den Seiten, Dach/Boden schlicht) */
function etagenblock(w, h, d, wand, art = 'putz') {
  const t = fassade(wand, art);
  const seite = (n) => { const tx = t.clone(); tx.needsUpdate = true; tx.repeat.set(Math.max(1, Math.round(n / 2)), 1); return new THREE.MeshLambertMaterial({ map: tx, flatShading: true }); };
  const deckel = mat(wand);
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [seite(d), seite(d), deckel, deckel, seite(w), seite(w)]);
}

function satteldach(w, d, hoehe, farbe) {
  // Dreiecksprisma, First entlang der längeren Seite
  const laengs = w >= d, l = laengs ? w : d, b = laengs ? d : w;
  const form = new THREE.Shape();
  form.moveTo(-b / 2 - 0.15, 0); form.lineTo(b / 2 + 0.15, 0); form.lineTo(0, hoehe); form.closePath();
  const geo = new THREE.ExtrudeGeometry(form, { depth: l + 0.3, bevelEnabled: false });
  geo.translate(0, 0, -(l + 0.3) / 2);
  const m = new THREE.Mesh(geo, mat(farbe));
  if (laengs) m.rotation.y = Math.PI / 2;
  m.castShadow = true;
  return m;
}

function baum(x, z, s = 1, farbe = '#3f9d55', y = 0) {
  const g = new THREE.Group();
  g.add(kasten(0.18 * s, 0.9 * s, 0.18 * s, mat('#8b5a2b'), 0, 0.45 * s, 0));
  const k = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62 * s, 0), mat(farbe));
  k.position.y = 1.25 * s;
  k.rotation.set(s, s * 2, 0);
  k.castShadow = true;
  g.add(k);
  g.position.set(x, y, z);
  return g;
}

function bank(x, z, rot = 0, y = 0.12) {
  const g = new THREE.Group();
  g.add(kasten(0.9, 0.08, 0.3, mat('#b07a45'), 0, 0.32, 0));
  g.add(kasten(0.9, 0.3, 0.06, mat('#b07a45'), 0, 0.5, -0.13));
  for (const s of [-0.38, 0.38]) g.add(kasten(0.06, 0.3, 0.26, mat('#475569'), s, 0.16, 0));
  g.position.set(x, y, z);
  g.rotation.y = rot;
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
    sc.background = new THREE.Color(F.himmel);

    // feste isometrische Kamera – für alle Modi identisch
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 300);
    this.camera.position.set(40, 34, 40);
    this.camera.lookAt(0, 0, 0);
    this.halbeHoehe = 11;

    sc.add(new THREE.HemisphereLight('#ffffff', '#86a98c', 1.7));
    const sonne = new THREE.DirectionalLight('#fff4e2', 2.3);
    sonne.position.set(-18, 40, 26);
    sonne.castShadow = true;
    sonne.shadow.mapSize.set(2048, 2048);
    Object.assign(sonne.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 5, far: 120 });
    sonne.shadow.bias = -0.0005;
    sc.add(sonne);

    const wiese = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), mat(F.wiese));
    wiese.rotation.x = -Math.PI / 2;
    wiese.receiveShadow = true;
    sc.add(wiese);

    this.anker = {};
    this.exp = { zustand: 'nebeneinander', anim: null };
    this.auf = { stufe: 'bestand', anim: null, teil: null };
    this.gruppen = {
      experiment: this._experiment(),
      A: this._variante('A'), B: this._variante('B'), C: this._variante('C'),
      aufstocken: this._aufstocken(),
    };
    this.gruppen.vergleich = this._vergleich();
    this.gruppen.start = this._start();
    for (const g of Object.values(this.gruppen)) { g.visible = false; sc.add(g); }

    this.experimentSetzen('nebeneinander', false);
    this.aufstockenSetzen('bestand', false);
    this.resize();
  }

  /* ---------- Experiment ---------- */
  _experiment() {
    const g = new THREE.Group();
    const n = this.c.raster.experimentFelder, m = this.c.raster.modul, L = n * m;
    g.add(kasten(L + 0.6, 0.2, L + 0.6, mat(F.rand), 0, 0.1, 0, false));
    g.add(kasten(L, 0.22, L, mat(F.grundstueck), 0, 0.12, 0, false));
    // deutliches Bodenraster: ein Feld = Grundfläche eines Wohnmoduls
    const lin = mat('#475569');
    for (let i = 0; i <= n; i++) {
      const p = -L / 2 + i * m;
      g.add(kasten(0.07, 0.04, L, lin, p, 0.25, 0, false));
      g.add(kasten(L, 0.04, 0.07, lin, 0, 0.25, p, false));
    }
    // frei gewordene Felder (werden beim Stapeln sanft grün)
    this.freiKacheln = new Map();
    for (let x = 0; x < n; x++) for (let z = 0; z < n; z++) {
      const k = new THREE.Mesh(new THREE.BoxGeometry(m - 0.16, 0.03, m - 0.16), new THREE.MeshLambertMaterial({ color: '#4ade80', transparent: true, opacity: 0 }));
      k.position.set(this._feld(x), 0.25, this._feld(z));
      g.add(k);
      this.freiKacheln.set(`${x},${z}`, k);
    }
    this.module = experimentModule('nebeneinander', this.c).map((mod, i) => {
      const grp = new THREE.Group();
      const block = etagenblock(m - 0.14, m - 0.1, m - 0.14, F.module[i]);
      block.castShadow = block.receiveShadow = true;
      grp.add(block);
      grp.add(kasten(m - 0.04, 0.12, m - 0.04, mat('#334155'), 0, m / 2 - 0.02, 0));
      const nr = nummerSprite(mod.nr, 0.9);   // Nummer liegt immer sichtbar auf dem Modul
      nr.position.set(0, 0.15, 0);
      grp.add(nr);
      g.add(grp);
      return grp;
    });
    // eigener, größerer Maßstab fürs Experiment; Ankerpunkt mitverschieben
    const ansicht = this.c.experimentAnsicht || { groesse: 1, versatz: [0, 0, 0] };
    g.scale.setScalar(ansicht.groesse);
    g.position.set(...ansicht.versatz);
    g.updateMatrixWorld(true);
    this.anker.frei = new THREE.Vector3(this._feld(2) + 1.2, 0.3, this._feld(1) + 1.2).applyMatrix4(g.matrixWorld);
    return g;
  }

  _feld(i) { const n = this.c.raster.experimentFelder, m = this.c.raster.modul; return (i - (n - 1) / 2) * m; }
  _modulPos(mod) { const m = this.c.raster.modul; return new THREE.Vector3(this._feld(mod.x), 0.23 + mod.etage * m + (m - 0.1) / 2, this._feld(mod.z)); }

  experimentSetzen(zustand, animiert, jetzt = performance.now()) {
    const von = this.module.map((g) => g.position.clone());
    const ziel = experimentModule(zustand, this.c).map((m) => this._modulPos(m));
    const stapeln = zustand === 'gestapelt';
    // Reihenfolge: beim Stapeln zuerst Etage 1, dann Etage 2; beim Zurückstellen umgekehrt
    const etagen = experimentModule('gestapelt', this.c).map((m) => m.etage);
    this.exp.zustand = zustand;
    if (!animiert) {
      this.module.forEach((g, i) => g.position.copy(ziel[i]));
      this.exp.anim = null;
    } else {
      this.exp.anim = { t0: jetzt, dauer: this.c.dauer.stapeln * 1000, von, ziel, fenster: etagen.map((e) => {
        if (e === 0) return null;
        const erst = stapeln ? e === 1 : e === 2;
        return erst ? [0, 0.5] : [0.5, 1];
      }) };
    }
  }

  _experimentAnimieren(jetzt) {
    const a = this.exp.anim;
    let fertig = true;
    if (a) {
      const k = Math.min(1, (jetzt - a.t0) / a.dauer);
      this.module.forEach((g, i) => {
        const f = a.fenster[i];
        if (!f) { g.position.copy(a.ziel[i]); return; }
        const u = Math.min(1, Math.max(0, (k - f[0]) / (f[1] - f[0])));
        const glatt = (x) => x * x * (3 - 2 * x);
        const oben = Math.max(a.von[i].y, a.ziel[i].y) + 1.6;
        const p = g.position;
        if (u < 0.3) { const v = glatt(u / 0.3); p.set(a.von[i].x, a.von[i].y + (oben - a.von[i].y) * v, a.von[i].z); }
        else if (u < 0.7) { const v = glatt((u - 0.3) / 0.4); p.set(a.von[i].x + (a.ziel[i].x - a.von[i].x) * v, oben, a.von[i].z + (a.ziel[i].z - a.von[i].z) * v); }
        else { const v = glatt((u - 0.7) / 0.3); p.set(a.ziel[i].x, oben + (a.ziel[i].y - oben) * v, a.ziel[i].z); }
      });
      fertig = k >= 1;
      if (fertig) this.exp.anim = null;
    }
    // frei gewordene Felder erst nach dem Stapeln einblenden
    const zahlen = experimentZahlen(this.exp.zustand, this.c);
    const frei = new Set(zahlen.freieFelder.map(([x, z]) => `${x},${z}`));
    for (const [k, kachel] of this.freiKacheln) {
      const ziel = frei.has(k) && !this.exp.anim ? 0.85 : 0;
      kachel.material.opacity += (ziel - kachel.material.opacity) * 0.12;
    }
    return !this.exp.anim;
  }

  experimentLaeuft() { return !!this.exp.anim; }

  /* ---------- Varianten A/B/C ---------- */
  _variante(v) {
    const g = new THREE.Group();
    const p = plan(v, this.c), n = p.length, h = n / 2;
    const zelle = (x, z) => [x - h + 0.5, z - h + 0.5];
    // Straße rundum: begrenztes Grundstück, Zugänge von außen
    const s = n + 0.8;
    for (const [w, d, x, z] of [[s + 4.4, 1.6, 0, -s / 2 - 0.8], [s + 4.4, 1.6, 0, s / 2 + 0.8], [1.6, s, -s / 2 - 0.8, 0], [1.6, s, s / 2 + 0.8, 0]]) {
      g.add(kasten(w, 0.06, d, mat(F.strasse), x, 0.03, z, false));
    }
    g.add(kasten(s, 0.16, s, mat(F.gehweg), 0, 0.08, 0, false));
    // Flächen je Rasterfeld (eine InstancedMesh je Flächenart)
    const arten = {};
    for (let z = 0; z < n; z++) for (let x = 0; x < n; x++) (arten[p[z][x]] = arten[p[z][x]] || []).push([x, z]);
    const dummy = new THREE.Object3D();
    for (const [art, felder] of Object.entries(arten)) {
      const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.14, 1), mat(F[art]), felder.length);
      felder.forEach(([x, z], i) => { const [cx, cz] = zelle(x, z); dummy.position.set(cx, 0.23, cz); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); });
      im.receiveShadow = true;
      g.add(im);
    }
    // offengelegtes Modellraster: feine Linien je Rasterfeld
    const lin = new THREE.MeshBasicMaterial({ color: F.linie, transparent: true, opacity: 0.45 });
    for (let i = 0; i <= n; i++) {
      g.add(kasten(0.04, 0.02, n, lin, i - h, 0.31, 0, false));
      g.add(kasten(n, 0.02, 0.04, lin, 0, 0.31, i - h, false));
    }

    // Gebäude: je Etage ein Block, jede Wohnung mit Nummer
    const vk = this.c.varianten[v];
    const wandFarben = v === 'A' ? F.module : v === 'B' ? ['#f2c48d', '#9cc5d6', '#e9b8b0'] : ['#cbd5e1', '#d6c4a8'];
    let wNr = 1;
    gebaeude(v, this.c).forEach((b, bi) => {
      const w = b.x1 - b.x0 + 1, d = b.z1 - b.z0 + 1;
      const [cx0, cz0] = zelle(b.x0, b.z0);
      const cx = cx0 + (w - 1) / 2, cz = cz0 + (d - 1) / 2;
      const eh = this.c.raster.etage;
      for (let e = 0; e < b.geschosse; e++) {
        const block = etagenblock(w - 0.1, eh - 0.06, d - 0.1, wandFarben[bi % wandFarben.length]);
        block.position.set(cx, 0.3 + e * eh + eh / 2, cz);
        block.castShadow = block.receiveShadow = true;
        g.add(block);
        for (let m = 0; m < b.module; m++) {
          const nr = nummerSprite(wNr++, 0.8);
          nr.position.set(cx, 0.3 + e * eh + eh / 2, cz);
          g.add(nr);
        }
      }
      const top = 0.3 + b.geschosse * eh;
      if (vk.dach === 'sattel') {
        const dach = satteldach(w, d, 1.1, v === 'A' ? '#b45309' : '#9a3412');
        dach.position.set(cx, top, cz);
        g.add(dach);
      } else {
        g.add(kasten(w + 0.1, 0.18, d + 0.1, mat('#64748b'), cx, top + 0.09, cz));
        g.add(kasten(w - 0.4, 0.1, d - 0.4, mat('#6fbf73'), cx, top + 0.22, cz));   // Gründach
      }
      // Tür zur Wegseite (vorn)
      g.add(kasten(0.5, 0.95, 0.06, mat('#7c2d12'), cx, 0.3 + 0.48, cz + d / 2 - 0.02, false));
    });

    // Ausstattung je Variante
    if (v === 'A') this._gaerten(g, p, zelle);
    if (v === 'B') this._hof(g, zelle);
    if (v === 'C') this._park(g, p, zelle);
    // Ankerpunkt für die Beschriftung der Grünfläche
    const [ax, az] = zelle(v === 'A' ? 10 : v === 'B' ? 5 : 3, v === 'A' ? 1 : 8);
    this.anker[v] = new THREE.Vector3(ax, 1.4, az);
    return g;
  }

  _gaerten(g, p, zelle) {
    const n = p.length, zaun = mat(F.zaun);
    const gehoert = (x, z) => (p[z] && p[z][x] === 'P' ? gartenVon('A', x, z, this.c) : null);
    for (let z = 0; z < n; z++) for (let x = 0; x < n; x++) {
      if (p[z][x] !== 'P') continue;
      const id = gehoert(x, z);
      const [cx, cz] = zelle(x, z);
      // Zaun, wo der Nachbar ein anderer Garten, ein Weg oder die Grundstücksgrenze ist
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, nz = z + dz;
        const nachbar = nx < 0 || nz < 0 || nx >= n || nz >= n ? 'X' : p[nz][nx];
        if (nachbar === 'H' || (nachbar === 'P' && gehoert(nx, nz) === id)) continue;
        const lang = dz === 0;
        g.add(kasten(lang ? 0.06 : 1, 0.42, lang ? 1 : 0.06, zaun, cx + dx * 0.5, 0.52, cz + dz * 0.5, false));
      }
    }
    // in jedem Garten etwas anderes: Baum, Beet, Schaukel, Tisch
    const deko = [[0, 0], [5, 1], [9, 0], [1, 10], [6, 10], [10, 11]];
    deko.forEach(([x, z], i) => {
      const [cx, cz] = zelle(x, z);
      if (i % 3 === 0) g.add(baum(cx + 0.3, cz + 0.3, 0.9, '#4caf50', 0.3));
      else if (i % 3 === 1) { g.add(kasten(1.4, 0.2, 0.6, mat('#8d5a34'), cx + 0.2, 0.4, cz + 0.2)); g.add(kasten(1.2, 0.08, 0.45, mat('#ec4899'), cx + 0.2, 0.52, cz + 0.2, false)); }
      else { g.add(kasten(0.08, 1.1, 0.08, mat('#64748b'), cx - 0.3, 0.85, cz)); g.add(kasten(0.08, 1.1, 0.08, mat('#64748b'), cx + 0.5, 0.85, cz)); g.add(kasten(0.9, 0.06, 0.08, mat('#64748b'), cx + 0.1, 1.38, cz)); g.add(kasten(0.4, 0.05, 0.25, mat('#f59e0b'), cx + 0.1, 0.65, cz)); }
    });
  }

  _hof(g, zelle) {
    const at = (x, z, dx = 0, dz = 0) => { const [cx, cz] = zelle(x, z); return [cx + dx, cz + dz]; };
    // langer Gemeinschaftstisch mit Bänken
    const [tx, tz] = at(3, 8, 0.5);
    g.add(kasten(2.2, 0.1, 0.8, mat('#b07a45'), tx, 0.82, tz));
    for (const s of [-0.85, 0.85]) g.add(kasten(0.1, 0.5, 0.6, mat('#475569'), tx + s, 0.55, tz));
    for (const s of [-0.75, 0.75]) g.add(kasten(2.2, 0.08, 0.3, mat('#b07a45'), tx, 0.6, tz + s));
    // Sandkasten
    const [sx, sz] = at(8, 8, 0.5, 0.5);
    g.add(kasten(2, 0.25, 2, mat('#a16207'), sx, 0.42, sz));
    g.add(kasten(1.7, 0.1, 1.7, mat('#fde68a'), sx, 0.52, sz, false));
    // Hochbeete
    for (const [x, z] of [[2, 1], [9, 1], [3, 11]]) { const [bx, bz] = at(x, z, 0.5); g.add(kasten(1.8, 0.45, 0.8, mat('#8d5a34'), bx, 0.5, bz)); g.add(kasten(1.6, 0.1, 0.6, mat('#65a30d'), bx, 0.76, bz, false)); }
    // großer Hofbaum und Bänke
    const [bx, bz] = at(8, 3);
    g.add(baum(bx, bz, 1.6, '#3f9d55', 0.3));
    g.add(bank(...at(3, 3), 0.5, 0.3));
    g.add(bank(...at(9, 10), -0.4, 0.3));
  }

  _park(g, p, zelle) {
    const n = p.length;
    // viele Bäume auf Parkfeldern (feste, gleichmäßige Verteilung)
    let i = 0;
    for (let z = 0; z < n; z++) for (let x = 0; x < n; x++) {
      if (p[z][x] !== 'O') continue;
      i++;
      if ((x * 7 + z * 13) % 5 !== 0) continue;
      if (z >= 5 && z <= 8 && x >= 7 && x <= 10) continue;   // Platz für den Teich
      if (z >= 6 && z <= 9 && x >= 1 && x <= 3) continue;    // Platz für den Spielplatz
      const [cx, cz] = zelle(x, z);
      g.add(baum(cx, cz, 0.95 + ((x + z) % 3) * 0.12, ['#3f9d55', '#4caf50', '#2f855a'][(x + z) % 3], 0.3));
    }
    // Teich
    const [tx, tz] = zelle(8.5, 6.5);
    const teich = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.08, 20), mat('#60a5fa'));
    teich.position.set(tx, 0.33, tz);
    teich.scale.z = 0.75;
    g.add(teich);
    // Spielplatz: Rutsche und Schaukel
    const [sx, sz] = zelle(2, 7.5);
    g.add(kasten(2.4, 0.06, 2.6, mat('#fcd34d'), sx, 0.33, sz, false));
    g.add(kasten(0.7, 1.2, 0.7, mat('#ef4444'), sx - 0.6, 0.9, sz - 0.6));
    const rutsche = kasten(0.45, 0.08, 1.6, mat('#3b82f6'), sx - 0.6, 0.85, sz + 0.25);
    rutsche.rotation.x = 0.6;
    g.add(rutsche);
    g.add(kasten(0.08, 1.2, 0.08, mat('#64748b'), sx + 0.5, 0.9, sz - 0.5));
    g.add(kasten(0.08, 1.2, 0.08, mat('#64748b'), sx + 0.5, 0.9, sz + 0.7));
    g.add(kasten(0.08, 0.08, 1.3, mat('#64748b'), sx + 0.5, 1.48, sz + 0.1));
    // Bänke am Weg
    g.add(bank(...zelle(4, 6), Math.PI / 2, 0.3));
    g.add(bank(...zelle(7, 9), -Math.PI / 2, 0.3));
  }

  _vergleich() {
    const g = new THREE.Group();
    // drei gleich skalierte Miniaturen nebeneinander, mittig im ganzen Bild (rechte Spalte ist hier leer)
    const rechts = new THREE.Vector3(1, 0, -1).normalize();
    const s = 0.45, mitte = 6.3, abstand = 12;
    ['A', 'B', 'C'].forEach((v, i) => {
      const k = this.gruppen[v].clone();
      k.visible = true;
      k.scale.setScalar(s);
      k.position.copy(rechts.clone().multiplyScalar(mitte + (i - 1) * abstand)).add(new THREE.Vector3(0.6, 0, 0.6));
      g.add(k);
      this.anker['vgl' + v] = k.position.clone().add(new THREE.Vector3(8.4 * s, 0, 8.4 * s));   // vordere Ecke
    });
    return g;
  }

  _start() {
    const g = this.gruppen.C.clone();
    return g;
  }

  /* ---------- Aufstocken ---------- */
  _aufstocken() {
    const g = new THREE.Group();
    const L = 9.6, D = 4, eh = 1.85;
    g.add(kasten(16, 0.14, 9, mat(F.gehweg), 0, 0.07, 0, false));
    g.add(kasten(15.4, 0.16, 8.4, mat('#a7d98f'), 0, 0.09, 0, false));
    for (const [x, z, s] of [[-6.6, -3, 1.3], [6.4, -3.1, 1.2], [-6.8, 3, 1.1], [6.6, 3.2, 1.4], [0, -3.6, 1.0]]) g.add(baum(x, z, s, '#4caf50', 0.15));
    // Fundament (Beton) – bleibt bestehen
    this.fundament = kasten(L + 0.6, 0.5, D + 0.6, mat(F.beton, {}), 0, 0.42, 0);
    g.add(this.fundament);
    const basis = 0.67;
    // Bestand: zwei Etagen (verputzt) mit Deckenplatten
    this.bestand = [];
    this.decken = [];
    for (let e = 0; e < 2; e++) {
      const b = etagenblock(L, eh - 0.12, D, F.putz);
      b.position.set(0, basis + e * eh + (eh - 0.12) / 2, 0);
      b.castShadow = b.receiveShadow = true;
      g.add(b);
      this.bestand.push(b);
      const decke = kasten(L + 0.12, 0.12, D + 0.12, mat(F.beton, {}), 0, basis + e * eh + eh - 0.06, 0);
      g.add(decke);
      this.decken.push(decke);
    }
    // neue Holzgeschosse: wachsen von unten nach oben
    this.holz = [];
    for (let e = 0; e < 2; e++) {
      const geo = new THREE.BoxGeometry(L - 0.2, eh - 0.08, D - 0.2);
      geo.translate(0, (eh - 0.08) / 2, 0);
      const t = fassade(F.holz, 'holz');
      const seite = (n) => { const tx = t.clone(); tx.needsUpdate = true; tx.repeat.set(Math.round(n / 2), 1); return new THREE.MeshLambertMaterial({ map: tx, flatShading: true, emissive: '#000000' }); };
      const deckel = new THREE.MeshLambertMaterial({ color: '#b97a40', emissive: '#000000' });
      const m = new THREE.Mesh(geo, [seite(D), seite(D), deckel, deckel, seite(L), seite(L)]);
      m.position.set(0, basis + (2 + e) * eh, 0);
      m.castShadow = m.receiveShadow = true;
      g.add(m);
      this.holz.push(m);
    }
    this.dach = new THREE.Group();
    this.dach.add(kasten(L + 0.5, 0.22, D + 0.5, mat('#475569'), 0, 0.11, 0));
    this.dach.add(kasten(L - 0.6, 0.12, D - 0.6, mat('#6fbf73'), 0, 0.28, 0));
    g.add(this.dach);
    this.auf.basis = basis;
    this.auf.eh = eh;
    // Häkchen für „Was wird eingespart?“
    this.haken = [];
    const hakenTex = leinwand(128, 128, (c) => { c.fillStyle = '#16a34a'; c.beginPath(); c.arc(64, 64, 58, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 16; c.lineCap = 'round'; c.beginPath(); c.moveTo(34, 66); c.lineTo(56, 88); c.lineTo(96, 42); c.stroke(); });
    for (const [x, y] of [[-3.3, basis + eh / 2], [0, basis + eh / 2], [3.3, basis + eh / 2], [-3.3, basis + eh * 1.5], [0, basis + eh * 1.5], [3.3, basis + eh * 1.5], [-5.2, 0.45], [5.2, 0.45]]) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: hakenTex, depthTest: false, transparent: true, opacity: 0 }));
      sp.position.set(x, y, D / 2 + 0.2);
      sp.scale.set(0.9, 0.9, 1);
      sp.renderOrder = 11;
      g.add(sp);
      this.haken.push(sp);
    }
    // etwas nach rechts oben gerückt, damit Frage und Hinweise unten links nichts verdecken
    g.position.set(1.0, 0, -1.4);
    this.anker.alt = new THREE.Vector3(-L / 2, basis + eh, D / 2).add(g.position);
    this.anker.neu = new THREE.Vector3(-L / 2, basis + 3 * eh, D / 2).add(g.position);
    this.anker.fundament = new THREE.Vector3(L / 2 + 0.3, 0.5, D / 2 + 0.3).add(g.position);
    return g;
  }

  aufstockenSetzen(stufe, animiert, jetzt = performance.now()) {
    const ziel = stufe === 'bestand' ? 0 : 1;
    const von = this.auf.anim ? this._aufWert(jetzt) : (this.auf.stufe === 'bestand' ? 0 : 1);
    this.auf.stufe = stufe;
    this.auf.anim = animiert && von !== ziel ? { t0: jetzt, dauer: this.c.dauer.aufstocken * 1000 * Math.abs(ziel - von), von, ziel } : null;
    if (!this.auf.anim) this._aufAnwenden(ziel);
  }

  _aufWert(jetzt) {
    const a = this.auf.anim;
    if (!a) return this.auf.stufe === 'bestand' ? 0 : 1;
    const k = Math.min(1, (jetzt - a.t0) / a.dauer);
    return a.von + (a.ziel - a.von) * k;
  }

  /* w = 0 … 1: wie weit die zwei Holzgeschosse gewachsen sind (erst Etage 3, dann Etage 4) */
  _aufAnwenden(w) {
    const glatt = (x) => x * x * (3 - 2 * x);
    const { basis, eh } = this.auf;
    let oben = basis + 2 * eh;
    this.holz.forEach((m, i) => {
      const u = glatt(Math.min(1, Math.max(0, w * 2 - i)));
      m.visible = u > 0.001;
      m.scale.y = Math.max(0.001, u);
      m.position.y = oben;
      oben += (eh) * u;
    });
    this.dach.position.y = oben;
  }

  aufstockenLaeuft() { return !!this.auf.anim; }

  /* Materialwissen / Einsparen: Bauteile hervorheben */
  hervorheben(teil) {
    this.auf.teil = teil;
    const glow = (o, farbe, stark) => {
      const ms = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of ms) { if (m.emissive) { m.emissive.set(farbe); m.emissiveIntensity = stark; } }
    };
    // eigene Materialien, damit nur dieses Gebäude leuchtet
    for (const o of [this.fundament, ...this.decken, ...this.bestand, ...this.holz]) {
      if (!o.userData.eigen) {
        o.material = Array.isArray(o.material) ? o.material.map((m) => m.clone()) : o.material.clone();
        o.userData.eigen = true;
      }
      glow(o, '#000000', 0);
    }
    if (teil === 'holz') this.holz.forEach((o) => glow(o, '#f59e0b', 0.45));
    if (teil === 'beton') [this.fundament, ...this.decken].forEach((o) => glow(o, '#60a5fa', 0.6));
    if (teil === 'bestand' || teil === 'einsparen') [this.fundament, ...this.decken, ...this.bestand].forEach((o) => glow(o, '#22c55e', 0.38));
    this.haken.forEach((h) => { h.material.opacity = teil === 'einsparen' ? 1 : 0; });
  }

  /* ---------- Allgemein ---------- */
  zeige(name) {
    for (const [k, g] of Object.entries(this.gruppen)) g.visible = k === name;
  }

  bildpunkt(name) {
    const p = this.anker[name];
    if (!p) return null;
    const v = p.clone().project(this.camera);
    const w = this.container.clientWidth, h = this.container.clientHeight;
    return { x: (v.x + 1) / 2 * w, y: (1 - v.y) / 2 * h };
  }

  resize() {
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    const a = w / h, H = this.halbeHoehe * 2, W = H * a;
    // Modell links der Mitte, darunter Platz für die Bedienleiste, rechts für die Zahlen
    Object.assign(this.camera, { left: -0.34 * W, right: 0.66 * W, top: 0.5 * H, bottom: -0.5 * H });
    this.camera.updateProjectionMatrix();
  }

  render(jetzt = performance.now()) {
    this._experimentAnimieren(jetzt);
    if (this.auf.anim) {
      const w = this._aufWert(jetzt);
      this._aufAnwenden(w);
      if (jetzt - this.auf.anim.t0 >= this.auf.anim.dauer) this.auf.anim = null;
    }
    this.renderer.render(this.scene, this.camera);
  }

  info() {
    let objekte = 0;
    this.scene.traverse(() => objekte++);
    return { objekte, geometrien: this.renderer.info.memory.geometries, texturen: this.renderer.info.memory.textures, sichtbar: Object.entries(this.gruppen).filter(([, g]) => g.visible).map(([k]) => k) };
  }
}
