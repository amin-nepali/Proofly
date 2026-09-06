const CACHE_NAME = "proofly-shell-v22";
const BASE_PATH = new URL("./", self.registration.scope).pathname;
const APP_SHELL = [
  BASE_PATH,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}vault.html`,
  `${BASE_PATH}qr-vault.html`,
  `${BASE_PATH}profile.html`,
  `${BASE_PATH}styles.css`,
  `${BASE_PATH}manifest.json`,
  `${BASE_PATH}icons/icon.svg`,
  `${BASE_PATH}icons/proofly-logo.svg`,
  `${BASE_PATH}js/firebase-config.js`,
  `${BASE_PATH}js/firebase-bootstrap.js`,
  `${BASE_PATH}js/profile.js`,
  `${BASE_PATH}js/profile-page.js`,
  `${BASE_PATH}js/account.js`,
  `${BASE_PATH}js/auth.js`,
  `${BASE_PATH}js/scanner.js`,
  `${BASE_PATH}js/vault.js`,
  `${BASE_PATH}js/app.js`
  ,`${BASE_PATH}js/page-common.js`
  ,`${BASE_PATH}js/page-vault.js`
  ,`${BASE_PATH}js/page-qr.js`
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    const navigationKey = new URL(request.url).pathname;
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(navigationKey, copy));
          return response;
        })
        .catch(() => caches.match(navigationKey).then((cached) => cached || caches.match(`${BASE_PATH}index.html`)))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});