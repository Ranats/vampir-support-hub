import assert from "node:assert/strict";
import test from "node:test";
import {
  EVENT_PROGRESS_KEY,
  eventObjectiveValue,
  normalizeEventProgress,
  parseEventProgress,
  setEventObjectiveProgress,
} from "../app/event-progress.ts";

const events = [{ campaignId: "red-moon", objectives: [
  { id: "world-boss", kind: "count", target: 4, cadence: "weekly" },
  { id: "login", kind: "check", cadence: "daily" },
  { id: "claim", kind: "check", cadence: "once" },
] }];
const event = events[0];
const [worldBoss, login, claim] = event.objectives;

test("keeps progress under the versioned event storage key", () => {
  assert.equal(EVENT_PROGRESS_KEY, "vampir-event-progress-v1");
});

test("updates only known objectives and clamps count/check values", () => {
  let progress = setEventObjectiveProgress({ version: 1, campaigns: {} }, event, worldBoss, 9, "2026-8-14", "2026-8-10");
  progress = setEventObjectiveProgress(progress, event, login, 3, "2026-8-14", "2026-8-10");
  assert.deepEqual(progress, { version: 1, campaigns: { "red-moon": { objectives: {
    "world-boss": { value: 4, cycle: "2026-8-10" }, login: { value: 1, cycle: "2026-8-14" },
  } } } });
  assert.equal(eventObjectiveValue(progress, event, worldBoss, "2026-8-14", "2026-8-10"), 4);
  assert.equal(eventObjectiveValue(progress, event, login, "2026-8-14", "2026-8-10"), 1);
  assert.equal(eventObjectiveValue(progress, event, claim, "2026-8-14", "2026-8-10"), 0);
});

test("checkbox-style updates complete, persist, and reset count and check objectives", () => {
  let progress = setEventObjectiveProgress({ version: 1, campaigns: {} }, event, worldBoss, 2, "2026-8-14", "2026-8-10");
  progress = setEventObjectiveProgress(progress, event, worldBoss, 4, "2026-8-14", "2026-8-10");
  progress = setEventObjectiveProgress(progress, event, login, 1, "2026-8-14", "2026-8-10");

  const restored = parseEventProgress(JSON.stringify(progress), events, "2026-8-14", "2026-8-10");
  assert.equal(eventObjectiveValue(restored, event, worldBoss, "2026-8-14", "2026-8-10"), 4);
  assert.equal(eventObjectiveValue(restored, event, login, "2026-8-14", "2026-8-10"), 1);

  progress = setEventObjectiveProgress(restored, event, worldBoss, 0, "2026-8-14", "2026-8-10");
  progress = setEventObjectiveProgress(progress, event, login, 0, "2026-8-14", "2026-8-10");
  assert.deepEqual(progress, { version: 1, campaigns: {} });
});

test("resets daily and weekly values while retaining once-only progress", () => {
  const progress = { version: 1, campaigns: { "red-moon": { objectives: {
    "world-boss": { value: 2, cycle: "2026-8-3" }, login: { value: 1, cycle: "2026-8-13" }, claim: { value: 1 },
  } } } };
  assert.equal(eventObjectiveValue(progress, event, worldBoss, "2026-8-14", "2026-8-10"), 0);
  assert.equal(eventObjectiveValue(progress, event, login, "2026-8-14", "2026-8-10"), 0);
  assert.equal(eventObjectiveValue(progress, event, claim, "2026-8-14", "2026-8-10"), 1);
  assert.deepEqual(normalizeEventProgress(progress, events, "2026-8-14", "2026-8-10"), {
    version: 1, campaigns: { "red-moon": { objectives: { claim: { value: 1 } } } },
  });
});

test("parsing drops unknown, stale, and zero-value localStorage entries", () => {
  const parsed = parseEventProgress(JSON.stringify({ version: 1, campaigns: {
    "red-moon": { objectives: { "world-boss": { value: 2, cycle: "2026-8-10" }, unknown: { value: 1 }, login: { value: 0, cycle: "2026-8-14" } } },
    oldCampaign: { objectives: { old: { value: 1 } } },
  } }), events, "2026-8-14", "2026-8-10");
  assert.deepEqual(parsed, { version: 1, campaigns: { "red-moon": { objectives: {
    "world-boss": { value: 2, cycle: "2026-8-10" },
  } } } });
});

test("invalid localStorage falls back to empty progress", () => {
  assert.deepEqual(parseEventProgress("{bad", events, "2026-8-14", "2026-8-10"), { version: 1, campaigns: {} });
});

test("one cumulative metric automatically completes every reached reward tier", () => {
  const tieredEvent = { campaignId: "tiered", objectives: [
    { id: "gold-1500", metricId: "gold", kind: "count", target: 1_500_000, cadence: "once" },
    { id: "gold-3000", metricId: "gold", kind: "count", target: 3_000_000, cadence: "once" },
  ] };
  const [lowerTier, upperTier] = tieredEvent.objectives;
  const progress = setEventObjectiveProgress(
    { version: 1, campaigns: {} },
    tieredEvent,
    upperTier,
    3_000_000,
    "2026-8-14",
    "2026-8-10",
  );

  assert.deepEqual(progress.campaigns.tiered.objectives, { gold: { value: 3_000_000 } });
  assert.equal(eventObjectiveValue(progress, tieredEvent, lowerTier, "2026-8-14", "2026-8-10"), 1_500_000);
  assert.equal(eventObjectiveValue(progress, tieredEvent, upperTier, "2026-8-14", "2026-8-10"), 3_000_000);
  assert.deepEqual(normalizeEventProgress(progress, [tieredEvent], "2026-8-14", "2026-8-10"), progress);

  const reset = setEventObjectiveProgress(progress, tieredEvent, lowerTier, 0, "2026-8-14", "2026-8-10");
  assert.equal(eventObjectiveValue(reset, tieredEvent, lowerTier, "2026-8-14", "2026-8-10"), 0);
  assert.equal(eventObjectiveValue(reset, tieredEvent, upperTier, "2026-8-14", "2026-8-10"), 0);
});
