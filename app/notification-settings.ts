export const NOTIFICATION_SETTINGS_KEY = "vampir-notification-settings-v1";
export const FAVORITE_SPAWNS_KEY = "vampir-favorite-spawns-v1";

export type NotificationLeadMinutes = 5 | 10 | 30;

export type NotificationSettings = {
  version: 1;
  enabled: boolean;
  leadMinutes: NotificationLeadMinutes;
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  version: 1,
  enabled: false,
  leadMinutes: 10,
};

const VALID_LEAD_MINUTES = new Set<NotificationLeadMinutes>([5, 10, 30]);
const MAX_FAVORITE_SPAWNS = 100;
const MAX_SPAWN_ID_LENGTH = 100;

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function parseNotificationSettings(raw: string | null): NotificationSettings {
  if (!raw) return DEFAULT_NOTIFICATION_SETTINGS;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isObject(parsed) || parsed.version !== 1) {
      return DEFAULT_NOTIFICATION_SETTINGS;
    }

    return {
      version: 1,
      enabled: typeof parsed.enabled === "boolean"
        ? parsed.enabled
        : DEFAULT_NOTIFICATION_SETTINGS.enabled,
      leadMinutes: VALID_LEAD_MINUTES.has(parsed.leadMinutes as NotificationLeadMinutes)
        ? parsed.leadMinutes as NotificationLeadMinutes
        : DEFAULT_NOTIFICATION_SETTINGS.leadMinutes,
    };
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

export function parseFavoriteSpawnIds(
  raw: string | null,
  knownIds?: readonly string[],
): string[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    const values = Array.isArray(parsed)
      ? parsed
      : isObject(parsed) && parsed.version === 1 && Array.isArray(parsed.favoriteSpawnIds)
        ? parsed.favoriteSpawnIds
        : null;

    if (!values) return [];

    const known = knownIds ? new Set(knownIds) : null;
    const seen = new Set<string>();
    const result: string[] = [];

    for (const value of values) {
      if (typeof value !== "string") continue;
      const id = value.trim();
      if (!id || id.length > MAX_SPAWN_ID_LENGTH || seen.has(id)) continue;
      if (known && !known.has(id)) continue;

      seen.add(id);
      result.push(id);
      if (result.length >= MAX_FAVORITE_SPAWNS) break;
    }

    return result;
  } catch {
    return [];
  }
}
