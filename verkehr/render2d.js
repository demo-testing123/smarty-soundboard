/* 2D-Ansicht von oben – Ersatz, wenn kein WebGL verfügbar ist. Gleiche Simulation, gleiche Schnittstelle wie Szene3D. */
import { ROT, ROTGELB, GRUEN, GELB } from './sim.js';

const LAMPE = { rot: '#ff3b30', gelb: '#ffcc00', gruen: '#22e36b', aus: '#2b3443' };

export class Szene2D {
  constructor(container, sim, c) {
    this.c = c;
    this.sim = sim;
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    container.append(this.canvas);
    this.g = this.canvas.getContext('2d');
    this.resize();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.w = w; this.h = h; this.dpr = dpr;
    this.skala = w / 108;              // 108 m Breite sichtbar
  }

  // Welt (x,z) → Bildschirm (Pixel, CSS); Blick wie in 3D etwas nach links versetzt
  p(x, z) { return { x: this.w / 2 + (x + 9) * this.skala, y: this.h * 0.5 + z * this.skala }; }

  bildpunkt(name) {
    const s = this.sim;
    if (name === 'bus') { const b = s.welt(s.bus); const q = this.p(b.x, b.z); return { x: q.x, y: q.y - 3 * this.skala }; }
    const h = this.c.strasse.halteAbstand, hb = this.c.strasse.breite / 2;
    if (name === 'ampelBus') { const q = this.p(-h - 0.6, hb + 1.4); return { x: q.x + 2 * this.skala, y: q.y }; }
    if (name === 'ampelQuer') { const q = this.p(hb + 1.4, h + 0.6); return { x: q.x + 4 * this.skala, y: q.y }; }
    return null;
  }

  rect(x, z, w, d, farbe) {
    const a = this.p(x - w / 2, z - d / 2);
    this.g.fillStyle = farbe;
    this.g.fillRect(a.x, a.y, w * this.skala, d * this.skala);
  }

  render(echtzeit) {
    const { g, sim, c } = this;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const B = c.strasse.breite, hb = B / 2, h = c.strasse.halteAbstand, k = this.skala;
    g.fillStyle = '#8ccf9c';
    g.fillRect(0, 0, this.w, this.h);
    // Häuser und Bäume
    for (const [x, z, w, d, farbe] of [[-50, -24, 14, 10, '#9cc5d6'], [-28, -24, 12, 10, '#cfe0ea'], [28, -24, 14, 10, '#a8c3e0'], [50, -24, 12, 10, '#f2d0a9'],
      [-45, 22, 14, 9, '#e9c6b8'], [45, 22, 14, 9, '#b9d7d3']]) {
      this.rect(x, z, w, d, '#64748b');
      this.rect(x, z, w - 1, d - 1, farbe);
    }
    for (const [x, z] of [[-16, -11], [-34, -11.5], [16, -11], [34, -11.5], [-18, 11.5], [20, 11], [-11, -20], [11, -22], [-11.5, 20], [11.5, 21]]) {
      const q = this.p(x, z);
      g.fillStyle = '#2f855a';
      g.beginPath(); g.arc(q.x, q.y, 2 * k, 0, Math.PI * 2); g.fill();
    }
    // Gehwege, Straßen, Markierungen
    this.rect(0, 0, 300, B + 6.4, '#d9e0ea');
    this.rect(0, 0, B + 6.4, 300, '#d9e0ea');
    this.rect(0, 0, 300, B, '#4b5563');
    this.rect(0, 0, B, 300, '#4b5563');
    for (let d = h + 4; d < 120; d += 6) for (const s of [-1, 1]) {
      this.rect(s * (d + 1.5), 0, 3, 0.25, '#f8fafc');
      this.rect(0, s * (d + 1.5), 0.25, 3, '#f8fafc');
    }
    this.rect(-h, hb / 2, 0.5, hb, '#f8fafc'); this.rect(h, -hb / 2, 0.5, hb, '#f8fafc');
    this.rect(-hb / 2, -h, hb, 0.5, '#f8fafc'); this.rect(hb / 2, h, hb, 0.5, '#f8fafc');
    for (let q = -hb + 0.55; q < hb - 0.3; q += 1) for (const s of [-1, 1]) {
      this.rect(s * 5.75, q, 2.9, 0.5, '#f8fafc');
      this.rect(q, s * 5.75, 0.5, 2.9, '#f8fafc');
    }

    // Fahrzeuge
    for (const f of sim.fahrzeuge) {
      const w = sim.welt(f), q = this.p(w.x, w.z);
      g.save();
      g.translate(q.x, q.y);
      g.rotate(-w.winkel);
      const L = f.laenge * k, W = (f.typ === 'bus' ? 2.55 : 1.95) * k;
      g.fillStyle = 'rgba(0,0,0,.25)';
      g.fillRect(-L / 2 + 2, -W / 2 + 3, L, W);
      g.fillStyle = f.typ === 'bus' ? '#f5a524' : f.farbe;
      g.beginPath(); g.roundRect ? g.roundRect(-L / 2, -W / 2, L, W, 0.4 * k) : g.rect(-L / 2, -W / 2, L, W); g.fill();
      g.fillStyle = '#cfeefa';
      g.fillRect(L / 2 - (f.typ === 'bus' ? 1.6 : 1.6) * k, -W / 2 + 0.2 * k, 0.9 * k, W - 0.4 * k);
      if (f.typ === 'bus') {
        g.fillStyle = '#1f2937';
        g.font = `bold ${1.6 * k}px system-ui, sans-serif`;
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('BUS', -0.8 * k, 0);
      }
      g.restore();
    }

    // Ampeln
    const amp = [['haupt', -h - 0.6, hb + 1.4], ['haupt', h + 0.6, -hb - 1.4], ['quer', -hb - 1.4, -h - 0.6], ['quer', hb + 1.4, h + 0.6]];
    for (const [gr, x, z] of amp) {
      const st = sim.signal(gr), q = this.p(x, z);
      const an = { rot: st === ROT || st === ROTGELB, gelb: st === GELB || st === ROTGELB, gruen: st === GRUEN };
      g.fillStyle = '#1f2937';
      g.beginPath(); g.roundRect ? g.roundRect(q.x - 1.1 * k, q.y - 3.2 * k, 2.2 * k, 6.4 * k, 0.6 * k) : g.rect(q.x - 1.1 * k, q.y - 3.2 * k, 2.2 * k, 6.4 * k); g.fill();
      ['rot', 'gelb', 'gruen'].forEach((n, i) => {
        g.fillStyle = an[n] ? LAMPE[n] : LAMPE.aus;
        g.shadowColor = an[n] ? LAMPE[n] : 'transparent';
        g.shadowBlur = an[n] ? 18 : 0;
        g.beginPath(); g.arc(q.x, q.y + (i - 1) * 2 * k, 0.8 * k, 0, Math.PI * 2); g.fill();
      });
      g.shadowBlur = 0;
    }

    // Funksignal
    const fk = sim.funk, t = sim.t;
    if (fk && t >= fk.gesendet && t <= fk.empfangen + 1) {
      const b = sim.welt(sim.bus), von = this.p(b.x + sim.bus.laenge / 2 - 2, b.z), zu = this.p(-h - 0.6, hb + 1.4);
      g.strokeStyle = '#22d3ee';
      g.lineWidth = 0.35 * k;
      if (t <= fk.empfangen) {
        for (let i = 0; i < 3; i++) {
          const kk = (((t - fk.gesendet) / 0.55) + i / 3) % 1;
          g.globalAlpha = 1 - kk;
          g.beginPath(); g.arc(von.x, von.y, (1 + kk * 5) * k, 0, Math.PI * 2); g.stroke();
        }
        g.globalAlpha = 1;
        const u = (t - fk.gesendet) / (fk.empfangen - fk.gesendet);
        const x = von.x + (zu.x - von.x) * u, y = von.y + (zu.y - von.y) * u - Math.sin(u * Math.PI) * 8 * k;
        g.fillStyle = '#e0fbff'; g.shadowColor = '#22d3ee'; g.shadowBlur = 20;
        g.beginPath(); g.arc(x, y, 0.8 * k, 0, Math.PI * 2); g.fill();
        g.shadowBlur = 0;
      } else {
        const kk = t - fk.empfangen;
        g.globalAlpha = 1 - kk;
        g.beginPath(); g.arc(zu.x, zu.y, (1 + kk * 5) * k, 0, Math.PI * 2); g.stroke();
        g.globalAlpha = 1;
      }
    }
  }

  dispose() { this.canvas.remove(); }
}
