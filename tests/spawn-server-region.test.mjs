import assert from "node:assert/strict";
import test from "node:test";
import { SPAWN_EVENTS } from "../app/game-content.ts";
import {
  DEFAULT_SPAWN_SERVER_REGION,
  SPAWN_SERVER_REGION_KEY,
  formatSpawnServerClock,
  formatSpawnServerTime,
  parseSpawnServerRegion,
  spawnScheduleLabel,
  spawnServerRegionSettings,
  spawnTimeZoneLabel,
} from "../app/spawn-server-region.ts";

const eventBossDay = SPAWN_EVENTS.find(({ id }) => id === "event-boss-bardeun-day");
const eventBossNight = SPAWN_EVENTS.find(({ id }) => id === "event-boss-bardeun-night");
const worldBoss = SPAWN_EVENTS.find(({ id }) => id === "world-noon");

test("stores a strict versioned Event Boss server region preference", () => {
  assert.equal(SPAWN_SERVER_REGION_KEY, "vampir-spawn-server-region-v1");
  assert.equal(parseSpawnServerRegion(null), DEFAULT_SPAWN_SERVER_REGION);
  assert.equal(
    parseSpawnServerRegion(JSON.stringify(spawnServerRegionSettings("taiwan-hong-kong-macau"))),
    "taiwan-hong-kong-macau",
  );
  assert.equal(parseSpawnServerRegion(JSON.stringify({ version: 2, region: "taiwan-hong-kong-macau" })), DEFAULT_SPAWN_SERVER_REGION);
  assert.equal(parseSpawnServerRegion(JSON.stringify({ version: 1, region: "taiwan-hong-kong-macau", extra: true })), DEFAULT_SPAWN_SERVER_REGION);
  assert.equal(parseSpawnServerRegion("not-json"), DEFAULT_SPAWN_SERVER_REGION);
});

test("shows the confirmed regional Event Boss clocks without changing the occurrence instant", () => {
  assert.ok(eventBossDay && eventBossNight);
  assert.equal(formatSpawnServerClock(eventBossDay, "japan-korea"), "11:50");
  assert.equal(formatSpawnServerClock(eventBossDay, "taiwan-hong-kong-macau"), "10:50");
  assert.equal(formatSpawnServerClock(eventBossNight, "japan-korea"), "19:50");
  assert.equal(formatSpawnServerClock(eventBossNight, "taiwan-hong-kong-macau"), "18:50");

  const occurrence = new Date("2026-08-20T02:50:00.000Z");
  assert.match(formatSpawnServerTime(occurrence, eventBossDay, "japan-korea"), /11:50/);
  assert.match(formatSpawnServerTime(occurrence, eventBossDay, "taiwan-hong-kong-macau"), /10:50/);
  assert.equal(spawnTimeZoneLabel(eventBossDay, "japan-korea", "ja"), "日本・韓国");
  assert.equal(spawnTimeZoneLabel(eventBossDay, "taiwan-hong-kong-macau", "ja"), "台湾・香港・マカオ");
  assert.equal(spawnScheduleLabel(eventBossDay, "japan-korea", "ja"), "毎日・9/16 04:59まで");
  assert.equal(spawnScheduleLabel(eventBossDay, "taiwan-hong-kong-macau", "ja"), "毎日・9/16 03:59まで");
});

test("keeps unverified regional spawn schedules in JST", () => {
  assert.ok(worldBoss);
  assert.equal(formatSpawnServerClock(worldBoss, "japan-korea"), "12:00");
  assert.equal(formatSpawnServerClock(worldBoss, "taiwan-hong-kong-macau"), "12:00");
  assert.equal(spawnTimeZoneLabel(worldBoss, "taiwan-hong-kong-macau", "ja"), "JST");
});
