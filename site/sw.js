const CACHE = "magda-shell-v1";
const SHELL = [
  "./", "./index.html", "./style.css", "./app.js", "./pwa.js",
  "./manifest.webmanifest", "./logo-mark.png", "./logo-mark-64.png",
  "./icons/icon-192.png", "./icons/icon-512.png", "./privacy.html",
];
const shellURLs = new Set(SHELL.map((path) => new URL(path, self.registration.scope).href));

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith("magda-shell-") && key !== CACHE)
      .map((key) => caches.delete(key))
  )));
});

// Network first: cache only the interface, never webcam media or traffic data.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  url.hash = "";
  url.search = "";
  if (!shellURLs.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(event.request);
      if (response.ok) {
        await cache.put(url.href, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await cache.match(url.href);
      if (cached) return cached;
      throw error;
    }
  })());
});
