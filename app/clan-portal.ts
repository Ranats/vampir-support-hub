import {
  CLAN_CONTENT_IDS,
  DEFAULT_CLAN_SCHEDULE_SETTINGS,
  type ClanContentId,
  type ClanScheduleSettings,
} from "./clan-schedule.ts";
import {
  JAPAN_TIME_ZONE,
  isValidClanTimeZone,
} from "./clan-time-zone.ts";
import type { Locale } from "./localization";

export const CLAN_PORTAL_ACCESS_STORAGE_PREFIX = "vampir-clan-portal-access-v1:";
export const MAX_CLAN_PORTAL_NAME = 40;
export const CLAN_PORTAL_POLL_INTERVAL_MS = 30_000;

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const CLAN_ID_PATTERN = /^[A-Za-z0-9_-]{22}$/;
const KNOWN_CONTENT_IDS = new Set<string>(CLAN_CONTENT_IDS);

export type ClanPortalCapability = "viewer" | "admin";

export type SharedClanScheduleItem = {
  contentId: ClanContentId;
  scheduled: boolean;
  day: number;
  hour: number;
  minute: number;
};

export type SharedClanSchedule = {
  version: 2;
  timeZone: string;
  items: SharedClanScheduleItem[];
};

export type ClanPortalSnapshot = {
  id: string;
  displayName: string;
  schedule: SharedClanSchedule;
  revision: number;
  updatedAt: string;
  capability: ClanPortalCapability;
};

export type StoredClanPortalAccess = {
  version: 1;
  adminToken?: string;
  viewerToken?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isIntegerInRange(value: unknown, minimum: number, maximum: number) {
  return Number.isInteger(value) && (value as number) >= minimum && (value as number) <= maximum;
}

function defaultSharedItem(contentId: ClanContentId): SharedClanScheduleItem {
  const local = DEFAULT_CLAN_SCHEDULE_SETTINGS.items.find((item) => item.contentId === contentId);
  return {
    contentId,
    scheduled: local?.scheduled ?? false,
    day: local?.day ?? 0,
    hour: local?.hour ?? 0,
    minute: local?.minute ?? 0,
  };
}

export function defaultSharedClanSchedule(
  timeZone = JAPAN_TIME_ZONE,
): SharedClanSchedule {
  return {
    version: 2,
    timeZone: isValidClanTimeZone(timeZone) ? timeZone : JAPAN_TIME_ZONE,
    items: CLAN_CONTENT_IDS.map(defaultSharedItem),
  };
}

function parseSharedItem(value: unknown): SharedClanScheduleItem | null {
  if (!isRecord(value) || typeof value.contentId !== "string") return null;
  if (!KNOWN_CONTENT_IDS.has(value.contentId)) return null;
  if (typeof value.scheduled !== "boolean") return null;
  if (!isIntegerInRange(value.day, 0, 6)) return null;
  if (!isIntegerInRange(value.hour, 0, 23)) return null;
  if (!isIntegerInRange(value.minute, 0, 59)) return null;

  return {
    contentId: value.contentId as ClanContentId,
    scheduled: value.scheduled,
    day: value.day as number,
    hour: value.hour as number,
    minute: value.minute as number,
  };
}

export function parseSharedClanSchedule(value: unknown): SharedClanSchedule | null {
  if (!isRecord(value)
    || (value.version !== 1 && value.version !== 2)
    || !Array.isArray(value.items)) {
    return null;
  }
  const timeZone = value.version === 1 ? JAPAN_TIME_ZONE : value.timeZone;
  if (!isValidClanTimeZone(timeZone)) return null;
  if (value.items.length !== CLAN_CONTENT_IDS.length) return null;

  const byId = new Map<ClanContentId, SharedClanScheduleItem>();
  for (const candidate of value.items) {
    const item = parseSharedItem(candidate);
    if (!item || byId.has(item.contentId)) return null;
    byId.set(item.contentId, item);
  }

  if (byId.size !== CLAN_CONTENT_IDS.length) return null;
  return {
    version: 2,
    timeZone,
    items: CLAN_CONTENT_IDS.map((contentId) => byId.get(contentId) ?? defaultSharedItem(contentId)),
  };
}

export function parseSharedClanScheduleForWrite(value: unknown): SharedClanSchedule | null {
  if (!isRecord(value) || value.version !== 2) return null;
  return parseSharedClanSchedule(value);
}

export function toSharedClanSchedule(
  settings: ClanScheduleSettings,
  timeZone = JAPAN_TIME_ZONE,
): SharedClanSchedule {
  const items = CLAN_CONTENT_IDS.map((contentId) => {
    const item = settings.items.find((candidate) => candidate.contentId === contentId);
    return item
      ? {
          contentId,
          scheduled: item.scheduled,
          day: item.day,
          hour: item.hour,
          minute: item.minute,
        }
      : defaultSharedItem(contentId);
  });
  return {
    version: 2,
    timeZone: isValidClanTimeZone(timeZone) ? timeZone : JAPAN_TIME_ZONE,
    items,
  };
}

export function mergeSharedScheduleIntoLocal(
  shared: SharedClanSchedule,
  current: ClanScheduleSettings,
): ClanScheduleSettings {
  const parsed = parseSharedClanSchedule(shared) ?? defaultSharedClanSchedule();
  return {
    version: 1,
    items: parsed.items.map((item) => ({
      ...item,
      reminder: current.items.find((candidate) => candidate.contentId === item.contentId)?.reminder ?? true,
    })),
  };
}

export function normalizeClanPortalName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized || normalized.length > MAX_CLAN_PORTAL_NAME) return null;
  return normalized;
}

export function parseClanPortalSnapshot(value: unknown): ClanPortalSnapshot | null {
  if (!isRecord(value) || !isClanPortalId(value.id)) return null;
  const displayName = normalizeClanPortalName(value.displayName);
  const schedule = parseSharedClanSchedule(value.schedule);
  if (!displayName || !schedule) return null;
  if (!Number.isInteger(value.revision) || (value.revision as number) < 1) return null;
  if (typeof value.updatedAt !== "string" || Number.isNaN(Date.parse(value.updatedAt))) return null;
  if (value.capability !== "viewer" && value.capability !== "admin") return null;
  return {
    id: value.id,
    displayName,
    schedule,
    revision: value.revision as number,
    updatedAt: value.updatedAt,
    capability: value.capability,
  };
}

function randomBase64Url(byteLength: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function createClanPortalId(): string {
  return randomBase64Url(16);
}

export function createClanPortalToken(): string {
  return randomBase64Url(32);
}

export function isClanPortalId(value: unknown): value is string {
  return typeof value === "string" && CLAN_ID_PATTERN.test(value);
}

export function isClanPortalToken(value: unknown): value is string {
  return typeof value === "string" && TOKEN_PATTERN.test(value);
}

export async function hashClanPortalToken(token: string): Promise<string> {
  if (!isClanPortalToken(token)) throw new Error("Invalid clan portal token");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function readBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer ([A-Za-z0-9_-]+)$/.exec(authorization);
  return match && isClanPortalToken(match[1]) ? match[1] : null;
}

export function clanPortalAccessStorageKey(clanId: string): string {
  return `${CLAN_PORTAL_ACCESS_STORAGE_PREFIX}${clanId}`;
}

export function parseStoredClanPortalAccess(raw: string | null): StoredClanPortalAccess | null {
  if (!raw || raw.length > 256) return null;
  try {
    const value = JSON.parse(raw) as unknown;
    if (!isRecord(value) || value.version !== 1) return null;
    const adminToken = isClanPortalToken(value.adminToken) ? value.adminToken : undefined;
    const viewerToken = isClanPortalToken(value.viewerToken)
      ? value.viewerToken
      : isClanPortalToken(value.token)
        ? value.token
        : undefined;
    if (!adminToken && !viewerToken) return null;
    return { version: 1, ...(adminToken ? { adminToken } : {}), ...(viewerToken ? { viewerToken } : {}) };
  } catch {
    return null;
  }
}

export function withStoredClanPortalToken(
  current: StoredClanPortalAccess | null,
  capability: ClanPortalCapability,
  token: string,
): StoredClanPortalAccess {
  if (!isClanPortalToken(token)) throw new Error("Invalid clan portal token");
  return {
    version: 1,
    ...(current?.adminToken ? { adminToken: current.adminToken } : {}),
    ...(current?.viewerToken ? { viewerToken: current.viewerToken } : {}),
    ...(capability === "admin" ? { adminToken: token } : { viewerToken: token }),
  };
}

export function withoutStoredClanPortalToken(
  current: StoredClanPortalAccess | null,
  token: string,
): StoredClanPortalAccess | null {
  if (!current) return null;
  const adminToken = current.adminToken === token ? undefined : current.adminToken;
  const viewerToken = current.viewerToken === token ? undefined : current.viewerToken;
  if (!adminToken && !viewerToken) return null;
  return { version: 1, ...(adminToken ? { adminToken } : {}), ...(viewerToken ? { viewerToken } : {}) };
}

export function preferredStoredClanPortalToken(access: StoredClanPortalAccess | null): string | null {
  return access?.adminToken ?? access?.viewerToken ?? null;
}

export function buildClanPortalUrl(
  origin: string,
  clanId: string,
  capability: ClanPortalCapability,
  token: string,
  locale: Locale = "ja",
): string {
  if (!isClanPortalId(clanId) || !isClanPortalToken(token)) {
    throw new Error("Invalid clan portal capability");
  }
  const url = new URL(`${locale === "en" ? "/en" : ""}/clan/${clanId}`, origin);
  url.hash = `${capability}=${encodeURIComponent(token)}`;
  return url.toString();
}
