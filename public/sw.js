const ISEYA_SW_VERSION = "iseya-sw-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== ISEYA_SW_VERSION).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", () => {
  // Network-first by default. The handler exists to satisfy installability without
  // caching old manifests, theme colors, or application HTML.
});
