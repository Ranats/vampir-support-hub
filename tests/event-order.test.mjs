import assert from "node:assert/strict";
import test from "node:test";
import { activeLimitedEventsInProgressOrder, isLimitedEventComplete } from "../app/event-order.ts";
import { LIMITED_EVENTS } from "../app/game-content.ts";
import { parseEventProgress, setEventObjectiveProgress } from "../app/event-progress.ts";

const dailyCycle = "2026-8-14";
const weeklyCycle = "2026-8-10";
const now = new Date("2026-08-14T00:00:00.000Z");

function completeEvent(event) {
  return event.objectives.reduce((progress, objective) => setEventObjectiveProgress(
    progress,
    event,
    objective,
    objective.kind === "check" ? 1 : objective.target,
    dailyCycle,
    weeklyCycle,
  ), { version: 1, campaigns: {} });
}

test("moves completed active events below every incomplete event immediately", () => {
  const sigil = LIMITED_EVENTS.find(({ id }) => id === "sigil-red-moon");
  assert.ok(sigil);
  const progress = completeEvent(sigil);

  assert.equal(isLimitedEventComplete(sigil, progress, dailyCycle, weeklyCycle), true);
  const ordered = activeLimitedEventsInProgressOrder(
    LIMITED_EVENTS,
    progress,
    dailyCycle,
    weeklyCycle,
    now,
  );
  assert.equal(ordered.at(-1)?.id, sigil.id);
  assert.ok(ordered.slice(0, -1).every((event) => (
    !isLimitedEventComplete(event, progress, dailyCycle, weeklyCycle)
  )));
});

test("preserves completed-last ordering after localStorage serialization and reload parsing", () => {
  const sigil = LIMITED_EVENTS.find(({ id }) => id === "sigil-red-moon");
  assert.ok(sigil);
  const saved = JSON.stringify(completeEvent(sigil));
  const restored = parseEventProgress(saved, LIMITED_EVENTS, dailyCycle, weeklyCycle);
  const ordered = activeLimitedEventsInProgressOrder(
    LIMITED_EVENTS,
    restored,
    dailyCycle,
    weeklyCycle,
    now,
  );

  assert.equal(ordered.at(-1)?.id, sigil.id);
});

test("keeps the existing Sigil campaign while dropping obsolete generic checklist objectives", () => {
  const restored = parseEventProgress(JSON.stringify({ version: 1, campaigns: {
    "sigil-red-moon-2026-08": { objectives: {
      "collect-gear": { value: 1 },
      "world-boss": { value: 1 },
      "dark-trade": { value: 1 },
      "use-boxes": { value: 1 },
    } },
  } }), LIMITED_EVENTS, dailyCycle, weeklyCycle);

  assert.deepEqual(restored, { version: 1, campaigns: {} });
});
