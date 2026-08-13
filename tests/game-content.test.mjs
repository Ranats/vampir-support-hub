import assert from "node:assert/strict";
import test from "node:test";
import {
  DAILY_TASKS,
  GAME_CONTENT,
  LIMITED_EVENTS,
  SPAWN_EVENTS,
  WEEKLY_TASKS,
  oldestGameContentVerifiedAt,
  validateGameContent,
} from "../app/game-content.ts";

function copyContent() {
  return structuredClone(GAME_CONTENT);
}

test("game content retains the published IDs, counts, times, and deadlines", () => {
  assert.deepEqual(SPAWN_EVENTS.map(({ id, hour, minute, days, minLevel }) => ({ id, hour, minute, days, minLevel })), [
    { id: "world-noon", hour: 12, minute: 0, days: undefined, minLevel: undefined },
    { id: "gehenna-13", hour: 13, minute: 0, days: undefined, minLevel: 52 },
    { id: "gehenna-17", hour: 17, minute: 0, days: undefined, minLevel: 52 },
    { id: "world-night", hour: 20, minute: 0, days: undefined, minLevel: undefined },
    { id: "gehenna-21", hour: 21, minute: 0, days: undefined, minLevel: 52 },
    { id: "gehenna-sat-22", hour: 22, minute: 0, days: [6], minLevel: 64 },
  ]);
  assert.deepEqual(DAILY_TASKS.map((task) => task.id), ["daily-quest", "creation-abyss", "faded-legacy", "death-recovery", "gold-shop"]);
  assert.deepEqual(WEEKLY_TASKS.map((task) => task.id), ["epic-dungeon", "ancient-workshop", "dark-trade", "clan-mission", "clan-guard", "farm-diamond", "gehenna-weekly"]);
  assert.deepEqual(LIMITED_EVENTS.map((event) => [event.id, event.deadline.toISOString()]), [
    ["red-login-7", "2026-08-11T19:59:00.000Z"],
    ["red-growth", "2026-08-11T19:59:00.000Z"],
    ["red-payback", "2026-08-11T19:59:00.000Z"],
    ["daily-double", "2026-08-25T19:59:00.000Z"],
    ["region-growth", "2026-09-15T19:59:00.000Z"],
  ]);
  assert.equal(oldestGameContentVerifiedAt(), "2026-07-30T00:00:00+09:00");
  assert.equal(SPAWN_EVENTS[1].title, "ゲヘナ ★1・★2");
  assert.equal(DAILY_TASKS[0].note, "オルガの恩寵がある場合は12件");
  assert.equal(DAILY_TASKS[2].title, "褪せた遺産 1時間");
  assert.equal(WEEKLY_TASKS[3].title, "クラン任務を確認");
  assert.equal(WEEKLY_TASKS[4].title, "クラン守護を確認");
});

test("sources are explicitly classified and every published item is dated and sourced", () => {
  assert.deepEqual(GAME_CONTENT.sources.map(({ id, authority }) => [id, authority]), [
    ["official", "official"],
    ["routines", "supplementary"],
    ["clan-official", "official"],
    ["gehenna", "supplementary"],
    ["events", "supplementary"],
  ]);
  assert.deepEqual(SPAWN_EVENTS[0].sourceIds, ["routines"]);
  for (const item of [...SPAWN_EVENTS, ...DAILY_TASKS, ...WEEKLY_TASKS, ...LIMITED_EVENTS]) {
    assert.ok(item.sourceIds.length > 0);
    assert.equal(item.verifiedAt, "2026-07-30T00:00:00+09:00");
  }
});

test("validator accepts the published definition", () => {
  assert.equal(validateGameContent(copyContent()).sources.length, 5);
});

test("overall freshness uses the oldest item date so stale content cannot be hidden", () => {
  const content = copyContent();
  content.dailyTasks[0].verifiedAt = "2026-08-01T00:00:00+09:00";
  content.weeklyTasks[0].verifiedAt = "2026-07-20T00:00:00+09:00";
  assert.equal(oldestGameContentVerifiedAt(content), "2026-07-20T00:00:00+09:00");
});

for (const [name, mutate] of [
  ["duplicate IDs", (content) => { content.dailyTasks[0].id = content.spawnEvents[0].id; }],
  ["unknown source IDs", (content) => { content.dailyTasks[0].sourceIds = ["missing"]; }],
  ["duplicate source IDs", (content) => { content.dailyTasks[0].sourceIds = ["routines", "routines"]; }],
  ["invalid source URLs", (content) => { content.sources[0].url = "http://example.test"; }],
  ["whitespace-only source labels", (content) => { content.sources[0].label.ja = "   "; }],
  ["invalid verification dates", (content) => { content.dailyTasks[0].verifiedAt = "2026-07-30"; }],
  ["rolled-over calendar dates", (content) => { content.dailyTasks[0].verifiedAt = "2026-02-31T00:00:00+09:00"; }],
  ["rolled-over hours", (content) => { content.dailyTasks[0].verifiedAt = "2026-01-01T24:00:00+09:00"; }],
  ["invalid weekdays", (content) => { content.spawnEvents[5].days = [7]; }],
  ["invalid times", (content) => { content.spawnEvents[0].hour = 24; }],
  ["invalid levels", (content) => { content.dailyTasks[1].minLevel = 0; }],
  ["invalid priorities", (content) => { content.dailyTasks[0].priority = 6; }],
  ["invalid deadlines", (content) => { content.limitedEvents[0].deadline = new Date("invalid"); }],
  ["unreferenced details URLs", (content) => { content.limitedEvents[0].detailsUrl = "https://example.test/details"; }],
  ["empty source registries", (content) => { content.sources = []; }],
  ["empty spawn event collections", (content) => { content.spawnEvents = []; }],
  ["empty content collections", (content) => {
    content.spawnEvents = [];
    content.dailyTasks = [];
    content.weeklyTasks = [];
    content.limitedEvents = [];
  }],
  ["empty display copy", (content) => { content.dailyTasks[0].title = ""; }],
]) {
  test(`validator fails closed for ${name}`, () => {
    const content = copyContent();
    mutate(content);
    assert.throws(() => validateGameContent(content), /Invalid game content/);
  });
}
