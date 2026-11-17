/* START IT SMART – Stadt-Konfigurator: 3D-Vorschau (Three.js, Blockoptik, isometrische Kamera).
 *
 * Zeigt dieselben Blöcke, die auch in die Minecraft-Welt geschrieben werden. Die Stadt ist in Netze geteilt:
 * ein Netz für alles Feste und je ein Netz pro Baufläche. Ändert sich eine Entscheidung, wird nur diese Fläche neu gebaut.
 * Gleichartige Blockflächen werden zu großen Rechtecken zusammengefasst („greedy meshing“) – wenige Zeichenaufrufe,
 * auch auf schwachen Laptops flüssig. Gezeichnet wird nur, wenn sich etwas bewegt.
 */
import * as THREE from '../lib/three.module.min.js';
import { Welt, NAMEN, BLOECKE, ID, GRUEN_TEILE } from '../minecraft/welt.js';
import { BEREICH_3D, BEREICHE, BEREICH_IDS, boxVon, groesseVon, S, BODEN, STADT, vorlage } from './stadtmodell.js';

export function webglMoeglich() {
  try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch { return false; }
}

/* ---------- Blöcke: Farbe, Art, Form ---------- */
// Farben angelehnt an die Palette des Kollegen-Konfigurators (heller, freundlicher Blockstil)
const FARBEN = {
  asphalt: '#43454d', beton: '#8e9198', betonHell: '#bcbcb7', betonWeiss: '#ece8df', glattstein: '#d0cec8', andesit: '#a1a8ae',
  erde: '#94714c', grobeErde: '#7e6143', gras: '#94b964', moos: '#8aa35a', kies: '#aba398', ziegel: '#b96a50', fenster: '#a8d3e0',
  cyanGlas: '#5c98a2', grauGlas: '#77808a', glas: '#d6edf2', wasser: '#5aa4c8', eicheLaub: '#6f9d4c', birkeLaub: '#9dbc60', azalee: '#88a254',
  eicheStamm: '#7b5b3b', birkeStamm: '#e3decf', tiefschiefer: '#5c6371', terrakotta: '#bb6a41', kupfer: '#cf7e59', schwarzstein: '#4a4d57',
  steinziegel: '#9a9b97', redstone: '#b4302a', lampeAn: '#ffd986', lampeAus: '#8a6446', licht: '#f4f1df', laterne: '#ffcf70', sensor: '#d8ccaf',
  gelb: '#efc13d', rot: '#c94b42', blau: '#4a68b5', orange: '#e48230', limette: '#83c64c', gruenBeton: '#628441', cyanBeton: '#2f8590',
  braun: '#71503a', schwarzGlas: '#30343c', sandstein: '#e0cb9d', quarz: '#efe7da', fichteBretter: '#8d6a45', eicheBretter: '#c39a66',
  bretterBirke: '#dac792', fichteStamm: '#5c4630', fichteStammX: '#5c4630', zaun: '#b8945f', gitter: '#6c6f74', kette: '#55585e',
};
const ART = { LUFT: 0, OPAK: 1, GLAS: 2, WASSER: 3, FORM: 4, LEUCHT: 5, LAMPE: 6 };
const GLAS = new Set(['fenster', 'cyanGlas', 'grauGlas', 'glas', 'limGlas']);
const LEUCHT = new Set(['lampeAn', 'licht']);
// Formen in 1/16-Block: [x1, y1, z1, x2, y2, z2, farbe?, leuchtet?]
const GRUENT = '#5f8f3c';
const blume = (f) => [[7, 0, 7, 9, 7, 9, GRUENT], [6, 6, 6, 10, 10, 10, f]];
const FORMEN = {
  farn: [[2, 0, 7, 14, 11, 9, '#4f8a35'], [7, 0, 2, 9, 11, 14, '#4f8a35']],
  hohesGras: [[2, 0, 7, 14, 9, 9, '#79a648'], [7, 0, 2, 9, 9, 14, '#79a648']],
  mohn: blume('#d23a2a'), kornblume: blume('#4a6fd8'), margerite: blume('#f4f4ec'), loewenzahn: blume('#f3d23a'),
  laterne: [[5, 0, 5, 11, 7, 11, '#ffcf70', true], [6, 7, 6, 10, 9, 10, '#4b4b4b']],
  kette: [[7, 0, 7, 9, 16, 9]],
  fichteHalb: [[0, 0, 0, 16, 8, 16]],
  bankOst: [[0, 0, 0, 16, 8, 16], [8, 8, 0, 16, 16, 16]], bankWest: [[0, 0, 0, 16, 8, 16], [0, 8, 0, 8, 16, 16]],
  bankSued: [[0, 0, 0, 16, 8, 16], [0, 8, 8, 16, 16, 16]], bankNord: [[0, 0, 0, 16, 8, 16], [0, 8, 0, 16, 16, 8]],
  schildSued: [[0, 4, 0, 16, 12, 2, '#c49a65']], schildNord: [[0, 4, 14, 16, 12, 16, '#c49a65']],
  schildOst: [[0, 4, 0, 2, 12, 16, '#c49a65']], schildWest: [[14, 4, 0, 16, 12, 16, '#c49a65']],
  knopf: [[5, 0, 6, 11, 2, 10, '#888888']], knopfSued: [[5, 6, 0, 11, 10, 2, '#888888']],
  zaun: [[6, 0, 6, 10, 16, 10]],
  gitter: [[7, 0, 0, 9, 16, 16], [0, 0, 7, 16, 16, 9]],
  schieneOW: [[0, 0, 2, 16, 1, 14, '#7d6650'], [0, 1, 3, 16, 2, 5, '#9a9ea3'], [0, 1, 11, 16, 2, 13, '#9a9ea3']],
  sensor: [[0, 0, 0, 16, 6, 16, '#d8ccaf'], [3, 6, 3, 13, 7, 13, '#3c4f6a']],
};
const N = NAMEN.length;
const art = new Uint8Array(N), farbe = [], formen = [];
for (let id = 0; id < N; id++) {
  const n = NAMEN[id], hex = FARBEN[n] || BLOECKE[n][2] || '#ff00ff';
  farbe[id] = new THREE.Color(hex);
  if (n === 'luft' || n === 'sperre') art[id] = ART.LUFT;
  else if (FORMEN[n]) { art[id] = ART.FORM; formen[id] = FORMEN[n]; }
  else if (n === 'wasser') art[id] = ART.WASSER;
  else if (GLAS.has(n)) art[id] = ART.GLAS;
  else if (LEUCHT.has(n)) art[id] = ART.LEUCHT;
  else art[id] = ART.OPAK;
}
const ID_LAMPE = ID.lampeAus, ID_SENSOR = ID.sensor;
const deckt = (a) => a === ART.OPAK || a === ART.LEUCHT || a === ART.LAMPE;

/* ---------- Materialien ---------- */
// leichte Helligkeitsschwankung je Block (im Shader, damit zusammengefasste Flächen trotzdem blockig wirken)
function blockRauschen(m) {
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;\nvarying vec3 vNo;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vNo = normal;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;\nvarying vec3 vNo;\nfloat hz(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }')
      .replace('#include <color_fragment>', '#include <color_fragment>\n{ vec3 zelle = floor(vWP - vNo * 0.5 + 0.001); diffuseColor.rgb *= 0.93 + 0.12 * hz(zelle); }');
  };
  return m;
}
const MAT = {
  opak: blockRauschen(new THREE.MeshLambertMaterial({ vertexColors: true })),
  glas: new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.62, depthWrite: false, emissive: new THREE.Color('#000000') }),
  wasser: new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.78, depthWrite: false }),
  leucht: new THREE.MeshBasicMaterial({ vertexColors: true }),
  lampe: new THREE.MeshLambertMaterial({ vertexColors: true, emissive: new THREE.Color('#000000') }),
};
const GRUPPEN = ['opak', 'glas', 'wasser', 'leucht', 'lampe'];

/* ---------- Netz bauen ---------- */
class Puffer {
  constructor() { this.pos = []; this.nor = []; this.col = []; this.idx = []; this.n = 0; }
  quad(a, b, c, d, nx, ny, nz, f) {
    const p = this.pos, o = this.n;
    p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], d[0], d[1], d[2]);
    for (let k = 0; k < 4; k++) { this.nor.push(nx, ny, nz); this.col.push(f.r, f.g, f.b); }
    this.idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
    this.n += 4;
  }
  box(x1, y1, z1, x2, y2, z2, f) {
    this.quad([x2, y1, z1], [x2, y2, z1], [x2, y2, z2], [x2, y1, z2], 1, 0, 0, f);
    this.quad([x1, y1, z1], [x1, y1, z2], [x1, y2, z2], [x1, y2, z1], -1, 0, 0, f);
    this.quad([x1, y2, z1], [x1, y2, z2], [x2, y2, z2], [x2, y2, z1], 0, 1, 0, f);
    this.quad([x1, y1, z1], [x2, y1, z1], [x2, y1, z2], [x1, y1, z2], 0, -1, 0, f);
    this.quad([x1, y1, z2], [x2, y1, z2], [x2, y2, z2], [x1, y2, z2], 0, 0, 1, f);
    this.quad([x1, y1, z1], [x1, y2, z1], [x2, y2, z1], [x2, y1, z1], 0, 0, -1, f);
  }
  geometrie() {
    if (!this.n) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setIndex(this.n > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    g.computeBoundingSphere();
    return g;
  }
}

/* welt: Welt mit .daten/.bereich; region = [ax, ay, az, bx, by, bz] (liegt innerhalb der Welt).
 * Gezeichnet wird alles in der Region; Nachbarn außerhalb kommen aus der Welt. Rechnet direkt auf dem Datenfeld. */
export function vernetze(welt, region) {
  const B = welt.bereich, D = welt.daten, sy = B.nx * B.nz, STR = [1, sy, B.nx];
  const MIN = [B.x0, B.y0, B.z0], MAX = [B.x0 + B.nx - 1, B.y0 + B.ny - 1, B.z0 + B.nz - 1];
  const idx = (x, y, z) => ((y - B.y0) * B.nz + (z - B.z0)) * B.nx + (x - B.x0);
  const klasse = (id, k, y) => (id === ID_LAMPE && y < MAX[1] && D[k + sy] === ID_SENSOR ? ART.LAMPE : art[id]);
  const P = Object.fromEntries(GRUPPEN.map((g) => [g, new Puffer()]));
  const lampen = { immer: [], nacht: [] };
  const [ax, ay, az, bx, by, bz] = region, lo = [ax, ay, az], L = [bx - ax + 1, by - ay + 1, bz - az + 1];
  const basis = idx(ax, ay, az);
  for (let d = 0; d < 3; d++) {
    const u = (d + 1) % 3, v = (d + 2) % 3, Lu = L[u], Lv = L[v], Sd = STR[d], Su = STR[u], Sv = STR[v];
    const maske = new Int32Array(Lu * Lv);
    for (const vz of [1, -1]) {
      for (let s = 0; s < L[d]; s++) {
        const c = lo[d] + s, cn = c + vz, nachbarDa = cn >= MIN[d] && cn <= MAX[d];
        let leer = true;
        for (let j = 0; j < Lv; j++) {
          let k = basis + s * Sd + j * Sv;
          for (let i = 0; i < Lu; i++, k += Su) {
            const id = D[k];
            let wert = 0;
            if (id) {
              const y = d === 1 ? c : u === 1 ? ay + i : ay + j;
              const kl = klasse(id, k, y);
              if (kl !== ART.LUFT && kl !== ART.FORM) {
                const nid = nachbarDa ? D[k + vz * Sd] : 0;
                const nk = nid ? klasse(nid, k + vz * Sd, d === 1 ? y + vz : y) : ART.LUFT;
                const sicht = deckt(kl) ? !deckt(nk) : (!deckt(nk) && nid !== id);
                if (sicht) wert = (id + 1) | (kl << 9);
              }
            }
            maske[j * Lu + i] = wert;
            if (wert) leer = false;
          }
        }
        if (leer) continue;
        // Rechtecke zusammenfassen
        for (let j = 0; j < Lv; j++) for (let i = 0; i < Lu;) {
          const w0 = maske[j * Lu + i];
          if (!w0) { i++; continue; }
          let w = 1; while (i + w < Lu && maske[j * Lu + i + w] === w0) w++;
          let h = 1;
          aussen: for (; j + h < Lv; h++) for (let q = 0; q < w; q++) if (maske[(j + h) * Lu + i + q] !== w0) break aussen;
          for (let a = 0; a < h; a++) for (let q = 0; q < w; q++) maske[(j + a) * Lu + i + q] = 0;
          const id = (w0 & 511) - 1, kl = w0 >> 9, f = farbe[id];
          const ebene = c + (vz > 0 ? 1 : 0);
          const ecke = (du, dv) => { const p = [0, 0, 0]; p[d] = ebene; p[u] = lo[u] + i + du; p[v] = lo[v] + j + dv; return p; };
          const n = [0, 0, 0]; n[d] = vz;
          const buf = kl === ART.GLAS ? P.glas : kl === ART.WASSER ? P.wasser : kl === ART.LEUCHT ? P.leucht : kl === ART.LAMPE ? P.lampe : P.opak;
          if (vz > 0) buf.quad(ecke(0, 0), ecke(w, 0), ecke(w, h), ecke(0, h), n[0], n[1], n[2], f);
          else buf.quad(ecke(0, 0), ecke(0, h), ecke(w, h), ecke(w, 0), n[0], n[1], n[2], f);
          i += w;
        }
      }
    }
  }
  // Formen (Pflanzen, Bänke, Schilder, Laternen …) und Lichtquellen
  for (let y = ay; y <= by; y++) for (let z = az; z <= bz; z++) {
    let k = idx(ax, y, z);
    for (let x = ax; x <= bx; x++, k++) {
      const id = D[k];
      if (!id) continue;
      const kl = klasse(id, k, y);
      if (kl === ART.LEUCHT && y <= S + 8) lampen.immer.push([x + 0.5, z + 0.5]);
      if (kl === ART.LAMPE) lampen.nacht.push([x + 0.5, z + 0.5]);
      if (kl !== ART.FORM) continue;
      for (const [x1, y1, z1, x2, y2, z2, hex, leucht] of formen[id]) {
        const f = hex ? new THREE.Color(hex) : farbe[id];
        (leucht ? P.leucht : P.opak).box(x + x1 / 16, y + y1 / 16, z + z1 / 16, x + x2 / 16, y + y2 / 16, z + z2 / 16, f);
        if (leucht) lampen.immer.push([x + 0.5, z + 0.5]);
      }
    }
  }
  const geo = {};
  for (const g of GRUPPEN) geo[g] = P[g].geometrie();
  return { geo, lampen };
}

/* ---------- Szene ---------- */
const SONNE = new THREE.Vector3(-0.45, 1, 0.55).normalize();
export const KAMERA_START = { ziel: [16, 64, 16], zoom: 92, azimut: 45, hoehe: 36 };
const leicht = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export class Ansicht {
  constructor(container) {
    this.container = container;
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    r.setClearColor(0x000000, 0);
    r.shadowMap.enabled = true;
    r.shadowMap.autoUpdate = false;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    container.append(r.domElement);
    Object.assign(r.domElement.style, { width: '100%', height: '100%', display: 'block', touchAction: 'none' });

    const sc = this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -400, 800);
    this.hemi = new THREE.HemisphereLight('#ffffff', '#9a9384', 1.55);
    sc.add(this.hemi);
    const sonne = this.sonne = new THREE.DirectionalLight('#fff4e2', 2.3);
    sonne.castShadow = true;
    sonne.shadow.mapSize.set(2048, 2048);
    Object.assign(sonne.shadow.camera, { left: -125, right: 125, top: 125, bottom: -125, near: 1, far: 420 });
    sonne.shadow.bias = -0.0008; sonne.shadow.normalBias = 0.04;
    sonne.position.copy(SONNE).multiplyScalar(200).add(new THREE.Vector3(16, 64, 16));
    sonne.target.position.set(16, 64, 16);
    sc.add(sonne, sonne.target);

    this.netze = new Map();           // 'basis' | Bereich → { gruppe, lampen }
    this.zustand = {};
    this.welt = null;
    this.nacht = false;
    this.regen = null;
    this.statistik = { bilder: 0, schatten: 0, netzbau: 0 };

    this.kam = { ...KAMERA_START, ziel: [...KAMERA_START.ziel] };
    this.flug = null;
    this._lichtkreise();
    this._regenTeilchen();
    this._wasserFlaechen();
    this.wege = new THREE.Group(); sc.add(this.wege);
    this.markierung = new THREE.Group(); sc.add(this.markierung);
    this._bedienung();
    this.resize();
    new ResizeObserver(() => this.resize()).observe(container);
    this.laeuft = false;
    this.anfordern();
  }

  /* --- Stadt --- */
  setzeStadt(welt, zustand) {
    // welt: 3D-Welt mit allen Entscheidungen (aus stadtFuer); einmal alles bauen
    this.welt = welt;
    this.zustand = { ...zustand };
    for (const [, n] of this.netze) this._entsorgen(n);
    this.netze.clear();
    // festes Netz: Stadt ohne Bauflächen (dort Luft – Nachbarflächen werden dann sicher gezeichnet, nie Löcher)
    const B = BEREICH_3D, basis = new Welt(B);
    basis.daten.set(welt.daten);
    for (const id of BEREICH_IDS) {
      const [a, b, c, d, e, f] = boxVon(id);
      for (let y = Math.max(b, B.y0); y <= Math.min(e, B.y0 + B.ny - 1); y++) for (let z = c; z <= f; z++) {
        const k = ((y - B.y0) * B.nz + (z - B.z0)) * B.nx + (a - B.x0);
        basis.daten.fill(0, k, k + d - a + 1);
      }
    }
    this._netzSetzen('basis', vernetze(basis, [B.x0, B.y0, B.z0, B.x0 + B.nx - 1, B.y0 + B.ny - 1, B.z0 + B.nz - 1]));
    for (const id of BEREICH_IDS) this._bereichNetz(id);
    this._lichtkreiseNeu();
    this.schattenNeu = true;
    this.anfordern();
  }
  setzeBereich(id, variante, welt) {
    // welt enthält die neue Variante bereits; nur diese Fläche (und direkte Nachbarflächen) neu vernetzen
    this.welt = welt;
    this.zustand[id] = variante;
    this._bereichNetz(id);
    const [a, , c, d, , f] = boxVon(id);
    for (const n of BEREICH_IDS) {
      if (n === id) continue;
      const [a2, , c2, d2, , f2] = boxVon(n);
      if (a2 <= d + 1 && d2 >= a - 1 && c2 <= f + 1 && f2 >= c - 1) this._bereichNetz(n);
    }
    this._lichtkreiseNeu();
    this.schattenNeu = true;
    this.anfordern();
  }
  _bereichNetz(id) {
    const b = boxVon(id);
    this._netzSetzen(id, vernetze(this.welt, b));
  }
  _netzSetzen(name, { geo, lampen }) {
    const alt = this.netze.get(name);
    if (alt) this._entsorgen(alt);
    const gruppe = new THREE.Group();
    for (const g of GRUPPEN) {
      if (!geo[g]) continue;
      const m = new THREE.Mesh(geo[g], MAT[g]);
      m.castShadow = g === 'opak' || g === 'lampe';
      m.receiveShadow = g !== 'leucht';
      m.matrixAutoUpdate = false;
      if (g === 'glas' || g === 'wasser') m.renderOrder = 2;
      gruppe.add(m);
    }
    this.scene.add(gruppe);
    this.netze.set(name, { gruppe, lampen });
    this.statistik.netzbau++;
  }
  _entsorgen(n) { this.scene.remove(n.gruppe); n.gruppe.traverse((o) => o.geometry && o.geometry.dispose()); }

  /* --- Tag und Nacht --- */
  setzeNacht(an) {
    this.nacht = !!an;
    this.container.classList.toggle('nacht', this.nacht);
    this.hemi.intensity = an ? 0.42 : 1.55;
    this.hemi.color.set(an ? '#9fb3d9' : '#ffffff');
    this.sonne.intensity = an ? 0.35 : 2.3;
    this.sonne.color.set(an ? '#9db4e8' : '#fff4e2');
    MAT.glas.emissive.set(an ? '#5a4520' : '#000000');
    MAT.lampe.emissive.set(an ? '#ffd986' : '#000000');
    this._lichtkreiseNeu();
    this.schattenNeu = true;
    this.anfordern();
  }
  _lichtkreise() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), v = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    v.addColorStop(0, 'rgba(255,214,140,0.95)'); v.addColorStop(0.45, 'rgba(255,200,120,0.4)'); v.addColorStop(1, 'rgba(255,190,110,0)');
    g.fillStyle = v; g.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    this.kreisMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    this.kreisGeo = new THREE.PlaneGeometry(7, 7).rotateX(-Math.PI / 2);
    this.kreise = new THREE.InstancedMesh(this.kreisGeo, this.kreisMat, 400);
    this.kreise.count = 0; this.kreise.renderOrder = 3; this.kreise.frustumCulled = false;
    this.scene.add(this.kreise);
  }
  _lichtkreiseNeu() {
    const pos = [];
    if (this.nacht) for (const [, n] of this.netze) pos.push(...n.lampen.immer, ...n.lampen.nacht);
    const m = new THREE.Matrix4();
    const k = Math.min(pos.length, 400);
    for (let i = 0; i < k; i++) { m.makeTranslation(pos[i][0], S + 0.04, pos[i][1]); this.kreise.setMatrixAt(i, m); }
    this.kreise.count = k;
    this.kreise.instanceMatrix.needsUpdate = true;
    this.lampenZahl = { immer: [...this.netze.values()].reduce((n, x) => n + x.lampen.immer.length, 0), nacht: [...this.netze.values()].reduce((n, x) => n + x.lampen.nacht.length, 0) };
  }

  /* --- Regen (Mission Natur, vereinfachte Darstellung) --- */
  _regenTeilchen() {
    const n = this.regenZahl = 1800, pos = new Float32Array(n * 6);
    this.regenPos = pos; this.regenGeo = new THREE.BufferGeometry();
    this.regenGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.regenLinien = new THREE.LineSegments(this.regenGeo, new THREE.LineBasicMaterial({ color: '#e3eefc', transparent: true, opacity: 0.7 }));
    this.regenLinien.frustumCulled = false; this.regenLinien.visible = false;
    this.scene.add(this.regenLinien);
    const r = Math.random;
    for (let i = 0; i < n; i++) { const x = -10 + r() * 52, z = -10 + r() * 52, y = S + r() * 40; pos.set([x, y, z, x - 0.15, y + 1.1, z + 0.1], i * 6); }
  }
  _wasserFlaechen() {
    // Wasserkörper stehen auf ihrem Boden (y0) und wachsen nach oben (Höhe h über scale.y)
    const m = new THREE.MeshLambertMaterial({ color: '#4f98d6', transparent: true, opacity: 0.72, depthWrite: false });
    const koerper = (x1, z1, x2, z2, y0) => {
      const me = new THREE.Mesh(new THREE.BoxGeometry(x2 - x1 + 1, 1, z2 - z1 + 1).translate(0, 0.5, 0), m);
      me.position.set((x1 + x2 + 1) / 2, y0, (z1 + z2 + 1) / 2); me.visible = false; me.renderOrder = 2; me.scale.y = 0.01;
      this.scene.add(me); return me;
    };
    const [mx1, mz1, mx2, mz2] = GRUEN_TEILE.mulde, [tx1, tz1, tx2, tz2] = GRUEN_TEILE.tieferSpielbereich;
    this.wasser = {
      mulde: koerper(mx1, mz1, mx2, mz2, BODEN),                       // Muldenboden: Oberkante y 63
      tiefInnen: koerper(tx1 + 1, tz1 + 1, tx2 - 1, tz2 - 1, BODEN - 1), // tiefer Spielbereich innen: Oberkante y 62
      tiefRand: koerper(tx1, tz1, tx2, tz2, BODEN),
      pfuetzen: [[8, 16], [24, 16], [16, 8], [16, 24], [5, 26], [26, 5]].map(([x, z]) => koerper(x - 2, z - 2, x + 2, z + 2, S)),
    };
  }
  setzeRegen(modus) {
    // modus: null | 'grau' | 'gruen' – der Wasserstand steigt mit der Zeit (gerafft, ohne Mengenangaben)
    this.regen = modus ? { modus, t0: performance.now() } : null;
    this.regenLinien.visible = !!modus;
    this.container.classList.toggle('regen', !!modus);
    this.hemi.intensity = modus ? 1.05 : (this.nacht ? 0.42 : 1.55);
    this.sonne.intensity = modus ? 0.9 : (this.nacht ? 0.35 : 2.3);
    for (const me of [this.wasser.mulde, this.wasser.tiefInnen, this.wasser.tiefRand, ...this.wasser.pfuetzen]) me.visible = false;
    this.schattenNeu = true;
    this.anfordern();
  }
  _regenBewegen(dt, jetzt) {
    if (!this.regen) return false;
    const p = this.regenPos, n = this.regenZahl, f = 46 * dt;
    for (let i = 0; i < n; i++) {
      const o = i * 6;
      p[o + 1] -= f; p[o + 4] -= f;
      if (p[o + 1] < S) { const y = S + 38 + Math.random() * 4; p[o + 1] = y; p[o + 4] = y + 1.1; }
    }
    this.regenGeo.attributes.position.needsUpdate = true;
    const t = Math.min(1, (jetzt - this.regen.t0) / 12000);
    const W = this.wasser, hoch = (me, h) => { me.visible = h > 0.02; me.scale.y = Math.max(0.01, h); };
    if (this.regen.modus === 'gruen') {
      hoch(W.mulde, Math.min(1, t * 1.6) * 0.85);
      hoch(W.tiefInnen, Math.min(1, t * 2) * 0.98);
      hoch(W.tiefRand, Math.max(0, t * 2 - 1) * 0.8);
    } else {
      W.pfuetzen.forEach((me, k) => { me.visible = true; const g = 0.3 + 0.7 * Math.min(1, t * (1.4 - k * 0.1)); me.scale.set(g, 0.06, g); });
    }
    return true;
  }

  /* --- Wege (Wegsteine wie im Kollegen-Konfigurator) --- */
  setzeWege(liste) {
    for (const c of [...this.wege.children]) { this.wege.remove(c); c.geometry.dispose(); }
    for (const { punkte, farbe: hex, start: startHex } of liste || []) {
      if (!punkte || !punkte.length) continue;
      const g = new THREE.BoxGeometry(0.74, 0.14, 0.74);
      const m = new THREE.InstancedMesh(g, new THREE.MeshBasicMaterial({ color: hex }), punkte.length);
      const mat = new THREE.Matrix4();
      punkte.forEach(([x, z], k) => { mat.makeTranslation(x + 0.5, S + 0.07, z + 0.5); m.setMatrixAt(k, mat); });
      m.frustumCulled = false;
      this.wege.add(m);
      const ende = punkte[punkte.length - 1], start = punkte[0];
      for (const [x, z, h, c] of [[start[0], start[1], 3.2, startHex || hex], [ende[0], ende[1], 3.2, hex]]) {
        const s = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, h, 10).translate(x + 0.5, S + h / 2, z + 0.5), new THREE.MeshBasicMaterial({ color: c }));
        this.wege.add(s);
      }
    }
    this.anfordern();
  }

  /* --- Hervorhebung der Bauflächen --- */
  setzeMarkierung(ids, hex = '#ffc15e') {
    for (const c of [...this.markierung.children]) { this.markierung.remove(c); c.geometry.dispose(); }
    const mat = new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.9, depthWrite: false });
    for (const id of ids || []) {
      const [a, , c, d, , f] = boxVon(id), x1 = a - 0.25, x2 = d + 1.25, z1 = c - 0.25, z2 = f + 1.25, y = S + 0.12, b = 0.45;
      for (const [xa, za, xb, zb] of [[x1, z1, x2, z1 + b], [x1, z2 - b, x2, z2], [x1, z1, x1 + b, z2], [x2 - b, z1, x2, z2]]) {
        const g = new THREE.BoxGeometry(xb - xa, 0.1, zb - za).translate((xa + xb) / 2, y, (za + zb) / 2);
        const me = new THREE.Mesh(g, mat); me.renderOrder = 4; this.markierung.add(me);
      }
    }
    this.anfordern();
  }

  /* --- Kamera --- */
  kamera(ziel, sofort = false) {
    const z = { ziel: [...(ziel.ziel || this.kam.ziel)], zoom: ziel.zoom ?? this.kam.zoom, azimut: ziel.azimut ?? this.kam.azimut, hoehe: ziel.hoehe ?? this.kam.hoehe };
    if (sofort) { this.kam = z; this.flug = null; this._kameraSetzen(); this.anfordern(); return; }
    let da = ((z.azimut - this.kam.azimut + 540) % 360) - 180;
    this.flug = { von: { ...this.kam, ziel: [...this.kam.ziel] }, nach: { ...z, azimut: this.kam.azimut + da }, t0: performance.now(), dauer: 1100 };
    this.anfordern();
  }
  // Kamera wie „vorlage“ (Blickrichtung bleibt), aber Ziel und Zoom so, dass der Quader box in das
  // Bildschirmrechteck rect = [links, oben, rechts, unten] (CSS-Pixel) passt. Reine Rechnung, ändert die Kamera nicht.
  passend(vorlage, box, rect) {
    const alt = this.kam, punkte = [];
    for (const x of [box[0], box[3] + 1]) for (const y of [box[1], box[4] + 1]) for (const z of [box[2], box[5] + 1]) punkte.push(new THREE.Vector3(x, y, z));
    const huelle = () => {
      this._kameraSetzen();
      let l = Infinity, o = Infinity, r = -Infinity, u = -Infinity;
      for (const p of punkte) { const q = this.projiziere(p.x, p.y, p.z); l = Math.min(l, q.x); r = Math.max(r, q.x); o = Math.min(o, q.y); u = Math.max(u, q.y); }
      return { l, o, r, u };
    };
    const k = { ziel: [...vorlage.ziel], zoom: vorlage.zoom, azimut: vorlage.azimut, hoehe: vorlage.hoehe };
    try {
      for (let i = 0; i < 6; i++) {
        this.kam = k;
        let h = huelle();
        k.zoom /= Math.min((rect[2] - rect[0]) / (h.r - h.l), (rect[3] - rect[1]) / (h.u - h.o));
        h = huelle();
        const proPx = (2 * k.zoom) / this.hoehePx, e = this.camera.matrixWorld.elements;
        const dx = ((h.l + h.r) / 2 - (rect[0] + rect[2]) / 2) * proPx, dy = ((h.o + h.u) / 2 - (rect[1] + rect[3]) / 2) * proPx;
        k.ziel = k.ziel.map((v, j) => v + e[j] * dx - e[4 + j] * dy);
      }
    } finally { this.kam = alt; this._kameraSetzen(); }
    return k;
  }
  _kameraSetzen() {
    const k = this.kam, a = THREE.MathUtils.degToRad(k.azimut), e = THREE.MathUtils.degToRad(k.hoehe);
    const dir = new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
    const z = new THREE.Vector3(...k.ziel);
    this.camera.position.copy(z).addScaledVector(dir, 300);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(z);
    const w = this.breite || 16, h = this.hoehePx || 9, H = k.zoom, W = H * (w / h), o = (this.versatz || 0) * H;
    Object.assign(this.camera, { left: -W, right: W, top: H - o, bottom: -H - o });
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
  }
  _flugBewegen(jetzt) {
    if (!this.flug) return false;
    const { von, nach, t0, dauer } = this.flug, t = Math.min(1, (jetzt - t0) / dauer), e = leicht(t);
    this.kam = {
      ziel: von.ziel.map((v, i) => v + (nach.ziel[i] - v) * e),
      zoom: Math.exp(Math.log(von.zoom) + (Math.log(nach.zoom) - Math.log(von.zoom)) * e),
      azimut: von.azimut + (nach.azimut - von.azimut) * e,
      hoehe: von.hoehe + (nach.hoehe - von.hoehe) * e,
    };
    if (t >= 1) { this.flug = null; this.kam.azimut = ((this.kam.azimut % 360) + 360) % 360; }
    this._kameraSetzen();
    return true;
  }
  _bedienung() {
    const el = this.renderer.domElement;
    let zug = null;
    el.addEventListener('pointerdown', (e) => { zug = { x: e.clientX, y: e.clientY, schieben: e.button === 2 || e.shiftKey }; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', (e) => {
      if (!zug) return;
      const dx = e.clientX - zug.x, dy = e.clientY - zug.y; zug.x = e.clientX; zug.y = e.clientY;
      this.flug = null;
      if (zug.schieben) {
        const s = (this.kam.zoom * 2) / (this.hoehePx || 1), a = THREE.MathUtils.degToRad(this.kam.azimut);
        const rechts = [Math.cos(a), 0, -Math.sin(a)], vor = [-Math.sin(a), 0, -Math.cos(a)];
        this.kam.ziel = this.kam.ziel.map((v, i) => v - rechts[i] * dx * s + vor[i] * dy * s * 1.4);
      } else {
        this.kam.azimut -= dx * 0.35;
        this.kam.hoehe = Math.max(14, Math.min(82, this.kam.hoehe + dy * 0.25));
      }
      this._kameraSetzen(); this.anfordern();
    });
    const ende = () => { zug = null; };
    el.addEventListener('pointerup', ende); el.addEventListener('pointercancel', ende);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    el.addEventListener('wheel', (e) => { e.preventDefault(); this.flug = null; this.kam.zoom = Math.max(6, Math.min(130, this.kam.zoom * (e.deltaY > 0 ? 1.12 : 1 / 1.12))); this._kameraSetzen(); this.anfordern(); }, { passive: false });
  }
  // Bild nach oben schieben, wenn unten Karten liegen (Anteil der halben Bildhöhe)
  setzeVersatz(v) { if (this.versatz === v) return; this.versatz = v; this._kameraSetzen(); this.anfordern(); }
  projiziere(x, y, z) {
    const v = new THREE.Vector3(x, y, z).project(this.camera);
    return { x: (v.x + 1) / 2 * this.breite, y: (1 - v.y) / 2 * this.hoehePx, sichtbar: v.x > -1.05 && v.x < 1.05 && v.y > -1.05 && v.y < 1.05 };
  }

  /* --- Zeichnen --- */
  resize() {
    const w = this.container.clientWidth || 16, h = this.container.clientHeight || 9;
    this.breite = w; this.hoehePx = h;
    this.renderer.setSize(w, h, false);
    this._kameraSetzen();
    this.anfordern();
    if (this.nachResize) this.nachResize();
  }
  anfordern() {
    this.dirty = true;
    if (this.laeuft) return;
    this.laeuft = true;
    this.zuletzt = performance.now();
    requestAnimationFrame((t) => this._schleife(t));
  }
  _schleife(jetzt) {
    const dt = Math.min(0.05, (jetzt - this.zuletzt) / 1000); this.zuletzt = jetzt;
    let bewegt = this._flugBewegen(jetzt);
    bewegt = this._regenBewegen(dt, jetzt) || bewegt;
    if (this.dirty || bewegt) {
      if (this.schattenNeu) { this.renderer.shadowMap.needsUpdate = true; this.schattenNeu = false; this.statistik.schatten++; }
      this.renderer.render(this.scene, this.camera);
      this.statistik.bilder++;
      this.dirty = false;
      if (this.nachBild) this.nachBild();
    }
    if (bewegt || this.dirty) requestAnimationFrame((t) => this._schleife(t));
    else this.laeuft = false;
  }

  /* --- Vorschaubilder für die Abstimmungskarten (aus denselben Blöcken) --- */
  vorschaubild(id, variante, breite = 520, hoehe = 300) {
    const t = vorlage(id, variante), box = boxVon(id), [nx, ny, nz] = groesseVon(id);
    const w = new Welt({ x0: box[0], y0: box[1], z0: box[2], nx, ny, nz });
    w.daten.set(t.daten);
    const { geo } = vernetze(w, box);
    const sc = new THREE.Scene();
    sc.add(new THREE.HemisphereLight('#ffffff', '#9a9384', 1.7));
    const so = new THREE.DirectionalLight('#fff4e2', 2.1); so.position.copy(SONNE).multiplyScalar(100); sc.add(so);
    const meshes = [];
    for (const g of GRUPPEN) if (geo[g]) { const m = new THREE.Mesh(geo[g], g === 'lampe' ? MAT.opak : MAT[g]); sc.add(m); meshes.push(m); }
    // Bildausschnitt: alle Ecken vom Boden bis zum höchsten Block einpassen
    let oben = 0;
    for (let y = t.dy - 1; y >= 0 && !oben; y--) for (let k = y * t.dx * t.dz, e2 = k + t.dx * t.dz; k < e2; k++) if (t.daten[k]) { oben = y; break; }
    const y1 = box[1], y2 = box[1] + oben + 1;
    const cx = (box[0] + box[3] + 1) / 2, cz = (box[2] + box[5] + 1) / 2, cy = (y1 + y2) / 2;
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -400, 800);
    const a = THREE.MathUtils.degToRad(45), e = THREE.MathUtils.degToRad(33);
    cam.position.set(cx + Math.sin(a) * Math.cos(e) * 200, cy + Math.sin(e) * 200, cz + Math.cos(a) * Math.cos(e) * 200);
    cam.lookAt(cx, cy, cz); cam.updateMatrixWorld();
    const inv = cam.matrixWorldInverse, v = new THREE.Vector3();
    let xa = Infinity, xb = -Infinity, ya = Infinity, yb = -Infinity;
    for (const x of [box[0], box[3] + 1]) for (const y of [y1, y2]) for (const z of [box[2], box[5] + 1]) {
      v.set(x, y, z).applyMatrix4(inv); xa = Math.min(xa, v.x); xb = Math.max(xb, v.x); ya = Math.min(ya, v.y); yb = Math.max(yb, v.y);
    }
    const asp = breite / hoehe, rand = 1.06;
    let W = (xb - xa) / 2 * rand, H = (yb - ya) / 2 * rand;
    if (W / H > asp) H = W / asp; else W = H * asp;
    const mx = (xa + xb) / 2, my = (ya + yb) / 2;
    Object.assign(cam, { left: mx - W, right: mx + W, top: my + H, bottom: my - H }); cam.updateProjectionMatrix();
    const rt = new THREE.WebGLRenderTarget(breite, hoehe, { samples: 4 });
    rt.texture.colorSpace = THREE.SRGBColorSpace;
    const r = this.renderer, alt = r.getRenderTarget(), schatten = r.shadowMap.enabled;
    r.shadowMap.enabled = false;
    r.setRenderTarget(rt); r.setClearColor(0x000000, 0); r.clear(); r.render(sc, cam);
    const px = new Uint8Array(breite * hoehe * 4);
    r.readRenderTargetPixels(rt, 0, 0, breite, hoehe, px);
    r.setRenderTarget(alt); r.shadowMap.enabled = schatten;
    rt.dispose(); for (const m of meshes) m.geometry.dispose();
    const c = document.createElement('canvas'); c.width = breite; c.height = hoehe;
    const g = c.getContext('2d'), bild = g.createImageData(breite, hoehe);
    for (let y = 0; y < hoehe; y++) bild.data.set(px.subarray((hoehe - 1 - y) * breite * 4, (hoehe - y) * breite * 4), y * breite * 4);
    g.putImageData(bild, 0, 0);
    return c.toDataURL('image/png');
  }

  info() {
    let dreiecke = 0, netze = 0;
    this.scene.traverse((o) => { if (o.isMesh && o.geometry.index) { dreiecke += o.geometry.index.count / 3; netze++; } });
    return { ...this.statistik, aufrufe: this.renderer.info.render.calls, dreiecke: Math.round(dreiecke), netze, geometrien: this.renderer.info.memory.geometries, texturen: this.renderer.info.memory.textures, lampen: this.lampenZahl, nacht: this.nacht, zustand: { ...this.zustand } };
  }
}
