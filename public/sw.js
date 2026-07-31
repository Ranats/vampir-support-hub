const CACHE_PREFIX = "vampir-support-hub-";
// Bump this value whenever the app shell changes. activate removes older versions.
const CACHE_NAME = `${CACHE_PREFIX}2026-07-31-v4`;
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Capability-protected responses must never enter Cache Storage. Let the
  // browser perform API and clan requests directly so no-store, authorization,
  // and the Web Analytics exclusion stay authoritative even while offline.
  const isClanRoute =
    url.pathname === "/clan" ||
    url.pathname.startsWith("/clan/") ||
    url.pathname === "/en/clan" ||
    url.pathname.startsWith("/en/clan/");
  if (url.pathname.startsWith("/api/") || isClanRoute) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        if (request.mode === "navigate") {
          const appShell = await caches.match("/");
          if (appShell) return appShell;
        }

        return new Response("Offline", {
          status: 503,
          statusText: "Offline",
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const requestedUrl = event.notification.data?.url;
  const targetUrl = new URL(
    typeof requestedUrl === "string" ? requestedUrl : "/",
    self.location.origin,
  );
  const safeUrl = targetUrl.origin === self.location.origin
    ? targetUrl.href
    : new URL("/", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true })
      .then(async (clients) => {
        const matchingClient = clients.find((client) => client.url === safeUrl);
        if (matchingClient) return matchingClient.focus();

        const existingClient = clients[0];
        if (existingClient) {
          await existingClient.navigate(safeUrl);
          return existingClient.focus();
        }

        return self.clients.openWindow(safeUrl);
      }),
  );
});
