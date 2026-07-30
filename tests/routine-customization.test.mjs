import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_CUSTOM_NOTE,
  MAX_CUSTOM_TITLE,
  keepKnownDefaultPreferences,
  makeCustomRoutine,
  parseCustomRoutines,
  parseRoutinePreferences,
  replaceCustomRoutine,
  visibleRoutines,
} from "../app/routine-customization.ts";

test("parses valid custom routines and ignores invalid or duplicate entries", () => {
  const parsed = parseCustomRoutines(JSON.stringify([
    { id: "custom:daily", title: "  倉庫整理  ", note: "  受取も確認  ", frequency: "daily" },
    { id: "custom:daily", title: "duplicate", note: "", frequency: "daily" },
    { id: "built-in", title: "invalid id", note: "", frequency: "weekly" },
    { id: "custom:invalid", title: "", note: "", frequency: "weekly" },
    { id: "custom:object", title: {}, note: [], frequency: "daily" },
  ]));

  assert.deepEqual(parsed, [{
    id: "custom:daily",
    title: "倉庫整理",
    note: "受取も確認",
    frequency: "daily",
    priority: 4,
    custom: true,
  }]);
});

test("bounds custom text and safely handles broken saved data", () => {
  const routine = makeCustomRoutine("custom:bounded", {
    title: "a".repeat(MAX_CUSTOM_TITLE + 10),
    note: "b".repeat(MAX_CUSTOM_NOTE + 10),
    frequency: "weekly",
  });

  assert.equal(routine?.title.length, MAX_CUSTOM_TITLE);
  assert.equal(routine?.note.length, MAX_CUSTOM_NOTE);
  assert.deepEqual(parseCustomRoutines("{broken"), []);
  assert.deepEqual(parseRoutinePreferences("{broken"), {
    version: 1,
    hiddenDefaultIds: [],
  });
});

test("hides only selected defaults and adds custom routines by frequency", () => {
  const defaults = [
    { id: "keep", title: "keep" },
    { id: "hide", title: "hide" },
  ];
  const custom = [
    makeCustomRoutine("custom:daily", { title: "daily", frequency: "daily" }),
    makeCustomRoutine("custom:weekly", { title: "weekly", frequency: "weekly" }),
  ].filter(Boolean);
  const preferences = parseRoutinePreferences(JSON.stringify({
    hiddenDefaultIds: ["hide", "hide"],
  }));

  assert.deepEqual(
    visibleRoutines(defaults, custom, preferences, "daily").map((item) => item.id),
    ["keep", "custom:daily"],
  );
  assert.deepEqual(
    visibleRoutines(defaults, custom, preferences, "weekly").map((item) => item.id),
    ["keep", "custom:weekly"],
  );
});

test("drops unknown hidden IDs before showing the hidden routine count", () => {
  const preferences = parseRoutinePreferences(JSON.stringify({
    hiddenDefaultIds: ["keep", "missing-id"],
  }));

  assert.deepEqual(keepKnownDefaultPreferences(preferences, ["keep"]), {
    version: 1,
    hiddenDefaultIds: ["keep"],
  });
});

test("edits a custom routine without changing its stable completion id", () => {
  const original = makeCustomRoutine("custom:stable", {
    title: "before",
    frequency: "daily",
  });
  assert.ok(original);

  const updated = replaceCustomRoutine([original], "custom:stable", {
    title: "after",
    note: "memo",
    frequency: "weekly",
  });

  assert.deepEqual(updated[0], {
    id: "custom:stable",
    title: "after",
    note: "memo",
    frequency: "weekly",
    priority: 4,
    custom: true,
  });
});
