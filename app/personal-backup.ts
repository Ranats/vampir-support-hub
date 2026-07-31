import type {
  ClanContentId,
  ClanScheduleItem,
  ClanScheduleSettings,
} from "./clan-schedule";
import {
  JAPAN_TIME_ZONE,
  clanScheduleTimeZoneSettings,
  parseClanScheduleTimeZoneSettings,
  type ClanScheduleTimeZoneSettings,
} from "./clan-time-zone.ts";

export const BACKUP_FORMAT = "vampir-support-hub-personal-backup";
export const BACKUP_VERSION = 2;

type SavedChecks = {
  cycle: string;
  completed: string[];
};

type SavedCustomRoutine = {
  id: string;
  title: string;
  note: string;
  frequency: "daily" | "weekly";
  priority: number;
  custom: true;
};

type SavedRoutinePreferences = {
  version: 1;
  hiddenDefaultIds: string[];
};

type SavedNotificationSettings = {
  version: 1;
  enabled: boolean;
  leadMinutes: 5 | 10 | 30;
};

export type PersonalBackupData = {
  level: number | null;
  dailyChecks: SavedChecks;
  weeklyChecks: SavedChecks;
  customRoutines: SavedCustomRoutine[];
  routinePreferences: SavedRoutinePreferences;
  favoriteSpawnIds: string[];
  clanSchedule: ClanScheduleSettings;
  clanScheduleTimeZone: ClanScheduleTimeZoneSettings;
  notificationSettings: SavedNotificationSettings;
};

export type PersonalBackup = {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  data: PersonalBackupData;
};

const MAX_BACKUP_LENGTH = 512 * 1024;
const MAX_COMPLETED_IDS = 500;
const MAX_COMPLETED_ID_LENGTH = 160;
const MAX_CUSTOM_ROUTINES = 40;
const MAX_CUSTOM_ID_LENGTH = 120;
const MAX_CUSTOM_TITLE_LENGTH = 80;
const MAX_CUSTOM_NOTE_LENGTH = 160;
const MAX_HIDDEN_IDS = 100;
const MAX_FAVORITE_SPAWNS = 100;
const MAX_SPAWN_ID_LENGTH = 100;
const CLAN_CONTENT_IDS = ["clan-mission", "clan-guard"] as const satisfies readonly ClanContentId[];

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function boundedString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length <= maxLength;
}

function copyStringArray(
  value: unknown,
  maxItems: number,
  maxLength: number,
): string[] | null {
  if (!Array.isArray(value) || value.length > maxItems) return null;
  if (!value.every((item) => boundedString(item, maxLength))) return null;
  return [...value];
}

function copyChecks(value: unknown): SavedChecks | null {
  if (!isObject(value)
    || !boundedString(value.cycle, 20)
    || !/^\d{4}-\d{1,2}-\d{1,2}$/.test(value.cycle)) {
    return null;
  }

  const completed = copyStringArray(
    value.completed,
    MAX_COMPLETED_IDS,
    MAX_COMPLETED_ID_LENGTH,
  );
  return completed ? { cycle: value.cycle, completed } : null;
}

function copyCustomRoutines(value: unknown): SavedCustomRoutine[] | null {
  if (!Array.isArray(value) || value.length > MAX_CUSTOM_ROUTINES) return null;

  const result: SavedCustomRoutine[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (!isObject(item)
      || !boundedString(item.id, MAX_CUSTOM_ID_LENGTH)
      || !item.id.startsWith("custom:")
      || seen.has(item.id)
      || !boundedString(item.title, MAX_CUSTOM_TITLE_LENGTH)
      || !item.title.trim()
      || !boundedString(item.note, MAX_CUSTOM_NOTE_LENGTH)
      || (item.frequency !== "daily" && item.frequency !== "weekly")) {
      return null;
    }

    seen.add(item.id);
    result.push({
      id: item.id,
      title: item.title,
      note: item.note,
      frequency: item.frequency,
      priority: 4,
      custom: true,
    });
  }

  return result;
}

function copyRoutinePreferences(value: unknown): SavedRoutinePreferences | null {
  if (!isObject(value) || value.version !== 1) return null;
  const hiddenDefaultIds = copyStringArray(value.hiddenDefaultIds, MAX_HIDDEN_IDS, 120);
  return hiddenDefaultIds ? { version: 1, hiddenDefaultIds } : null;
}

function copyFavoriteSpawnIds(value: unknown): string[] | null {
  const ids = copyStringArray(value, MAX_FAVORITE_SPAWNS, MAX_SPAWN_ID_LENGTH);
  if (!ids || ids.some((id) => !id.trim())) return null;

  const seen = new Set<string>();
  return ids.filter((id) => {
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function copyNotificationSettings(value: unknown): SavedNotificationSettings | null {
  if (!isObject(value)
    || value.version !== 1
    || typeof value.enabled !== "boolean"
    || (value.leadMinutes !== 5
      && value.leadMinutes !== 10
      && value.leadMinutes !== 30)) {
    return null;
  }

  return {
    version: 1,
    enabled: value.enabled,
    leadMinutes: value.leadMinutes,
  };
}

function copyDefaultClanSchedule(): ClanScheduleSettings {
  return {
    version: 1,
    items: CLAN_CONTENT_IDS.map((contentId) => ({
      contentId,
      scheduled: false,
      day: 0,
      hour: 0,
      minute: 0,
      reminder: true,
    })),
  };
}

function copyClanSchedule(value: unknown): ClanScheduleSettings | null {
  if (value === undefined) return copyDefaultClanSchedule();
  if (!isObject(value)
    || value.version !== 1
    || !Array.isArray(value.items)
    || value.items.length !== CLAN_CONTENT_IDS.length) {
    return null;
  }

  const items: ClanScheduleItem[] = [];
  const seen = new Set<ClanContentId>();
  for (const item of value.items) {
    if (!isObject(item)
      || !CLAN_CONTENT_IDS.includes(item.contentId as ClanContentId)
      || seen.has(item.contentId as ClanContentId)
      || typeof item.scheduled !== "boolean"
      || !Number.isInteger(item.day)
      || (item.day as number) < 0
      || (item.day as number) > 6
      || !Number.isInteger(item.hour)
      || (item.hour as number) < 0
      || (item.hour as number) > 23
      || !Number.isInteger(item.minute)
      || (item.minute as number) < 0
      || (item.minute as number) > 59
      || typeof item.reminder !== "boolean") {
      return null;
    }

    const contentId = item.contentId as ClanContentId;
    seen.add(contentId);
    items.push({
      contentId,
      scheduled: item.scheduled,
      day: item.day as number,
      hour: item.hour as number,
      minute: item.minute as number,
      reminder: item.reminder,
    });
  }

  if (CLAN_CONTENT_IDS.some((contentId) => !seen.has(contentId))) return null;
  const byId = new Map(items.map((item) => [item.contentId, item]));
  return {
    version: 1,
    items: CLAN_CONTENT_IDS.map((contentId) => ({ ...byId.get(contentId)! })),
  };
}

function copyBackupData(
  value: unknown,
  sourceVersion: 1 | 2,
): PersonalBackupData | null {
  if (!isObject(value)) return null;

  const level = value.level === null
    ? null
    : typeof value.level === "number"
      && Number.isInteger(value.level)
      && value.level >= 1
      && value.level <= 200
      ? value.level
      : undefined;
  if (level === undefined) return null;

  const dailyChecks = copyChecks(value.dailyChecks);
  const weeklyChecks = copyChecks(value.weeklyChecks);
  const customRoutines = copyCustomRoutines(value.customRoutines);
  const routinePreferences = copyRoutinePreferences(value.routinePreferences);
  const favoriteSpawnIds = copyFavoriteSpawnIds(value.favoriteSpawnIds);
  const clanSchedule = copyClanSchedule(value.clanSchedule);
  const clanScheduleTimeZone = sourceVersion === 1
    ? clanScheduleTimeZoneSettings(JAPAN_TIME_ZONE)
    : parseClanScheduleTimeZoneSettings(
        value.clanScheduleTimeZone === undefined
          ? null
          : JSON.stringify(value.clanScheduleTimeZone),
      );
  const notificationSettings = copyNotificationSettings(value.notificationSettings);

  if (!dailyChecks
    || !weeklyChecks
    || !customRoutines
    || !routinePreferences
    || !favoriteSpawnIds
    || !clanSchedule
    || !clanScheduleTimeZone
    || !notificationSettings) {
    return null;
  }

  return {
    level,
    dailyChecks,
    weeklyChecks,
    customRoutines,
    routinePreferences,
    favoriteSpawnIds,
    clanSchedule,
    clanScheduleTimeZone,
    notificationSettings,
  };
}

export function createPersonalBackup(input: PersonalBackupData): PersonalBackup {
  const data = copyBackupData(input, BACKUP_VERSION);
  if (!data) throw new TypeError("Invalid personal backup data");

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    data,
  };
}

export function parsePersonalBackup(raw: string | null): PersonalBackup | null {
  if (!raw || raw.length > MAX_BACKUP_LENGTH) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isObject(parsed)
      || parsed.format !== BACKUP_FORMAT
      || (parsed.version !== 1 && parsed.version !== BACKUP_VERSION)) {
      return null;
    }

    const data = copyBackupData(parsed.data, parsed.version);
    return data
      ? { format: BACKUP_FORMAT, version: BACKUP_VERSION, data }
      : null;
  } catch {
    return null;
  }
}
