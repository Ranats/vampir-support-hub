import assert from "node:assert/strict";
import test from "node:test";
import {
  DAILY_TASKS,
  GAME_CONTENT,
  LAST_CONTENT_UPDATE_CHECKED_AT,
  LIMITED_EVENTS,
  SPAWN_EVENTS,
  UPDATE_PENDING_REVIEW_AFTER_DAYS,
  WEEKLY_TASKS,
  oldestGameContentVerifiedAt,
  oldestPendingGameContentUpdateAt,
  pendingUpdateNeedsReview,
  validateGameContent,
} from "../app/game-content.ts";

const RED_MOON_FESTA_EVENT_ARTICLES = new Map([
  ["red-moon-festa-boss", 259],
  ["red-moon-festa-boss-mission", 260],
  ["recombine-ticket-login", 261],
  ["red-moon-festa-dungeon", 262],
  ["event-dungeon-mission", 264],
  ["diamond-grail", 265],
  ["equipment-enhancement-ranking", 266],
  ["artifact-enhancement-payback", 267],
  ["daily-login-rewards", 268],
]);

function copyContent() {
  return structuredClone(GAME_CONTENT);
}

test("game content retains the published IDs, counts, times, and deadlines", () => {
  assert.deepEqual(SPAWN_EVENTS.map(({ id, hour, minute, days, minLevel, endsAt }) => ({ id, hour, minute, days, minLevel, endsAt })), [
    { id: "event-boss-bardeun-day", hour: 11, minute: 50, days: undefined, minLevel: undefined, endsAt: "2026-09-15T19:59:00.000Z" },
    { id: "world-noon", hour: 12, minute: 0, days: undefined, minLevel: undefined, endsAt: undefined },
    { id: "gehenna-13", hour: 13, minute: 0, days: undefined, minLevel: 52, endsAt: undefined },
    { id: "gehenna-17", hour: 17, minute: 0, days: undefined, minLevel: 52, endsAt: undefined },
    { id: "event-boss-bardeun-night", hour: 19, minute: 50, days: undefined, minLevel: undefined, endsAt: "2026-09-15T19:59:00.000Z" },
    { id: "world-night", hour: 20, minute: 0, days: undefined, minLevel: undefined, endsAt: undefined },
    { id: "gehenna-21", hour: 21, minute: 0, days: undefined, minLevel: 52, endsAt: undefined },
    { id: "gehenna-sat-22", hour: 22, minute: 0, days: [6], minLevel: 64, endsAt: undefined },
  ]);
  assert.deepEqual(DAILY_TASKS.map((task) => task.id), ["daily-quest", "creation-abyss", "faded-legacy", "death-recovery", "gold-shop"]);
  assert.deepEqual(WEEKLY_TASKS.map((task) => task.id), ["epic-dungeon", "ancient-workshop", "dark-trade", "clan-mission", "clan-guard", "farm-diamond", "gehenna-weekly"]);
  assert.deepEqual(LIMITED_EVENTS.map((event) => [event.id, event.deadline.toISOString()]), [
    ["sigil-red-moon", "2026-08-25T19:59:00.000Z"],
    ["sigil-red-moon-support", "2026-08-25T19:59:00.000Z"],
    ["bloodline-payback", "2026-08-25T19:59:00.000Z"],
    ["seven-day-growth", "2026-08-25T22:59:00.000Z"],
    ["red-moon-login", "2026-08-18T19:59:00.000Z"],
    ["daily-double", "2026-08-25T19:59:00.000Z"],
    ["special-login", "2026-08-25T19:59:00.000Z"],
    ["basic-growth", "2026-08-25T19:59:00.000Z"],
    ["release-growth", "2026-09-15T19:59:00.000Z"],
    ["summon-mission", "2026-09-15T19:59:00.000Z"],
    ["summon-ranking", "2026-08-18T19:59:00.000Z"],
    ["commandment-payback", "2026-09-15T19:59:00.000Z"],
    ["hundred-day-growth", "2026-11-17T19:59:00.000Z"],
    ["red-moon-festa-boss", "2026-09-15T19:59:00.000Z"],
    ["red-moon-festa-boss-mission", "2026-09-15T19:59:00.000Z"],
    ["recombine-ticket-login", "2026-09-15T22:59:00.000Z"],
    ["red-moon-festa-dungeon", "2026-09-08T19:59:00.000Z"],
    ["event-dungeon-mission", "2026-09-01T19:59:00.000Z"],
    ["diamond-grail", "2026-09-08T19:59:00.000Z"],
    ["equipment-enhancement-ranking", "2026-09-08T19:59:00.000Z"],
    ["artifact-enhancement-payback", "2026-09-01T19:59:00.000Z"],
    ["daily-login-rewards", "2026-08-29T19:59:00.000Z"],
  ]);
  assert.equal(oldestGameContentVerifiedAt(), "2026-07-30T00:00:00+09:00");
  assert.equal(SPAWN_EVENTS[2].title, "ゲヘナ ★1・★2");
  assert.equal(DAILY_TASKS[0].note, "オルガの恩寵がある場合は12件");
  assert.equal(DAILY_TASKS[2].title, "褪せた遺産 1時間");
  assert.equal(WEEKLY_TASKS[3].title, "クラン任務を確認");
  assert.equal(WEEKLY_TASKS[4].title, "クラン守護を確認");
  assert.equal(LIMITED_EVENTS.find(({ id }) => id === "seven-day-growth")?.objectives.length, 37);
  assert.equal(LIMITED_EVENTS.find(({ id }) => id === "release-growth")?.objectives.length, 32);
  assert.equal(LIMITED_EVENTS.find(({ id }) => id === "daily-double")?.objectives[0].target, 10);
  assert.match(LIMITED_EVENTS.find(({ id }) => id === "daily-double")?.objectives[0].title ?? "", /基本/);

  const sigilTrade = LIMITED_EVENTS.find(({ id }) => id === "sigil-red-moon");
  assert.equal(sigilTrade?.campaignId, "sigil-red-moon-2026-08");
  assert.deepEqual(sigilTrade?.objectives.map(({ id, target }) => [id, target]), [
    ["sword-plus-11", 1],
    ["armor-plus-10", 1],
    ["ring-plus-6", 1],
    ["sword-plus-9", 4],
    ["armor-plus-8", 4],
    ["ring-plus-4", 4],
  ]);

  const sevenDay = LIMITED_EVENTS.find(({ id }) => id === "seven-day-growth");
  assert.deepEqual([...new Set(sevenDay?.objectives.flatMap(({ day }) => day === undefined ? [] : [day]))], [1, 2, 3, 4, 5, 6, 7]);
  for (let day = 1; day <= 7; day += 1) {
    assert.equal(sevenDay?.objectives.filter((objective) => objective.day === day).length, 5);
  }
  assert.equal(sevenDay?.objectives.filter(({ day }) => day === undefined).length, 2);

  const bossMission = LIMITED_EVENTS.find(({ id }) => id === "red-moon-festa-boss-mission");
  assert.equal(bossMission?.objectives[0].target, 20);
  const dungeonMission = LIMITED_EVENTS.find(({ id }) => id === "event-dungeon-mission");
  assert.deepEqual(dungeonMission?.objectives.map(({ id, target }) => [id, target]), [["world-bosses", 18], ["creation", 6000], ["faded", 6000]]);
  const ranking = LIMITED_EVENTS.find(({ id }) => id === "equipment-enhancement-ranking");
  assert.deepEqual(ranking?.objectives.slice(0, 2).map(({ target }) => target), [5000000, 2000]);
  assert.deepEqual(ranking?.milestones.map(({ deadline }) => deadline.toISOString()), ["2026-09-01T19:59:00.000Z", "2026-09-08T19:59:00.000Z"]);
  assert.doesNotMatch(ranking?.summary ?? "", /強化に使った/);
  assert.doesNotMatch(ranking?.objectives[2].action ?? "", /受取可能/);
  const diamondGrail = LIMITED_EVENTS.find(({ id }) => id === "diamond-grail");
  assert.equal(diamondGrail?.detailsUrl, "https://forum.netmarble.com/vampir_jp/view/20/265");
  assert.match(diamondGrail?.summary ?? "", /20%.*1,100円.*有料商品購入/);
  assert.match(diamondGrail?.summaryEn ?? "", /20%.*¥1,100 product/);
  assert.deepEqual(diamondGrail?.milestones.map(({ deadline }) => deadline.toISOString()), ["2026-09-01T19:59:00.000Z", "2026-09-08T19:59:00.000Z"]);
  assert.equal(LIMITED_EVENTS.find(({ id }) => id === "artifact-enhancement-payback")?.objectives[0].target, 5000);
  for (const [id, article] of RED_MOON_FESTA_EVENT_ARTICLES) {
    assert.equal(LIMITED_EVENTS.find((event) => event.id === id)?.detailsUrl, `https://forum.netmarble.com/vampir_jp/view/20/${article}`);
  }
});

test("sources are explicitly classified and every published item is dated and sourced", () => {
  assert.equal(GAME_CONTENT.sources.length, 28);
  assert.deepEqual(GAME_CONTENT.sources.slice(0, 5).map(({ id, authority }) => [id, authority]), [
    ["official", "official"], ["routines", "supplementary"], ["clan-official", "official"],
    ["gehenna", "supplementary"], ["events", "supplementary"],
  ]);
  assert.ok(GAME_CONTENT.sources.slice(5).every(({ authority }) => authority === "official"));
  assert.deepEqual(SPAWN_EVENTS[0].sourceIds, ["event-red-moon-boss"]);
  assert.equal(SPAWN_EVENTS[0].verifiedAt, "2026-08-19T12:45:00+09:00");
  assert.equal(SPAWN_EVENTS[0].endsAt, "2026-09-15T19:59:00.000Z");
  assert.deepEqual(SPAWN_EVENTS[1].sourceIds, ["routines"]);
  for (const item of [...SPAWN_EVENTS, ...DAILY_TASKS, ...WEEKLY_TASKS]) {
    assert.ok(item.sourceIds.length > 0);
    assert.equal(item.verifiedAt, item.id.startsWith("event-boss-bardeun") ? "2026-08-19T12:45:00+09:00" : "2026-07-30T00:00:00+09:00");
  }
  for (const event of LIMITED_EVENTS) {
    assert.ok(event.sourceIds.length > 0);
    assert.equal(event.verifiedAt, RED_MOON_FESTA_EVENT_ARTICLES.has(event.id) ? "2026-08-19T12:45:00+09:00" : "2026-08-14T00:00:00+09:00");
    assert.ok(event.objectives.length > 0);
    assert.ok(event.milestones.length > 0);
  }
});

test("validator accepts the published definition", () => {
  assert.equal(validateGameContent(copyContent()).sources.length, 28);
});

test("oldest published-value verification keeps the earliest item date visible", () => {
  const content = copyContent();
  content.dailyTasks[0].verifiedAt = "2026-08-01T00:00:00+09:00";
  content.weeklyTasks[0].verifiedAt = "2026-07-20T00:00:00+09:00";
  assert.equal(oldestGameContentVerifiedAt(content), "2026-07-20T00:00:00+09:00");
});

test("update review status is based only on confirmed unapplied updates", () => {
  assert.equal(LAST_CONTENT_UPDATE_CHECKED_AT, "2026-08-19T12:45:00+09:00");
  assert.equal(UPDATE_PENDING_REVIEW_AFTER_DAYS, 14);
  assert.equal(oldestPendingGameContentUpdateAt(), null);
  assert.equal(pendingUpdateNeedsReview(new Date("2026-08-30T00:00:00+09:00")), false);

  const content = copyContent();
  content.dailyTasks[0].updateRequiredAt = "2026-08-14T09:15:00+09:00";
  content.weeklyTasks[0].updateRequiredAt = "2026-08-13T09:15:00+09:00";
  assert.equal(oldestPendingGameContentUpdateAt(content), "2026-08-13T09:15:00+09:00");
  assert.equal(pendingUpdateNeedsReview(new Date("2026-08-27T09:14:59+09:00"), oldestPendingGameContentUpdateAt(content)), false);
  assert.equal(pendingUpdateNeedsReview(new Date("2026-08-27T09:15:00+09:00"), oldestPendingGameContentUpdateAt(content)), true);
});

for (const [name, mutate] of [
  ["duplicate IDs", (content) => { content.dailyTasks[0].id = content.spawnEvents[0].id; }],
  ["unknown source IDs", (content) => { content.dailyTasks[0].sourceIds = ["missing"]; }],
  ["duplicate source IDs", (content) => { content.dailyTasks[0].sourceIds = ["routines", "routines"]; }],
  ["invalid source URLs", (content) => { content.sources[0].url = "http://example.test"; }],
  ["whitespace-only source labels", (content) => { content.sources[0].label.ja = "   "; }],
  ["invalid verification dates", (content) => { content.dailyTasks[0].verifiedAt = "2026-07-30"; }],
  ["invalid pending-update dates", (content) => { content.dailyTasks[0].updateRequiredAt = "2026-08-14"; }],
  ["pending updates before verification", (content) => { content.dailyTasks[0].updateRequiredAt = "2026-07-29T00:00:00+09:00"; }],
  ["pending updates after the latest check", (content) => { content.dailyTasks[0].updateRequiredAt = "2026-08-19T12:45:01+09:00"; }],
  ["rolled-over calendar dates", (content) => { content.dailyTasks[0].verifiedAt = "2026-02-31T00:00:00+09:00"; }],
  ["rolled-over hours", (content) => { content.dailyTasks[0].verifiedAt = "2026-01-01T24:00:00+09:00"; }],
  ["invalid weekdays", (content) => { content.spawnEvents[5].days = [7]; }],
  ["invalid times", (content) => { content.spawnEvents[0].hour = 24; }],
  ["invalid spawn end dates", (content) => { content.spawnEvents[0].endsAt = "2026-09-16"; }],
  ["spawn end dates before verification", (content) => { content.spawnEvents[0].endsAt = "2026-08-19T12:44:59+09:00"; }],
  ["invalid levels", (content) => { content.dailyTasks[1].minLevel = 0; }],
  ["invalid priorities", (content) => { content.dailyTasks[0].priority = 6; }],
  ["invalid deadlines", (content) => { content.limitedEvents[0].deadline = new Date("invalid"); }],
  ["unreferenced details URLs", (content) => { content.limitedEvents[0].detailsUrl = "https://example.test/details"; }],
  ["duplicate campaign IDs", (content) => { content.limitedEvents[1].campaignId = content.limitedEvents[0].campaignId; }],
  ["duplicate objective IDs", (content) => { content.limitedEvents[0].objectives[1].id = content.limitedEvents[0].objectives[0].id; }],
  ["invalid objective targets", (content) => { content.limitedEvents[1].objectives[0].target = 0; }],
  ["invalid objective days", (content) => { content.limitedEvents[3].objectives[0].day = 8; }],
  ["milestones after the event deadline", (content) => { content.limitedEvents[0].milestones[0].deadline = new Date("2026-09-01T00:00:00Z"); }],
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
