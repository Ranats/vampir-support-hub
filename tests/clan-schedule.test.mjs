import assert from "node:assert/strict";
import test from "node:test";

import {
  CLAN_SCHEDULE_KEY,
  DEFAULT_CLAN_SCHEDULE_SETTINGS,
  nextClanOccurrence,
  nextClanOccurrences,
  parseClanScheduleSettings,
  updateClanScheduleItem,
} from "../app/clan-schedule.ts";

test("uses the versioned device-local key and stable defaults", () => {
  assert.equal(CLAN_SCHEDULE_KEY, "vampir-clan-schedule-v1");
  assert.deepEqual(parseClanScheduleSettings(null), DEFAULT_CLAN_SCHEDULE_SETTINGS);
  assert.deepEqual(
    parseClanScheduleSettings(null).items.map((item) => item.contentId),
    ["clan-mission", "clan-guard"],
  );
  assert.ok(parseClanScheduleSettings(null).items.every((item) => (
    item.scheduled === false && item.reminder === true
  )));
});

test("parses known valid items and restores stable content order", () => {
  const parsed = parseClanScheduleSettings(JSON.stringify({
    version: 1,
    items: [
      {
        contentId: "clan-guard",
        scheduled: true,
        day: 6,
        hour: 22,
        minute: 45,
        reminder: false,
      },
      {
        contentId: "clan-mission",
        scheduled: true,
        day: 2,
        hour: 8,
        minute: 5,
        reminder: true,
      },
    ],
  }));

  assert.deepEqual(parsed.items.map((item) => item.contentId), ["clan-mission", "clan-guard"]);
  assert.deepEqual(parsed.items[0], {
    contentId: "clan-mission",
    scheduled: true,
    day: 2,
    hour: 8,
    minute: 5,
    reminder: true,
  });
});

test("filters unknown and duplicate items and defaults malformed known items", () => {
  const parsed = parseClanScheduleSettings(JSON.stringify({
    version: 1,
    items: [
      {
        contentId: "unknown",
        scheduled: true,
        day: 1,
        hour: 12,
        minute: 0,
        reminder: true,
      },
      {
        contentId: "clan-mission",
        scheduled: true,
        day: 1,
        hour: 12,
        minute: 0,
        reminder: false,
      },
      {
        contentId: "clan-mission",
        scheduled: false,
        day: 2,
        hour: 3,
        minute: 4,
        reminder: true,
      },
      {
        contentId: "clan-guard",
        scheduled: true,
        day: 7,
        hour: 24,
        minute: 60,
        reminder: "yes",
      },
    ],
  }));

  assert.equal(parsed.items[0].scheduled, true);
  assert.equal(parsed.items[0].day, 1);
  assert.deepEqual(parsed.items[1], DEFAULT_CLAN_SCHEDULE_SETTINGS.items[1]);
  assert.deepEqual(parseClanScheduleSettings("{broken"), DEFAULT_CLAN_SCHEDULE_SETTINGS);
  assert.deepEqual(
    parseClanScheduleSettings(JSON.stringify({ version: 2, items: [] })),
    DEFAULT_CLAN_SCHEDULE_SETTINGS,
  );
});

test("rejects oversized stored input", () => {
  const oversized = JSON.stringify({
    version: 1,
    items: Array.from({ length: 21 }, () => ({
      contentId: "clan-mission",
      scheduled: true,
      day: 1,
      hour: 12,
      minute: 0,
      reminder: true,
    })),
  });

  assert.deepEqual(parseClanScheduleSettings(oversized), DEFAULT_CLAN_SCHEDULE_SETTINGS);
  assert.deepEqual(parseClanScheduleSettings(" ".repeat(8_193)), DEFAULT_CLAN_SCHEDULE_SETTINGS);
});

test("updates one item without mutating settings or changing order", () => {
  const initial = parseClanScheduleSettings(null);
  const updated = updateClanScheduleItem(initial, "clan-guard", {
    scheduled: true,
    day: 3,
    hour: 21,
    minute: 15,
    reminder: false,
  });

  assert.deepEqual(initial, DEFAULT_CLAN_SCHEDULE_SETTINGS);
  assert.deepEqual(updated.items.map((item) => item.contentId), ["clan-mission", "clan-guard"]);
  assert.deepEqual(updated.items[1], {
    contentId: "clan-guard",
    scheduled: true,
    day: 3,
    hour: 21,
    minute: 15,
    reminder: false,
  });
  assert.deepEqual(
    updateClanScheduleItem(updated, "clan-guard", { minute: 60 }).items,
    updated.items,
  );
  assert.deepEqual(
    updateClanScheduleItem(updated, "unknown", { scheduled: false }).items,
    updated.items,
  );
});

test("calculates the next occurrence at fixed JST boundaries", () => {
  const mondayAtFive = {
    contentId: "clan-mission",
    scheduled: true,
    day: 1,
    hour: 5,
    minute: 0,
    reminder: true,
  };

  assert.equal(
    nextClanOccurrence(mondayAtFive, new Date("2026-08-02T19:59:59.999Z"))?.startsAt.toISOString(),
    "2026-08-02T20:00:00.000Z",
  );
  assert.equal(
    nextClanOccurrence(mondayAtFive, new Date("2026-08-02T20:00:00.000Z"))?.startsAt.toISOString(),
    "2026-08-02T20:00:00.000Z",
  );
  assert.equal(
    nextClanOccurrence(mondayAtFive, new Date("2026-08-02T20:00:00.001Z"))?.startsAt.toISOString(),
    "2026-08-09T20:00:00.000Z",
  );
});

test("uses fixed UTC+9 in winter and summer and builds stable occurrence keys", () => {
  const sundayAtNine = {
    contentId: "clan-guard",
    scheduled: true,
    day: 0,
    hour: 9,
    minute: 0,
    reminder: true,
  };

  const winter = nextClanOccurrence(sundayAtNine, new Date("2026-01-03T23:00:00.000Z"));
  const summer = nextClanOccurrence(sundayAtNine, new Date("2026-07-04T23:00:00.000Z"));
  assert.equal(winter?.startsAt.toISOString(), "2026-01-04T00:00:00.000Z");
  assert.equal(summer?.startsAt.toISOString(), "2026-07-05T00:00:00.000Z");
  assert.equal(summer?.occurrenceKey, "clan-guard:2026-07-05T00:00:00.000Z");
});

test("moves a New York spring gap forward with compatible Temporal semantics", () => {
  const sundayAtTwoThirty = {
    contentId: "clan-mission",
    scheduled: true,
    day: 0,
    hour: 2,
    minute: 30,
    reminder: true,
  };

  const occurrence = nextClanOccurrence(
    sundayAtTwoThirty,
    new Date("2026-03-08T05:00:00.000Z"),
    "America/New_York",
  );
  assert.equal(occurrence?.startsAt.toISOString(), "2026-03-08T07:30:00.000Z");
  assert.equal(
    occurrence?.occurrenceKey,
    "clan-mission:2026-03-08T07:30:00.000Z",
  );
});

test("uses the earlier New York fall-overlap instant", () => {
  const sundayAtOneThirty = {
    contentId: "clan-guard",
    scheduled: true,
    day: 0,
    hour: 1,
    minute: 30,
    reminder: true,
  };

  assert.equal(
    nextClanOccurrence(
      sundayAtOneThirty,
      new Date("2026-11-01T04:00:00.000Z"),
      "America/New_York",
    )?.startsAt.toISOString(),
    "2026-11-01T05:30:00.000Z",
  );
});

test("adds calendar weeks while preserving wall-clock time across DST", () => {
  const sundayAtTwoThirty = {
    contentId: "clan-mission",
    scheduled: true,
    day: 0,
    hour: 2,
    minute: 30,
    reminder: true,
  };

  assert.equal(
    nextClanOccurrence(
      sundayAtTwoThirty,
      new Date("2026-03-08T07:30:00.001Z"),
      "America/New_York",
    )?.startsAt.toISOString(),
    "2026-03-15T06:30:00.000Z",
  );
  assert.equal(
    nextClanOccurrence(sundayAtTwoThirty, new Date(), "Mars/Olympus"),
    null,
  );
});

test("excludes unscheduled items and orders notification candidates by occurrence", () => {
  let settings = parseClanScheduleSettings(null);
  settings = updateClanScheduleItem(settings, "clan-mission", {
    scheduled: true,
    day: 1,
    hour: 12,
    minute: 0,
  });
  settings = updateClanScheduleItem(settings, "clan-guard", {
    scheduled: true,
    day: 1,
    hour: 11,
    minute: 0,
  });

  assert.equal(nextClanOccurrence(DEFAULT_CLAN_SCHEDULE_SETTINGS.items[0], new Date()), null);
  assert.deepEqual(
    nextClanOccurrences(settings, new Date("2026-08-02T20:00:00.000Z")).map((value) => value.contentId),
    ["clan-guard", "clan-mission"],
  );
});
