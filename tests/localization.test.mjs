import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  LANGUAGE_KEY,
  localePath,
  parseLocalePreference,
  preferredEnglishPath,
} from "../app/localization.ts";
import { DEFAULT_CLAN_SCHEDULE_SETTINGS } from "../app/clan-schedule.ts";
import { clanScheduleTimeZoneSettings } from "../app/clan-time-zone.ts";
import { createPersonalBackup } from "../app/personal-backup.ts";

test("accepts only supported device-local language preferences", () => {
  assert.equal(LANGUAGE_KEY, "vampir-language-v1");
  assert.equal(parseLocalePreference("ja"), "ja");
  assert.equal(parseLocalePreference("en"), "en");
  assert.equal(parseLocalePreference("fr"), null);
  assert.equal(parseLocalePreference(null), null);
});

test("maps home, policy, and schedule links without changing route semantics", () => {
  assert.equal(localePath("ja", "home"), "/");
  assert.equal(localePath("ja", "policy"), "/policy");
  assert.equal(localePath("en", "home"), "/en");
  assert.equal(localePath("en", "policy"), "/en/policy");
  assert.equal(localePath("ja", "schedule"), "/schedule");
  assert.equal(localePath("en", "schedule"), "/en/schedule");
});

test("restores an English preference from the Japanese entry routes", () => {
  assert.equal(preferredEnglishPath("en", "home"), "/en");
  assert.equal(preferredEnglishPath("en", "policy"), "/en/policy");
  assert.equal(preferredEnglishPath("en", "schedule"), "/en/schedule");
  assert.equal(preferredEnglishPath("ja", "home"), null);
  assert.equal(preferredEnglishPath("broken", "home"), null);
});

test("language preference remains outside the version 3 personal backup schema", () => {
  const backup = createPersonalBackup({
    level: null,
    dailyChecks: { cycle: "2026-7-31", completed: [] },
    weeklyChecks: { cycle: "2026-7-27", completed: [] },
    customRoutines: [],
    routinePreferences: { version: 1, hiddenDefaultIds: [] },
    clanSchedule: DEFAULT_CLAN_SCHEDULE_SETTINGS,
    clanScheduleTimeZone: clanScheduleTimeZoneSettings("Asia/Tokyo"),
    favoriteSpawnIds: [],
    notificationSettings: { version: 1, enabled: false, leadMinutes: 10 },
    eventProgress: { version: 1, campaigns: {} },
  });

  assert.equal(Object.hasOwn(backup.data, "language"), false);
  assert.equal(Object.hasOwn(backup.data, LANGUAGE_KEY), false);
});

test("localizes clan time-zone controls and policy data boundaries", async () => {
  const [settingsSource, japanesePolicy, englishPolicy] = await Promise.all([
    readFile(new URL("../app/ClanScheduleSettings.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/(ja)/policy/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/(en)/en/policy/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(settingsSource, /クラン予定のタイムゾーン/);
  assert.match(settingsSource, /Clan schedule time zone/);
  assert.match(settingsSource, /公式予定と日次・週次リセットはJSTのまま/);
  assert.match(settingsSource, /Official schedules and daily\/weekly resets remain in JST/);
  assert.match(japanesePolicy, /クラン名、曜日・時刻、クラン予定のタイムゾーン/);
  assert.match(englishPolicy, /clan name, weekday, time, and clan schedule time zone/);
  assert.match(japanesePolicy, /公式の出現・イベント予定と日次・週次リセットはJSTのまま/);
  assert.match(englishPolicy, /Official spawn and event schedules and daily or weekly resets remain in JST/);
});
