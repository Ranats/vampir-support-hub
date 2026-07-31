import assert from "node:assert/strict";
import test from "node:test";

import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  createPersonalBackup,
  parsePersonalBackup,
} from "../app/personal-backup.ts";

const validData = {
  level: 55,
  dailyChecks: {
    cycle: "2026-7-30",
    completed: ["daily-dungeon", "custom:shop"],
  },
  weeklyChecks: {
    cycle: "2026-7-27",
    completed: [],
  },
  customRoutines: [{
    id: "custom:shop",
    title: "ショップ確認",
    note: "交換を確認",
    frequency: "daily",
    priority: 4,
    custom: true,
  }],
  routinePreferences: {
    version: 1,
    hiddenDefaultIds: ["guild-donation"],
  },
  favoriteSpawnIds: ["gehena"],
  clanSchedule: {
    version: 1,
    items: [
      {
        contentId: "clan-mission",
        scheduled: true,
        day: 2,
        hour: 21,
        minute: 30,
        reminder: true,
      },
      {
        contentId: "clan-guard",
        scheduled: false,
        day: 0,
        hour: 0,
        minute: 0,
        reminder: false,
      },
    ],
  },
  clanScheduleTimeZone: {
    version: 1,
    timeZone: "America/New_York",
  },
  notificationSettings: {
    version: 1,
    enabled: true,
    leadMinutes: 10,
  },
};

test("creates a deterministic version 2 backup without mutating saved shapes", () => {
  const backup = createPersonalBackup(validData);

  assert.equal(backup.format, BACKUP_FORMAT);
  assert.equal(backup.version, BACKUP_VERSION);
  assert.deepEqual(backup.data, validData);
  assert.notEqual(backup.data, validData);
  assert.notEqual(backup.data.dailyChecks, validData.dailyChecks);
});

test("round-trips a valid backup", () => {
  const backup = createPersonalBackup(validData);
  assert.deepEqual(parsePersonalBackup(JSON.stringify(backup)), backup);
});

test("migrates a legacy version 1 backup without a clan schedule or time zone to JST", () => {
  const legacyData = { ...validData };
  delete legacyData.clanSchedule;
  delete legacyData.clanScheduleTimeZone;
  const parsed = parsePersonalBackup(JSON.stringify({
    format: BACKUP_FORMAT,
    version: 1,
    data: legacyData,
  }));

  assert.deepEqual(parsed?.data.clanSchedule, {
    version: 1,
    items: [
      {
        contentId: "clan-mission",
        scheduled: false,
        day: 0,
        hour: 0,
        minute: 0,
        reminder: true,
      },
      {
        contentId: "clan-guard",
        scheduled: false,
        day: 0,
        hour: 0,
        minute: 0,
        reminder: true,
      },
    ],
  });
  assert.deepEqual(parsed?.data.clanScheduleTimeZone, {
    version: 1,
    timeZone: "Asia/Tokyo",
  });
});

test("rejects broken JSON and unsupported versions", () => {
  assert.equal(parsePersonalBackup("{broken"), null);
  assert.equal(parsePersonalBackup(JSON.stringify({
    format: BACKUP_FORMAT,
    version: 3,
    data: validData,
  })), null);
});

test("rejects an invalid v2 time zone without partially importing", () => {
  assert.equal(parsePersonalBackup(JSON.stringify({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    data: {
      ...validData,
      clanScheduleTimeZone: { version: 1, timeZone: "Mars/Olympus" },
    },
  })), null);
  assert.equal(parsePersonalBackup(JSON.stringify({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    data: {
      ...validData,
      clanScheduleTimeZone: { version: 2, timeZone: "UTC" },
    },
  })), null);
});

test("rejects a malformed clan schedule without partially importing", () => {
  assert.equal(parsePersonalBackup(JSON.stringify({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    data: {
      ...validData,
      clanSchedule: {
        ...validData.clanSchedule,
        items: validData.clanSchedule.items.map((item, index) => (
          index === 0 ? { ...item, day: 7 } : item
        )),
      },
    },
  })), null);
});

test("rejects malformed progress and settings without partially importing", () => {
  assert.equal(parsePersonalBackup(JSON.stringify({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    data: {
      ...validData,
      dailyChecks: { cycle: "", completed: ["daily"] },
    },
  })), null);

  assert.equal(parsePersonalBackup(JSON.stringify({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    data: {
      ...validData,
      notificationSettings: { version: 1, enabled: true, leadMinutes: 60 },
    },
  })), null);
});

test("throws instead of exporting invalid runtime data", () => {
  assert.throws(
    () => createPersonalBackup({ ...validData, level: 999 }),
    /Invalid personal backup data/,
  );
});
