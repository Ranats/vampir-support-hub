import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const publicUrl = new URL("../public/", import.meta.url);
const serviceWorkerSource = await readFile(new URL("sw.js", publicUrl), "utf8");

test("ships installable PWA metadata and raster icons", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("manifest.webmanifest", publicUrl), "utf8"),
  );

  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/");
  assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192"));
  assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512"));
  assert.ok(manifest.icons.some((icon) => icon.purpose === "maskable"));

  for (const filename of ["icon-192.png", "icon-512.png", "icon-maskable-512.png"]) {
    const details = await stat(new URL(filename, publicUrl));
    assert.ok(details.size > 1_000, `${filename} should contain a real icon`);
  }
});

test("ships an English install experience for the English route", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("manifest-en.webmanifest", publicUrl), "utf8"),
  );

  assert.equal(manifest.id, "/en");
  assert.equal(manifest.lang, "en");
  assert.equal(manifest.start_url, "/en");
  assert.equal(manifest.name, "VAMPIR Daily Navigator");
  assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192"));
  assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512"));
});

test("service worker uses network-first requests and handles notification clicks", async () => {
  assert.match(serviceWorkerSource, /addEventListener\("fetch"/);
  assert.match(serviceWorkerSource, /fetch\(request\)/);
  assert.match(serviceWorkerSource, /url\.pathname\.startsWith\("\/api\/"\)/);
  assert.match(serviceWorkerSource, /url\.pathname\.startsWith\("\/clan\/"\)/);
  assert.match(serviceWorkerSource, /url\.pathname\.startsWith\("\/en\/clan\/"\)/);
  assert.match(serviceWorkerSource, /addEventListener\("notificationclick"/);
  assert.match(serviceWorkerSource, /clients\.openWindow/);
  assert.match(serviceWorkerSource, /2026-07-31-v4/);
});

test("service worker never intercepts or caches clan routes", () => {
  const listeners = new Map();
  const self = {
    location: { origin: "https://vampir.cilabworks.com" },
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    skipWaiting() {},
    clients: {
      claim() {},
      matchAll: async () => [],
      openWindow() {},
    },
  };
  const context = vm.createContext({
    URL,
    Response,
    caches: {
      open: async () => ({
        addAll: async () => {},
        put: async () => {
          assert.fail("clan routes must not enter Cache Storage");
        },
      }),
      keys: async () => [],
      delete: async () => true,
      match: async () => {
        assert.fail("clan routes must not read Cache Storage");
      },
    },
    fetch: async () => {
      assert.fail("the service worker must not fetch clan routes");
    },
    self,
  });
  vm.runInContext(serviceWorkerSource, context);

  const fetchListener = listeners.get("fetch");
  assert.equal(typeof fetchListener, "function");

  for (const path of [
    "/clan",
    "/clan/create",
    "/clan/example",
    "/en/clan",
    "/en/clan/create",
    "/en/clan/example",
  ]) {
    let intercepted = false;
    fetchListener({
      request: new Request(`https://vampir.cilabworks.com${path}`),
      respondWith() {
        intercepted = true;
      },
      waitUntil() {},
    });
    assert.equal(intercepted, false, `${path} must bypass the service worker`);
  }
});
