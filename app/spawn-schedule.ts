import { SPAWN_EVENTS, type SpawnEvent } from "./game-content";
import type { Locale } from "./localization";

export type SpawnOccurrence = SpawnEvent & { at: Date };

const JST_OFFSET = 9 * 60 * 60 * 1000;

type SpawnEventId = (typeof SPAWN_EVENTS)[number]["id"];

const EN_SPAWN_COPY: Record<SpawnEventId, Pick<SpawnEvent, "title" | "label">> = {
  "event-boss-bardeun-day": { title: "Event Boss Bardeun", label: "Daily · through Sep 16, 04:59 JST" },
  "world-noon": { title: "World Boss", label: "Daily" },
  "gehenna-13": { title: "Gehenna ★1 & ★2", label: "Daily" },
  "gehenna-17": { title: "Gehenna ★1", label: "Daily" },
  "event-boss-bardeun-night": { title: "Event Boss Bardeun", label: "Daily · through Sep 16, 04:59 JST" },
  "world-night": { title: "World Boss", label: "Daily" },
  "gehenna-21": { title: "Gehenna ★1 & ★2", label: "Daily" },
  "gehenna-sat-22": { title: "Gehenna ★3", label: "Saturday" },
};

export function localizedSpawnEvents(locale: Locale): readonly SpawnEvent[] {
  return locale === "en"
    ? SPAWN_EVENTS.map((event) => ({ ...event, ...EN_SPAWN_COPY[event.id] }))
    : SPAWN_EVENTS;
}

function makeJstDate(year: number, month: number, date: number, hour: number, minute: number) {
  return new Date(Date.UTC(year, month, date, hour - 9, minute, 0, 0));
}

function shiftedToJst(date: Date) {
  return new Date(date.getTime() + JST_OFFSET);
}

export function upcomingSpawnOccurrences(
  events: readonly SpawnEvent[],
  now: Date,
  level = 200,
  take = 6,
) {
  const items: SpawnOccurrence[] = [];
  const jst = shiftedToJst(now);

  for (let offset = 0; offset < 8; offset += 1) {
    const cursor = new Date(jst);
    cursor.setUTCDate(cursor.getUTCDate() + offset);

    for (const event of events) {
      if (event.days && !event.days.includes(cursor.getUTCDay())) continue;
      if (event.minLevel && event.minLevel > level) continue;
      const at = makeJstDate(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate(), event.hour, event.minute);
      if (event.endsAt !== undefined && at.getTime() >= Date.parse(event.endsAt)) continue;
      if (at.getTime() >= now.getTime() - 30_000) items.push({ ...event, at });
    }
  }

  return items.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, take);
}

export function formatSpawnCountdown(target: Date, now: Date, locale: Locale = "ja") {
  const total = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const clock = [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
  return days ? (locale === "en" ? `${days}d ${clock}` : `${days}日 ${clock}`) : clock;
}

export function formatSpawnJst(date: Date, withSeconds = false, locale: Locale = "ja") {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: withSeconds ? "2-digit" : undefined,
    hour12: false,
  }).format(date);
}

export function formatSpawnVerifiedAt(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}
