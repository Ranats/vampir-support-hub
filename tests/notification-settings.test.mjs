import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_NOTIFICATION_SETTINGS,
  parseFavoriteSpawnIds,
  parseNotificationSettings,
} from "../app/notification-settings.ts";

test("parses version 1 notification settings", () => {
  assert.deepEqual(
    parseNotificationSettings(JSON.stringify({
      version: 1,
      enabled: true,
      leadMinutes: 30,
    })),
    { version: 1, enabled: true, leadMinutes: 30 },
  );
});

test("uses safe defaults for broken, unsupported, or partial settings", () => {
  assert.deepEqual(parseNotificationSettings("{broken"), DEFAULT_NOTIFICATION_SETTINGS);
  assert.deepEqual(
    parseNotificationSettings(JSON.stringify({ version: 2, enabled: true, leadMinutes: 5 })),
    DEFAULT_NOTIFICATION_SETTINGS,
  );
  assert.deepEqual(
    parseNotificationSettings(JSON.stringify({ version: 1, enabled: "yes", leadMinutes: 60 })),
    DEFAULT_NOTIFICATION_SETTINGS,
  );
});

test("deduplicates favorites and can restrict them to known spawn ids", () => {
  const raw = JSON.stringify([" boss-a ", "boss-a", "missing", 42, "boss-b"]);

  assert.deepEqual(parseFavoriteSpawnIds(raw), ["boss-a", "missing", "boss-b"]);
  assert.deepEqual(parseFavoriteSpawnIds(raw, ["boss-a", "boss-b"]), ["boss-a", "boss-b"]);
});

test("accepts a versioned favorite-spawn wrapper", () => {
  assert.deepEqual(
    parseFavoriteSpawnIds(JSON.stringify({
      version: 1,
      favoriteSpawnIds: ["gehena"],
    })),
    ["gehena"],
  );
});
