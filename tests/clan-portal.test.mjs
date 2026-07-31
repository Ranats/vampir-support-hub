import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildClanPortalUrl,
  clanPortalAccessStorageKey,
  createClanPortalId,
  createClanPortalToken,
  defaultSharedClanSchedule,
  hashClanPortalToken,
  isClanPortalId,
  isClanPortalToken,
  mergeSharedScheduleIntoLocal,
  normalizeClanPortalName,
  parseSharedClanSchedule,
  parseSharedClanScheduleForWrite,
  parseStoredClanPortalAccess,
  preferredStoredClanPortalToken,
  toSharedClanSchedule,
  withStoredClanPortalToken,
  withoutStoredClanPortalToken,
} from "../app/clan-portal.ts";
import {
  CLAN_SCHEDULE_KEY,
  DEFAULT_CLAN_SCHEDULE_SETTINGS,
  updateClanScheduleItem,
} from "../app/clan-schedule.ts";

test("generates independent unguessable portal identifiers and capability tokens", async () => {
  const id = createClanPortalId();
  const viewToken = createClanPortalToken();
  const adminToken = createClanPortalToken();

  assert.equal(isClanPortalId(id), true);
  assert.equal(isClanPortalToken(viewToken), true);
  assert.equal(isClanPortalToken(adminToken), true);
  assert.notEqual(viewToken, adminToken);

  const viewHash = await hashClanPortalToken(viewToken);
  const adminHash = await hashClanPortalToken(adminToken);
  assert.match(viewHash, /^[a-f0-9]{64}$/);
  assert.match(adminHash, /^[a-f0-9]{64}$/);
  assert.notEqual(viewHash, adminHash);
  assert.equal(viewHash.includes(viewToken), false);
});

test("keeps capability tokens in URL fragments instead of paths or queries", () => {
  const id = createClanPortalId();
  const token = createClanPortalToken();
  const url = new URL(buildClanPortalUrl("https://vampir.cilabworks.com", id, "viewer", token));

  assert.equal(url.pathname, `/clan/${id}`);
  assert.equal(url.search, "");
  assert.equal(url.hash, `#viewer=${token}`);
  assert.equal(url.pathname.includes(token), false);

  const englishUrl = new URL(buildClanPortalUrl(
    "https://vampir.cilabworks.com",
    id,
    "admin",
    token,
    "en",
  ));
  assert.equal(englishUrl.pathname, `/en/clan/${id}`);
  assert.equal(englishUrl.search, "");
  assert.equal(englishUrl.hash, `#admin=${token}`);
});

test("normalizes legacy v1 shared schedules to v2 JST and excludes personal reminders", () => {
  const value = {
    version: 1,
    items: [
      { contentId: "clan-mission", scheduled: true, day: 2, hour: 22, minute: 30, reminder: true },
      { contentId: "clan-guard", scheduled: false, day: 4, hour: 21, minute: 0, reminder: false },
    ],
  };
  const parsed = parseSharedClanSchedule(value);
  assert.ok(parsed);
  assert.equal(parsed.version, 2);
  assert.equal(parsed.timeZone, "Asia/Tokyo");
  assert.deepEqual(parsed.items[0], {
    contentId: "clan-mission",
    scheduled: true,
    day: 2,
    hour: 22,
    minute: 30,
  });
  assert.equal("reminder" in parsed.items[0], false);

  assert.equal(parseSharedClanSchedule({ ...value, items: [value.items[0], value.items[0]] }), null);
  assert.equal(parseSharedClanSchedule({ ...value, items: [{ ...value.items[0], minute: 60 }, value.items[1]] }), null);
});

test("round-trips v2 time zones and rejects v1 or invalid-zone writes", () => {
  const value = {
    version: 2,
    timeZone: "America/New_York",
    items: [
      { contentId: "clan-mission", scheduled: true, day: 0, hour: 2, minute: 30 },
      { contentId: "clan-guard", scheduled: false, day: 4, hour: 21, minute: 0 },
    ],
  };

  assert.deepEqual(parseSharedClanSchedule(value), value);
  assert.deepEqual(parseSharedClanScheduleForWrite(value), value);
  assert.equal(parseSharedClanScheduleForWrite({ ...value, version: 1 }), null);
  assert.equal(parseSharedClanScheduleForWrite({ ...value, timeZone: "Mars/Olympus" }), null);
});

test("copies shared times to local storage shape while preserving personal reminder choices", () => {
  let local = updateClanScheduleItem(DEFAULT_CLAN_SCHEDULE_SETTINGS, "clan-mission", {
    reminder: false,
  });
  local = updateClanScheduleItem(local, "clan-guard", { reminder: true });

  const shared = defaultSharedClanSchedule();
  shared.items[0] = { ...shared.items[0], scheduled: true, day: 5, hour: 20, minute: 45 };
  const merged = mergeSharedScheduleIntoLocal(shared, local);

  assert.equal(CLAN_SCHEDULE_KEY, "vampir-clan-schedule-v1");
  assert.deepEqual(merged.items[0], {
    contentId: "clan-mission",
    scheduled: true,
    day: 5,
    hour: 20,
    minute: 45,
    reminder: false,
  });
  assert.equal(merged.items[1].reminder, true);
  assert.deepEqual(toSharedClanSchedule(merged), shared);
});

test("validates names and stored device access without widening storage", () => {
  const token = createClanPortalToken();
  const id = createClanPortalId();
  assert.equal(normalizeClanPortalName("  深紅   の夜  "), "深紅 の夜");
  assert.equal(normalizeClanPortalName(" "), null);
  assert.deepEqual(
    parseStoredClanPortalAccess(JSON.stringify({ version: 1, token })),
    { version: 1, viewerToken: token },
  );
  assert.equal(parseStoredClanPortalAccess(JSON.stringify({ version: 2, token })), null);
  assert.equal(clanPortalAccessStorageKey(id), `vampir-clan-portal-access-v1:${id}`);

  const adminToken = createClanPortalToken();
  const withAdmin = withStoredClanPortalToken(null, "admin", adminToken);
  const withBoth = withStoredClanPortalToken(withAdmin, "viewer", token);
  assert.deepEqual(withBoth, { version: 1, adminToken, viewerToken: token });
  assert.equal(preferredStoredClanPortalToken(withBoth), adminToken);
  assert.deepEqual(withoutStoredClanPortalToken(withBoth, token), { version: 1, adminToken });
});

test("serializes one request timestamp for the first client render", async () => {
  const [japaneseSource, englishSource, clientSource] = await Promise.all([
    readFile(new URL("../app/(ja)/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/(en)/en/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/HomeClient.tsx", import.meta.url), "utf8"),
  ]);

  for (const serverSource of [japaneseSource, englishSource]) {
    assert.match(serverSource, /await connection\(\)/);
    assert.match(serverSource, /currentRequestTimeMs\(\)/);
    assert.match(serverSource, /initialNowMs=\{initialNowMs\}/);
  }
  assert.match(japaneseSource, /locale="ja"/);
  assert.match(englishSource, /locale="en"/);
  assert.match(clientSource, /useState\(\(\) => new Date\(initialNowMs\)\)/);
  assert.doesNotMatch(clientSource, /useState\(\(\) => new Date\(\)\)/);
});

test("portal APIs keep capability responses private and authorize with bearer tokens", async () => {
  const [
    httpSource,
    routeSource,
    repositorySource,
    clientSource,
    createSource,
    englishPortalPageSource,
    englishCreatePageSource,
    homeSource,
  ] = await Promise.all([
    readFile(new URL("../app/api/clan-portals/http.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/clan-portals/[clanId]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/clan-portals.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/ClanPortalClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/ClanPortalCreateClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/(en)/en/clan/[clanId]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/(en)/en/clan/create/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/HomeClient.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(httpSource, /private, no-store/);
  assert.match(httpSource, /noindex, nofollow/);
  assert.match(httpSource, /request\.body\?\.getReader\(\)/);
  assert.match(httpSource, /receivedBytes > MAX_REQUEST_BODY_BYTES[\s\S]*?reader\.cancel\(\)/);
  assert.doesNotMatch(httpSource, /request\.text\(\)/);
  assert.match(routeSource, /readBearerToken\(request\)/);
  assert.match(routeSource, /status === "conflict"/);
  assert.match(repositorySource, /admin_token_hash = \? AND revision = \?/);
  assert.match(repositorySource, /DELETE FROM clan_portals WHERE id = \? AND admin_token_hash = \?/);
  assert.doesNotMatch(repositorySource, /console\.(?:log|error)/);
  assert.match(clientSource, /response\.status === 404[\s\S]*?setPortal\(null\)[\s\S]*?setToken\(null\)/);
  assert.doesNotMatch(clientSource, /catch \(reason\) \{\s*if \(!silent\) setPortal\(null\)/);
  assert.match(clientSource, /tokenReady && token && !portal && !loading[\s\S]*?再試行[\s\S]*?別の共有キーを使う/);
  assert.match(clientSource, /dirtyRef\.current && portal && nextPortal\.revision !== portal\.revision/);
  assert.match(clientSource, /stripCapabilityFragment\(\);[\s\S]*?readStoredAccess\(clanId\)/);
  assert.doesNotMatch(clientSource, /fragmentCapability && !storeAccess/);
  assert.match(clientSource, /storeAccess\(clanId, activeToken, nextPortal\.capability\)/);
  assert.match(clientSource, /refreshPortal\(token, false, true\)/);
  assert.doesNotMatch(clientSource, /dirtyRef\.current = false;\s*setMessage\(""\);\s*await refreshPortal\(token/);
  assert.match(createSource, /setLinks\(createdLinks\);[\s\S]*?try \{[\s\S]*?localStorage\.setItem/);
  assert.match(createSource, /buildClanPortalUrl\(origin, portal\.id, "viewer", viewToken, locale\)/);
  assert.match(clientSource, /buildClanPortalUrl\(window\.location\.origin, clanId, "viewer", payload\.viewToken, locale\)/);
  assert.match(englishPortalPageSource, /locale="en"/);
  assert.match(englishPortalPageSource, /await connection\(\)/);
  assert.match(englishCreatePageSource, /locale="en"/);
  assert.match(homeSource, /href=\{en \? "\/en\/clan\/create" : "\/clan\/create"\}/);
  assert.match(clientSource, /Back to VAMPIR Daily Navigator/);
  assert.match(createSource, /Create a shared clan portal/);
});
