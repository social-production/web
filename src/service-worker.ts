/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

const sw = globalThis as unknown as ServiceWorkerGlobalScope;
const CACHE = `sp-shell-${version}`;

/** Built assets and static files only. Never cache API responses or signed-in pages. */
const ASSETS = new Set([...build, ...files]);

sw.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([...ASSETS]))
      .then(() => sw.skipWaiting())
  );
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => sw.clients.claim())
  );
});

sw.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== sw.location.origin) return;
  if (!ASSETS.has(url.pathname)) return;

  event.respondWith(caches.match(event.request).then((cached) => cached ?? fetch(event.request)));
});
