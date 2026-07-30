export type RoutineFrequency = "daily" | "weekly";

export type CustomRoutine = {
  id: string;
  title: string;
  note: string;
  frequency: RoutineFrequency;
  priority: number;
  custom: true;
};

export type RoutinePreferences = {
  version: 1;
  hiddenDefaultIds: string[];
};

export type CustomRoutineInput = {
  title: string;
  note?: string;
  frequency: RoutineFrequency;
};

export const CUSTOM_ROUTINES_KEY = "vampir-custom-routines-v1";
export const ROUTINE_PREFERENCES_KEY = "vampir-routine-preferences-v1";
export const MAX_CUSTOM_ROUTINES = 40;
export const MAX_CUSTOM_TITLE = 80;
export const MAX_CUSTOM_NOTE = 160;

export const DEFAULT_ROUTINE_PREFERENCES: RoutinePreferences = {
  version: 1,
  hiddenDefaultIds: [],
};

function sanitizeText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function makeCustomRoutine(
  id: string,
  input: CustomRoutineInput,
): CustomRoutine | null {
  const safeId = typeof id === "string" ? id.trim() : "";
  const title = sanitizeText(input.title, MAX_CUSTOM_TITLE);
  const note = sanitizeText(input.note, MAX_CUSTOM_NOTE);

  if (!safeId.startsWith("custom:") || !title) return null;
  if (input.frequency !== "daily" && input.frequency !== "weekly") return null;

  return {
    id: safeId,
    title,
    note,
    frequency: input.frequency,
    priority: 4,
    custom: true,
  };
}

export function parseCustomRoutines(raw: string | null) {
  if (!raw) return [] as CustomRoutine[];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [] as CustomRoutine[];

    const result: CustomRoutine[] = [];
    const seen = new Set<string>();

    for (const value of parsed) {
      if (!value || typeof value !== "object") continue;
      const candidate = value as Record<string, unknown>;
      const routine = makeCustomRoutine(
        typeof candidate.id === "string" ? candidate.id : "",
        {
          title: typeof candidate.title === "string" ? candidate.title : "",
          note: typeof candidate.note === "string" ? candidate.note : "",
          frequency: candidate.frequency as RoutineFrequency,
        },
      );
      if (!routine || seen.has(routine.id)) continue;

      seen.add(routine.id);
      result.push(routine);
      if (result.length >= MAX_CUSTOM_ROUTINES) break;
    }

    return result;
  } catch {
    return [] as CustomRoutine[];
  }
}

export function parseRoutinePreferences(raw: string | null) {
  if (!raw) return DEFAULT_ROUTINE_PREFERENCES;

  try {
    const parsed = JSON.parse(raw) as { hiddenDefaultIds?: unknown };
    if (!parsed || !Array.isArray(parsed.hiddenDefaultIds)) {
      return DEFAULT_ROUTINE_PREFERENCES;
    }

    const hiddenDefaultIds = [...new Set(
      parsed.hiddenDefaultIds
        .filter((id): id is string => typeof id === "string")
        .map((id) => id.trim())
        .filter(Boolean)
        .slice(0, 100),
    )];

    return { version: 1 as const, hiddenDefaultIds };
  } catch {
    return DEFAULT_ROUTINE_PREFERENCES;
  }
}

export function keepKnownDefaultPreferences(
  preferences: RoutinePreferences,
  defaultIds: readonly string[],
) {
  const knownIds = new Set(defaultIds);
  return {
    version: 1 as const,
    hiddenDefaultIds: preferences.hiddenDefaultIds.filter((id) => knownIds.has(id)),
  };
}

export function visibleRoutines<T extends { id: string }>(
  defaults: readonly T[],
  customRoutines: readonly CustomRoutine[],
  preferences: RoutinePreferences,
  frequency: RoutineFrequency,
) {
  const hidden = new Set(preferences.hiddenDefaultIds);
  return [
    ...defaults.filter((routine) => !hidden.has(routine.id)),
    ...customRoutines.filter((routine) => routine.frequency === frequency),
  ];
}

export function replaceCustomRoutine(
  routines: readonly CustomRoutine[],
  id: string,
  input: CustomRoutineInput,
) {
  const replacement = makeCustomRoutine(id, input);
  if (!replacement) return [...routines];
  return routines.map((routine) => routine.id === id ? replacement : routine);
}
