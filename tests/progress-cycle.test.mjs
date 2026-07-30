import assert from "node:assert/strict";
import test from "node:test";

import {
  cycleResetState,
  dailyCycleKey,
  weeklyCycleKey,
} from "../app/progress-cycle.ts";

test("daily cycle changes exactly at 05:00 JST", () => {
  assert.equal(
    dailyCycleKey(new Date("2026-07-30T19:59:59.999Z")),
    "2026-7-30",
  );
  assert.equal(
    dailyCycleKey(new Date("2026-07-30T20:00:00.000Z")),
    "2026-7-31",
  );
});

test("weekly cycle changes at Monday 05:00 JST", () => {
  assert.equal(
    weeklyCycleKey(new Date("2026-08-02T19:59:59.999Z")),
    "2026-7-27",
  );
  assert.equal(
    weeklyCycleKey(new Date("2026-08-02T20:00:00.000Z")),
    "2026-8-3",
  );
});

test("reset state keeps daily and weekly boundaries independent", () => {
  assert.deepEqual(
    cycleResetState("2026-7-30", "2026-7-27", "2026-7-31", "2026-7-27"),
    { dailyExpired: true, weeklyExpired: false },
  );
  assert.deepEqual(
    cycleResetState("2026-8-2", "2026-7-27", "2026-8-3", "2026-8-3"),
    { dailyExpired: true, weeklyExpired: true },
  );
});
