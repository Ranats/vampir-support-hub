import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const publicUrl = new URL("../public/", import.meta.url);

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
  const worker = await readFile(new URL("sw.js", publicUrl), "utf8");
  assert.match(worker, /addEventListener\("fetch"/);
  assert.match(worker, /fetch\(request\)/);
  assert.match(worker, /if \(url\.pathname\.startsWith\("\/api\/"\)\) return/);
  assert.match(worker, /addEventListener\("notificationclick"/);
  assert.match(worker, /clients\.openWindow/);
});
