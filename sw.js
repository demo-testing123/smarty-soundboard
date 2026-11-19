/* Offline-Speicher: Seite und alle Sounds bleiben nach dem ersten Besuch im Browser,
 * damit das Soundboard in der Turnhalle auch ohne Internet läuft. */
const CACHE = 'smarty-v21';
const CORE = ['./', 'index.html', 'style.css', 'app.js', 'qr.js', 'beamer.html', 'sounds.json', 'layout.json', 'audio/manifest.json'];
// Simulationen für die Bühne (eigene Seiten im selben Projekt) – ebenfalls offline verfügbar
const SPIELE = [
  'lib/three.module.min.js',
  'verkehr/', 'verkehr/index.html', 'verkehr/style.css', 'verkehr/main.js', 'verkehr/config.js',
  'verkehr/sim.js', 'verkehr/scene3d.js', 'verkehr/render2d.js',
  'wohnen/', 'wohnen/index.html', 'wohnen/style.css', 'wohnen/main.js', 'wohnen/config.js',
  'wohnen/model.js', 'wohnen/scene3d.js',
  'minecraft/', 'minecraft/index.html', 'minecraft/style.css', 'minecraft/main.js', 'minecraft/welt.js', 'minecraft/mcworld.js',
  'natur/', 'natur/index.html', 'natur/style.css', 'natur/main.js', 'natur/config.js', 'natur/model.js', 'natur/scene3d.js',
  'stadt/', 'stadt/index.html', 'stadt/style.css', 'stadt/main.js', 'stadt/daten.js', 'stadt/zustand.js', 'stadt/stadtmodell.js',
  'stadt/ansicht3d.js', 'stadt/minecraft-ausgabe.js', 'stadt/weltleser.js', 'stadt/START-IT-SMART_Ersatzwelt_Stadt-2050.mcworld',
  'stadt/schrift/dm-sans.woff2', 'stadt/schrift/ibm-plex-mono-500.woff2',
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(CORE.map((u) => new Request(u, { cache: 'reload' })));
    await Promise.allSettled(SPIELE.map((u) => c.add(new Request(u, { cache: 'reload' }))));
    try {
      const m = await (await fetch('audio/manifest.json', { cache: 'no-store' })).json();
      // einzeln, damit eine fehlende Datei nicht alles verhindert
      await Promise.allSettled(Object.values(m).map((x) => c.add(`${x.datei}?v=${x.hash}`)));
    } catch { /* Sounds werden beim Abspielen nachgeladen */ }
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

function withTimeout(p, ms) {
  return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  // Sounds und Film: erst Speicher (Adresse enthält Version ?v=…), sonst Netz + speichern
  if ((url.pathname.includes('/audio/') || url.pathname.includes('/film/')) && !url.pathname.endsWith('.json')) {
    e.respondWith((async () => {
      const c = await caches.open(CACHE);
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) await c.put(req, res.clone());
      return res;
    })());
    return;
  }

  // Seite, Texte, Manifest: erst Netz (für Änderungen), bei Funkloch Speicher
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try {
      // no-cache: beim Server nachfragen statt eine alte Fassung aus dem Browser-Cache zu nehmen
      const res = await withTimeout(fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }), 4000);
      if (res.ok) await c.put(req, res.clone());
      return res;
    } catch {
      return (await c.match(req, { ignoreSearch: true })) ||
             (req.mode === 'navigate' ? await c.match('index.html') : Response.error());
    }
  })());
});
