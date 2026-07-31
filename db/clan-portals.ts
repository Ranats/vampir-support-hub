import { getD1 } from ".";
import {
  createClanPortalId,
  createClanPortalToken,
  defaultSharedClanSchedule,
  hashClanPortalToken,
  normalizeClanPortalName,
  parseSharedClanSchedule,
  parseSharedClanScheduleForWrite,
  type ClanPortalCapability,
  type ClanPortalSnapshot,
  type SharedClanSchedule,
} from "../app/clan-portal";

const CREATE_LIMIT_PER_HOUR = 5;

const CREATE_PORTALS_TABLE = `
CREATE TABLE IF NOT EXISTS clan_portals (
  id TEXT PRIMARY KEY NOT NULL,
  display_name TEXT NOT NULL,
  schedule_json TEXT NOT NULL,
  view_token_hash TEXT NOT NULL UNIQUE,
  admin_token_hash TEXT NOT NULL UNIQUE,
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
)
`;

const CREATE_LIMITS_TABLE = `
CREATE TABLE IF NOT EXISTS clan_portal_creation_limits (
  rate_key TEXT PRIMARY KEY NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  window_started_at TEXT NOT NULL
)
`;

type ClanPortalRow = {
  id: string;
  display_name: string;
  schedule_json: string;
  view_token_hash: string;
  admin_token_hash: string;
  revision: number;
  created_at: string;
  updated_at: string;
};

type UpdateResult =
  | { status: "updated"; portal: ClanPortalSnapshot }
  | { status: "conflict" }
  | { status: "not_found" };

let schemaPromise: Promise<void> | null = null;

export class ClanPortalCreationRateLimitError extends Error {
  constructor() {
    super("Clan portal creation limit reached");
    this.name = "ClanPortalCreationRateLimitError";
  }
}

async function ensureClanPortalSchema() {
  if (!schemaPromise) {
    const db = getD1();
    schemaPromise = db.batch([
      db.prepare(CREATE_PORTALS_TABLE),
      db.prepare(CREATE_LIMITS_TABLE),
    ]).then(() => undefined).catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
}

async function sha256Text(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function parseStoredSchedule(raw: string): SharedClanSchedule {
  try {
    return parseSharedClanSchedule(JSON.parse(raw)) ?? defaultSharedClanSchedule();
  } catch {
    return defaultSharedClanSchedule();
  }
}

function toSnapshot(row: ClanPortalRow, capability: ClanPortalCapability): ClanPortalSnapshot {
  return {
    id: row.id,
    displayName: row.display_name,
    schedule: parseStoredSchedule(row.schedule_json),
    revision: row.revision,
    updatedAt: row.updated_at,
    capability,
  };
}

async function consumeCreationAllowance(request: Request) {
  const db = getD1();
  const now = new Date();
  const windowStartedAt = `${now.toISOString().slice(0, 13)}:00:00.000Z`;
  const clientAddress = request.headers.get("cf-connecting-ip") ?? "local-preview";
  const rateKey = await sha256Text(`${clientAddress}|${windowStartedAt}|clan-portal-v1`);

  await db.prepare(
    "DELETE FROM clan_portal_creation_limits WHERE datetime(window_started_at) < datetime('now', '-2 hours')",
  ).run();

  const row = await db.prepare(`
    INSERT INTO clan_portal_creation_limits (rate_key, count, window_started_at)
    VALUES (?, 1, ?)
    ON CONFLICT(rate_key) DO UPDATE SET count = count + 1
    RETURNING count
  `).bind(rateKey, windowStartedAt).first<{ count: number }>();

  if (!row || row.count > CREATE_LIMIT_PER_HOUR) {
    throw new ClanPortalCreationRateLimitError();
  }
}

export async function createClanPortal(
  request: Request,
  displayNameValue: unknown,
  scheduleValue: unknown,
) {
  await ensureClanPortalSchema();
  await consumeCreationAllowance(request);

  const displayName = normalizeClanPortalName(displayNameValue);
  const schedule = parseSharedClanScheduleForWrite(scheduleValue);
  if (!displayName || !schedule) throw new TypeError("Invalid clan portal input");

  const db = getD1();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const id = createClanPortalId();
    const viewToken = createClanPortalToken();
    const adminToken = createClanPortalToken();
    const viewTokenHash = await hashClanPortalToken(viewToken);
    const adminTokenHash = await hashClanPortalToken(adminToken);

    try {
      const row = await db.prepare(`
        INSERT INTO clan_portals (
          id, display_name, schedule_json, view_token_hash, admin_token_hash
        ) VALUES (?, ?, ?, ?, ?)
        RETURNING id, display_name, schedule_json, view_token_hash, admin_token_hash,
                  revision, created_at, updated_at
      `).bind(
        id,
        displayName,
        JSON.stringify(schedule),
        viewTokenHash,
        adminTokenHash,
      ).first<ClanPortalRow>();

      if (!row) throw new Error("Clan portal could not be created");
      return {
        portal: toSnapshot(row, "admin"),
        viewToken,
        adminToken,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("UNIQUE") || attempt === 2) throw error;
    }
  }

  throw new Error("Clan portal could not be created");
}

export async function getClanPortal(
  clanId: string,
  rawToken: string,
): Promise<ClanPortalSnapshot | null> {
  await ensureClanPortalSchema();
  const tokenHash = await hashClanPortalToken(rawToken);
  const row = await getD1().prepare(`
    SELECT id, display_name, schedule_json, view_token_hash, admin_token_hash,
           revision, created_at, updated_at
    FROM clan_portals
    WHERE id = ? AND (view_token_hash = ? OR admin_token_hash = ?)
  `).bind(clanId, tokenHash, tokenHash).first<ClanPortalRow>();
  if (!row) return null;
  return toSnapshot(row, row.admin_token_hash === tokenHash ? "admin" : "viewer");
}

export async function updateClanPortal(
  clanId: string,
  rawToken: string,
  displayNameValue: unknown,
  scheduleValue: unknown,
  expectedRevision: unknown,
): Promise<UpdateResult> {
  await ensureClanPortalSchema();
  const displayName = normalizeClanPortalName(displayNameValue);
  const schedule = parseSharedClanScheduleForWrite(scheduleValue);
  if (!displayName || !schedule || !Number.isInteger(expectedRevision) || (expectedRevision as number) < 1) {
    throw new TypeError("Invalid clan portal input");
  }

  const tokenHash = await hashClanPortalToken(rawToken);
  const db = getD1();
  const row = await db.prepare(`
    UPDATE clan_portals
    SET display_name = ?, schedule_json = ?, revision = revision + 1,
        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = ? AND admin_token_hash = ? AND revision = ?
    RETURNING id, display_name, schedule_json, view_token_hash, admin_token_hash,
              revision, created_at, updated_at
  `).bind(
    displayName,
    JSON.stringify(schedule),
    clanId,
    tokenHash,
    expectedRevision,
  ).first<ClanPortalRow>();

  if (row) return { status: "updated", portal: toSnapshot(row, "admin") };
  const authorized = await db.prepare(
    "SELECT 1 AS allowed FROM clan_portals WHERE id = ? AND admin_token_hash = ?",
  ).bind(clanId, tokenHash).first<{ allowed: number }>();
  return authorized ? { status: "conflict" } : { status: "not_found" };
}

export async function rotateClanPortalViewToken(clanId: string, rawToken: string) {
  await ensureClanPortalSchema();
  const adminTokenHash = await hashClanPortalToken(rawToken);
  const db = getD1();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const viewToken = createClanPortalToken();
    const viewTokenHash = await hashClanPortalToken(viewToken);
    try {
      const row = await db.prepare(`
        UPDATE clan_portals
        SET view_token_hash = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ? AND admin_token_hash = ?
        RETURNING id
      `).bind(viewTokenHash, clanId, adminTokenHash).first<{ id: string }>();
      return row ? viewToken : null;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("UNIQUE") || attempt === 2) throw error;
    }
  }
  return null;
}

export async function deleteClanPortal(clanId: string, rawToken: string): Promise<boolean> {
  await ensureClanPortalSchema();
  const adminTokenHash = await hashClanPortalToken(rawToken);
  const result = await getD1().prepare(
    "DELETE FROM clan_portals WHERE id = ? AND admin_token_hash = ?",
  ).bind(clanId, adminTokenHash).run();
  return (result.meta.changes ?? 0) > 0;
}
