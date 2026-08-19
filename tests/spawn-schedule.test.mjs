import assert from "node:assert/strict";
import { register } from "node:module";
import test from "node:test";

register(new URL("../scripts/typescript-extension-loader.mjs", import.meta.url));

const { SPAWN_EVENTS } = await import("../app/game-content.ts");
const { localizedSpawnEvents, upcomingSpawnOccurrences } = await import("../app/spawn-schedule.ts");

const jst = (year, month, day, hour, minute) => new Date(Date.UTC(year, month - 1, day, hour - 9, minute));

test("includes the event boss at 11:50 immediately before its daytime appearance", () => {
  const occurrences = upcomingSpawnOccurrences(SPAWN_EVENTS, jst(2026, 8, 20, 11, 49), 200, 2);
  assert.deepEqual(occurrences.map(({ id, at }) => [id, at.toISOString()]), [
    ["event-boss-bardeun-day", "2026-08-20T02:50:00.000Z"],
    ["world-noon", "2026-08-20T03:00:00.000Z"],
  ]);
});

test("keeps the noon World Boss ahead of the next evening event boss after 11:51", () => {
  const occurrences = upcomingSpawnOccurrences(SPAWN_EVENTS, jst(2026, 8, 20, 11, 51), 200, 4);
  assert.deepEqual(occurrences.slice(0, 3).map(({ id, at }) => [id, at.toISOString()]), [
    ["world-noon", "2026-08-20T03:00:00.000Z"],
    ["gehenna-13", "2026-08-20T04:00:00.000Z"],
    ["gehenna-17", "2026-08-20T08:00:00.000Z"],
  ]);
  assert.equal(occurrences.find(({ id }) => id === "event-boss-bardeun-night")?.at.toISOString(), "2026-08-20T10:50:00.000Z");
});

test("keeps the final 19:50 event boss on September 15", () => {
  const occurrences = upcomingSpawnOccurrences(SPAWN_EVENTS, jst(2026, 9, 15, 19, 49), 200, 2);
  assert.deepEqual(occurrences.map(({ id, at }) => [id, at.toISOString()]), [
    ["event-boss-bardeun-night", "2026-09-15T10:50:00.000Z"],
    ["world-night", "2026-09-15T11:00:00.000Z"],
  ]);
});

test("keeps the existing 30-second appearance grace window", () => {
  const atGraceBoundary = upcomingSpawnOccurrences(SPAWN_EVENTS, new Date("2026-08-20T10:50:30.000Z"), 200, 1);
  const afterGraceBoundary = upcomingSpawnOccurrences(SPAWN_EVENTS, new Date("2026-08-20T10:50:31.000Z"), 200, 1);

  assert.equal(atGraceBoundary[0]?.id, "event-boss-bardeun-night");
  assert.equal(afterGraceBoundary[0]?.id, "world-night");
});

test("removes event boss appearances from the schedule when the event ends", () => {
  const occurrences = upcomingSpawnOccurrences(SPAWN_EVENTS, jst(2026, 9, 16, 4, 59), 200, 20);
  assert.ok(occurrences.every(({ id }) => !id.startsWith("event-boss-bardeun")));
});

test("provides English copy for both event boss appearances", () => {
  const events = localizedSpawnEvents("en").filter(({ id }) => id.startsWith("event-boss-bardeun"));
  assert.deepEqual(events.map(({ title, label }) => [title, label]), [
    ["Event Boss Bardeun", "Daily · through Sep 16, 04:59 JST"],
    ["Event Boss Bardeun", "Daily · through Sep 16, 04:59 JST"],
  ]);
});
