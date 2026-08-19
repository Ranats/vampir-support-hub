import type { SpawnEvent, SpawnServerRegion } from "./game-content";
import type { Locale } from "./localization";

export const SPAWN_SERVER_REGION_KEY = "vampir-spawn-server-region-v1";
export const DEFAULT_SPAWN_SERVER_REGION: SpawnServerRegion = "japan-korea";

export type SpawnServerRegionSettings = {
  version: 1;
  region: SpawnServerRegion;
};

function isSpawnServerRegion(value: unknown): value is SpawnServerRegion {
  return value === "japan-korea" || value === "taiwan-hong-kong-macau";
}

export function parseSpawnServerRegion(value: string | null): SpawnServerRegion {
  if (!value) return DEFAULT_SPAWN_SERVER_REGION;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (
      !parsed
      || typeof parsed !== "object"
      || Array.isArray(parsed)
      || Object.keys(parsed).length !== 2
      || parsed.version !== 1
      || !isSpawnServerRegion(parsed.region)
    ) return DEFAULT_SPAWN_SERVER_REGION;
    return parsed.region;
  } catch {
    return DEFAULT_SPAWN_SERVER_REGION;
  }
}

export function spawnServerRegionSettings(
  region: SpawnServerRegion,
): SpawnServerRegionSettings {
  return { version: 1, region };
}

export function spawnServerRegionLabel(region: SpawnServerRegion, locale: Locale): string {
  if (region === "taiwan-hong-kong-macau") {
    return locale === "en" ? "Taiwan / Hong Kong / Macau" : "台湾・香港・マカオ";
  }
  return locale === "en" ? "Japan / Korea" : "日本・韓国";
}

export function spawnDisplayTimeZone(event: SpawnEvent, region: SpawnServerRegion): string {
  return event.regionalTimes && region === "taiwan-hong-kong-macau"
    ? "Asia/Taipei"
    : "Asia/Tokyo";
}

export function spawnTimeZoneLabel(
  event: SpawnEvent,
  region: SpawnServerRegion,
  locale: Locale,
): string {
  if (event.regionalTimes) return spawnServerRegionLabel(region, locale);
  return "JST";
}

export function formatSpawnServerTime(
  date: Date,
  event: SpawnEvent,
  region: SpawnServerRegion,
  withSeconds = false,
  locale: Locale = "ja",
): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "ja-JP", {
    timeZone: spawnDisplayTimeZone(event, region),
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: withSeconds ? "2-digit" : undefined,
    hour12: false,
  }).format(date);
}

export function formatSpawnServerClock(
  event: SpawnEvent,
  region: SpawnServerRegion,
): string {
  const clock = event.regionalTimes?.[region] ?? event;
  return `${String(clock.hour).padStart(2, "0")}:${String(clock.minute).padStart(2, "0")}`;
}

function formatEventEnd(event: SpawnEvent, region: SpawnServerRegion): string | null {
  if (!event.regionalTimes || !event.endsAt) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: spawnDisplayTimeZone(event, region),
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(event.endsAt));
  const part = (type: "month" | "day" | "hour" | "minute") => (
    parts.find((candidate) => candidate.type === type)?.value ?? ""
  );
  return `${part("month")}/${part("day")} ${part("hour")}:${part("minute")}`;
}

export function spawnScheduleLabel(
  event: SpawnEvent,
  region: SpawnServerRegion,
  locale: Locale,
): string {
  const eventEnd = formatEventEnd(event, region);
  if (!eventEnd) return event.label;
  return locale === "en" ? `Daily · through ${eventEnd}` : `毎日・${eventEnd}まで`;
}
