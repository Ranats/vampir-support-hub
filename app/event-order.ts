import type { LimitedEvent } from "./game-content";
// @ts-expect-error Node's strip-types test runner requires the explicit extension.
import { eventObjectiveValue, type EventProgress } from "./event-progress.ts";

function objectiveMaximum(objective: LimitedEvent["objectives"][number]) {
  return objective.kind === "check" ? 1 : objective.target ?? 1;
}

export function isLimitedEventComplete(
  event: LimitedEvent,
  progress: EventProgress,
  dailyCycle: string,
  weeklyCycle: string,
) {
  return event.objectives.every((objective) => (
    eventObjectiveValue(progress, event, objective, dailyCycle, weeklyCycle)
      >= objectiveMaximum(objective)
  ));
}

export function activeLimitedEventsInProgressOrder(
  events: readonly LimitedEvent[],
  progress: EventProgress,
  dailyCycle: string,
  weeklyCycle: string,
  now: Date,
) {
  return events
    .map((event, sourceIndex) => ({
      event,
      sourceIndex,
      complete: isLimitedEventComplete(event, progress, dailyCycle, weeklyCycle),
      nextDeadline: event.milestones.find((milestone) => milestone.deadline > now)?.deadline
        ?? event.deadline,
    }))
    .filter(({ event }) => event.deadline > now)
    .sort((left, right) => (
      Number(left.complete) - Number(right.complete)
      || left.nextDeadline.getTime() - right.nextDeadline.getTime()
      || left.sourceIndex - right.sourceIndex
    ))
    .map(({ event }) => event);
}
