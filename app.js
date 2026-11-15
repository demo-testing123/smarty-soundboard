/* SMARTy Soundboard – Sätze per Klick oder Taste abspielen.
 * Daten: sounds.json (Stimmen + Sätze) und audio/manifest.json (vom Generator).
 * Robo-Effekt läuft live per Web Audio, Anteil pro Stimme einstellbar.
 */
'use strict';
(() => {
  const KEYPOOL = '1234567890qwertzuiopasdghjklyxcvbnm'.split('');
  const $ = (s, el = document) => el.querySelector(s);

  function h(tag, attrs = {}, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style') el.style.cssText = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return el;
  }

  const store = {
    get(k, d) { try { const v = localStorage.getItem('smarty.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('smarty.' + k, JSON.stringify(v)); } catch { /* privat */ } },
  };

  const fmt = (s) => (Math.round(s * 10) / 10).toFixed(1).replace('.', ',') + ' s';

  // ---------- Zustand ----------
  const voices = new Map();   // id -> {id,name,rolle,farbe,robo,chain,padsEl}
  const pads = new Map();     // id -> {id,voice,title,text,cue,key,url,buffer,el,...}
  const playing = new Map();  // padId -> {src,g,t0,dur}
  const keyMap = new Map();   // taste -> padId
  const usedKeys = new Set();
  let ctx = null, master = null, analyser = null, meterBuf = null;
  let overlap = store.get('overlap', false);
  let cfg = null, manifest = {};

  // ---------- Audio ----------
  function ensureCtx() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC({ latencyHint: 'interactive' });
    master = ctx.createGain();
    master.gain.value = store.get('master', 1);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    meterBuf = new Float32Array(analyser.fftSize);
    master.connect(analyser);
    analyser.connect(ctx.destination);
    return ctx;
  }

  /* Robo-Kette: dry + Ringmodulator (55 Hz) + metallischer Kammfilter (7 ms),
     danach Präsenz-EQ und Kompressor. a = 0 … 1 (0.2 = 20 % robotisch). */
  function buildChain(c, amount, dest) {
    const input = c.createGain();
    const hp = c.createBiquadFilter(); hp.type = 'highpass';
    input.connect(hp);

    const dry = c.createGain();
    const ring = c.createGain(); ring.gain.value = 0;
    const osc = c.createOscillator(); osc.type = 'sine'; osc.frequency.value = 55;
    osc.connect(ring.gain); osc.start();
    const ringOut = c.createGain();
    const delay = c.createDelay(0.05); delay.delayTime.value = 0.007;
    const fb = c.createGain(); fb.gain.value = 0.5;
    const combOut = c.createGain();

    hp.connect(dry);
    hp.connect(ring); ring.connect(ringOut);
    hp.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(combOut);

    const sum = c.createGain();
    dry.connect(sum); ringOut.connect(sum); combOut.connect(sum);

    const presence = c.createBiquadFilter();
    presence.type = 'peaking'; presence.frequency.value = 3000; presence.Q.value = 0.9; presence.gain.value = 2.5;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -20; comp.knee.value = 8; comp.ratio.value = 3;
    comp.attack.value = 0.004; comp.release.value = 0.15;
    const out = c.createGain(); out.gain.value = 1.1;
    sum.connect(presence); presence.connect(comp); comp.connect(out); out.connect(dest);

    function set(a, smooth) {
      const vals = [[dry.gain, 1 - 0.45 * a], [ringOut.gain, 0.9 * a], [combOut.gain, 0.7 * a], [hp.frequency, 60 + 80 * a]];
      for (const [p, v] of vals) {
        if (smooth && c.currentTime > 0) p.setTargetAtTime(v, c.currentTime, 0.03);
        else p.value = v;
      }
    }
    set(amount, false);
    return { input, set };
  }

  function chainFor(voiceId) {
    const v = voices.get(voiceId);
    if (!v.chain) v.chain = buildChain(ensureCtx(), v.robo, master);
    return v.chain;
  }

  function resume() {
    if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
    document.body.classList.add('live');
  }

  function play(id) {
    const p = pads.get(id);
    if (!p || !p.buffer) return;
    ensureCtx(); resume();
    if (playing.has(id)) { stop(id); return; }
    if (!overlap) stopAll(0.04);

    const src = ctx.createBufferSource();
    src.buffer = p.buffer;
    const g = ctx.createGain();
    src.connect(g);
    g.connect(p.direct ? master : chainFor(p.voice).input);   // fertige Mischungen ohne Effektkette
    const t0 = ctx.currentTime + 0.005;
    src.start(t0);
    const entry = { src, g, t0, dur: p.buffer.duration };
    playing.set(id, entry);
    src.onended = () => {
      if (playing.get(id) === entry) { playing.delete(id); paint(p); }
    };
    paint(p);
    tick();
  }

  function stop(id, fade = 0.08) {
    const e = playing.get(id);
    if (!e) return;
    const now = ctx.currentTime;
    e.g.gain.cancelScheduledValues(now);
    e.g.gain.setValueAtTime(e.g.gain.value, now);
    e.g.gain.linearRampToValueAtTime(0, now + fade);
    try { e.src.stop(now + fade + 0.02); } catch { /* schon gestoppt */ }
    playing.delete(id);
    paint(pads.get(id));
  }

  function stopAll(fade = 0.08) { for (const id of [...playing.keys()]) stop(id, fade); }

  function paint(p) {
    if (!p || !p.el) return;
    const on = playing.has(p.id);
    p.el.classList.toggle('playing', on);
    p.el.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (!on) {
      p.barEl.style.transform = 'scaleX(0)';
      if (p.buffer) p.durEl.textContent = fmt(p.buffer.duration);
    }
  }

  let raf = 0;
  function tick() {
    if (raf) return;
    const loop = () => {
      raf = 0;
      if (!ctx) return;
      const now = ctx.currentTime;
      for (const [id, e] of playing) {
        const p = pads.get(id);
        const f = Math.min(1, Math.max(0, (now - e.t0) / e.dur));
        p.barEl.style.transform = `scaleX(${f})`;
        p.durEl.textContent = '−' + fmt(Math.max(0, e.dur - (now - e.t0)));
      }
      analyser.getFloatTimeDomainData(meterBuf);
      let sum = 0;
      for (let i = 0; i < meterBuf.length; i++) sum += meterBuf[i] * meterBuf[i];
      const rms = Math.sqrt(sum / meterBuf.length);
      const db = 20 * Math.log10(rms + 1e-9);
      $('#meterFill').style.transform = `scaleX(${Math.min(1, Math.max(0, (db + 48) / 48))})`;
      if (playing.size || db > -60) raf = requestAnimationFrame(loop);
      else $('#meterFill').style.transform = 'scaleX(0)';
    };
    raf = requestAnimationFrame(loop);
  }

  // ---------- WAV-Export (mit Effekt) ----------
  async function exportWav(id) {
    const p = pads.get(id);
    if (!p || !p.buffer) return;
    const v = voices.get(p.voice);
    const base = p.vary ? `${p.id}__${v.variante}` : p.id;
    if (p.direct) {                                // fertige Mischung: Originaldatei speichern
      const a = h('a', { href: p.url, download: `${base}.mp3` });
      document.body.append(a); a.click(); a.remove();
      return;
    }
    const b = p.buffer, sr = 44100;            // feste Rate, unabhängig von der Soundkarte
    const off = new OfflineAudioContext(1, Math.ceil((b.duration + 0.3) * sr), sr);
    const chain = buildChain(off, v.robo, off.destination);
    const src = off.createBufferSource(); src.buffer = b; src.connect(chain.input); src.start();
    const out = await off.startRendering();
    const name = `${base}${v.robo > 0 ? '_robo' + Math.round(v.robo * 100) : ''}.wav`;
    const url = URL.createObjectURL(encodeWav(out));
    const a = h('a', { href: url, download: name });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function encodeWav(buf) {
    const ch = buf.getChannelData(0), n = ch.length, sr = buf.sampleRate;
    const dv = new DataView(new ArrayBuffer(44 + n * 2));
    const w = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
    dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
    dv.setUint32(24, sr, true); dv.setUint32(28, sr * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
    w(36, 'data'); dv.setUint32(40, n * 2, true);
    let peak = 0;
    for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(ch[i]));
    const g = peak > 0.89 ? 0.89 / peak : 1;               // ca. −1 dBFS
    for (let i = 0; i < n; i++) {
      const s = Math.max(-1, Math.min(1, ch[i] * g));
      dv.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return new Blob([dv], { type: 'audio/wav' });
  }

  // ---------- Eigene Sounds (IndexedDB, nur dieses Gerät) ----------
  const DB = (() => {
    let opening = null;
    const open = () => opening || (opening = new Promise((res, rej) => {
      const r = indexedDB.open('smarty-soundboard', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('sounds', { keyPath: 'id' });
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    }));
    const tx = async (mode, fn) => {
      const db = await open();
      return new Promise((res, rej) => {
        const t = db.transaction('sounds', mode);
        const req = fn(t.objectStore('sounds'));
        t.oncomplete = () => res(req && req.result);
        t.onerror = () => rej(t.error);
      });
    };
    return {
      all: () => tx('readonly', (s) => s.getAll()),
      put: (rec) => tx('readwrite', (s) => s.put(rec)),
      del: (id) => tx('readwrite', (s) => s.delete(id)),
    };
  })();

  /* Eigene Aufnahmen auf ähnliche Lautheit bringen wie die erzeugten Dateien. */
  function normalize(buf) {
    const ch = buf.getChannelData(0);
    let peak = 0, sum = 0, cnt = 0;
    for (let i = 0; i < ch.length; i++) {
      const a = Math.abs(ch[i]);
      if (a > peak) peak = a;
      if (a > 0.01) { sum += ch[i] * ch[i]; cnt++; }
    }
    if (!cnt || !peak) return buf;
    const g = Math.min(0.12 / Math.sqrt(sum / cnt), 0.84 / peak);
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < d.length; i++) d[i] *= g;
    }
    return buf;
  }

  async function decodeBlob(blob) {
    const ab = await blob.arrayBuffer();
    return normalize(await ensureCtx().decodeAudioData(ab));
  }

  // ---------- Tasten ----------
  function claimKey(k) {
    k = (k || '').toLowerCase();
    if (!k || usedKeys.has(k)) return null;
    usedKeys.add(k);
    return k;
  }
  function nextKey() {
    for (const k of KEYPOOL) if (!usedKeys.has(k)) { usedKeys.add(k); return k; }
    return null;
  }

  // ---------- Aufbau ----------
  function padCell(p) {
    const v = voices.get(p.voice);
    const btn = h('button', {
      class: 'pad loading', type: 'button', 'data-id': p.id, 'aria-pressed': 'false',
      title: p.text ? p.text : p.title,
    },
      p.key ? h('kbd', { class: 'key' }, p.key.toUpperCase()) : null,
      h('span', { class: 'pad-title' }, p.title),
      p.text ? h('span', { class: 'pad-text' }, p.text) : null,
      p.cue ? h('span', { class: 'pad-cue' }, p.cue) : null,
      h('span', { class: 'pad-foot' },
        (p.durEl = h('span', { class: 'dur' }, 'lädt …')),
        p.local ? h('span', { class: 'tag' }, 'lokal') : null,
        p.direct ? h('span', { class: 'tag' }, 'Stimme + Musik + Effekte') : null,
        p.vary ? (p.varTag = h('span', { class: 'tag' }, 'Stimme ' + v.variante)) : null),
      h('span', { class: 'bar' }, (p.barEl = h('i'))),
    );
    btn.addEventListener('click', () => play(p.id));
    const tools = h('div', { class: 'tools' },
      h('button', {
        type: 'button', class: 'icon',
        title: p.direct ? 'Fertige Mischung als MP3 speichern' : 'Als WAV speichern (mit Robo-Effekt)',
        'aria-label': `${p.title} speichern`,
        onclick: () => exportWav(p.id),
      }, '⤓'),
      p.local ? h('button', {
        type: 'button', class: 'icon del', title: 'Eigenen Sound löschen', 'aria-label': `${p.title} löschen`,
        onclick: () => removeLocal(p.id),
      }, '✕') : null,
    );
    p.el = btn;
    p.cell = h('div', { class: p.direct ? 'cell wide' : 'cell', style: `--c:${v.farbe}` }, btn, tools);
    return p.cell;
  }

  function voiceSection(v) {
    const out = h('output', {}, Math.round(v.robo * 100) + ' %');
    const range = h('input', {
      type: 'range', min: '0', max: '1', step: '0.05', value: String(v.robo), 'aria-label': `Robo-Anteil ${v.name}`,
    });
    range.addEventListener('input', () => {
      v.robo = parseFloat(range.value);
      out.textContent = Math.round(v.robo * 100) + ' %';
      if (v.chain) v.chain.set(v.robo, true);
      store.set('robo.' + v.id, v.robo);
    });
    range.addEventListener('dblclick', () => { range.value = String(v.roboDefault); range.dispatchEvent(new Event('input')); });
    v.padsEl = h('div', { class: 'pads' });
    v.varEl = v.varianten.length ? h('div', { class: 'variants', role: 'group', 'aria-label': `Stimme ${v.name}` },
      h('span', { class: 'variants-label' }, 'Stimme:'),
      v.varianten.map((x) => h('button', {
        type: 'button', class: 'var-btn', 'data-var': x.id, 'aria-pressed': String(x.id === v.variante),
        title: `${x.name}${x.standard ? ' (Standard)' : ''} – gilt für die Eröffnung und alle Einzelteile`,
        onclick: () => setVariant(v.id, x.id),
      }, h('b', {}, x.id), ' ', x.name, x.standard ? ' ★' : ''))) : null;
    return h('section', { class: 'voice', style: `--c:${v.farbe}`, 'aria-label': v.name },
      h('header', { class: 'voice-head' },
        h('div', { class: 'who' },
          h('h2', {}, h('span', { class: 'dot' }), v.name),
          v.rolle ? h('p', { class: 'rolle' }, v.rolle) : null),
        h('label', { class: 'robo', title: `Robo-Anteil (Standard ${Math.round(v.roboDefault * 100)} %, Doppelklick = zurücksetzen)` },
          'Robo', range, out),
        h('button', { type: 'button', class: 'btn small', onclick: () => openAdd(v.id) }, '＋ Eigener Sound'),
        v.varEl,
      ),
      v.padsEl,
    );
  }

  function audioUrl(id, datei, vid) {
    const m = manifest[vid ? `${id}__${vid}` : id];
    if (m && m.datei) return `${m.datei}?v=${m.hash}`;
    if (datei) return datei;
    return null;
  }

  /* Stimmvariante umschalten: alle Sätze dieser Stimme in der neuen Variante laden. */
  async function setVariant(voiceId, vid) {
    const v = voices.get(voiceId);
    if (!v || v.variante === vid) return;
    v.variante = vid;
    store.set('var.' + voiceId, vid);
    v.varEl.querySelectorAll('.var-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.var === vid)));
    const list = [...pads.values()].filter((p) => p.voice === voiceId && p.vary);
    for (const p of list) {
      stop(p.id, 0.05);
      p.url = audioUrl(p.id, p.datei, vid);
      p.buffer = null;
      p.el.classList.add('loading');
      p.el.classList.remove('missing');
      p.durEl.textContent = 'lädt …';
      if (p.varTag) p.varTag.textContent = 'Stimme ' + vid;
    }
    await loadAll(list);
    offlineCheck();
  }

  async function loadAll(list) {
    const queue = [...list];
    let done = 0, failed = 0;
    const total = list.length;
    status(`Lade Sounds … 0/${total}`);
    const worker = async () => {
      while (queue.length) {
        const p = queue.shift();
        const url = p.url;
        try {
          if (!url) throw new Error('keine Datei');
          const res = await fetch(url);
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const buf = await ensureCtx().decodeAudioData(await res.arrayBuffer());
          if (p.url !== url) { done++; continue; }   // inzwischen andere Variante gewählt
          p.buffer = buf;
          p.el.classList.remove('loading');
          p.durEl.textContent = fmt(p.buffer.duration);
        } catch (e) {
          if (p.url !== url) { done++; continue; }
          failed++;
          p.el.classList.remove('loading');
          p.el.classList.add('missing');
          p.durEl.textContent = 'Audio fehlt';
          p.el.title = 'Audiodatei fehlt – wird nach dem nächsten Speichern von sounds.json erzeugt.';
        }
        done++;
        if (done < total) status(`Lade Sounds … ${done}/${total}`);
      }
    };
    await Promise.all(Array.from({ length: 4 }, worker));
    return { total, failed };
  }

  function status(html) { $('#status').innerHTML = html; }

  /* alle Audiodateien laut Manifest – inklusive aller Stimmvarianten */
  function manifestUrls() {
    return Object.values(manifest).filter((m) => m && m.datei)
      .map((m) => new URL(`${m.datei}?v=${m.hash}`, location.href).href);
  }

  async function offlineCheck() {
    const all = [...pads.values()];
    const failed = all.filter((p) => p.el && p.el.classList.contains('missing')).length;
    const loading = all.filter((p) => p.el && p.el.classList.contains('loading')).length;
    if (loading) return;
    const base = `<span class="${failed ? 'warn' : 'ok'}">${failed ? '⚠' : '✓'}</span> ` +
      `${all.length - failed}/${all.length} Sounds geladen` + (failed ? ` · ${failed} fehlen` : '');
    status(base);
    if (!('serviceWorker' in navigator) || !window.caches) return;
    try {
      await navigator.serviceWorker.ready;
      const urls = manifestUrls();
      const hits = await Promise.all(urls.map((u) => caches.match(u)));
      const n = hits.filter(Boolean).length;
      const vars = Math.max(0, ...[...voices.values()].map((v) => v.varianten.length));
      status(base + (n === urls.length
        ? ` · <span class="ok">offline bereit</span>${vars > 1 ? ' (alle Stimmvarianten)' : ''} – funktioniert jetzt auch ohne Internet`
        : ` · offline: ${n}/${urls.length} Dateien gespeichert …`));
      return n === urls.length;
    } catch { /* kein Offline-Cache */ }
  }

  /* Im Hintergrund alle Dateien (auch andere Stimmvarianten) in den Offline-Speicher holen. */
  async function warmCache() {
    if (!window.caches || !navigator.serviceWorker || !navigator.serviceWorker.controller) return;
    for (const u of manifestUrls()) {
      try { if (!(await caches.match(u))) await fetch(u); } catch { /* später erneut */ }
    }
  }

  async function getJSON(url) {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    return res.json();
  }

  async function init() {
    const board = $('#board');
    try {
      cfg = await getJSON('sounds.json');
      manifest = await getJSON('audio/manifest.json').catch(() => ({}));
    } catch (e) {
      board.innerHTML = '';
      board.append(h('p', { class: 'error-note' },
        location.protocol === 'file:'
          ? 'Die Seite muss über einen Webserver laufen (GitHub Pages oder lokal: „python -m http.server“ im Ordner, dann http://localhost:8000).'
          : 'sounds.json konnte nicht geladen werden: ' + e.message));
      status('Fehler beim Laden');
      return;
    }

    document.title = cfg.titel || document.title;
    $('#titel').textContent = cfg.titel || 'Soundboard';
    $('#untertitel').textContent = cfg.untertitel || '';

    for (const s of cfg.stimmen || []) {
      const def = typeof s.robo === 'number' ? s.robo : 0;
      const vars = (s.varianten || []).map((x) => ({ id: x.id, name: x.name || x.id, standard: !!x.standard }));
      const std = (vars.find((x) => x.standard) || vars[0] || {}).id || null;
      let cur = store.get('var.' + s.id, std);
      if (!vars.some((x) => x.id === cur)) cur = std;
      voices.set(s.id, {
        id: s.id, name: s.name || s.id, rolle: s.rolle || '', farbe: s.farbe || '#2ee6d6',
        roboDefault: def, robo: store.get('robo.' + s.id, def), chain: null, padsEl: null,
        varianten: vars, variante: cur, varEl: null,
      });
    }

    // feste Tasten zuerst reservieren, dann Rest verteilen
    const lines = (cfg.saetze || []).filter((l) => voices.has(l.stimme));
    for (const l of lines) if (l.gruppe !== 'proben') l._key = claimKey(l.taste);
    for (const l of lines) if (l.gruppe !== 'proben' && !l._key) l._key = nextKey();

    board.innerHTML = '';
    for (const v of voices.values()) board.append(voiceSection(v));

    const probenEl = $('#proben');
    for (const l of lines) {
      const v = voices.get(l.stimme);
      const vary = v.varianten.length > 0 && l.gruppe !== 'proben' && !l.aufnahme;
      const p = {
        id: l.id, voice: l.stimme, title: l.titel || l.id, text: l.text || '', cue: l.einsatz || '',
        key: l._key || null, datei: l.datei || null, vary,
        url: audioUrl(l.id, l.datei, vary ? v.variante : null), buffer: null, local: false, direct: !!(l.teile || l.aufnahme),
      };
      pads.set(p.id, p);
      if (p.key) keyMap.set(p.key, p.id);
      const cell = padCell(p);
      if (l.gruppe === 'proben') probenEl.append(cell);
      else voices.get(l.stimme).padsEl.append(cell);
    }
    $('#probenWrap').hidden = !probenEl.children.length;

    await loadAll([...pads.values()]);
    await loadLocal();
    await offlineCheck();
    warmCache().then(offlineCheck);
  }

  async function loadLocal() {
    let recs = [];
    try { recs = await DB.all(); } catch { return; }
    recs.sort((a, b) => a.created - b.created);
    for (const rec of recs) await addLocalPad(rec);
  }

  async function addLocalPad(rec) {
    if (!voices.has(rec.stimme)) rec.stimme = voices.keys().next().value;
    const p = {
      id: rec.id, voice: rec.stimme, title: rec.titel, text: '', cue: 'Eigener Sound (nur auf diesem Gerät)',
      key: nextKey(), url: null, buffer: null, local: true,
    };
    pads.set(p.id, p);
    if (p.key) keyMap.set(p.key, p.id);
    voices.get(p.voice).padsEl.append(padCell(p));
    try {
      p.buffer = await decodeBlob(rec.blob);
      p.el.classList.remove('loading');
      p.durEl.textContent = fmt(p.buffer.duration);
    } catch {
      p.el.classList.remove('loading'); p.el.classList.add('missing'); p.durEl.textContent = 'nicht lesbar';
    }
  }

  async function removeLocal(id) {
    const p = pads.get(id);
    if (!p || !confirm(`„${p.title}“ von diesem Gerät löschen?`)) return;
    stop(id, 0.03);
    try { await DB.del(id); } catch { /* egal */ }
    if (p.key) { keyMap.delete(p.key); usedKeys.delete(p.key); }
    p.cell.remove();
    pads.delete(id);
  }

  // ---------- Dialog „Eigener Sound“ ----------
  const dlg = $('#addDlg');
  let addBlob = null, recorder = null, recChunks = [], recTimer = 0, recStream = null;

  function openAdd(voiceId) {
    const sel = $('#addVoice');
    sel.innerHTML = '';
    for (const v of voices.values()) sel.append(h('option', { value: v.id }, `${v.name} (Robo ${Math.round(v.robo * 100)} %)`));
    sel.value = voiceId;
    $('#addForm').reset();
    sel.value = voiceId;
    setAddBlob(null);
    $('#recInfo').textContent = '';
    dlg.showModal();
  }

  function setAddBlob(blob) {
    addBlob = blob;
    const pv = $('#addPreview');
    if (pv.src) URL.revokeObjectURL(pv.src);
    if (blob) { pv.src = URL.createObjectURL(blob); pv.hidden = false; } else { pv.removeAttribute('src'); pv.hidden = true; }
    $('#addOk').disabled = !blob;
  }

  $('#addFile').addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setAddBlob(f);
    const name = $('#addForm').elements.titel;
    if (!name.value) name.value = f.name.replace(/\.[^.]+$/, '').slice(0, 60);
    $('#recInfo').textContent = f.name;
  });

  $('#recBtn').addEventListener('click', async () => {
    const btn = $('#recBtn');
    if (recorder && recorder.state === 'recording') { recorder.stop(); return; }
    try {
      recStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: false } });
    } catch {
      $('#recInfo').textContent = 'Kein Mikrofonzugriff.';
      return;
    }
    recChunks = [];
    recorder = new MediaRecorder(recStream);
    recorder.ondataavailable = (e) => { if (e.data.size) recChunks.push(e.data); };
    recorder.onstop = () => {
      clearInterval(recTimer);
      recStream.getTracks().forEach((t) => t.stop());
      btn.classList.remove('on'); btn.textContent = '● Aufnehmen';
      if (recChunks.length) {
        setAddBlob(new Blob(recChunks, { type: recorder.mimeType || 'audio/webm' }));
        $('#recInfo').textContent = 'Aufnahme fertig – anhören und speichern.';
      }
    };
    recorder.start();
    const t0 = Date.now();
    btn.classList.add('on'); btn.textContent = '■ Aufnahme stoppen';
    $('#recInfo').textContent = 'Aufnahme läuft … 0 s';
    recTimer = setInterval(() => { $('#recInfo').textContent = `Aufnahme läuft … ${Math.round((Date.now() - t0) / 1000)} s`; }, 250);
  });

  dlg.addEventListener('close', async () => {
    if (recorder && recorder.state === 'recording') recorder.stop();
    if (dlg.returnValue !== 'ok' || !addBlob) return;
    const f = $('#addForm').elements;
    const rec = { id: 'lokal_' + Date.now(), titel: f.titel.value.trim() || 'Eigener Sound', stimme: f.stimme.value, blob: addBlob, created: Date.now() };
    try { await DB.put(rec); } catch { alert('Speichern im Browser nicht möglich (privates Fenster?). Der Sound bleibt nur bis zum Neuladen.'); }
    await addLocalPad(rec);
    setAddBlob(null);
  });

  // ---------- Bedienelemente ----------
  function setMaster(v) {
    v = Math.min(1.5, Math.max(0, v));
    $('#master').value = String(v);
    $('#masterOut').textContent = Math.round(v * 100) + ' %';
    if (master) master.gain.setTargetAtTime(v, ctx.currentTime, 0.02);
    store.set('master', v);
  }
  $('#master').addEventListener('input', (e) => setMaster(parseFloat(e.target.value)));
  setMaster(store.get('master', 1));

  $('#overlap').checked = overlap;
  $('#overlap').addEventListener('change', (e) => { overlap = e.target.checked; store.set('overlap', overlap); });

  const showText = store.get('showText', true);
  $('#showText').checked = showText;
  document.body.classList.toggle('compact', !showText);
  $('#showText').addEventListener('change', (e) => { document.body.classList.toggle('compact', !e.target.checked); store.set('showText', e.target.checked); });

  $('#stop').addEventListener('click', () => stopAll());
  $('#fade').addEventListener('click', () => stopAll(1.5));

  const typing = (el) => el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

  document.addEventListener('keydown', (e) => {
    if (dlg.open || typing(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === ' ' || e.key === 'Escape') { e.preventDefault(); stopAll(); return; }
    if (e.repeat) return;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      setMaster(parseFloat($('#master').value) + (e.key === 'ArrowUp' ? 0.05 : -0.05));
      return;
    }
    const k = e.key.toLowerCase();
    if (k === 'f' && !keyMap.has('f')) { stopAll(1.5); return; }
    const id = keyMap.get(k);
    if (!id) return;
    e.preventDefault();
    const p = pads.get(id);
    play(id);
    if (p && p.el) { p.el.classList.add('hit'); setTimeout(() => p.el.classList.remove('hit'), 120); }
  });
  // Leertaste löst sonst beim Loslassen den fokussierten Button aus
  document.addEventListener('keyup', (e) => {
    if (e.key === ' ' && !dlg.open && !typing(e.target)) e.preventDefault();
  });
  document.addEventListener('pointerdown', () => { ensureCtx(); resume(); }, { once: true });

  // Bearbeiten-Link, wenn auf GitHub Pages
  const gh = location.hostname.match(/^([^.]+)\.github\.io$/);
  const repo = location.pathname.split('/').filter(Boolean)[0];
  if (gh && repo) {
    const hint = $('#editHint');
    hint.innerHTML = '';
    hint.append('Neue Sätze oder Stimmen: ',
      h('a', { href: `https://github.com/${gh[1]}/${repo}/edit/main/sounds.json`, target: '_blank', rel: 'noopener' }, 'sounds.json auf GitHub bearbeiten'),
      '. Die Sprachdateien entstehen dann automatisch (ca. 2 Min.), danach Seite neu laden. ',
      h('a', { href: `https://github.com/${gh[1]}/${repo}#readme`, target: '_blank', rel: 'noopener' }, 'Anleitung'));
  }

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  init();
})();
