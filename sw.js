/* Offline-Speicher: Seite und alle Sounds bleiben nach dem ersten Besuch im Browser,
 * damit das Soundboard in der Turnhalle auch ohne Internet läuft. */
const CACHE = 'smarty-v1';
const CORE = ['./', 'index.html', 'style.css', 'app.js', 'sounds.json', 'audio/manifest.json'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(CORE.map((u) => new Request(u, { cache: 'reload' })));
    try {
      const m = await (await fetch('audio/manifest.json', { cache: 'no-store' })).json();
      await c.addAll(Object.values(m).map((x) => `${x.datei}?v=${x.hash}`));
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

  // Sounds: erst Speicher (Dateiname enthält Version ?v=…), sonst Netz + speichern
  if (url.pathname.includes('/audio/') && !url.pathname.endsWith('.json')) {
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
      const res = await withTimeout(fetch(req), 4000);
      if (res.ok) await c.put(req, res.clone());
      return res;
    } catch {
      return (await c.match(req, { ignoreSearch: true })) ||
             (req.mode === 'navigate' ? await c.match('index.html') : Response.error());
    }
  })());
});
