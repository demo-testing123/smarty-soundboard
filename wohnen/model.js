/* Modell ohne Grafik: Alle angezeigten Zahlen werden hier aus dem Raster berechnet. */
import { CONFIG } from './config.js';

const key = (x, z) => `${x},${z}`;

/* ---------- Experiment ---------- */
export function experimentModule(zustand, c = CONFIG) {
  const e = c.experiment;
  return e.nebeneinander.map(([x, z], i) => {
    if (zustand === 'gestapelt') { const [gx, gz, etage] = e.gestapelt[i]; return { nr: i + 1, x: gx, z: gz, etage }; }
    return { nr: i + 1, x, z, etage: 0 };
  });
}

export function experimentZahlen(zustand, c = CONFIG) {
  const module = experimentModule(zustand, c);
  const belegt = new Set(module.map((m) => key(m.x, m.z)));
  const basis = new Set(experimentModule('nebeneinander', c).map((m) => key(m.x, m.z)));
  const freiGeworden = [...basis].filter((k) => !belegt.has(k));
  return {
    wohnungen: module.length,
    belegt: belegt.size,
    freiGeworden: freiGeworden.length,
    freieFelder: freiGeworden.map((k) => k.split(',').map(Number)),
    felder: c.raster.experimentFelder ** 2,
  };
}

/* ---------- Varianten ---------- */
export function plan(variante, c = CONFIG) {
  const v = c.varianten[variante];
  return v.plan.map((zeile) => zeile.split(''));
}

/* zusammenhängende Hausflächen (H) = Gebäude */
export function gebaeude(variante, c = CONFIG) {
  const p = plan(variante, c), n = p.length, gesehen = new Set(), liste = [];
  for (let z = 0; z < n; z++) for (let x = 0; x < p[z].length; x++) {
    if (p[z][x] !== 'H' || gesehen.has(key(x, z))) continue;
    const zellen = [], stapel = [[x, z]];
    gesehen.add(key(x, z));
    while (stapel.length) {
      const [cx, cz] = stapel.pop();
      zellen.push([cx, cz]);
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, nz = cz + dz;
        if (p[nz] && p[nz][nx] === 'H' && !gesehen.has(key(nx, nz))) { gesehen.add(key(nx, nz)); stapel.push([nx, nz]); }
      }
    }
    const xs = zellen.map((q) => q[0]), zs = zellen.map((q) => q[1]);
    const g = { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs), felder: zellen.length };
    g.module = g.felder / (c.raster.modul * c.raster.modul);          // Wohnmodule je Etage
    g.geschosse = c.varianten[variante].geschosse;
    g.wohnungen = g.module * g.geschosse;
    liste.push(g);
  }
  return liste;
}

export function variantenZahlen(variante, c = CONFIG) {
  const p = plan(variante, c);
  const zaehl = { H: 0, P: 0, G: 0, O: 0, W: 0 };
  for (const zeile of p) for (const t of zeile) zaehl[t] = (zaehl[t] || 0) + 1;
  const gesamt = p.length * p[0].length;
  const geb = gebaeude(variante, c);
  return {
    gesamt,
    seite: p.length,
    bebaut: zaehl.H,
    unbebaut: gesamt - zaehl.H,
    gruen: zaehl.P + zaehl.G + zaehl.O,
    wege: zaehl.W,
    privat: zaehl.P, gemeinsam: zaehl.G, oeffentlich: zaehl.O,
    gruenTyp: c.varianten[variante].gruenTyp,
    gebaeude: geb.length,
    wohnungen: geb.reduce((s, g) => s + g.wohnungen, 0),
  };
}

/* Garten-Zuordnung (Variante A): jedes private Feld gehört zum nächstgelegenen Haus */
export function gartenVon(variante, x, z, c = CONFIG) {
  const geb = gebaeude(variante, c);
  let best = 0, bd = Infinity;
  geb.forEach((g, i) => {
    const cx = (g.x0 + g.x1) / 2, cz = (g.z0 + g.z1) / 2;
    const d = Math.abs(cx - x) + Math.abs(cz - z);
    if (d < bd - 1e-9) { bd = d; best = i; }
  });
  return best;
}
