export type SourceAuthority = "official" | "supplementary";
export type LocalizedLabel = { ja: string; en: string };

export type GameContentSource = {
  id: string;
  url: string;
  authority: SourceAuthority;
  label: LocalizedLabel;
};

export type SpawnEvent = {
  id: string;
  title: string;
  hour: number;
  minute: number;
  days?: readonly number[];
  minLevel?: number;
  label: string;
  sourceIds: readonly string[];
  verifiedAt: string;
};

export type Routine = {
  id: string;
  title: string;
  note: string;
  priority: number;
  minLevel?: number;
  unlock?: string;
  custom?: boolean;
  sourceIds: readonly string[];
  verifiedAt: string;
};

export type LimitedEvent = {
  id: string;
  title: string;
  deadline: Date;
  detailsUrl: string;
  sourceIds: readonly string[];
  verifiedAt: string;
};

export type GameContentDefinition = {
  sources: readonly GameContentSource[];
  spawnEvents: readonly SpawnEvent[];
  dailyTasks: readonly Routine[];
  weeklyTasks: readonly Routine[];
  limitedEvents: readonly LimitedEvent[];
};

const VERIFIED_AT = "2026-07-30T00:00:00+09:00";
export const STALE_AFTER_DAYS = 14;

export const GAME_CONTENT_SOURCES = [
    { id: "official", url: "https://vampirjp.netmarble.com/landing", authority: "official", label: { ja: "VAMPIR公式", en: "Official VAMPIR site (Japanese)" } },
    { id: "routines", url: "https://gamewith.jp/vampir/567160", authority: "supplementary", label: { ja: "日課・週課・クラン概要（日本語解説）", en: "Daily, weekly, and clan overview (Japanese)" } },
    { id: "clan-official", url: "https://guide.netmarble.com/thered/110", authority: "official", label: { ja: "クラン機能 公式ガイド（韓国語）", en: "Official clan feature guide (Korean)" } },
    { id: "gehenna", url: "https://gamewith.jp/vampir/569771", authority: "supplementary", label: { ja: "ゲヘナ時刻", en: "Gehenna schedule (Japanese)" } },
    { id: "events", url: "https://gamewith.jp/vampir/567177", authority: "supplementary", label: { ja: "イベント一覧", en: "Event list (Japanese)" } },
  ] as const satisfies readonly GameContentSource[];

export const SPAWN_EVENTS = [
    { id: "world-noon", title: "ワールドボス", hour: 12, minute: 0, label: "毎日", sourceIds: ["routines"], verifiedAt: VERIFIED_AT },
    { id: "gehenna-13", title: "ゲヘナ ★1・★2", hour: 13, minute: 0, minLevel: 52, label: "毎日", sourceIds: ["gehenna"], verifiedAt: VERIFIED_AT },
    { id: "gehenna-17", title: "ゲヘナ ★1", hour: 17, minute: 0, minLevel: 52, label: "毎日", sourceIds: ["gehenna"], verifiedAt: VERIFIED_AT },
    { id: "world-night", title: "ワールドボス", hour: 20, minute: 0, label: "毎日", sourceIds: ["routines"], verifiedAt: VERIFIED_AT },
    { id: "gehenna-21", title: "ゲヘナ ★1・★2", hour: 21, minute: 0, minLevel: 52, label: "毎日", sourceIds: ["gehenna"], verifiedAt: VERIFIED_AT },
    { id: "gehenna-sat-22", title: "ゲヘナ ★3", hour: 22, minute: 0, days: [6], minLevel: 64, label: "土曜", sourceIds: ["gehenna"], verifiedAt: VERIFIED_AT },
  ] as const satisfies readonly SpawnEvent[];

export const DAILY_TASKS = [
    { id: "daily-quest", title: "デイリークエスト 10件", note: "オルガの恩寵がある場合は12件", priority: 5, unlock: "解放：エピソード1 act3-101", sourceIds: ["routines"], verifiedAt: VERIFIED_AT },
    { id: "creation-abyss", title: "創造の深淵 1時間", note: "1日最大1時間", priority: 5, minLevel: 32, sourceIds: ["routines"], verifiedAt: VERIFIED_AT },
    { id: "faded-legacy", title: "褪せた遺産 1時間", note: "1日最大1時間", priority: 5, minLevel: 34, sourceIds: ["routines"], verifiedAt: VERIFIED_AT },
    { id: "death-recovery", title: "戦闘不能ペナルティを確認", note: "発生した日に確認。24時間以内、最初の5回は無料", priority: 4, sourceIds: ["routines"], verifiedAt: VERIFIED_AT },
    { id: "gold-shop", title: "ゴールド交換を確認", note: "ゴールドに余裕がある場合", priority: 3, sourceIds: ["routines"], verifiedAt: VERIFIED_AT },
  ] as const satisfies readonly Routine[];

export const WEEKLY_TASKS = [
    { id: "epic-dungeon", title: "エピックダンジョン 3回", note: "週3回まで無料入場", priority: 5, unlock: "解放：対応エピソードの進行", sourceIds: ["routines"], verifiedAt: VERIFIED_AT },
    { id: "ancient-workshop", title: "古代の工房 8時間", note: "1週間で最大8時間", priority: 5, minLevel: 41, sourceIds: ["routines"], verifiedAt: VERIFIED_AT },
    { id: "dark-trade", title: "闇取引を確認", note: "対象アイテムと交換上限は毎週更新", priority: 5, minLevel: 38, sourceIds: ["routines"], verifiedAt: VERIFIED_AT },
    { id: "clan-mission", title: "クラン任務を確認", note: "クラン加入・クランLv3以上が対象", priority: 4, sourceIds: ["routines", "clan-official"], verifiedAt: VERIFIED_AT },
    { id: "clan-guard", title: "クラン守護を確認", note: "クラン加入・クランLv3以上が対象", priority: 4, sourceIds: ["routines", "clan-official"], verifiedAt: VERIFIED_AT },
    { id: "farm-diamond", title: "ファームダイヤ 1,000", note: "通常の週間上限。恩寵がある場合は2,000", priority: 4, sourceIds: ["routines"], verifiedAt: VERIFIED_AT },
    { id: "gehenna-weekly", title: "ゲヘナ週間ポイントを確認", note: "現在のポイントと交換予定を確認", priority: 3, minLevel: 52, sourceIds: ["gehenna"], verifiedAt: VERIFIED_AT },
  ] as const satisfies readonly Routine[];

export const LIMITED_EVENTS = [
    { id: "red-login-7", title: "レッドムーン前夜祭 7日間特別ログイン", deadline: new Date("2026-08-11T19:59:00.000Z"), detailsUrl: "https://gamewith.jp/vampir/567177", sourceIds: ["events"], verifiedAt: VERIFIED_AT },
    { id: "red-growth", title: "レッドムーン前夜祭 成長支援ミッション", deadline: new Date("2026-08-11T19:59:00.000Z"), detailsUrl: "https://gamewith.jp/vampir/567177", sourceIds: ["events"], verifiedAt: VERIFIED_AT },
    { id: "red-payback", title: "強化支援ペイバック", deadline: new Date("2026-08-11T19:59:00.000Z"), detailsUrl: "https://gamewith.jp/vampir/567177", sourceIds: ["events"], verifiedAt: VERIFIED_AT },
    { id: "daily-double", title: "デイリークエスト W報酬", deadline: new Date("2026-08-25T19:59:00.000Z"), detailsUrl: "https://gamewith.jp/vampir/567177", sourceIds: ["events"], verifiedAt: VERIFIED_AT },
    { id: "region-growth", title: "新地域オープン記念 成長支援", deadline: new Date("2026-09-15T19:59:00.000Z"), detailsUrl: "https://gamewith.jp/vampir/567177", sourceIds: ["events"], verifiedAt: VERIFIED_AT },
  ] as const satisfies readonly LimitedEvent[];

export const GAME_CONTENT = {
  sources: GAME_CONTENT_SOURCES,
  spawnEvents: SPAWN_EVENTS,
  dailyTasks: DAILY_TASKS,
  weeklyTasks: WEEKLY_TASKS,
  limitedEvents: LIMITED_EVENTS,
} as const satisfies GameContentDefinition;

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function isValidVerifiedAt(value: string) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{3})?(Z|([+-])(\d{2}):(\d{2}))$/,
  );
  if (!match) return false;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText, zone, , offsetHourText, offsetMinuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) return false;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > daysInMonth) return false;
  if (zone !== "Z" && (Number(offsetHourText) > 23 || Number(offsetMinuteText) > 59)) return false;
  return !Number.isNaN(Date.parse(value));
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Invalid game content: ${message}`);
}

export function validateGameContent(content: GameContentDefinition) {
  assert(content.sources.length > 0, "at least one source is required");
  const sourceIds = new Set<string>();
  for (const source of content.sources) {
    assert(Boolean(source.id.trim()), "source id must not be empty");
    assert(!sourceIds.has(source.id), `duplicate source id ${source.id}`);
    sourceIds.add(source.id);
    assert(isValidUrl(source.url), `invalid source URL for ${source.id}`);
    assert(source.authority === "official" || source.authority === "supplementary", `invalid source authority for ${source.id}`);
    assert(Boolean(source.label.ja.trim()) && Boolean(source.label.en.trim()), `missing source label for ${source.id}`);
  }

  const itemIds = new Set<string>();
  const allItems = [
    ...content.spawnEvents,
    ...content.dailyTasks,
    ...content.weeklyTasks,
    ...content.limitedEvents,
  ];
  assert(content.spawnEvents.length > 0, "at least one spawn event is required");
  assert(allItems.length > 0, "at least one game-content item is required");
  const validateItem = (item: { id: string; sourceIds: readonly string[]; verifiedAt: string }) => {
    assert(Boolean(item.id.trim()), "item id must not be empty");
    assert(!itemIds.has(item.id), `duplicate item id ${item.id}`);
    itemIds.add(item.id);
    assert(item.sourceIds.length > 0, `missing source id for ${item.id}`);
    assert(new Set(item.sourceIds).size === item.sourceIds.length, `duplicate source ids for ${item.id}`);
    for (const sourceId of item.sourceIds) assert(sourceIds.has(sourceId), `unknown source id ${sourceId} for ${item.id}`);
    assert(isValidVerifiedAt(item.verifiedAt), `invalid verifiedAt for ${item.id}`);
  };

  for (const event of content.spawnEvents) {
    validateItem(event);
    assert(Boolean(event.title.trim()) && Boolean(event.label.trim()), `missing display copy for ${event.id}`);
    assert(Number.isInteger(event.hour) && event.hour >= 0 && event.hour <= 23, `invalid hour for ${event.id}`);
    assert(Number.isInteger(event.minute) && event.minute >= 0 && event.minute <= 59, `invalid minute for ${event.id}`);
    if (event.days) {
      assert(event.days.length > 0 && event.days.every((day) => Number.isInteger(day) && day >= 0 && day <= 6), `invalid weekdays for ${event.id}`);
      assert(new Set(event.days).size === event.days.length, `duplicate weekdays for ${event.id}`);
    }
    if (event.minLevel !== undefined) assert(Number.isInteger(event.minLevel) && event.minLevel >= 1 && event.minLevel <= 200, `invalid level for ${event.id}`);
  }
  for (const task of [...content.dailyTasks, ...content.weeklyTasks]) {
    validateItem(task);
    assert(Boolean(task.title.trim()) && Boolean(task.note.trim()), `missing display copy for ${task.id}`);
    if (task.unlock !== undefined) assert(Boolean(task.unlock.trim()), `empty unlock copy for ${task.id}`);
    assert(Number.isInteger(task.priority) && task.priority >= 1 && task.priority <= 5, `invalid priority for ${task.id}`);
    if (task.minLevel !== undefined) assert(Number.isInteger(task.minLevel) && task.minLevel >= 1 && task.minLevel <= 200, `invalid level for ${task.id}`);
  }
  for (const event of content.limitedEvents) {
    validateItem(event);
    assert(Boolean(event.title.trim()), `missing display copy for ${event.id}`);
    assert(event.deadline instanceof Date && !Number.isNaN(event.deadline.getTime()), `invalid deadline for ${event.id}`);
    assert(isValidUrl(event.detailsUrl), `invalid details URL for ${event.id}`);
    const referencedUrls = event.sourceIds.map((sourceId) => (
      content.sources.find((source) => source.id === sourceId)?.url
    ));
    assert(referencedUrls.includes(event.detailsUrl), `details URL is not a referenced source for ${event.id}`);
  }
  return content;
}

validateGameContent(GAME_CONTENT);

export function oldestGameContentVerifiedAt(content: GameContentDefinition = GAME_CONTENT) {
  return [...content.spawnEvents, ...content.dailyTasks, ...content.weeklyTasks, ...content.limitedEvents]
    .map((item) => item.verifiedAt)
    .reduce<string | null>((oldest, verifiedAt) => (
      oldest === null || Date.parse(verifiedAt) < Date.parse(oldest) ? verifiedAt : oldest
    ), null);
}
