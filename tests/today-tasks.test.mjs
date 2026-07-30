import assert from "node:assert/strict";
import test from "node:test";

import { selectTodayTasks } from "../app/today-tasks.ts";

const daily = [
  { id: "daily-low", priority: 3 },
  { id: "daily-first", priority: 5 },
  { id: "daily-locked", priority: 5, minLevel: 60 },
  { id: "daily-second", priority: 5 },
];

const weekly = [
  { id: "weekly-first", priority: 5 },
  { id: "weekly-second", priority: 4 },
];

test("selects unlocked unfinished daily tasks before weekly tasks", () => {
  assert.deepEqual(
    selectTodayTasks(daily, weekly, [], [], 55).map((task) => task.id),
    ["daily-first", "daily-second", "daily-low"],
  );
});

test("fills remaining slots with weekly tasks", () => {
  assert.deepEqual(
    selectTodayTasks(
      daily,
      weekly,
      ["daily-first", "daily-second", "daily-low"],
      [],
      55,
    ).map((task) => task.id),
    ["weekly-first", "weekly-second"],
  );
});

test("keeps stable source order for equal priorities", () => {
  assert.deepEqual(
    selectTodayTasks(daily, weekly, [], [], 99, 4).map((task) => task.id),
    ["daily-first", "daily-locked", "daily-second", "daily-low"],
  );
});

test("excludes completed tasks and respects the requested limit", () => {
  assert.deepEqual(
    selectTodayTasks(daily, weekly, ["daily-first"], [], 55, 2).map(
      (task) => task.id,
    ),
    ["daily-second", "daily-low"],
  );
});
