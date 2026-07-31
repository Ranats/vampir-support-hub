import type { Locale } from "./localization";

export const CLAN_SCHEDULE_TIME_ZONE_KEY = "vampir-clan-schedule-time-zone-v1";
export const JAPAN_TIME_ZONE = "Asia/Tokyo";
export const UTC_TIME_ZONE = "UTC";

export type ClanScheduleTimeZoneSettings = {
  version: 1;
  timeZone: string;
};

const MAX_STORED_LENGTH = 256;
const MAX_TIME_ZONE_LENGTH = 100;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isValidClanTimeZone(value: unknown): value is string {
  if (typeof value !== "string"
    || !value
    || value.length > MAX_TIME_ZONE_LENGTH
    || value.trim() !== value) {
    return false;
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(0);
    return true;
  } catch {
    return false;
  }
}

export function parseClanScheduleTimeZoneSettings(
  raw: string | null,
): ClanScheduleTimeZoneSettings | null {
  if (!raw || raw.length > MAX_STORED_LENGTH) return null;

  try {
    const value = JSON.parse(raw) as unknown;
    if (!isRecord(value)
      || Object.keys(value).length !== 2
      || value.version !== 1
      || !isValidClanTimeZone(value.timeZone)) {
      return null;
    }
    return { version: 1, timeZone: value.timeZone };
  } catch {
    return null;
  }
}

export function clanScheduleTimeZoneSettings(
  timeZone: string,
): ClanScheduleTimeZoneSettings {
  if (!isValidClanTimeZone(timeZone)) {
    throw new TypeError("Invalid clan schedule time zone");
  }
  return { version: 1, timeZone };
}

export function detectBrowserTimeZone(): string | null {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return isValidClanTimeZone(timeZone) ? timeZone : null;
  } catch {
    return null;
  }
}

export function initialClanScheduleTimeZone(
  locale: Locale,
  existingSchedule: string | null,
  browserTimeZone: string | null,
): string {
  if (existingSchedule !== null || locale === "ja") return JAPAN_TIME_ZONE;
  return isValidClanTimeZone(browserTimeZone) ? browserTimeZone : UTC_TIME_ZONE;
}

export function resolveClanScheduleTimeZone(
  locale: Locale,
  existingSchedule: string | null,
  storedTimeZone: string | null,
  browserTimeZone: string | null,
): string {
  const stored = parseClanScheduleTimeZoneSettings(storedTimeZone);
  if (stored) return stored.timeZone;
  if (storedTimeZone !== null) return JAPAN_TIME_ZONE;
  return initialClanScheduleTimeZone(locale, existingSchedule, browserTimeZone);
}

export function formatClanTimeZoneName(timeZone: string, locale: Locale): string {
  if (timeZone === JAPAN_TIME_ZONE) {
    return locale === "en" ? "Japan time (Asia/Tokyo)" : "日本時間（Asia/Tokyo）";
  }
  if (timeZone === UTC_TIME_ZONE) return "UTC";
  return timeZone;
}

export function supportedClanTimeZones(current: string): string[] {
  const defaults = [current, JAPAN_TIME_ZONE, UTC_TIME_ZONE];
  try {
    const supportedValuesOf = (
      Intl as typeof Intl & { supportedValuesOf?: (key: "timeZone") => string[] }
    ).supportedValuesOf;
    const values = supportedValuesOf ? supportedValuesOf("timeZone") : [];
    return [...new Set([...defaults, ...values])].filter(isValidClanTimeZone);
  } catch {
    return [...new Set(defaults)].filter(isValidClanTimeZone);
  }
}
