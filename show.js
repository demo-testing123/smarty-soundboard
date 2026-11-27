/* START IT SMART – Dashboard 2: Show-Zentrale.
 * Große Kacheln für Filme und vorhandene Anwendungen (show.json). Filme laufen in einem normalen Video-Element,
 * auf Wunsch im Vollbild auf dem Bildschirm, auf dem das Fenster liegt. Kein Beamerfenster, keine Fernsteuerung.
 * show.html?film=intro|abschluss öffnet nur den Film in einem eigenen Fenster (zum Verschieben auf einen anderen Bildschirm). */
'use strict';
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const q = new URLSearchParams(location.search);
  const filmModus = q.get('film') || '';
  window.name = filmModus ? 'smarty-film-' + filmModus : 'smarty-show';
  const speicher = {
    get(k, d) { try { const v = localStorage.getItem('smarty.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('smarty.' + k, JSON.stringify(v)); } catch { /* privat */ } },
    del(k) { try { localStorage.removeItem('smarty.' + k); } catch { /* privat */ } },
  };
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const ico = (n) => `<svg class="ico" aria-hidden="true"><use href="#i-${n}"/></svg>`;

  let show = null, folieVorgabe = {}, manifest = {};
  const filme = new Map();        // id → { titel, url, blob }

  async function json(url, ersatz) {
    try { const r = await fetch(url, { cache: 'no-cache' }); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json(); }
    catch (e) { if (ersatz !== undefined) return ersatz; throw e; }
  }

  // ------------------------------------------------------------ Links (Vorgabe aus Dateien, Änderung nur in diesem Browser)
  const kachel = (id) => show.kacheln.find((k) => k.id === id) || {};
  const vorgabe = {
    canva: () => kachel('praesentation').canva || '',
    calliope: () => kachel('calliope').href || '',
    stadt: () => ((folieVorgabe.qr || []).find((x) => x.id === 'stadt') || {}).url || '',
    feedback: () => ((folieVorgabe.qr || []).find((x) => x.id === 'feedback') || {}).url || '',
  };
  const schluessel = { canva: 'show.canva', calliope: 'show.calliope', stadt: 'folie.stadt', feedback: 'folie.feedback' };
  const link = (n) => speicher.get(schluessel[n], vorgabe[n]());

  // ------------------------------------------------------------ Start
  async function start() {
    try {
      [show, manifest] = await Promise.all([json('show.json'), json('audio/manifest.json', {})]);
      const sounds = await json('sounds.json', {});
      folieVorgabe = sounds.abschlussfolie || {};
    } catch (e) {
      $('#kacheln').innerHTML = `<p class="fehler">show.json konnte nicht geladen werden (${esc(e.message)}). Seite neu laden.</p>`;
      return;
    }
    for (const k of show.kacheln.filter((x) => x.art === 'film')) {
      const m = manifest[k.manifest];
      filme.set(k.id, { id: k.id, titel: k.titel, url: m ? `${k.film}?v=${m.hash}` : k.film, blob: '' });
    }
    if (filmModus) { filmFenster(); return; }
    const mc = show.minecraft || {};
    $('#mcStart').href = mc.start || 'https://education.minecraft.net/';
    $('#mcErsatz').href = mc.ersatzwelt || 'stadt/START-IT-SMART_Ersatzwelt_Stadt-2050.mcworld';
    $('#titel').textContent = show.titel || 'Show-Zentrale';
    $('#untertitel').textContent = show.untertitel || '';
    zeichne();
    for (const f of filme.values()) await vorladen(f);     // nacheinander: erst der Introfilm
  }

  function zeichne() {
    const box = $('#kacheln');
    box.innerHTML = '';
    for (const k of show.kacheln) {
      const el = document.createElement('article');
      el.className = 'kachel';
      el.dataset.id = k.id;
      const bild = k.bild ? `<img class="kachel-bild" src="${esc(k.bild)}" alt="" loading="lazy">` : `<div class="kachel-band" aria-hidden="true">${ico(k.icon)}</div>`;
      let knopf = '', info = esc(k.info || ''), zweit = '';
      if (k.art === 'film') {
        knopf = `<button type="button" class="knopf gelb los" data-film="${k.id}">${ico('play')} ${esc(k.knopf)}</button>`;
        info += ` <button type="button" class="textlink" data-fenster="${k.id}" title="Nur den Film in einem eigenen Fenster öffnen, z. B. zum Verschieben auf den Beamer">in eigenem Fenster</button>` +
                ` <span class="laden" data-laden="${k.id}">${filme.get(k.id).blob ? 'bereit (auch offline)' : 'lädt …'}</span>`;
      } else if (k.art === 'link') {
        knopf = `<a class="knopf gelb los" href="${esc(k.href)}" target="${esc(k.fenster || '_blank')}">${ico('play')} ${esc(k.knopf)}</a>`;
      } else if (k.art === 'minecraft') {
        knopf = `<button type="button" class="knopf gelb los" data-minecraft>${ico('play')} ${esc(k.knopf)}</button>`;
      } else if (k.art === 'extern') {
        const url = link(k.linkfeld || 'calliope');
        knopf = url ? `<a class="knopf gelb los" href="${esc(url)}" target="${esc(k.fenster || '_blank')}" rel="noopener">${ico('extern')} ${esc(k.knopf)}</a>`
                    : `<button type="button" class="knopf gelb los" data-links aria-disabled="true">Link fehlt – „Links bearbeiten“</button>`;
        if (url) info += ` · <span>${esc(url.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</span>`;
      } else if (k.art === 'praesentation') {
        const url = link('canva');
        knopf = url ? `<a class="knopf gelb los" href="${esc(url)}" target="smarty-praesentation" rel="noopener">${ico('play')} ${esc(k.knopf)} (Canva)</a>`
                    : `<button type="button" class="knopf gelb los" data-links aria-disabled="true">Canva-Link fehlt – hier eintragen</button>`;
        // Auftrag 06: Bühnenfolien als unverändertes PDF (aus der Original-PowerPoint), öffnet im eigenen Tab
        zweit = k.folien ? `<div class="zweit"><a class="knopf" data-folien href="${esc(k.folien)}#view=Fit" target="smarty-folien">${ico('praesentation')} ${esc(k.folienKnopf || 'Bühnenfolien öffnen (PDF)')}</a></div>` : '';
        info = esc(k.dateien || '');
      }
      el.innerHTML = `
        <div class="kachel-kopf"><span class="kachel-icon">${ico(k.icon)}</span><div><h2>${esc(k.titel)}</h2><p>${esc(k.unter || '')}</p></div></div>
        ${bild}${knopf}${zweit}<p class="kachel-info">${info}</p>`;
      box.append(el);
    }
    for (const b of box.querySelectorAll('[data-film]')) b.addEventListener('click', () => filmStart(filme.get(b.dataset.film)));
    for (const b of box.querySelectorAll('[data-fenster]')) b.addEventListener('click', () =>
      window.open(`show.html?film=${b.dataset.fenster}`, 'smarty-film-' + b.dataset.fenster, 'popup=yes,width=1100,height=660'));
    for (const b of box.querySelectorAll('[data-minecraft]')) b.addEventListener('click', () => $('#mcDlg').showModal());
    for (const b of box.querySelectorAll('[data-links]')) b.addEventListener('click', linksOeffnen);
    for (const b of box.querySelectorAll('[data-folie]')) b.addEventListener('click', folieZeigen);
  }

  // Film einmal komplett laden (über den Offline-Speicher), damit er sofort und ohne Netz startet.
  async function vorladen(f) {
    const anzeige = (t, art) => { for (const el of document.querySelectorAll(`[data-laden="${f.id}"], #ffLaden`)) { el.textContent = t; el.className = el.id === 'ffLaden' ? 'klein' : 'laden ' + (art || ''); } };
    if (f.blob) return;
    try {
      const r = await fetch(f.url);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const gesamt = Number(r.headers.get('content-length')) || 0;
      const leser = r.body.getReader();
      const teile = [];
      let n = 0, zuletzt = 0;
      for (;;) {
        const { done, value } = await leser.read();
        if (done) break;
        teile.push(value);
        n += value.length;
        if (gesamt && performance.now() - zuletzt > 250) { zuletzt = performance.now(); anzeige(`lädt ${Math.round((n / gesamt) * 100)} %`); }
      }
      f.blob = URL.createObjectURL(new Blob(teile, { type: 'video/mp4' }));
      anzeige('bereit (auch offline)', 'ok');
    } catch (e) {
      anzeige('nicht vorgeladen – lädt beim Start', 'fehler');
    }
  }

  // ------------------------------------------------------------ Filmwiedergabe
  const kino = $('#kino'), v = $('#kinoVideo');
  let laufend = null, ruhe = 0, folieVoll = false;

  function vollbild(el) {
    try {
      const p = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : (el.webkitRequestFullscreen && el.webkitRequestFullscreen());
      if (p && p.catch) p.catch(() => {});
    } catch { /* Vollbild nicht erlaubt */ }
  }
  const imVollbild = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  function vollbildAus() { if (imVollbild()) { const p = document.exitFullscreen ? document.exitFullscreen() : document.webkitExitFullscreen(); if (p && p.catch) p.catch(() => {}); } }

  function filmStart(f) {
    if (!f) return;
    if (!$('#folie').hidden) folieZu();
    laufend = f;
    kino.hidden = false;
    vollbild(kino);                                   // im selben Klick anfordern, sonst lehnt der Browser ab
    v.classList.remove('zuende');
    $('#kinoTitel').textContent = f.titel;
    $('#kinoPause').textContent = 'Pause';
    $('#kinoKlick').hidden = true;
    v.src = f.blob || f.url;                          // ein einziges Video-Element: der Ton läuft genau einmal
    v.muted = false;
    v.volume = 1;
    v.play().catch(() => { $('#kinoKlick').hidden = false; });
    wach();
  }

  function filmZu() {
    v.pause();
    v.removeAttribute('src');
    v.load();
    laufend = null;
    kino.hidden = true;
    kino.classList.remove('ruhig');
    vollbildAus();
  }

  function wach() {
    kino.classList.remove('ruhig');
    clearTimeout(ruhe);
    ruhe = setTimeout(() => kino.classList.add('ruhig'), 2200);
  }
  kino.addEventListener('mousemove', wach);
  v.addEventListener('timeupdate', () => { $('#kinoZeit').textContent = `${mmss(v.currentTime || 0)} / ${mmss(v.duration || 0)}`; });
  v.addEventListener('ended', () => { v.classList.add('zuende'); $('#kinoPause').textContent = 'Nochmal'; $('#kinoZeit').textContent = 'zu Ende · Esc oder ✕'; });
  v.addEventListener('pause', () => { if (!v.ended) $('#kinoPause').textContent = 'Weiter'; });
  v.addEventListener('play', () => { $('#kinoPause').textContent = 'Pause'; v.classList.remove('zuende'); $('#kinoKlick').hidden = true; });
  $('#kinoPause').addEventListener('click', pauseUmschalten);
  $('#kinoVoll').addEventListener('click', () => (imVollbild() ? vollbildAus() : vollbild(kino)));
  $('#kinoZu').addEventListener('click', filmZu);
  $('#kinoKlick').addEventListener('click', () => v.play().catch(() => {}));
  function pauseUmschalten() {
    if (v.ended) { v.currentTime = 0; v.play().catch(() => {}); }
    else if (v.paused) v.play().catch(() => {});
    else v.pause();
    wach();
  }

  document.addEventListener('fullscreenchange', () => {
    $('#kinoVoll').textContent = imVollbild() ? 'Vollbild aus' : 'Vollbild';
    if (!imVollbild()) {
      if (laufend && v.ended) filmZu();               // Esc nach dem Filmende: zurück zur Übersicht
      if (folieVoll && !$('#folie').hidden) folieZu();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (!kino.hidden) {
      if (e.key === ' ') { e.preventDefault(); pauseUmschalten(); }
      else if (e.key === 'Escape' && !imVollbild()) filmZu();
    } else if (!$('#folie').hidden && (e.key === 'Escape' || e.key === ' ')) { e.preventDefault(); folieZu(); }
  });

  // Eigenes Filmfenster: nur Startknopf, Film und schwarzes Ende
  function filmFenster() {
    const f = filme.get(filmModus);
    document.title = (f ? f.titel : 'Film') + ' · START IT SMART';
    $('#seite').innerHTML = f
      ? `<div class="filmfenster"><div><h1>${esc(f.titel)}</h1><p>Dieses Fenster auf den gewünschten Bildschirm ziehen, dann starten. Esc beendet das Vollbild.</p>
         <button type="button" class="knopf gelb" id="ffStart">${ico('play')} Im Vollbild abspielen</button><p class="klein" id="ffLaden">lädt …</p></div></div>`
      : `<div class="filmfenster"><div><h1>Film nicht gefunden</h1><p>Bitte aus der Show-Zentrale öffnen.</p></div></div>`;
    if (!f) return;
    $('#ffStart').addEventListener('click', () => filmStart(f));
    vorladen(f);
  }

  // ------------------------------------------------------------ Abschlussfolie (QR)
  function folieZeigen() {
    const qr = (folieVorgabe.qr || []).map((x) => ({ ...x, url: link(x.id) }));
    const fehlt = qr.filter((x) => !x.url).map((x) => x.text);
    if (fehlt.length && !confirm(`Für „${fehlt.join('“ und „')}“ ist kein Link eingetragen – dort steht „Link fehlt“.\nTrotzdem zeigen? (Eintragen: „Links bearbeiten …“)`)) return;
    if (laufend) filmZu();
    $('#folieTitel').textContent = folieVorgabe.titel || 'Danke, Zukunftsteam!';
    $('#folieUnter').textContent = folieVorgabe.unter || '';
    const reihe = $('#qrReihe');
    reihe.innerHTML = '';
    for (const x of qr) {
      const k = document.createElement('div');
      k.className = 'qr' + (x.url ? '' : ' fehlt');
      const code = document.createElement('div');
      code.className = 'code';
      if (x.url) { try { code.innerHTML = QR.svg(x.url); } catch { code.textContent = 'Link zu lang'; } } else code.textContent = 'Link fehlt';
      const t = document.createElement('div'); t.className = 'titel'; t.textContent = x.text;
      const u = document.createElement('div'); u.className = 'url'; u.textContent = x.url ? x.url.replace(/^https?:\/\//, '') : '';
      k.append(code, t, u);
      reihe.append(k);
    }
    $('#folie').hidden = false;
    folieVoll = true;
    vollbild($('#folie'));
  }
  function folieZu() { $('#folie').hidden = true; folieVoll = false; vollbildAus(); }
  $('#folie').addEventListener('click', folieZu);

  // ------------------------------------------------------------ Dialoge
  for (const d of document.querySelectorAll('dialog')) {
    d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-zu]')) d.close(); });
  }
  const felder = { canva: '#lkCanva', calliope: '#lkCalliope', stadt: '#lkStadt', feedback: '#lkFeedback' };
  function linksOeffnen() {
    for (const [n, sel] of Object.entries(felder)) { $(sel).value = link(n); $(sel).placeholder = vorgabe[n]() || 'https://…'; }
    $('#linksDlg').showModal();
  }
  $('#linksAuf').addEventListener('click', linksOeffnen);
  $('#lkStandard').addEventListener('click', () => { for (const [n, sel] of Object.entries(felder)) $(sel).value = vorgabe[n](); });
  // beim Absenden speichern (nicht erst beim „close“-Ereignis, das manche Browser verzögert melden)
  $('#linksDlg form').addEventListener('submit', (e) => {
    if (!e.submitter || e.submitter.value !== 'ok') return;
    for (const [n, sel] of Object.entries(felder)) {
      const w = $(sel).value.trim();
      if (w === vorgabe[n]()) speicher.del(schluessel[n]); else speicher.set(schluessel[n], w);
    }
    zeichne();
  });
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  start();
})();
