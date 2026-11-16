/* 3D-Darstellung (Three.js, Low-Poly). Liest nur den Zustand der Simulation, verändert ihn nie. */
import * as THREE from '../lib/three.module.min.js';
import { ROT, ROTGELB, GRUEN, GELB } from './sim.js';

export function webglMoeglich() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

const FARBE = {
  himmel: '#bfe3f2', wiese: '#8ccf9c', gehweg: '#d9e0ea', strasse: '#4b5563', markierung: '#f8fafc',
  mast: '#64748b', gehaeuse: '#1f2937', bus: '#f5a524', glas: '#cfeefa', reifen: '#1f2430',
  rot: '#ff3b30', gelb: '#ffcc00', gruen: '#22e36b', funk: '#22d3ee',
};

const mat = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra });

function haloTextur() {
  const s = 128, c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.25, 'rgba(255,255,255,.75)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function textTextur(text, { w = 512, h = 160, bg = '#fff7e0', fg = '#1f2937', font = 'bold 110px system-ui, Segoe UI, sans-serif' } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = bg;
  const r = 28;
  g.beginPath();
  g.roundRect ? g.roundRect(6, 6, w - 12, h - 12, r) : g.rect(6, 6, w - 12, h - 12);
  g.fill();
  g.fillStyle = fg;
  g.font = font;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2 + 6);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const fensterCache = new Map();
function fensterTextur(wand) {
  if (fensterCache.has(wand)) return fensterCache.get(wand);
  const s = 64, c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  g.fillStyle = wand;
  g.fillRect(0, 0, s, s);
  g.fillStyle = '#f4f9fc';
  g.fillRect(16, 14, 32, 36);
  g.fillStyle = 'rgba(30,41,59,.18)';
  g.fillRect(16, 30, 32, 3);
  g.fillRect(30.5, 14, 3, 36);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  fensterCache.set(wand, t);
  return t;
}

export class Szene3D {
  constructor(container, sim, c) {
    this.c = c;
    this.sim = sim;
    this.container = container;
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    container.append(r.domElement);

    const sc = this.scene = new THREE.Scene();
    sc.background = new THREE.Color(FARBE.himmel);
    sc.fog = new THREE.Fog(FARBE.himmel, 150, 300);

    // feste, leicht schräge Kamera – keine Fahrten
    // Blick etwas nach links versetzt: Der Bus kommt von links und bleibt die ganze Zeit im Bild
    this.camera = new THREE.PerspectiveCamera(34, 16 / 9, 1, 700);
    this.camera.position.set(-9, 50, 62);
    this.camera.lookAt(-9, 0, -1);

    sc.add(new THREE.HemisphereLight('#ffffff', '#7fa889', 1.6));
    const sonne = new THREE.DirectionalLight('#fff3df', 2.4);
    sonne.position.set(-45, 90, 55);
    sonne.castShadow = true;
    sonne.shadow.mapSize.set(2048, 2048);
    Object.assign(sonne.shadow.camera, { left: -95, right: 95, top: 80, bottom: -80, near: 10, far: 260 });
    sonne.shadow.bias = -0.0006;
    sc.add(sonne);

    this.halo = haloTextur();
    this._welt();
    this._ampeln();
    this._funk();
    this.fahrzeugMeshes = new Map();
    this.resize();
  }

  _box(w, h, d, m, x, y, z, schatten = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    mesh.castShadow = schatten;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    return mesh;
  }

  _welt() {
    const B = this.c.strasse.breite, hb = B / 2, L = 140, gw = 3.2;
    const wiese = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat(FARBE.wiese));
    wiese.rotation.x = -Math.PI / 2;
    wiese.receiveShadow = true;
    this.scene.add(wiese);

    const geh = mat(FARBE.gehweg), str = mat(FARBE.strasse), wei = mat(FARBE.markierung);
    // Gehwege (Querstraße ohne Kreuzungsbereich, damit nichts flimmert)
    this._box(2 * L, 0.12, B + 2 * gw, geh, 0, 0.06, 0, false);
    for (const s of [-1, 1]) this._box(B + 2 * gw, 0.12, L - hb - gw, geh, 0, 0.06, s * (hb + gw + (L - hb - gw) / 2), false);
    // Fahrbahnen
    this._box(2 * L, 0.16, B, str, 0, 0.08, 0, false);
    for (const s of [-1, 1]) this._box(B, 0.16, L - hb, str, 0, 0.08, s * (hb + (L - hb) / 2), false);

    const y = 0.17;
    const h = this.c.strasse.halteAbstand;
    // Mittellinien gestrichelt
    for (let d = h + 4; d < L; d += 6) {
      for (const s of [-1, 1]) {
        this._box(3, 0.02, 0.22, wei, s * (d + 1.5), y, 0, false);
        this._box(0.22, 0.02, 3, wei, 0, y, s * (d + 1.5), false);
      }
    }
    // Haltelinien (je rechte Fahrbahnhälfte)
    this._box(0.5, 0.02, hb, wei, -h, y, hb / 2, false);
    this._box(0.5, 0.02, hb, wei, h, y, -hb / 2, false);
    this._box(hb, 0.02, 0.5, wei, -hb / 2, y, -h, false);
    this._box(hb, 0.02, 0.5, wei, hb / 2, y, h, false);
    // Zebrastreifen zwischen Haltelinie und Kreuzung
    const zMitte = (hb + h - 0.5) / 2 + 0.25, zLang = h - hb - 1.6;
    for (let q = -hb + 0.55; q < hb - 0.3; q += 1.0) {
      for (const s of [-1, 1]) {
        this._box(zLang, 0.02, 0.5, wei, s * zMitte, y, q, false);
        this._box(0.5, 0.02, zLang, wei, q, y, s * zMitte, false);
      }
    }

    // Häuser (hinten höher, vorn niedriger – verdecken die Kreuzung nicht)
    const haeuser = [
      [-58, -26, 12, 9, 14, '#9cc5d6'], [-42, -24, 10, 8, 18, '#b9d7d3'], [-26, -25, 11, 9, 12, '#cfe0ea'],
      [24, -25, 12, 9, 16, '#a8c3e0'], [40, -26, 10, 9, 11, '#f2d0a9'], [56, -24, 12, 8, 19, '#b9d7d3'],
      [-14, -46, 12, 10, 22, '#a8c3e0'], [14, -48, 14, 10, 26, '#9cc5d6'],
      [-50, 22, 12, 8, 6, '#e9c6b8'], [-30, 24, 9, 8, 7, '#cfe0ea'], [30, 23, 11, 8, 6, '#f2d0a9'], [50, 22, 10, 8, 7, '#b9d7d3'],
    ];
    for (const [x, z, w, d, hh, farbe] of haeuser) this._haus(x, z, w, d, hh, farbe);

    // Bäume
    const baeume = [
      [-16, -11], [-30, -11.5], [-46, -11], [-62, -11.5], [17, -11], [31, -11.5], [47, -11], [63, -11.5],
      [-18, 11.5], [-36, 11], [-56, 11.5], [19, 11], [38, 11.5], [58, 11],
      [-11, -18], [-11, -34], [11, -20], [11, -36], [-11.5, 18], [11.5, 19], [-12, 32], [12, 34],
      [-70, -40], [72, -38], [-66, 36], [70, 34], [-36, -40], [38, -42],
    ];
    const kronen = ['#3f9d55', '#4caf50', '#2f855a', '#57b86a'];
    baeume.forEach(([x, z], i) => this._baum(x, z, 0.85 + ((i * 37) % 10) / 25, kronen[i % kronen.length]));
  }

  _haus(x, z, w, d, h, farbe) {
    const t = fensterTextur(farbe);
    const seite = (n, m) => { const tx = t.clone(); tx.needsUpdate = true; tx.repeat.set(Math.max(1, Math.round(n / 3.2)), Math.max(1, Math.round(m / 3.2))); return mat('#ffffff', { map: tx }); };
    const dach = mat('#e2e8f0');
    const mats = [seite(d, h), seite(d, h), dach, dach, seite(w, h), seite(w, h)];
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
    m.position.set(x, h / 2, z);
    m.castShadow = m.receiveShadow = true;
    this.scene.add(m);
    // Dachkante
    this._box(w + 0.6, 0.5, d + 0.6, mat('#94a3b8'), x, h + 0.25, z);
  }

  _baum(x, z, s, farbe) {
    const stamm = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * s, 0.3 * s, 1.8 * s, 6), mat('#8b5a2b'));
    stamm.position.set(x, 0.9 * s, z);
    stamm.castShadow = true;
    const krone = new THREE.Mesh(new THREE.IcosahedronGeometry(1.9 * s, 0), mat(farbe));
    krone.position.set(x, 2.9 * s, z);
    krone.rotation.set(s, s * 2, 0);
    krone.castShadow = true;
    this.scene.add(stamm, krone);
  }

  /* vier große Ampeln; Lampen als Kugeln mit Leuchtschein – von überall gut sichtbar */
  _ampeln() {
    const hb = this.c.strasse.breite / 2, h = this.c.strasse.halteAbstand;
    const def = [
      // Spur, Gruppe, Position, Blickrichtung (Winkel um y)
      ['ost', 'haupt', -h - 0.6, hb + 1.4, -Math.PI / 2],
      ['west', 'haupt', h + 0.6, -hb - 1.4, Math.PI / 2],
      ['sued', 'quer', -hb - 1.4, -h - 0.6, Math.PI],
      ['nord', 'quer', hb + 1.4, h + 0.6, 0],
    ];
    this.ampeln = [];
    for (const [spur, gruppe, x, z, rot] of def) {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.rotation.y = rot;
      g.scale.setScalar(1.35);   // bewusst groß: auch aus der letzten Reihe erkennbar
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 5.2, 8), mat(FARBE.mast));
      mast.position.y = 2.6;
      mast.castShadow = true;
      const kasten = new THREE.Mesh(new THREE.BoxGeometry(1.25, 3.3, 0.55), mat(FARBE.gehaeuse));
      kasten.position.set(0, 6.4, 0);
      kasten.castShadow = true;
      g.add(mast, kasten);
      const lampen = {};
      [['rot', 7.4], ['gelb', 6.4], ['gruen', 5.4]].forEach(([name, ly]) => {
        const m = new THREE.MeshLambertMaterial({ color: '#2b3443', emissive: FARBE[name], emissiveIntensity: 0 });
        // Kugel ragt vorn, hinten und oben aus dem Gehäuse: Licht ist aus jeder Richtung zu sehen
        const kugel = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), m);
        kugel.position.set(0, ly, 0);
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.halo, color: FARBE[name], depthWrite: false, transparent: true, opacity: 0 }));
        sp.position.set(0, ly, 0);
        sp.scale.set(3.2, 3.2, 1);
        g.add(kugel, sp);
        lampen[name] = { m, sp };
      });
      // Empfangsantenne an der Bus-Ampel
      if (spur === 'ost') {
        const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 6), mat('#cbd5e1'));
        ant.position.set(0, 8.7, 0);
        const spitze = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), new THREE.MeshLambertMaterial({ color: '#e2e8f0', emissive: FARBE.funk, emissiveIntensity: 0 }));
        spitze.position.set(0, 9.4, 0);
        g.add(ant, spitze);
        this.antenneAmpel = spitze;
      }
      this.scene.add(g);
      this.ampeln.push({ spur, gruppe, g, lampen });
    }
  }

  _funk() {
    // Wellen am Bus, Datenpaket zur Ampel, Empfangsring, „Prüfen“-Kreisel
    this.funkWellen = [0, 1, 2].map(() => {
      const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.09, 6, 40), new THREE.MeshBasicMaterial({ color: FARBE.funk, transparent: true, opacity: 0, depthWrite: false }));
      m.rotation.x = -Math.PI / 2;
      this.scene.add(m);
      return m;
    });
    const paketMat = new THREE.MeshBasicMaterial({ color: '#e0fbff' });
    this.paket = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), paketMat);
    this.paketHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.halo, color: FARBE.funk, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    this.paketHalo.scale.set(4.5, 4.5, 1);
    this.spur = Array.from({ length: 14 }, () => {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshBasicMaterial({ color: FARBE.funk, transparent: true, opacity: 0.8, depthWrite: false }));
      this.scene.add(s);
      return s;
    });
    this.scene.add(this.paket, this.paketHalo);
    this.empfang = new THREE.Mesh(new THREE.TorusGeometry(1, 0.12, 6, 40), new THREE.MeshBasicMaterial({ color: FARBE.funk, transparent: true, opacity: 0, depthWrite: false }));
    this.scene.add(this.empfang);
    this.kreisel = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.16, 6, 32, Math.PI * 1.4), new THREE.MeshBasicMaterial({ color: '#fde047', transparent: true, opacity: 0, depthWrite: false }));
    this.scene.add(this.kreisel);
  }

  _bus(f) {
    const g = new THREE.Group();
    const L = f.laenge, W = 2.55;
    const koerper = mat(FARBE.bus), glas = mat(FARBE.glas), dunkel = mat('#7c4a03');
    const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
    add(new THREE.BoxGeometry(L, 2.2, W), koerper, 0, 1.6, 0);
    add(new THREE.BoxGeometry(L - 0.4, 0.35, W - 0.2), mat('#e8940f'), 0, 2.85, 0);
    add(new THREE.BoxGeometry(L - 2.2, 0.95, W + 0.04), glas, -0.6, 2.05, 0);
    add(new THREE.BoxGeometry(0.08, 1.35, W - 0.3), glas, L / 2 + 0.01, 2.0, 0);
    add(new THREE.BoxGeometry(0.1, 0.35, W - 0.6), mat('#fff7cc', { emissive: '#fff3b0', emissiveIntensity: 0.6 }), L / 2, 0.95, 0);
    this.busBremse = add(new THREE.BoxGeometry(0.1, 0.4, W - 0.5), new THREE.MeshLambertMaterial({ color: '#7f1d1d', emissive: '#ff2a2a', emissiveIntensity: 0 }), -L / 2 - 0.01, 1.05, 0);
    add(new THREE.BoxGeometry(L, 0.25, W + 0.02), dunkel, 0, 0.62, 0);
    // „BUS“-Schild auf beiden Seiten
    const schild = new THREE.MeshBasicMaterial({ map: textTextur('BUS') });
    for (const s of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.05), schild);
      p.position.set(L / 2 - 2.6, 1.15, s * (W / 2 + 0.03));
      p.rotation.y = s > 0 ? 0 : Math.PI;
      g.add(p);
    }
    // Dachantenne (sendet das Funksignal)
    add(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6), mat('#cbd5e1'), L / 2 - 2, 3.6, 0);
    this.busAntenne = add(new THREE.SphereGeometry(0.22, 12, 8), new THREE.MeshLambertMaterial({ color: '#e2e8f0', emissive: FARBE.funk, emissiveIntensity: 0 }), L / 2 - 2, 4.25, 0);
    g.userData.raeder = this._raeder(g, [-L / 2 + 2.2, L / 2 - 2.4], W, 0.62);
    return g;
  }

  _auto(f) {
    const g = new THREE.Group();
    const L = f.laenge, W = 1.95;
    const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
    const lack = mat(f.farbe);
    add(new THREE.BoxGeometry(L, 0.85, W), lack, 0, 0.8, 0);
    add(new THREE.BoxGeometry(L * 0.52, 0.72, W - 0.18), mat(FARBE.glas), -0.15, 1.58, 0);
    add(new THREE.BoxGeometry(L * 0.5, 0.12, W - 0.12), lack, -0.15, 1.98, 0);
    add(new THREE.BoxGeometry(0.06, 0.2, W - 0.5), mat('#fff7cc', { emissive: '#fff3b0', emissiveIntensity: 0.5 }), L / 2, 0.88, 0);
    g.userData.raeder = this._raeder(g, [-L / 2 + 0.9, L / 2 - 0.9], W, 0.42);
    return g;
  }

  _raeder(g, xs, W, r) {
    const geo = new THREE.CylinderGeometry(r, r, 0.38, 12);
    geo.rotateX(Math.PI / 2);
    const m = mat(FARBE.reifen);
    const raeder = [];
    for (const x of xs) for (const s of [-1, 1]) {
      const w = new THREE.Mesh(geo, m);
      w.position.set(x, r, s * (W / 2 - 0.1));
      w.castShadow = true;
      g.add(w);
      raeder.push({ w, r });
    }
    return raeder;
  }

  _setLampen(a, st) {
    const an = { rot: st === ROT || st === ROTGELB, gelb: st === GELB || st === ROTGELB, gruen: st === GRUEN };
    for (const n of ['rot', 'gelb', 'gruen']) {
      a.lampen[n].m.emissiveIntensity = an[n] ? 2.2 : 0.04;
      a.lampen[n].m.color.set(an[n] ? FARBE[n] : '#2b3443');
      a.lampen[n].sp.material.opacity = an[n] ? 0.95 : 0;
    }
  }

  /* Bildschirmposition (Pixel im Container) eines Punktes für HTML-Beschriftungen */
  bildpunkt(name) {
    const v = new THREE.Vector3();
    if (name === 'bus') {
      const p = this.sim.welt(this.sim.bus);
      v.set(p.x, 5.4, p.z);
    } else if (name === 'ampelBus') {
      const a = this.ampeln[0].g.position;
      v.set(a.x + 1.2, 8.8, a.z);   // rechts neben dem Ampelkopf
    } else if (name === 'ampelQuer') {
      const a = this.ampeln[3].g.position;
      v.set(a.x, 12.5, a.z);
    } else return null;
    v.project(this.camera);
    const w = this.container.clientWidth, h = this.container.clientHeight;
    return { x: (v.x + 1) / 2 * w, y: (1 - v.y) / 2 * h };
  }

  resize() {
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  render(echtzeit) {
    const sim = this.sim;
    for (const a of this.ampeln) this._setLampen(a, sim.signal(a.gruppe));

    // Fahrzeuge
    const da = new Set();
    for (const f of sim.fahrzeuge) {
      let g = this.fahrzeugMeshes.get(f.id);
      if (!g) {
        g = f.typ === 'bus' ? this._bus(f) : this._auto(f);
        this.scene.add(g);
        this.fahrzeugMeshes.set(f.id, g);
      }
      const p = sim.welt(f);
      g.position.set(p.x, 0, p.z);
      g.rotation.y = p.winkel;
      for (const { w, r } of g.userData.raeder) w.rotation.z = -f.weg / r;
      da.add(f.id);
    }
    for (const [id, g] of this.fahrzeugMeshes) {
      if (!da.has(id)) { this.scene.remove(g); this.fahrzeugMeshes.delete(id); }
    }
    if (this.busBremse) this.busBremse.material.emissiveIntensity = sim.bus.v < 2 && !sim.bus.durch ? 1.6 : 0.05;

    this._renderFunk(echtzeit);
    this.renderer.render(this.scene, this.camera);
  }

  _renderFunk(echtzeit) {
    const sim = this.sim, fk = sim.funk, t = sim.t;
    const busP = sim.welt(sim.bus);
    const vonBus = new THREE.Vector3(busP.x + sim.bus.laenge / 2 - 2, 4.25, busP.z);
    const ziel = new THREE.Vector3();
    this.antenneAmpel.getWorldPosition(ziel);

    const sendet = fk && t >= fk.gesendet && t <= fk.empfangen + 0.3;
    this.funkWellen.forEach((m, i) => {
      if (!sendet) { m.material.opacity = 0; return; }
      const k = (((t - fk.gesendet) / 0.55) + i / 3) % 1;
      m.position.copy(vonBus);
      m.scale.setScalar(0.6 + k * 4.2);
      m.material.opacity = 0.9 * (1 - k);
    });
    if (this.busAntenne) this.busAntenne.material.emissiveIntensity = sendet ? 2 + Math.sin(echtzeit * 20) : 0;

    // Datenpaket fliegt im Bogen vom Bus zur Ampel
    const fliegt = fk && t >= fk.gesendet && t <= fk.empfangen;
    const kurve = (u, out) => {
      out.lerpVectors(vonBus, ziel, u);
      out.y += Math.sin(u * Math.PI) * 6;
      return out;
    };
    if (fliegt) {
      const u = (t - fk.gesendet) / (fk.empfangen - fk.gesendet);
      kurve(u, this.paket.position);
      this.paketHalo.position.copy(this.paket.position);
      this.paket.visible = this.paketHalo.visible = true;
      this.spur.forEach((s, i) => {
        const ui = u * (i / this.spur.length);
        kurve(ui, s.position);
        s.visible = true;
        s.material.opacity = 0.25 + 0.6 * (i / this.spur.length);
      });
    } else {
      this.paket.visible = this.paketHalo.visible = false;
      // nach dem Empfang bleibt die Spur kurz sichtbar und verblasst
      const nach = fk ? t - fk.empfangen : -1;
      this.spur.forEach((s, i) => {
        if (nach >= 0 && nach < 1.2) { kurve(i / this.spur.length, s.position); s.visible = true; s.material.opacity = 0.7 * (1 - nach / 1.2); }
        else s.visible = false;
      });
    }

    // Empfang an der Ampel: Ring + leuchtende Antenne
    const seitEmpfang = fk ? t - fk.empfangen : -1;
    if (seitEmpfang >= 0 && seitEmpfang < 1) {
      this.empfang.position.copy(ziel);
      this.empfang.rotation.x = -Math.PI / 2;
      this.empfang.scale.setScalar(0.5 + seitEmpfang * 4);
      this.empfang.material.opacity = 1 - seitEmpfang;
    } else this.empfang.material.opacity = 0;
    this.antenneAmpel.material.emissiveIntensity = seitEmpfang >= 0 && sim.anforderung ? 1.6 + 0.6 * Math.sin(echtzeit * 8) : 0;

    // Entscheidung: gelber Kreisel über der Bus-Ampel, solange sie „prüft“
    const prueft = fk && t >= fk.empfangen && t < fk.entscheidungBis + 0.05 && sim.phase === 'QUER_GRUEN';
    if (prueft) {
      this.kreisel.position.set(ziel.x, ziel.y + 1.8, ziel.z);
      this.kreisel.rotation.set(-Math.PI / 2.6, 0, -echtzeit * 6);
      this.kreisel.material.opacity = 0.95;
    } else this.kreisel.material.opacity = 0;
  }

  dispose() {
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
