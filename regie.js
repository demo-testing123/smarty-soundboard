/* START IT SMART – Dashboard 1: Regie-Soundboard.
 * Nur die einzelnen Sprachclips von SMARTy und der Zeitmaschinen-KI, nach Missionen und Drehbuch sortiert
 * (sounds.json → "missionen"). Jeder Clip hat einen eigenen Play-Knopf. Es läuft immer höchstens ein Clip;
 * nach dem Ende startet nichts automatisch. Filme und Anwendungen liegen in der Show-Zentrale (show.html). */
'use strict';
(() => {
  window.name = 'smarty-soundboard';            // die Show-Zentrale springt mit target="smarty-soundboard" in diesen Tab zurück
  const $ = (s, r = document) => r.querySelector(s);
  const speicher = {
    get(k, d) { try { const v = localStorage.getItem('smarty.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('smarty.' + k, JSON.stringify(v)); } catch { /* privat */ } },
  };
  const sitzung = {
    get(k, d) { try { const v = sessionStorage.getItem('smarty.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { sessionStorage.setItem('smarty.' + k, JSON.stringify(v)); } catch { /* privat */ } },
  };
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sek = (t) => (Math.round(t * 10) / 10).toFixed(1).replace('.', ',') + ' s';

  const SPRECHER = { smarty: { name: 'SMARTy', icon: 'hund' }, ki: { name: 'Zeitmaschinen-KI', icon: 'chip' } };
  const ICON = { eroeffnung: 'rakete', natur: 'blatt', technik: 'zahnrad', mobilitaet: 'auto', wohnen: 'haus', wege: 'pin', bildung: 'hut', finale: 'flagge' };
  const TASTE_ANZEIGE = { "'": 'Umschalt + #', '&': 'Umschalt + 6', '*': 'Umschalt + +', '?': 'Umschalt + ß', '_': 'Umschalt + -' };
  const RESERVIERT = new Set([' ', 'escape', 'f']);   // Stopp, Stopp, weich ausblenden

  let missionen = [];
  let clips = [];                 // alle Clips in Anzeigereihenfolge
  const perTaste = new Map();
  let aktuell = null;             // laufender Clip
  let zuletzt = null;             // zuletzt gestarteter Clip
  let uhr = 0;
  let lautstaerke = Math.min(1.5, Math.max(0, speicher.get('master', 1)));   // gleicher Speicherplatz wie im früheren Soundboard
  const robo = {};                // Stimme → Robo-Anteil 0…1 (sounds.json "robo"; ein früher im Browser eingestellter Wert bleibt gültig)
  const ausklingend = new Set();  // gestoppte Quellen, die noch kurz ausblenden
  let filter = speicher.get('sprecher', 'alle');
  const gespielt = new Set(sitzung.get('gespielt', []));

  async function json(url) {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
    return r.json();
  }

  // ------------------------------------------------------------ Aufbau
  async function start() {
    let cfg, man;
    try { [cfg, man] = await Promise.all([json('sounds.json'), json('audio/manifest.json')]); }
    catch (e) { $('#liste').innerHTML = `<p class="fehler">Die Clipliste konnte nicht geladen werden (${esc(e.message)}). Seite neu laden.</p>`; return; }
    const saetze = new Map(cfg.saetze.map((s) => [s.id, s]));
    for (const s of cfg.stimmen || []) robo[s.id] = speicher.get('robo.' + s.id, typeof s.robo === 'number' ? s.robo : 0);
    missionen = (cfg.missionen || []).map((m) => ({ ...m, clips: [...m.clips] }));
    // Sicherheitsnetz: SMARTy-/KI-Clips ohne Missionszuordnung nicht verschwinden lassen
    const belegt = new Set(missionen.flatMap((m) => m.clips.filter((x) => x.id).map((x) => x.id)));
    const rest = cfg.saetze.filter((s) => SPRECHER[s.stimme] && s.gruppe !== 'proben' && !belegt.has(s.id));
    if (rest.length) missionen.push({ id: 'weitere', name: 'Weitere', titel: 'Noch keiner Mission zugeordnet', clips: rest.map((s) => ({ id: s.id, nr: (s.titel || s.id).split('·')[0].trim(), szene: s.szene || '' })) });

    for (const m of missionen) {
      m.eintraege = m.clips.map((x) => {
        if (x.hinweis) return { hinweis: x.hinweis };
        const s = saetze.get(x.id);
        if (!s || !SPRECHER[s.stimme]) return null;
        const f = man[x.id];
        const c = { id: x.id, nr: x.nr, szene: x.szene || '', reserve: !!x.reserve, mission: m, stimme: s.stimme, text: s.text || '',
                    taste: (s.taste || '').toLowerCase(), url: f ? `${f.datei}?v=${f.hash}` : '', dauer: f && f.dauer ? f.dauer : 0, zustand: 'laedt' };
        clips.push(c);
        if (c.taste && !RESERVIERT.has(c.taste)) perTaste.set(c.taste, c);
        return c;
      }).filter(Boolean);
    }
    zeichne();
    setzeFilter(filter);
    pult();
    await ladeAlle();
    offlineStand();
  }

  function zeichne() {
    const offen = speicher.get('offen', ['eroeffnung']);
    $('#missionswahl').innerHTML = missionen.map((m) =>
      `<button type="button" data-mission="${m.id}"><svg class="ico"><use href="#i-${ICON[m.id] || 'flagge'}"/></svg>${esc(m.name)}</button>`).join('');
    const liste = $('#liste');
    liste.innerHTML = '';
    for (const m of missionen) {
      const haupt = m.eintraege.filter((e) => !e.hinweis && !e.reserve);
      const reserve = m.eintraege.filter((e) => !e.hinweis && e.reserve);
      const sec = document.createElement('section');
      sec.className = 'mission';
      sec.id = 'm-' + m.id;
      sec.dataset.offen = String(offen.includes(m.id));
      const bereich = haupt.length ? `${haupt[0].nr}–${haupt[haupt.length - 1].nr} · ` : '';
      sec.innerHTML = `
        <button type="button" class="mission-kopf" aria-expanded="${offen.includes(m.id)}" aria-controls="t-${m.id}">
          <svg class="ico"><use href="#i-${ICON[m.id] || 'flagge'}"/></svg>
          <h2>${m.id === 'eroeffnung' || m.id === 'finale' || m.id === 'weitere' ? '' : 'Mission '}${esc(m.name)} – ${esc(m.titel)}</h2>
          <span class="anzahl">${bereich}${haupt.length} ${haupt.length === 1 ? 'Clip' : 'Clips'}${reserve.length ? ` · ${reserve.length} Reserve` : ''}</span>
          <svg class="ico pfeil"><use href="#i-pfeil"/></svg>
        </button>
        <div class="tabelle" id="t-${m.id}" role="table" aria-label="${esc(m.name)}">
          <div class="zeile kopfzeile" role="row"><span role="columnheader">Nr. · Taste</span><span role="columnheader">Sprecher</span><span role="columnheader">Szene · gesprochener Text</span><span role="columnheader" style="text-align:right">Dauer</span><span role="columnheader">Status</span><span role="columnheader" class="sr">Play/Stopp</span></div>
        </div>`;
      const tab = sec.querySelector('.tabelle');
      for (const e of m.eintraege) {
        if (e.reserve) continue;
        tab.append(e.hinweis ? hinweisEl(e.hinweis) : zeile(e));
      }
      if (reserve.length) {
        const d = document.createElement('details');
        d.className = 'reserve-block';
        d.innerHTML = `<summary>Reserve – nicht im aktuellen Drehbuch (${reserve.length})</summary>`;
        for (const c of reserve) d.append(zeile(c));
        tab.append(d);
      }
      sec.querySelector('.mission-kopf').addEventListener('click', () => oeffne(m.id, sec.dataset.offen !== 'true', false));
      liste.append(sec);
    }
    const hilfe = document.createElement('p');
    hilfe.className = 'hilfe';
    hilfe.innerHTML = 'Bedienung: Play-Knopf oder Clip-Taste spielt genau diesen Clip. Ein neuer Clip beendet den laufenden. Nach dem Ende startet nichts automatisch. ' +
      '<kbd>Leertaste</kbd> oder <kbd>Esc</kbd> stoppt, <kbd>F</kbd> blendet weich aus, <kbd>↑</kbd> <kbd>↓</kbd> Lautstärke. ' +
      '<span id="offline"></span> <button type="button" id="gespieltWeg">Häkchen „gespielt“ zurücksetzen</button>';
    liste.append(hilfe);
    $('#gespieltWeg').addEventListener('click', () => { gespielt.clear(); sitzung.set('gespielt', []); for (const c of clips) zeigeZustand(c); });
    for (const b of document.querySelectorAll('#missionswahl button')) b.addEventListener('click', () => oeffne(b.dataset.mission, true, true));
  }

  function hinweisEl(text) {
    const d = document.createElement('div');
    d.className = 'hinweis';
    d.textContent = text;
    return d;
  }

  function zeile(c) {
    const sp = SPRECHER[c.stimme];
    const el = document.createElement('div');
    el.className = 'zeile clip' + (c.reserve ? ' reserve' : '');
    el.dataset.id = c.id;
    el.dataset.stimme = c.stimme;
    el.setAttribute('role', 'row');
    const taste = c.taste ? (TASTE_ANZEIGE[c.taste] || c.taste.toUpperCase()) : '';
    el.innerHTML = `
      <div class="nr" role="cell"><b>${esc(c.nr)}</b>${taste ? `<kbd title="Taste">${esc(taste)}</kbd>` : ''}</div>
      <div class="sprecher" role="cell"><svg class="ico" aria-hidden="true"><use href="#i-${sp.icon}"/></svg><span>${esc(sp.name)}</span></div>
      <div class="inhalt" role="cell"><div class="szene">${esc(c.szene)}</div><p class="text">${esc(c.text)}</p></div>
      <div class="dauer" role="cell">${c.dauer ? sek(c.dauer) : '–'}</div>
      <div class="status" role="cell"></div>
      <div role="cell"><button type="button" class="play" aria-label="${esc(c.nr)} abspielen"><svg class="ico"><use href="#i-play"/></svg></button></div>`;
    el.querySelector('.play').addEventListener('click', () => spieleOderStoppe(c));
    c.el = el;
    zeigeZustand(c);
    return el;
  }

  // ------------------------------------------------------------ Audio (Web Audio, wie im früheren Soundboard)
  let ctx = null, master = null;
  const ketten = new Map();
  function audio() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC({ latencyHint: 'interactive' });
    master = ctx.createGain();
    master.gain.value = lautstaerke;
    master.connect(ctx.destination);
    return ctx;
  }
  /* Robo-Kette (unverändert aus dem früheren Soundboard): trocken + Ringmodulator (55 Hz) + metallischer Kammfilter (7 ms),
     danach Präsenz-EQ (3 kHz) und leichter Kompressor. a = 0 … 1 (0,2 = 20 % robotisch, Standard SMARTy; KI 0). */
  function baueKette(c, a, ziel) {
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
    sum.connect(presence); presence.connect(comp); comp.connect(out); out.connect(ziel);
    dry.gain.value = 1 - 0.45 * a; ringOut.gain.value = 0.9 * a; combOut.gain.value = 0.7 * a; hp.frequency.value = 60 + 80 * a;
    return { input };
  }
  function kette(stimme) {
    if (!ketten.has(stimme)) ketten.set(stimme, baueKette(audio(), robo[stimme] || 0, master));
    return ketten.get(stimme);
  }

  // Alle Clips laden und dekodieren (4 gleichzeitig); danach startet jeder Clip ohne Verzögerung.
  async function ladeAlle() {
    const warte = clips.filter((c) => c.url);
    for (const c of clips) if (!c.url) { c.zustand = 'fehlt'; zeigeZustand(c); }
    const arbeiter = async () => {
      while (warte.length) {
        const c = warte.shift();
        try {
          const r = await fetch(c.url);
          if (!r.ok) throw new Error('HTTP ' + r.status);
          c.puffer = await audio().decodeAudioData(await r.arrayBuffer());
          c.dauer = c.puffer.duration;
          c.el.querySelector('.dauer').textContent = sek(c.dauer);
          c.zustand = 'bereit';
        } catch {
          c.zustand = 'fehlt';
        }
        zeigeZustand(c);
      }
    };
    await Promise.all([0, 1, 2, 3].map(arbeiter));
  }

  const position = (c) => (c.lauf && ctx ? Math.min(c.dauer, Math.max(0, ctx.currentTime - c.lauf.t0)) : 0);

  // ------------------------------------------------------------ Wiedergabe
  function spieleOderStoppe(c) {
    if (aktuell === c) { stopp(); return; }
    spiele(c);
  }

  function spiele(c) {
    if (!c.puffer) return;
    audio();
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    stopp(0.04);
    for (const q of ausklingend) { try { q.stop(); } catch { /* schon aus */ } }   // nichts überlagert den neuen Clip
    ausklingend.clear();
    const src = ctx.createBufferSource();
    src.buffer = c.puffer;
    const g = ctx.createGain();
    src.connect(g);
    g.connect(kette(c.stimme).input);
    const t0 = ctx.currentTime + 0.005;
    src.start(t0);
    c.lauf = { src, g, t0 };
    src.onended = () => { ausklingend.delete(src); if (c.lauf && c.lauf.src === src) beendet(c); };
    aktuell = zuletzt = c;
    zeigeZustand(c);
    markiereNaechsten();
    sichtbarMachen(c);
    clearInterval(uhr);
    uhr = setInterval(() => { if (aktuell) { zeigeZustand(aktuell); pult(); } }, 100);
    pult();
  }

  function stopp(blende = 0.08) {
    if (!aktuell) return;
    const c = aktuell;
    aktuell = null;
    clearInterval(uhr);
    const { src, g } = c.lauf;
    c.lauf = null;
    const jetzt = ctx.currentTime;
    g.gain.cancelScheduledValues(jetzt);
    g.gain.setValueAtTime(g.gain.value, jetzt);
    g.gain.linearRampToValueAtTime(0, jetzt + blende);
    try { src.stop(jetzt + blende + 0.02); } catch { /* schon gestoppt */ }
    ausklingend.add(src);
    zeigeZustand(c);
    pult();
  }

  const ausblenden = () => stopp(1.5);

  function beendet(c) {
    if (aktuell !== c) return;
    aktuell = null;
    c.lauf = null;
    clearInterval(uhr);
    gespielt.add(c.id);
    sitzung.set('gespielt', [...gespielt]);
    zeigeZustand(c);
    pult();
  }

  // Der nächste Hauptclip (gleicher Sprecherfilter) nach dem zuletzt gestarteten bekommt eine dezente Markierung.
  function markiereNaechsten() {
    for (const c of clips) c.el && c.el.classList.remove('naechster');
    if (!zuletzt) return;
    const i = clips.indexOf(zuletzt);
    const n = clips.slice(i + 1).find((c) => !c.reserve && passt(c));
    if (n && n.el) n.el.classList.add('naechster');
  }

  function zeigeZustand(c) {
    if (!c.el) return;
    const st = c.el.querySelector('.status');
    const knopf = c.el.querySelector('.play');
    const laeuft = aktuell === c;
    c.el.classList.toggle('laeuft', laeuft);
    c.el.classList.toggle('gespielt', gespielt.has(c.id) && !laeuft);
    st.classList.toggle('fehlt', c.zustand === 'fehlt');
    knopf.disabled = c.zustand === 'fehlt';
    knopf.innerHTML = `<svg class="ico"><use href="#i-${laeuft ? 'stopp' : 'play'}"/></svg>`;
    knopf.setAttribute('aria-label', `${c.nr} ${laeuft ? 'stoppen' : 'abspielen'}`);
    if (laeuft) st.textContent = `▶ läuft ${sek(position(c))}`;
    else if (c.zustand === 'fehlt') st.textContent = 'Datei fehlt';
    else if (c.zustand === 'laedt') st.textContent = 'lädt …';
    else st.textContent = gespielt.has(c.id) ? '✓ gespielt' : 'bereit';
    for (const b of document.querySelectorAll('#missionswahl button')) b.classList.toggle('spielt', !!aktuell && b.dataset.mission === aktuell.mission.id);
  }

  function pult(meldung) {
    const j = $('#jetzt'), bal = $('#balken');
    if (aktuell) {
      const d = aktuell.dauer || 0, t = position(aktuell);
      j.innerHTML = `▶ ${esc(aktuell.nr)} · ${esc(SPRECHER[aktuell.stimme].name)} <span class="leise">„${esc(aktuell.text)}“</span> · ${sek(t)} / ${sek(d)}`;
      bal.style.width = d ? `${Math.min(100, (t / d) * 100)}%` : '0';
    } else {
      bal.style.width = '0';
      if (meldung) { j.textContent = meldung; return; }
      j.innerHTML = zuletzt ? `Kein Clip läuft <span class="leise">· zuletzt ${esc(zuletzt.nr)}${gespielt.has(zuletzt.id) ? ' ✓' : ' (gestoppt)'}</span>` : 'Bereit · kein Clip läuft';
    }
  }

  // ------------------------------------------------------------ Missionen, Filter
  function oeffne(id, auf, nurDiese) {
    for (const sec of document.querySelectorAll('.mission')) {
      const diese = sec.id === 'm-' + id;
      if (diese) sec.dataset.offen = String(auf);
      else if (nurDiese) sec.dataset.offen = 'false';
      sec.querySelector('.mission-kopf').setAttribute('aria-expanded', sec.dataset.offen);
    }
    speicher.set('offen', [...document.querySelectorAll('.mission[data-offen="true"]')].map((s) => s.id.slice(2)));
    for (const b of document.querySelectorAll('#missionswahl button')) b.classList.toggle('aktiv', nurDiese && b.dataset.mission === id);
    if (nurDiese) document.getElementById('m-' + id).scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function sichtbarMachen(c) {
    const sec = document.getElementById('m-' + c.mission.id);
    if (sec && sec.dataset.offen !== 'true') oeffne(c.mission.id, true, false);
    const det = c.el.closest('details');
    if (det) det.open = true;
    const r = c.el.getBoundingClientRect();
    if (r.top < 70 || r.bottom > innerHeight - 100) c.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  const passt = (c) => filter === 'alle' || c.stimme === filter;
  function setzeFilter(f) {
    filter = SPRECHER[f] ? f : 'alle';
    speicher.set('sprecher', filter);
    for (const b of document.querySelectorAll('.sprecherwahl button')) b.setAttribute('aria-pressed', String(b.dataset.sprecher === filter));
    for (const c of clips) c.el && c.el.classList.toggle('aus', !passt(c));
    for (const m of missionen) {
      const sichtbar = m.eintraege.some((e) => !e.hinweis && passt(e));
      const sec = document.getElementById('m-' + m.id);
      sec.hidden = !sichtbar;
      for (const h of sec.querySelectorAll('.hinweis')) h.hidden = filter !== 'alle';
      const det = sec.querySelector('.reserve-block');
      if (det) det.hidden = !m.eintraege.some((e) => e.reserve && passt(e));
      const b = document.querySelector(`#missionswahl button[data-mission="${m.id}"]`);
      if (b) b.disabled = !sichtbar;
    }
    markiereNaechsten();
  }
  for (const b of document.querySelectorAll('.sprecherwahl button')) b.addEventListener('click', () => setzeFilter(b.dataset.sprecher));

  // ------------------------------------------------------------ Lautstärke, Stopp, Tasten
  const regler = $('#lautstaerke');
  function setzeLautstaerke(v) {
    lautstaerke = Math.min(1.5, Math.max(0, v));
    regler.value = String(Math.round(lautstaerke * 100));
    $('#lautWert').textContent = `${Math.round(lautstaerke * 100)} %`;
    if (master) master.gain.setTargetAtTime(lautstaerke, ctx.currentTime, 0.02);
    speicher.set('master', lautstaerke);
  }
  regler.addEventListener('input', () => setzeLautstaerke(regler.value / 100));
  setzeLautstaerke(lautstaerke);
  $('#stoppAlles').addEventListener('click', () => stopp());

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) {
      if (e.key !== 'Escape') return;
    }
    const k = (e.key || '').toLowerCase();
    if (k === ' ' || k === 'escape') {
      e.preventDefault();
      stopp();
      return;
    }
    if (k === 'f' && !e.repeat) { ausblenden(); return; }
    if (k === 'arrowup' || k === 'arrowdown') { e.preventDefault(); setzeLautstaerke(lautstaerke + (k === 'arrowup' ? 0.05 : -0.05)); return; }
    if (e.repeat) return;
    const c = perTaste.get(k);
    if (c) { e.preventDefault(); spiele(c); }
  });
  // Leertaste nur als Stopp: ein fokussierter Knopf darf beim Loslassen nicht zusätzlich „klicken“ (sonst startet der Clip neu)
  document.addEventListener('keyup', (e) => {
    if (e.key === ' ' && e.target.closest && e.target.closest('button, summary')) e.preventDefault();
  }, true);

  // ------------------------------------------------------------ Offline
  async function offlineStand() {
    const el = $('#offline');
    if (!el) return;
    const ok = clips.filter((c) => c.zustand === 'bereit').length;
    const fehlt = clips.filter((c) => c.zustand === 'fehlt').length;
    let t = `${ok} von ${clips.length} Clips geladen${fehlt ? ` · ${fehlt} fehlen` : ''}.`;
    if (window.caches && navigator.serviceWorker && navigator.serviceWorker.controller) {
      try {
        const da = await Promise.all(clips.filter((c) => c.url).map((c) => caches.match(c.url)));
        const n = da.filter(Boolean).length;
        t += n === da.length ? ' Offline bereit.' : ` Offline gespeichert: ${n} von ${da.length}.`;
      } catch { /* ohne Offline-Speicher */ }
    }
    el.textContent = t;
  }

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  start();
})();
