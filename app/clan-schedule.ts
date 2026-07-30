export const CLAN_SCHEDULE_KEY = "vampir-clan-schedule-v1";

export const CLAN_CONTENT_IDS = ["clan-mission", "clan-guard"] as const;

export type ClanContentId = typeof CLAN_CONTENT_IDS[number];

export type ClanScheduleItem = {
  contentId: ClanContentId;
  scheduled: boolean;
  day: number;
  hour: number;
  minute: number;
  reminder: boolean;
};

export type ClanScheduleSettings = {
  version: 1;
  items: ClanScheduleItem[];
};

export type ClanScheduleOccurrence = {
  contentId: ClanContentId;
  startsAt: Date;
  occurrenceKey: string;
};

export const CLAN_WEEKDAY_LABELS = [
  "日",
  "月",
  "火",
  "水",
  "木",
  "金",
  "土",
] as const;

export const CLAN_CONTENT_META = [
  {
    contentId: "clan-mission",
    name: "クラン任務",
    minimumClanLevel: 3,
    weeklyLimit: 1,
  },
  {
    contentId: "clan-guard",
    name: "クラン守護",
    minimumClanLevel: 3,
    weeklyLimit: 1,
  },
] as const satisfies readonly {
  contentId: ClanContentId;
  name: string;
  minimumClanLevel: number;
  weeklyLimit: number;
}[];

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_STORED_LENGTH = 8_192;
const MAX_STORED_ITEMS = 20;
const KNOWN_CONTENT_IDS = new Set<string>(CLAN_CONTENT_IDS);

function defaultItem(contentId: ClanContentId): ClanScheduleItem {
  return {
    contentId,
    scheduled: false,
    day: 0,
    hour: 0,
    minute: 0,
    reminder: true,
  };
}

function defaultSettings(): ClanScheduleSettings {
  return {
    version: 1,
    items: CLAN_CONTENT_IDS.map(defaultItem),
  };
}

export const DEFAULT_CLAN_SCHEDULE_SETTINGS = defaultSettings();

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isIntegerInRange(value: unknown, minimum: number, maximum: number) {
  return Number.isInteger(value) && (value as number) >= minimum && (value as number) <= maximum;
}

function isClanContentId(value: unknown): value is ClanContentId {
  return typeof value === "string" && KNOWN_CONTENT_IDS.has(value);
}

function parseItem(value: unknown): ClanScheduleItem | null {
  if (!isObject(value) || !isClanContentId(value.contentId)) return null;
  if (typeof value.scheduled !== "boolean" || typeof value.reminder !== "boolean") return null;
  if (!isIntegerInRange(value.day, 0, 6)) return null;
  if (!isIntegerInRange(value.hour, 0, 23)) return null;
  if (!isIntegerInRange(value.minute, 0, 59)) return null;

  return {
    contentId: value.contentId,
    scheduled: value.scheduled,
    day: value.day as number,
    hour: value.hour as number,
    minute: value.minute as number,
    reminder: value.reminder,
  };
}

function normalizeItems(values: readonly unknown[]): ClanScheduleItem[] {
  const byId = new Map<ClanContentId, ClanScheduleItem>();
  for (const value of values) {
    const item = parseItem(value);
    if (!item || byId.has(item.contentId)) continue;
    byId.set(item.contentId, item);
  }

  return CLAN_CONTENT_IDS.map((contentId) => byId.get(contentId) ?? defaultItem(contentId));
}

export function parseClanScheduleSettings(raw: string | null): ClanScheduleSettings {
  if (!raw || raw.length > MAX_STORED_LENGTH) return defaultSettings();

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isObject(parsed) || parsed.version !== 1 || !Array.isArray(parsed.items)) {
      return defaultSettings();
    }
    if (parsed.items.length > MAX_STORED_ITEMS) return defaultSettings();

    return {
      version: 1,
      items: normalizeItems(parsed.items),
    };
  } catch {
    return defaultSettings();
  }
}

export function updateClanScheduleItem(
  settings: ClanScheduleSettings,
  contentId: ClanContentId,
  update: Partial<Omit<ClanScheduleItem, "contentId">>,
): ClanScheduleSettings {
  const currentItems = settings.items.length <= MAX_STORED_ITEMS
    ? normalizeItems(settings.items)
    : defaultSettings().items;
  if (!isClanContentId(contentId) || !isObject(update)) {
    return { version: 1, items: currentItems };
  }

  const current = currentItems.find((item) => item.contentId === contentId) ?? defaultItem(contentId);
  const replacement = parseItem({ ...current, ...update, contentId });
  if (!replacement) {
    return { version: 1, items: currentItems };
  }

  return {
    version: 1,
    items: CLAN_CONTENT_IDS.map((id) => id === contentId
      ? replacement
      : { ...(currentItems.find((item) => item.contentId === id) ?? defaultItem(id)) }),
  };
}

export function nextClanOccurrence(
  item: ClanScheduleItem,
  now: Date,
): ClanScheduleOccurrence | null {
  const safeItem = parseItem(item);
  const nowTime = now.getTime();
  if (!safeItem?.scheduled || !Number.isFinite(nowTime)) return null;

  const jstNow = new Date(nowTime + JST_OFFSET_MS);
  const daysUntil = (safeItem.day - jstNow.getUTCDay() + 7) % 7;
  let startsAtTime = Date.UTC(
    jstNow.getUTCFullYear(),
    jstNow.getUTCMonth(),
    jstNow.getUTCDate() + daysUntil,
    safeItem.hour - 9,
    safeItem.minute,
    0,
    0,
  );

  if (startsAtTime < nowTime) startsAtTime += WEEK_MS;

  const startsAt = new Date(startsAtTime);
  return {
    contentId: safeItem.contentId,
    startsAt,
    occurrenceKey: `${safeItem.contentId}:${startsAt.toISOString()}`,
  };
}

export function nextClanOccurrences(
  settings: ClanScheduleSettings,
  now: Date,
): ClanScheduleOccurrence[] {
  return settings.items
    .map((item, index) => ({ occurrence: nextClanOccurrence(item, now), index }))
    .filter((candidate): candidate is { occurrence: ClanScheduleOccurrence; index: number } => (
      candidate.occurrence !== null
    ))
    .sort((left, right) => (
      left.occurrence.startsAt.getTime() - right.occurrence.startsAt.getTime()
      || left.index - right.index
    ))
    .map(({ occurrence }) => occurrence);
}
