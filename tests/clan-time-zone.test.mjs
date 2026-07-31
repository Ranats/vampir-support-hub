import assert from "node:assert/strict";
import test from "node:test";

import {
  CLAN_SCHEDULE_TIME_ZONE_KEY,
  initialClanScheduleTimeZone,
  isValidClanTimeZone,
  parseClanScheduleTimeZoneSettings,
  resolveClanScheduleTimeZone,
} from "../app/clan-time-zone.ts";

test("uses a separate strict versioned clan time-zone key", () => {
  assert.equal(
    CLAN_SCHEDULE_TIME_ZONE_KEY,
    "vampir-clan-schedule-time-zone-v1",
  );
  assert.deepEqual(
    parseClanScheduleTimeZoneSettings(
      JSON.stringify({ version: 1, timeZone: "America/New_York" }),
    ),
    { version: 1, timeZone: "America/New_York" },
  );
  assert.equal(parseClanScheduleTimeZoneSettings(
    JSON.stringify({ version: 1, timeZone: "Mars/Olympus" }),
  ), null);
  assert.equal(parseClanScheduleTimeZoneSettings(
    JSON.stringify({ version: 1, timeZone: "UTC", extra: true }),
  ), null);
  assert.equal(isValidClanTimeZone("Asia/Tokyo"), true);
  assert.equal(isValidClanTimeZone("not a zone"), false);
});

test("keeps legacy and Japanese defaults in JST and uses browser zones for new English users", () => {
  assert.equal(initialClanScheduleTimeZone("ja", null, "America/New_York"), "Asia/Tokyo");
  assert.equal(initialClanScheduleTimeZone("en", "{\"version\":1}", "America/New_York"), "Asia/Tokyo");
  assert.equal(initialClanScheduleTimeZone("en", null, "America/New_York"), "America/New_York");
  assert.equal(initialClanScheduleTimeZone("en", null, "invalid"), "UTC");
  assert.equal(initialClanScheduleTimeZone("en", null, null), "UTC");
});

test("fails invalid stored time zones closed without changing legacy semantics", () => {
  assert.equal(
    resolveClanScheduleTimeZone(
      "en",
      null,
      JSON.stringify({ version: 1, timeZone: "Mars/Olympus" }),
      "America/New_York",
    ),
    "Asia/Tokyo",
  );
  assert.equal(
    resolveClanScheduleTimeZone(
      "en",
      null,
      JSON.stringify({ version: 1, timeZone: "Europe/London" }),
      "America/New_York",
    ),
    "Europe/London",
  );
});
