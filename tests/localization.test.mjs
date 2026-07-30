import assert from "node:assert/strict";
import test from "node:test";

import {
  LANGUAGE_KEY,
  localePath,
  parseLocalePreference,
  preferredEnglishPath,
} from "../app/localization.ts";
import { createPersonalBackup } from "../app/personal-backup.ts";

test("accepts only supported device-local language preferences", () => {
  assert.equal(LANGUAGE_KEY, "vampir-language-v1");
  assert.equal(parseLocalePreference("ja"), "ja");
  assert.equal(parseLocalePreference("en"), "en");
  assert.equal(parseLocalePreference("fr"), null);
  assert.equal(parseLocalePreference(null), null);
});

test("maps home and policy links without changing route semantics", () => {
  assert.equal(localePath("ja", "home"), "/");
  assert.equal(localePath("ja", "policy"), "/policy");
  assert.equal(localePath("en", "home"), "/en");
  assert.equal(localePath("en", "policy"), "/en/policy");
});

test("restores an English preference from the Japanese entry routes", () => {
  assert.equal(preferredEnglishPath("en", "home"), "/en");
  assert.equal(preferredEnglishPath("en", "policy"), "/en/policy");
  assert.equal(preferredEnglishPath("ja", "home"), null);
  assert.equal(preferredEnglishPath("broken", "home"), null);
});

test("language preference remains outside the version 1 personal backup schema", () => {
  const backup = createPersonalBackup({
    level: null,
    dailyChecks: { cycle: "2026-7-31", completed: [] },
    weeklyChecks: { cycle: "2026-7-27", completed: [] },
    customRoutines: [],
    routinePreferences: { version: 1, hiddenDefaultIds: [] },
    favoriteSpawnIds: [],
    notificationSettings: { version: 1, enabled: false, leadMinutes: 10 },
  });

  assert.equal(Object.hasOwn(backup.data, "language"), false);
  assert.equal(Object.hasOwn(backup.data, LANGUAGE_KEY), false);
});
