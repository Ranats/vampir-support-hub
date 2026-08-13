export const EVENT_PROGRESS_KEY = "vampir-event-progress-v1";

export type EventObjectiveCadence = "once" | "daily" | "weekly";

export type EventObjectiveDefinition = {
  id: string;
  metricId?: string;
  kind: "count" | "check";
  target?: number;
  cadence: EventObjectiveCadence;
};

export type EventProgressDefinition = {
  campaignId: string;
  objectives: readonly EventObjectiveDefinition[];
};

export type EventObjectiveProgress = { value: number; cycle?: string };
export type EventCampaignProgress = { objectives: Record<string, EventObjectiveProgress> };
export type EventProgress = { version: 1; campaigns: Record<string, EventCampaignProgress> };

export const EMPTY_EVENT_PROGRESS: EventProgress = { version: 1, campaigns: {} };

const MAX_CAMPAIGNS = 60;
const MAX_OBJECTIVES_PER_CAMPAIGN = 80;
const MAX_ID_LENGTH = 120;
const CYCLE_PATTERN = /^\d{4}-\d{1,2}-\d{1,2}$/;

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_ID_LENGTH;
}

function isCycle(value: unknown): value is string {
  return typeof value === "string" && value.length <= 20 && CYCLE_PATTERN.test(value);
}

function objectiveMaximum(objective: EventObjectiveDefinition): number {
  return objective.kind === "check"
    ? 1
    : Number.isInteger(objective.target) && objective.target! > 0 ? objective.target! : 1;
}

function objectiveStorageId(objective: EventObjectiveDefinition) {
  return objective.metricId ?? objective.id;
}

function storageMaximum(event: EventProgressDefinition, objective: EventObjectiveDefinition) {
  const storageId = objectiveStorageId(objective);
  return Math.max(...event.objectives
    .filter((candidate) => objectiveStorageId(candidate) === storageId)
    .map(objectiveMaximum));
}

function normalizedValue(value: unknown, maximum: number): number | null {
  if (!Number.isFinite(value) || !Number.isInteger(value)) return null;
  return Math.min(Math.max(value as number, 0), maximum);
}

function objectiveCycle(objective: EventObjectiveDefinition, dailyCycle: string, weeklyCycle: string) {
  if (objective.cadence === "daily") return dailyCycle;
  if (objective.cadence === "weekly") return weeklyCycle;
  return undefined;
}

function definitionsByCampaign(events: readonly EventProgressDefinition[]) {
  const campaigns = new Map<string, Map<string, EventObjectiveDefinition>>();
  for (const event of events) {
    if (!isId(event.campaignId)) continue;
    const objectives = new Map<string, EventObjectiveDefinition>();
    for (const objective of event.objectives) {
      if (!isId(objective.id)
        || (objective.metricId !== undefined && !isId(objective.metricId))
        || (objective.kind !== "count" && objective.kind !== "check")
        || (objective.cadence !== "once" && objective.cadence !== "daily" && objective.cadence !== "weekly")
        ) continue;
      const storageId = objectiveStorageId(objective);
      const existing = objectives.get(storageId);
      if (!existing || objectiveMaximum(objective) > objectiveMaximum(existing)) {
        objectives.set(storageId, objective);
      }
    }
    if (objectives.size) campaigns.set(event.campaignId, objectives);
  }
  return campaigns;
}

function copyStructure(value: unknown): EventProgress | null {
  if (!isObject(value) || value.version !== 1 || !isObject(value.campaigns)) return null;
  const entries = Object.entries(value.campaigns);
  if (entries.length > MAX_CAMPAIGNS) return null;
  const campaigns: Record<string, EventCampaignProgress> = {};
  for (const [campaignId, campaign] of entries) {
    if (!isId(campaignId) || !isObject(campaign) || !isObject(campaign.objectives)) return null;
    const objectives = Object.entries(campaign.objectives);
    if (objectives.length > MAX_OBJECTIVES_PER_CAMPAIGN) return null;
    const copied: Record<string, EventObjectiveProgress> = {};
    for (const [objectiveId, progress] of objectives) {
      if (!isId(objectiveId) || !isObject(progress) || !Number.isInteger(progress.value)
        || (progress.cycle !== undefined && !isCycle(progress.cycle))) return null;
      copied[objectiveId] = progress.cycle === undefined
        ? { value: progress.value as number }
        : { value: progress.value as number, cycle: progress.cycle };
    }
    campaigns[campaignId] = { objectives: copied };
  }
  return { version: 1, campaigns };
}

export function copyEventProgress(value: unknown): EventProgress | null {
  return copyStructure(value);
}

export function normalizeEventProgress(
  value: unknown,
  events: readonly EventProgressDefinition[],
  dailyCycle: string,
  weeklyCycle: string,
): EventProgress {
  const source = copyStructure(value);
  if (!source) return { version: 1, campaigns: {} };
  const definitions = definitionsByCampaign(events);
  const campaigns: Record<string, EventCampaignProgress> = {};
  for (const [campaignId, objectivesById] of definitions) {
    const saved = source.campaigns[campaignId]?.objectives;
    if (!saved) continue;
    const objectives: Record<string, EventObjectiveProgress> = {};
    for (const [objectiveId, objective] of objectivesById) {
      const candidate = saved[objectiveId];
      if (!candidate) continue;
      const value = normalizedValue(candidate.value, objectiveMaximum(objective));
      const cycle = objectiveCycle(objective, dailyCycle, weeklyCycle);
      if (value === null || value === 0 || (cycle && candidate.cycle !== cycle)) continue;
      objectives[objectiveId] = cycle ? { value, cycle } : { value };
    }
    if (Object.keys(objectives).length) campaigns[campaignId] = { objectives };
  }
  return { version: 1, campaigns };
}

export const pruneEventProgress = normalizeEventProgress;

export function parseEventProgress(raw: string | null, events: readonly EventProgressDefinition[], dailyCycle: string, weeklyCycle: string): EventProgress {
  if (!raw || raw.length > 256 * 1024) return { version: 1, campaigns: {} };
  try {
    return normalizeEventProgress(JSON.parse(raw) as unknown, events, dailyCycle, weeklyCycle);
  } catch {
    return { version: 1, campaigns: {} };
  }
}

export function eventObjectiveValue(progress: EventProgress, event: EventProgressDefinition, objective: EventObjectiveDefinition, dailyCycle: string, weeklyCycle: string): number {
  const definition = event.objectives.find(({ id }) => id === objective.id);
  if (!definition) return 0;
  const saved = progress.campaigns[event.campaignId]?.objectives[objectiveStorageId(definition)];
  if (!saved) return 0;
  const value = normalizedValue(saved.value, storageMaximum(event, definition));
  if (value === null) return 0;
  const cycle = objectiveCycle(definition, dailyCycle, weeklyCycle);
  return cycle && saved.cycle !== cycle ? 0 : Math.min(value, objectiveMaximum(definition));
}

export function setEventObjectiveProgress(current: EventProgress, event: EventProgressDefinition, objective: EventObjectiveDefinition, value: number, dailyCycle: string, weeklyCycle: string): EventProgress {
  const definition = event.objectives.find(({ id }) => id === objective.id);
  if (!definition) return copyStructure(current) ?? { version: 1, campaigns: {} };
  const next = copyStructure(current) ?? { version: 1, campaigns: {} };
  const nextValue = normalizedValue(value, storageMaximum(event, definition));
  if (nextValue === null) return next;
  const campaigns = { ...next.campaigns };
  const objectives = { ...(campaigns[event.campaignId]?.objectives ?? {}) };
  const storageId = objectiveStorageId(definition);
  if (nextValue === 0) delete objectives[storageId];
  else {
    const cycle = objectiveCycle(definition, dailyCycle, weeklyCycle);
    objectives[storageId] = cycle ? { value: nextValue, cycle } : { value: nextValue };
  }
  if (Object.keys(objectives).length) campaigns[event.campaignId] = { objectives };
  else delete campaigns[event.campaignId];
  return { version: 1, campaigns };
}
