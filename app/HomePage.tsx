"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type MouseEvent as ReactMouseEvent,
  type SetStateAction,
} from "react";
import {
  cycleResetState,
  dailyCycleKey,
  weeklyCycleKey,
} from "./progress-cycle";
import SettingsSheet from "./SettingsSheet";
import ShareMenu from "./ShareMenu";
import {
  CUSTOM_ROUTINES_KEY,
  DEFAULT_ROUTINE_PREFERENCES,
  MAX_CUSTOM_ROUTINES,
  ROUTINE_PREFERENCES_KEY,
  keepKnownDefaultPreferences,
  makeCustomRoutine,
  parseCustomRoutines,
  parseRoutinePreferences,
  replaceCustomRoutine,
  visibleRoutines,
  type CustomRoutine,
  type CustomRoutineInput,
  type RoutinePreferences,
} from "./routine-customization";
import { selectTodayTasks } from "./today-tasks";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  FAVORITE_SPAWNS_KEY,
  NOTIFICATION_SETTINGS_KEY,
  parseFavoriteSpawnIds,
  parseNotificationSettings,
  type NotificationSettings,
} from "./notification-settings";
import {
  createPersonalBackup,
  parsePersonalBackup,
} from "./personal-backup";
import { replaceStorageValues } from "./storage-transaction";
import LanguageSwitch from "./LanguageSwitch";
import type { Locale } from "./localization";

type SpawnEvent = {
  id: string;
  title: string;
  hour: number;
  minute: number;
  days?: number[];
  minLevel?: number;
  label: string;
};

type Occurrence = SpawnEvent & { at: Date };

type Routine = {
  id: string;
  title: string;
  note: string;
  priority: number;
  minLevel?: number;
  unlock?: string;
  custom?: boolean;
};

type LimitedEvent = {
  id: string;
  title: string;
  deadline: Date;
};

const JST_OFFSET = 9 * 60 * 60 * 1000;
const VERIFIED_AT = "2026年7月30日";
const VERIFIED_AT_ISO = "2026-07-30T00:00:00+09:00";
const STALE_AFTER_DAYS = 14;
const NOTIFIED_OCCURRENCES_KEY = "vampir-notified-occurrences-v1";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const SOURCE_URLS = {
  official: "https://vampirjp.netmarble.com/landing",
  routines: "https://gamewith.jp/vampir/567160",
  gehenna: "https://gamewith.jp/vampir/569771",
  events: "https://gamewith.jp/vampir/567177",
};

const SUPPORT_URLS = {
  kofi: "https://ko-fi.com/ranats",
  ofuse: "https://ofuse.me/d2c3aa65",
};

const DEVELOPER_X_URL = "https://x.com/Kokonoe_variant";

const SPAWN_EVENTS: SpawnEvent[] = [
  {
    id: "world-noon",
    title: "ワールドボス",
    hour: 12,
    minute: 0,
    label: "毎日",
  },
  {
    id: "gehenna-13",
    title: "ゲヘナ ★1・★2",
    hour: 13,
    minute: 0,
    minLevel: 52,
    label: "毎日",
  },
  {
    id: "gehenna-17",
    title: "ゲヘナ ★1",
    hour: 17,
    minute: 0,
    minLevel: 52,
    label: "毎日",
  },
  {
    id: "world-night",
    title: "ワールドボス",
    hour: 20,
    minute: 0,
    label: "毎日",
  },
  {
    id: "gehenna-21",
    title: "ゲヘナ ★1・★2",
    hour: 21,
    minute: 0,
    minLevel: 52,
    label: "毎日",
  },
  {
    id: "gehenna-sat-22",
    title: "ゲヘナ ★3",
    hour: 22,
    minute: 0,
    days: [6],
    minLevel: 64,
    label: "土曜",
  },
];

const DAILY_TASKS: Routine[] = [
  {
    id: "daily-quest",
    title: "デイリークエスト 10件",
    note: "オルガの恩寵がある場合は12件",
    priority: 5,
    unlock: "解放：エピソード1 act3-101",
  },
  {
    id: "creation-abyss",
    title: "創造の深淵 1時間",
    note: "1日最大1時間",
    priority: 5,
    minLevel: 32,
  },
  {
    id: "faded-legacy",
    title: "褪せた遺産 1時間",
    note: "1日最大1時間",
    priority: 5,
    minLevel: 34,
  },
  {
    id: "death-recovery",
    title: "戦闘不能ペナルティを確認",
    note: "発生した日に確認。24時間以内、最初の5回は無料",
    priority: 4,
  },
  {
    id: "gold-shop",
    title: "ゴールド交換を確認",
    note: "ゴールドに余裕がある場合",
    priority: 3,
  },
];

const WEEKLY_TASKS: Routine[] = [
  {
    id: "epic-dungeon",
    title: "エピックダンジョン 3回",
    note: "週3回まで無料入場",
    priority: 5,
    unlock: "解放：対応エピソードの進行",
  },
  {
    id: "ancient-workshop",
    title: "古代の工房 8時間",
    note: "1週間で最大8時間",
    priority: 5,
    minLevel: 41,
  },
  {
    id: "dark-trade",
    title: "闇取引を確認",
    note: "対象アイテムと交換上限は毎週更新",
    priority: 5,
    minLevel: 38,
  },
  {
    id: "clan-mission",
    title: "クラン任務を確認",
    note: "クラン加入・クランLv3以上が対象",
    priority: 4,
  },
  {
    id: "clan-guard",
    title: "クラン守護を確認",
    note: "クラン加入・クランLv3以上が対象",
    priority: 4,
  },
  {
    id: "farm-diamond",
    title: "ファームダイヤ 1,000",
    note: "通常の週間上限。恩寵がある場合は2,000",
    priority: 4,
  },
  {
    id: "gehenna-weekly",
    title: "ゲヘナ週間ポイントを確認",
    note: "現在のポイントと交換予定を確認",
    priority: 3,
    minLevel: 52,
  },
];

const LIMITED_EVENTS: LimitedEvent[] = [
  {
    id: "red-login-7",
    title: "レッドムーン前夜祭 7日間特別ログイン",
    deadline: makeJstDate(2026, 7, 12, 4, 59),
  },
  {
    id: "red-growth",
    title: "レッドムーン前夜祭 成長支援ミッション",
    deadline: makeJstDate(2026, 7, 12, 4, 59),
  },
  {
    id: "red-payback",
    title: "強化支援ペイバック",
    deadline: makeJstDate(2026, 7, 12, 4, 59),
  },
  {
    id: "daily-double",
    title: "デイリークエスト W報酬",
    deadline: makeJstDate(2026, 7, 26, 4, 59),
  },
  {
    id: "region-growth",
    title: "新地域オープン記念 成長支援",
    deadline: makeJstDate(2026, 8, 16, 4, 59),
  },
];

const EN_SPAWN_COPY: Record<string, Pick<SpawnEvent, "title" | "label">> = {
  "world-noon": { title: "World Boss", label: "Daily" },
  "gehenna-13": { title: "Gehenna ★1 & ★2", label: "Daily" },
  "gehenna-17": { title: "Gehenna ★1", label: "Daily" },
  "world-night": { title: "World Boss", label: "Daily" },
  "gehenna-21": { title: "Gehenna ★1 & ★2", label: "Daily" },
  "gehenna-sat-22": { title: "Gehenna ★3", label: "Saturday" },
};

const EN_DAILY_COPY: Record<string, Pick<Routine, "title" | "note"> & { unlock?: string }> = {
  "daily-quest": { title: "Complete 10 Daily Quests", note: "12 with Olga's Blessing", unlock: "Unlocks: Episode 1 act3-101" },
  "creation-abyss": { title: "Abyss of Creation — 1 hour", note: "Up to 1 hour per day" },
  "faded-legacy": { title: "Faded Legacy — 1 hour", note: "Up to 1 hour per day" },
  "death-recovery": { title: "Check incapacitation penalties", note: "Check on the day they occur. The first five recoveries within 24 hours are free" },
  "gold-shop": { title: "Check gold exchanges", note: "When you have spare gold" },
};

const EN_WEEKLY_COPY: Record<string, Pick<Routine, "title" | "note"> & { unlock?: string }> = {
  "epic-dungeon": { title: "Epic Dungeon — 3 runs", note: "Up to 3 free entries per week", unlock: "Unlocks through the corresponding episode" },
  "ancient-workshop": { title: "Ancient Workshop — 8 hours", note: "Up to 8 hours per week" },
  "dark-trade": { title: "Check Dark Trade", note: "Items and exchange limits update weekly" },
  "clan-mission": { title: "Check Clan Missions", note: "Requires clan membership and Clan Lv3+" },
  "clan-guard": { title: "Check Clan Guard", note: "Requires clan membership and Clan Lv3+" },
  "farm-diamond": { title: "Farm 1,000 Diamonds", note: "Standard weekly limit; 2,000 with a blessing" },
  "gehenna-weekly": { title: "Check weekly Gehenna points", note: "Review current points and planned exchanges" },
};

const EN_EVENT_COPY: Record<string, string> = {
  "red-login-7": "Red Moon Eve Festival — 7-Day Special Login",
  "red-growth": "Red Moon Eve Festival — Growth Support Missions",
  "red-payback": "Enhancement Support Payback",
  "daily-double": "Daily Quest Double Rewards",
  "region-growth": "New Region Opening — Growth Support",
};

function localizedRoutines(routines: Routine[], copy: typeof EN_DAILY_COPY, locale: Locale) {
  if (locale === "ja") return routines;
  return routines.map((routine) => ({ ...routine, ...copy[routine.id] }));
}

function makeJstDate(
  year: number,
  month: number,
  date: number,
  hour: number,
  minute: number,
) {
  return new Date(Date.UTC(year, month, date, hour - 9, minute, 0, 0));
}

function shiftedToJst(date: Date) {
  return new Date(date.getTime() + JST_OFFSET);
}

function upcomingOccurrences(events: readonly SpawnEvent[], now: Date, level: number, take = 6) {
  const items: Occurrence[] = [];
  const jst = shiftedToJst(now);

  for (let offset = 0; offset < 8; offset += 1) {
    const cursor = new Date(jst);
    cursor.setUTCDate(cursor.getUTCDate() + offset);

    for (const event of events) {
      if (event.days && !event.days.includes(cursor.getUTCDay())) continue;
      if (event.minLevel && event.minLevel > level) continue;

      const at = makeJstDate(
        cursor.getUTCFullYear(),
        cursor.getUTCMonth(),
        cursor.getUTCDate(),
        event.hour,
        event.minute,
      );
      if (at.getTime() >= now.getTime() - 30_000) items.push({ ...event, at });
    }
  }

  return items
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, take);
}

function formatCountdown(target: Date, now: Date, locale: Locale = "ja") {
  const total = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const clock = [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
  return days ? (locale === "en" ? `${days}d ${clock}` : `${days}日 ${clock}`) : clock;
}

function formatJst(date: Date, withSeconds = false, locale: Locale = "ja") {
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

function nextDailyReset(now: Date) {
  const jst = shiftedToJst(now);
  const today = makeJstDate(
    jst.getUTCFullYear(),
    jst.getUTCMonth(),
    jst.getUTCDate(),
    5,
    0,
  );
  return today > now
    ? today
    : makeJstDate(
        jst.getUTCFullYear(),
        jst.getUTCMonth(),
        jst.getUTCDate() + 1,
        5,
        0,
      );
}

function nextWeeklyReset(now: Date) {
  const jst = shiftedToJst(now);
  const daysUntilMonday = (8 - jst.getUTCDay()) % 7 || 7;
  if (jst.getUTCDay() === 1 && jst.getUTCHours() < 5) {
    return makeJstDate(
      jst.getUTCFullYear(),
      jst.getUTCMonth(),
      jst.getUTCDate(),
      5,
      0,
    );
  }
  return makeJstDate(
    jst.getUTCFullYear(),
    jst.getUTCMonth(),
    jst.getUTCDate() + daysUntilMonday,
    5,
    0,
  );
}

function safeSavedChecks(key: string) {
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "{}") as {
      cycle?: string;
      completed?: string[];
    };
  } catch {
    return {};
  }
}

function safeNotifiedOccurrences() {
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(NOTIFIED_OCCURRENCES_KEY) ?? "{}",
    ) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed)
        .filter((entry): entry is [string, number] => (
          typeof entry[0] === "string" && typeof entry[1] === "number"
        ))
        .slice(-100),
    );
  } catch {
    return {};
  }
}

function freshnessLabel(now: Date, locale: Locale = "ja") {
  const elapsedDays = Math.max(
    0,
    Math.floor((now.getTime() - new Date(VERIFIED_AT_ISO).getTime()) / 86_400_000),
  );
  if (elapsedDays === 0) return locale === "en" ? "verified today" : "本日確認";
  if (elapsedDays === 1) return locale === "en" ? "verified 1 day ago" : "1日前に確認";
  return locale === "en" ? `verified ${elapsedDays} days ago` : `${elapsedDays}日前に確認`;
}

function RoutineRow({
  task,
  done,
  locked,
  onToggle,
  locale,
}: {
  task: Routine;
  done: boolean;
  locked: boolean;
  onToggle: () => void;
  locale: Locale;
}) {
  return (
    <button
      className={`routine-row${done ? " done" : ""}${locked ? " locked" : ""}${task.custom ? " custom" : ""}`}
      type="button"
      disabled={locked}
      aria-pressed={done}
      onClick={onToggle}
    >
      <span className="check-box" aria-hidden="true">{done ? "✓" : ""}</span>
      <span className="routine-copy">
        <strong>{task.title}</strong>
        <small>{task.note}</small>
      </span>
      <span className="routine-meta">
        {task.custom
          ? (locale === "en" ? "Mine" : "自分")
          : locked
            ? `Lv${task.minLevel}`
            : task.unlock ?? (task.minLevel ? `Lv${task.minLevel}+` : "")}
      </span>
    </button>
  );
}

export default function HomePage({ locale = "ja" }: { locale?: Locale }) {
  const en = locale === "en";
  const spawnEvents = useMemo(() => locale === "en"
    ? SPAWN_EVENTS.map((event) => ({ ...event, ...EN_SPAWN_COPY[event.id] }))
    : SPAWN_EVENTS, [locale]);
  const dailyTasks = useMemo(() => localizedRoutines(DAILY_TASKS, EN_DAILY_COPY, locale), [locale]);
  const weeklyTasks = useMemo(() => localizedRoutines(WEEKLY_TASKS, EN_WEEKLY_COPY, locale), [locale]);
  const limitedEvents = useMemo(() => locale === "en"
    ? LIMITED_EVENTS.map((event) => ({ ...event, title: EN_EVENT_COPY[event.id] }))
    : LIMITED_EVENTS, [locale]);
  const [now, setNow] = useState(() => new Date());
  const dailyCycle = dailyCycleKey(now);
  const weeklyCycle = weeklyCycleKey(now);
  const [activeDailyCycle, setActiveDailyCycle] = useState(dailyCycle);
  const [activeWeeklyCycle, setActiveWeeklyCycle] = useState(weeklyCycle);
  const [level, setLevel] = useState<number | null>(null);
  const [dailyDone, setDailyDone] = useState<string[]>([]);
  const [weeklyDone, setWeeklyDone] = useState<string[]>([]);
  const [customRoutines, setCustomRoutines] = useState<CustomRoutine[]>([]);
  const [routinePreferences, setRoutinePreferences] = useState<RoutinePreferences>(
    DEFAULT_ROUTINE_PREFERENCES,
  );
  const [favoriteSpawnIds, setFavoriteSpawnIds] = useState<string[]>([]);
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >("unsupported");
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationMessageIsError, setNotificationMessageIsError] = useState(false);
  const [dataMessage, setDataMessage] = useState("");
  const [dataMessageIsError, setDataMessageIsError] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsReturnFocusRef = useRef<HTMLButtonElement | null>(null);
  const settingsFallbackFocusRef = useRef<HTMLButtonElement | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const visibleDaily = visibleRoutines(
    dailyTasks,
    customRoutines,
    routinePreferences,
    "daily",
  ) as Routine[];
  const visibleWeekly = visibleRoutines(
    weeklyTasks,
    customRoutines,
    routinePreferences,
    "weekly",
  ) as Routine[];
  const unlockedDaily = visibleDaily.filter(
    (task) => level === null || !task.minLevel || task.minLevel <= level,
  );
  const unlockedWeekly = visibleWeekly.filter(
    (task) => level === null || !task.minLevel || task.minLevel <= level,
  );
  const dailyCount = unlockedDaily.filter((task) => dailyDone.includes(task.id)).length;
  const weeklyCount = unlockedWeekly.filter((task) => weeklyDone.includes(task.id)).length;
  const effectiveLevel = level ?? 200;
  const upcoming = useMemo(
    () => upcomingOccurrences(spawnEvents, now, effectiveLevel),
    [now, effectiveLevel, spawnEvents],
  );
  const next = upcoming[0];
  const todayTasks = selectTodayTasks(
    visibleDaily,
    visibleWeekly,
    dailyDone,
    weeklyDone,
    effectiveLevel,
  );
  const visibleDefaultCount = [...dailyTasks, ...weeklyTasks].filter(
    (routine) => !routinePreferences.hiddenDefaultIds.includes(routine.id),
  ).length;
  const activeEvents = limitedEvents.filter((event) => event.deadline > now).sort(
    (a, b) => a.deadline.getTime() - b.deadline.getTime(),
  );
  const informationAgeDays = Math.max(
    0,
    Math.floor((now.getTime() - new Date(VERIFIED_AT_ISO).getTime()) / 86_400_000),
  );
  const informationIsStale = informationAgeDays >= STALE_AFTER_DAYS;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      const savedLevelValue = window.localStorage.getItem("vampir-level");
      const savedLevel = Number(savedLevelValue);
      if (savedLevelValue && savedLevel >= 1 && savedLevel <= 200) {
        setLevel(savedLevel);
      }

      const daily = safeSavedChecks("vampir-daily-checks");
      const weekly = safeSavedChecks("vampir-weekly-checks");
      if (daily.cycle === dailyCycle && Array.isArray(daily.completed)) {
        setDailyDone(daily.completed);
      }
      if (weekly.cycle === weeklyCycle && Array.isArray(weekly.completed)) {
        setWeeklyDone(weekly.completed);
      }
      setCustomRoutines(
        parseCustomRoutines(window.localStorage.getItem(CUSTOM_ROUTINES_KEY)),
      );
      setRoutinePreferences(keepKnownDefaultPreferences(
        parseRoutinePreferences(window.localStorage.getItem(ROUTINE_PREFERENCES_KEY)),
        [...dailyTasks, ...weeklyTasks].map((routine) => routine.id),
      ));
      setFavoriteSpawnIds(parseFavoriteSpawnIds(
        window.localStorage.getItem(FAVORITE_SPAWNS_KEY),
        spawnEvents.map((event) => event.id),
      ));
      setNotificationSettings(parseNotificationSettings(
        window.localStorage.getItem(NOTIFICATION_SETTINGS_KEY),
      ));
      setNotificationPermission(
        "Notification" in window ? window.Notification.permission : "unsupported",
      );
      setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(hydrationTimer);
  }, [dailyCycle, dailyTasks, spawnEvents, weeklyCycle, weeklyTasks]);

  useEffect(() => {
    if (!hydrated) return;
    const resetTimer = window.setTimeout(() => {
      const { dailyExpired, weeklyExpired } = cycleResetState(
        activeDailyCycle,
        activeWeeklyCycle,
        dailyCycle,
        weeklyCycle,
      );
      if (dailyExpired) {
        setDailyDone([]);
        setActiveDailyCycle(dailyCycle);
      }
      if (weeklyExpired) {
        setWeeklyDone([]);
        setActiveWeeklyCycle(weeklyCycle);
      }
    }, 0);
    return () => window.clearTimeout(resetTimer);
  }, [activeDailyCycle, activeWeeklyCycle, dailyCycle, weeklyCycle, hydrated]);

  useEffect(() => {
    if (!hydrated || activeDailyCycle !== dailyCycle) return;
    window.localStorage.setItem(
      "vampir-daily-checks",
      JSON.stringify({ cycle: activeDailyCycle, completed: dailyDone }),
    );
  }, [activeDailyCycle, dailyCycle, dailyDone, hydrated]);

  useEffect(() => {
    if (!hydrated || activeWeeklyCycle !== weeklyCycle) return;
    window.localStorage.setItem(
      "vampir-weekly-checks",
      JSON.stringify({ cycle: activeWeeklyCycle, completed: weeklyDone }),
    );
  }, [activeWeeklyCycle, hydrated, weeklyCycle, weeklyDone]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(CUSTOM_ROUTINES_KEY, JSON.stringify(customRoutines));
  }, [customRoutines, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      ROUTINE_PREFERENCES_KEY,
      JSON.stringify(routinePreferences),
    );
  }, [hydrated, routinePreferences]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(FAVORITE_SPAWNS_KEY, JSON.stringify(favoriteSpawnIds));
  }, [favoriteSpawnIds, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      NOTIFICATION_SETTINGS_KEY,
      JSON.stringify(notificationSettings),
    );
  }, [hydrated, notificationSettings]);

  useEffect(() => {
    const refreshClock = () => {
      setNow(new Date());
      if ("Notification" in window) {
        setNotificationPermission(window.Notification.permission);
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refreshClock();
    };
    window.addEventListener("focus", refreshClock);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", refreshClock);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setIsStandalone(true);
    };
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const handleStorage = (event: StorageEvent) => {
      if (!event.key) return;
      if (event.key === "vampir-level") {
        const savedLevel = Number(event.newValue);
        setLevel(event.newValue && savedLevel >= 1 && savedLevel <= 200 ? savedLevel : null);
      } else if (event.key === "vampir-daily-checks") {
        const daily = safeSavedChecks("vampir-daily-checks");
        const nextCompleted = daily.cycle === dailyCycle && Array.isArray(daily.completed) ? daily.completed : [];
        setDailyDone((current) => (
          JSON.stringify(current) === JSON.stringify(nextCompleted) ? current : nextCompleted
        ));
      } else if (event.key === "vampir-weekly-checks") {
        const weekly = safeSavedChecks("vampir-weekly-checks");
        const nextCompleted = weekly.cycle === weeklyCycle && Array.isArray(weekly.completed) ? weekly.completed : [];
        setWeeklyDone((current) => (
          JSON.stringify(current) === JSON.stringify(nextCompleted) ? current : nextCompleted
        ));
      } else if (event.key === CUSTOM_ROUTINES_KEY) {
        const nextRoutines = parseCustomRoutines(event.newValue);
        setCustomRoutines((current) => (
          JSON.stringify(current) === JSON.stringify(nextRoutines) ? current : nextRoutines
        ));
      } else if (event.key === ROUTINE_PREFERENCES_KEY) {
        const nextPreferences = keepKnownDefaultPreferences(
          parseRoutinePreferences(event.newValue),
          [...dailyTasks, ...weeklyTasks].map((routine) => routine.id),
        );
        setRoutinePreferences((current) => (
          JSON.stringify(current) === JSON.stringify(nextPreferences) ? current : nextPreferences
        ));
      } else if (event.key === FAVORITE_SPAWNS_KEY) {
        const nextFavorites = parseFavoriteSpawnIds(
          event.newValue,
          spawnEvents.map((spawn) => spawn.id),
        );
        setFavoriteSpawnIds((current) => (
          JSON.stringify(current) === JSON.stringify(nextFavorites) ? current : nextFavorites
        ));
      } else if (event.key === NOTIFICATION_SETTINGS_KEY) {
        const nextSettings = parseNotificationSettings(event.newValue);
        setNotificationSettings((current) => (
          JSON.stringify(current) === JSON.stringify(nextSettings) ? current : nextSettings
        ));
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [dailyCycle, dailyTasks, hydrated, spawnEvents, weeklyCycle, weeklyTasks]);

  useEffect(() => {
    if (
      !hydrated
      || !notificationSettings.enabled
      || notificationPermission !== "granted"
      || favoriteSpawnIds.length === 0
    ) return;

    const leadMilliseconds = notificationSettings.leadMinutes * 60_000;
    const candidates = upcomingOccurrences(spawnEvents, now, effectiveLevel, 20).filter((event) => {
      const untilStart = event.at.getTime() - now.getTime();
      return favoriteSpawnIds.includes(event.id)
        && untilStart > 0
        && untilStart <= leadMilliseconds;
    });
    if (!candidates.length) return;

    const recentCutoff = now.getTime() - 2 * 86_400_000;

    for (const event of candidates) {
      const occurrenceKey = `${event.id}:${event.at.toISOString()}`;
      const sendOnce = async () => {
        const notified = safeNotifiedOccurrences();
        if (notified[occurrenceKey]) return;
        const pruned = Object.fromEntries(
          Object.entries(notified).filter(([, timestamp]) => timestamp >= recentCutoff),
        );
        pruned[occurrenceKey] = Date.now();
        window.localStorage.setItem(NOTIFIED_OCCURRENCES_KEY, JSON.stringify(pruned));

        const registration = await navigator.serviceWorker.ready;
        const remainingMinutes = Math.max(
          1,
          Math.ceil((event.at.getTime() - Date.now()) / 60_000),
        );
        await registration.showNotification(
          en ? `${event.title} starts in about ${remainingMinutes} minutes` : `${event.title}まであと約${remainingMinutes}分`,
          {
            body: en
              ? `Scheduled for ${formatJst(event.at, false, locale)} JST. Always follow the in-game schedule.`
              : `${formatJst(event.at)} JST開始予定。ゲーム内時刻表を優先してください。`,
            icon: "/icon-192.png",
            tag: occurrenceKey,
            data: { url: en ? "/en#schedule" : "/#schedule" },
          },
        );
      };

      if ("locks" in navigator) {
        void navigator.locks
          .request(`vampir-notification:${occurrenceKey}`, sendOnce)
          .catch(() => undefined);
      } else {
        void sendOnce().catch(() => undefined);
      }
    }
  }, [
    effectiveLevel,
    favoriteSpawnIds,
    hydrated,
    notificationPermission,
    notificationSettings,
    now,
    en,
    locale,
    spawnEvents,
  ]);

  function toggle(
    id: string,
    setter: Dispatch<SetStateAction<string[]>>,
  ) {
    setter((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function saveLevel(value: number) {
    setLevel(value);
    window.localStorage.setItem("vampir-level", String(value));
  }

  function clearLevel() {
    setLevel(null);
    window.localStorage.removeItem("vampir-level");
  }

  function toggleDefaultRoutine(id: string) {
    setRoutinePreferences((current) => ({
      version: 1,
      hiddenDefaultIds: current.hiddenDefaultIds.includes(id)
        ? current.hiddenDefaultIds.filter((item) => item !== id)
        : [...current.hiddenDefaultIds, id],
    }));
  }

  function addCustomRoutine(input: CustomRoutineInput) {
    if (customRoutines.length >= MAX_CUSTOM_ROUTINES) return false;
    const uniquePart = window.crypto?.randomUUID?.()
      ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    const routine = makeCustomRoutine(`custom:${uniquePart}`, input);
    if (!routine) return false;
    setCustomRoutines((current) => [...current, routine]);
    return true;
  }

  function updateCustomRoutine(id: string, input: CustomRoutineInput) {
    const existing = customRoutines.find((routine) => routine.id === id);
    if (existing && existing.frequency !== input.frequency) {
      setDailyDone((current) => current.filter((item) => item !== id));
      setWeeklyDone((current) => current.filter((item) => item !== id));
    }
    setCustomRoutines((current) => replaceCustomRoutine(current, id, input));
  }

  function deleteCustomRoutine(id: string) {
    setCustomRoutines((current) => current.filter((routine) => routine.id !== id));
    setDailyDone((current) => current.filter((item) => item !== id));
    setWeeklyDone((current) => current.filter((item) => item !== id));
  }

  function resetChecks() {
    setDailyDone([]);
    setWeeklyDone([]);
    setActiveDailyCycle(dailyCycle);
    setActiveWeeklyCycle(weeklyCycle);
  }

  function deleteAllCustomRoutines() {
    const customIds = new Set(customRoutines.map((routine) => routine.id));
    setCustomRoutines([]);
    setDailyDone((current) => current.filter((id) => !customIds.has(id)));
    setWeeklyDone((current) => current.filter((id) => !customIds.has(id)));
  }

  function toggleFavoriteSpawn(id: string) {
    setFavoriteSpawnIds((current) => (
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    ));
  }

  function updateNotificationSettings(nextSettings: NotificationSettings) {
    setNotificationSettings(nextSettings);
    setNotificationMessage("");
    setNotificationMessageIsError(false);
  }

  async function requestNotificationPermission() {
    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      setNotificationMessage(en ? "This browser does not support notifications." : "このブラウザは通知に対応していません。");
      setNotificationMessageIsError(true);
      return;
    }
    const permission = await window.Notification.requestPermission();
    setNotificationPermission(permission);
    setNotificationSettings((current) => ({
      ...current,
      enabled: permission === "granted",
    }));
    setNotificationMessage(
      permission === "granted"
        ? (en ? "Notifications are on. Favorite spawns will be announced while the site is open." : "通知を有効にしました。お気に入りの予定をサイト表示中にお知らせします。")
        : permission === "denied"
          ? (en ? "Notifications are blocked. You can change this in your browser's site settings." : "通知が拒否されています。ブラウザのサイト設定から変更できます。")
          : (en ? "Notifications were not enabled." : "通知は有効になりませんでした。"),
    );
    setNotificationMessageIsError(permission !== "granted");
  }

  async function showTestNotification() {
    if (notificationPermission !== "granted") return;
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(en ? "VAMPIR Daily Navigator: Test notification" : "VAMPIR 日課ナビ：テスト通知", {
        body: en ? "Notifications are working. Always follow the in-game schedule for actual spawn times." : "通知は正常です。実際の出現時刻はゲーム内時刻表を優先してください。",
        icon: "/icon-192.png",
        tag: "vampir-test-notification",
        data: { url: en ? "/en#schedule" : "/#schedule" },
      });
      setNotificationMessage(en ? "Test notification sent." : "テスト通知を送信しました。");
      setNotificationMessageIsError(false);
    } catch {
      setNotificationMessage(en ? "The test notification could not be shown. Check your browser notification settings." : "テスト通知を表示できませんでした。ブラウザの通知設定を確認してください。");
      setNotificationMessageIsError(true);
    }
  }

  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setNotificationMessage(en ? "Started adding the site to your Home Screen." : "ホーム画面への追加を開始しました。");
      setNotificationMessageIsError(false);
      setInstallPrompt(null);
    }
  }

  function exportPersonalData() {
    const backup = createPersonalBackup({
      level,
      dailyChecks: { cycle: activeDailyCycle, completed: dailyDone },
      weeklyChecks: { cycle: activeWeeklyCycle, completed: weeklyDone },
      customRoutines,
      routinePreferences,
      favoriteSpawnIds,
      notificationSettings,
    });
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `vampir-support-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setDataMessage(en ? "Backup exported." : "バックアップを書き出しました。");
    setDataMessageIsError(false);
  }

  async function importPersonalData(file: File) {
    try {
      const backup = parsePersonalBackup(await file.text());
      if (!backup) throw new Error("invalid backup");

      const { data } = backup;
      const normalizedDailyChecks = data.dailyChecks.cycle === dailyCycle
        ? data.dailyChecks
        : { cycle: dailyCycle, completed: [] };
      const normalizedWeeklyChecks = data.weeklyChecks.cycle === weeklyCycle
        ? data.weeklyChecks
        : { cycle: weeklyCycle, completed: [] };
      const nextValues = new Map<string, string | null>([
        ["vampir-level", data.level === null ? null : String(data.level)],
        ["vampir-daily-checks", JSON.stringify(normalizedDailyChecks)],
        ["vampir-weekly-checks", JSON.stringify(normalizedWeeklyChecks)],
        [CUSTOM_ROUTINES_KEY, JSON.stringify(data.customRoutines)],
        [ROUTINE_PREFERENCES_KEY, JSON.stringify(data.routinePreferences)],
        [FAVORITE_SPAWNS_KEY, JSON.stringify(data.favoriteSpawnIds)],
        [NOTIFICATION_SETTINGS_KEY, JSON.stringify(data.notificationSettings)],
      ]);
      replaceStorageValues(window.localStorage, nextValues);

      setLevel(data.level);
      setDailyDone(normalizedDailyChecks.completed);
      setWeeklyDone(normalizedWeeklyChecks.completed);
      setActiveDailyCycle(dailyCycle);
      setActiveWeeklyCycle(weeklyCycle);
      setCustomRoutines(data.customRoutines);
      setRoutinePreferences(keepKnownDefaultPreferences(
        data.routinePreferences,
        [...dailyTasks, ...weeklyTasks].map((routine) => routine.id),
      ));
      setFavoriteSpawnIds(parseFavoriteSpawnIds(
        JSON.stringify(data.favoriteSpawnIds),
        spawnEvents.map((event) => event.id),
      ));
      setNotificationSettings(data.notificationSettings);
      setDataMessage(en ? "Backup restored. Checks from expired cycles were reset for the current cycle." : "バックアップを復元しました。期限切れのチェックは現在の周期に合わせて未完了に戻しました。");
      setDataMessageIsError(false);
    } catch {
      setDataMessage(en ? "This file cannot be restored. Choose a backup exported by VAMPIR Daily Navigator." : "このファイルは復元できません。VAMPIR 日課ナビのバックアップを選んでください。");
      setDataMessageIsError(true);
    }
  }

  const openSettings = useCallback((event: ReactMouseEvent<HTMLButtonElement>) => {
    settingsReturnFocusRef.current = event.currentTarget;
    setSettingsOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
    window.setTimeout(() => {
      const requestedTarget = settingsReturnFocusRef.current;
      const focusTarget = requestedTarget?.isConnected
        ? requestedTarget
        : settingsFallbackFocusRef.current;
      focusTarget?.focus();
    }, 0);
  }, []);

  return (
    <main className="site-shell">
      <header className="site-header">
        <a className="brand" href="#today" aria-label={en ? "VAMPIR Daily Navigator home" : "VAMPIR 日課ナビ ホーム"}>
          <span className="brand-mark" aria-hidden="true">V</span>
          <span><strong>VAMPIR</strong><small>{en ? "Daily Navigator" : "日課ナビ"}</small></span>
        </a>
        <div className="header-tools">
          <a
            className={`verified${informationIsStale ? " stale" : ""}`}
            href="#info"
            title={en ? "Last verified July 30, 2026. Follow the in-game display and official notices." : `最終確認 ${VERIFIED_AT}。ゲーム内表示と公式告知を優先してください。`}
          >
            {informationIsStale ? (en ? "Needs review" : "要再確認") : freshnessLabel(now, locale)}
          </a>
          <LanguageSwitch locale={locale} page="home" />
          <ShareMenu locale={locale} />
          <button
            ref={settingsFallbackFocusRef}
            className="settings-trigger"
            type="button"
            onClick={openSettings}
            aria-label={en ? "Open display and checklist settings" : "表示とチェックリスト設定を開く"}
          >
            <span>{level ? `Lv${level}` : (en ? "Lv not set" : "Lv未設定")}</span>
            <small>{en ? "Settings" : "設定"}</small>
          </button>
        </div>
      </header>

      <div className="content">
        <section className="today-section" id="today" aria-labelledby="today-title">
          <div className="today-heading">
            <div>
              <span className="eyebrow">TODAY</span>
              <h1 id="today-title">{en ? "What to do next today" : "今日、次にやること"}</h1>
            </div>
            <time dateTime={now.toISOString()}>{formatJst(now, true, locale)} JST</time>
          </div>

          <div className="today-grid">
            <article className="next-card panel">
              <div className="card-label">{en ? "NEXT SPAWN" : "次の出現"}</div>
              {next ? (
                <>
                  <div className="next-title-row">
                    <div>
                      <span>{next.label}</span>
                      <h2>{next.title}</h2>
                    </div>
                    <div className="next-actions">
                      <strong>{String(next.hour).padStart(2, "0")}:{String(next.minute).padStart(2, "0")}</strong>
                      <button
                        className={`favorite-button${favoriteSpawnIds.includes(next.id) ? " active" : ""}`}
                        type="button"
                        aria-pressed={favoriteSpawnIds.includes(next.id)}
                        aria-label={en ? `${favoriteSpawnIds.includes(next.id) ? "Remove" : "Add"} ${next.title} at ${String(next.hour).padStart(2, "0")}:${String(next.minute).padStart(2, "0")} ${favoriteSpawnIds.includes(next.id) ? "from" : "to"} favorites` : `${next.title} ${String(next.hour).padStart(2, "0")}:${String(next.minute).padStart(2, "0")}をお気に入り${favoriteSpawnIds.includes(next.id) ? "から外す" : "に追加"}`}
                        onClick={() => toggleFavoriteSpawn(next.id)}
                      >
                        <span aria-hidden="true">{favoriteSpawnIds.includes(next.id) ? "★" : "☆"}</span>
                        {favoriteSpawnIds.includes(next.id) ? (en ? "Alert on" : "通知対象") : (en ? "Favorite" : "お気に入り")}
                      </button>
                    </div>
                  </div>
                  <div className="countdown" aria-label={en ? `Starts in ${formatCountdown(next.at, now, locale)}` : `開始まで ${formatCountdown(next.at, now)}`}>{formatCountdown(next.at, now, locale)}</div>
                  <p>{en ? "Always follow the latest in-game schedule for the start time." : "開始時刻はゲーム内の最新時刻表を優先してください。"}</p>
                </>
              ) : null}
            </article>

            <article className="quick-card panel">
              <div className="quick-head">
                <div>
                  <span className="card-label">{en ? "UP NEXT" : "次にやること"}</span>
                  <h2>{en ? "3 unfinished tasks" : "未完了の3件"}</h2>
                </div>
                <strong>{dailyCount}/{unlockedDaily.length}</strong>
              </div>
              <div className="quick-list">
                {todayTasks.length ? todayTasks.map((task) => {
                  const isDaily = visibleDaily.some((item) => item.id === task.id);
                  return (
                    <button
                      type="button"
                      key={task.id}
                      onClick={() => toggle(task.id, isDaily ? setDailyDone : setWeeklyDone)}
                    >
                      <span className="check-box" aria-hidden="true" />
                      <span>
                        <strong>{task.title}</strong>
                        <small>{isDaily ? (en ? "Today" : "今日") : (en ? "This week" : "今週")}{task.custom ? (en ? " · Mine" : "・自分") : ""}</small>
                      </span>
                    </button>
                  );
                }) : (
                  <p className="all-done">{en ? "All visible tasks are complete." : "表示中の項目は完了です。"}</p>
                )}
              </div>
              <a href="#checklists">{en ? "View all checklist items" : "すべてのチェックを見る"}</a>
            </article>
          </div>

          <div className="reset-strip">
            <span>{en ? "Daily reset at 05:00 in" : "日次05:00まで"} <strong>{formatCountdown(nextDailyReset(now), now, locale)}</strong></span>
            <span>{en ? "Weekly reset Monday at 05:00 in" : "週次・月曜05:00まで"} <strong>{formatCountdown(nextWeeklyReset(now), now, locale)}</strong></span>
          </div>

          <div className="personalization-strip">
            <div>
              <span>{en ? "PERSONALIZED VIEW" : "あなた向け表示"}</span>
              <strong>
                {level
                  ? (en ? `Filtering suggestions, progress, and schedules for Lv${level}` : `Lv${level}で候補・集計・予定を絞り込み中`)
                  : (en ? "No level set — showing all content" : "レベル未設定のため、すべてのコンテンツを表示中")}
              </strong>
              <small>
                {en ? `Showing ${visibleDefaultCount} default tasks` : `既定 ${visibleDefaultCount}件を表示`}
                {routinePreferences.hiddenDefaultIds.length
                  ? (en ? ` · ${routinePreferences.hiddenDefaultIds.length} hidden` : `・${routinePreferences.hiddenDefaultIds.length}件を非表示`)
                  : ""}
                {customRoutines.length ? (en ? ` · ${customRoutines.length} personal tasks` : `・自分の項目 ${customRoutines.length}件`) : ""}
              </small>
            </div>
            <button type="button" onClick={openSettings}>
              {en ? "Edit display and lists" : "表示とリストを編集"}
            </button>
          </div>
        </section>

        <section className="check-section section-block" id="checklists" aria-labelledby="check-title">
          <div className="section-heading">
            <div>
              <span className="eyebrow">CHECK</span>
              <h2 id="check-title">{en ? "Daily and weekly routines" : "日課・週課"}</h2>
            </div>
            <div className="section-heading-actions">
              <p>{en ? "Checks are saved on this device and refresh automatically at reset time." : "チェックはこの端末に保存され、リセット時刻に自動更新されます。"}</p>
              <button type="button" onClick={openSettings}>{en ? "Edit lists" : "リストを編集"}</button>
            </div>
          </div>

          <div className="check-grid">
            <details className="routine-panel panel" open>
              <summary>
                <span><small>DAILY</small><strong>{en ? "Daily tasks" : "毎日やること"}</strong></span>
                <b>{dailyCount}/{unlockedDaily.length}</b>
              </summary>
              <div className="routine-list">
                {visibleDaily.map((task) => {
                  const locked = Boolean(level !== null && task.minLevel && task.minLevel > level);
                  return (
                    <RoutineRow
                      key={task.id}
                      task={task}
                      done={dailyDone.includes(task.id)}
                      locked={locked}
                      onToggle={() => toggle(task.id, setDailyDone)}
                      locale={locale}
                    />
                  );
                })}
                {!visibleDaily.length ? (
                  <button className="empty-routine-action" type="button" onClick={openSettings}>
                    {en ? "Add or restore daily tasks" : "毎日の項目を追加・再表示"}
                  </button>
                ) : null}
              </div>
            </details>

            <details className="routine-panel panel">
              <summary>
                <span><small>WEEKLY</small><strong>{en ? "Weekly tasks" : "毎週やること"}</strong></span>
                <b>{weeklyCount}/{unlockedWeekly.length}</b>
              </summary>
              <div className="routine-list">
                {visibleWeekly.map((task) => {
                  const locked = Boolean(level !== null && task.minLevel && task.minLevel > level);
                  return (
                    <RoutineRow
                      key={task.id}
                      task={task}
                      done={weeklyDone.includes(task.id)}
                      locked={locked}
                      onToggle={() => toggle(task.id, setWeeklyDone)}
                      locale={locale}
                    />
                  );
                })}
                {!visibleWeekly.length ? (
                  <button className="empty-routine-action" type="button" onClick={openSettings}>
                    {en ? "Add or restore weekly tasks" : "毎週の項目を追加・再表示"}
                  </button>
                ) : null}
              </div>
            </details>
          </div>
        </section>

        <section className="schedule-section section-block" id="schedule" aria-labelledby="schedule-title">
          <div className="section-heading">
            <div>
              <span className="eyebrow">SCHEDULE</span>
              <h2 id="schedule-title">{en ? "Upcoming spawns" : "次の出現予定"}</h2>
            </div>
            <p>
              {level
                ? (en ? `Showing JST schedules available at Lv${level}.` : `Lv${level}で参加できる予定をJSTで表示しています。`)
                : (en ? "No level set — showing all schedules in JST." : "レベル未設定のため、すべての予定をJSTで表示しています。")}
              {favoriteSpawnIds.length ? (en ? ` ${favoriteSpawnIds.length} favorite${favoriteSpawnIds.length === 1 ? "" : "s"}.` : ` お気に入り${favoriteSpawnIds.length}件。`) : ""}
            </p>
          </div>
          <div className={`information-status${informationIsStale ? " stale" : ""}`}>
            <div>
              <strong>{informationIsStale ? (en ? "Published information may be outdated" : "掲載情報が古い可能性があります") : (en ? `Information ${freshnessLabel(now, locale)}` : `掲載情報は${freshnessLabel(now)}です`)}</strong>
              <small>{en ? "Last verified July 30, 2026. Follow the in-game schedule if times change." : `最終確認 ${VERIFIED_AT}・時刻変更時はゲーム内時刻表を正本とします。`}</small>
            </div>
            <a href="#info">{en ? "View sources" : "情報源を見る"}</a>
          </div>
          <div className="schedule-list panel">
            {upcoming.map((event) => (
              <article className="schedule-row" key={`${event.id}-${event.at.toISOString()}`}>
                <time dateTime={event.at.toISOString()}>{formatJst(event.at, false, locale)}</time>
                <div><strong>{event.title}</strong><small>{event.label}{event.minLevel ? `${en ? " · " : "・"}Lv${event.minLevel}+` : ""}</small></div>
                <b>{formatCountdown(event.at, now, locale)}</b>
                <button
                  className={`schedule-favorite${favoriteSpawnIds.includes(event.id) ? " active" : ""}`}
                  type="button"
                  aria-pressed={favoriteSpawnIds.includes(event.id)}
                  aria-label={en ? `${favoriteSpawnIds.includes(event.id) ? "Remove" : "Add"} ${event.title} at ${formatJst(event.at, false, locale)} ${favoriteSpawnIds.includes(event.id) ? "from" : "to"} favorites` : `${event.title} ${formatJst(event.at)}をお気に入り${favoriteSpawnIds.includes(event.id) ? "から外す" : "に追加"}`}
                  onClick={() => toggleFavoriteSpawn(event.id)}
                >
                  <span aria-hidden="true">{favoriteSpawnIds.includes(event.id) ? "★" : "☆"}</span>
                </button>
              </article>
            ))}
          </div>
          <p className="schedule-note">{en ? "Times may change after events such as territory battles. Always treat the in-game schedule as authoritative." : "争奪戦後などに時刻が変わる場合があります。ゲーム内時刻表を正本として確認してください。"}</p>
        </section>

        {activeEvents.length ? (
          <section className="event-section section-block" id="events" aria-labelledby="event-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">DEADLINES</span>
                <h2 id="event-title">{en ? "Events ending soon" : "期限が近いイベント"}</h2>
              </div>
              <p>{en ? "Only event names and end times are listed." : "名称と終了時刻だけを掲載しています。"}</p>
            </div>
            <div className="event-list panel">
              {activeEvents.map((event) => (
                <article className="event-row" key={event.id}>
                  <div><strong>{event.title}</strong><small>{en ? "Ends" : "終了"} {formatJst(event.deadline, false, locale)} JST</small></div>
                  <b>{en ? "In" : "あと"} {formatCountdown(event.deadline, now, locale)}</b>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <footer className="site-footer" id="info">
          <div className="site-footer-about">
            <strong>{en ? "VAMPIR Daily Navigator" : "VAMPIR 日課ナビ"}</strong>
            <p>{en ? "This is an unofficial tool, and its English labels are unofficial translations. Follow in-game information and official notices for schedules and event periods." : "非公式ツールです。時刻・イベント期間はゲーム内表示と公式告知を優先してください。"}</p>
            <section className="support-panel" aria-labelledby="support-title">
              <div>
                <strong id="support-title">{en ? "Support this tool" : "このツールを応援する"}</strong>
                <p>{en ? "Support for ongoing verification and updates is optional." : "継続的な確認・更新への支援は任意です。"}</p>
              </div>
              <div className="support-links">
                <a
                  className="support-banner support-banner-kofi"
                  href={SUPPORT_URLS.kofi}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={en ? "Support on Ko-fi (external site)" : "Ko-fiで応援する（外部サイト）"}
                >
                  <span aria-hidden="true">☕</span>
                  <span><strong>Ko-fi</strong><small>{en ? "Support on external site" : "外部サイトで応援"}</small></span>
                </a>
                <a
                  className="support-banner support-banner-ofuse"
                  href={SUPPORT_URLS.ofuse}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={en ? "Support on OFUSE (external site)" : "OFUSEで応援する（外部サイト）"}
                >
                  <span aria-hidden="true">♥</span>
                  <span><strong>OFUSE</strong><small>{en ? "Support on external site" : "外部サイトで応援"}</small></span>
                </a>
              </div>
              <small className="support-note">{en ? "All features remain free whether or not you choose to support us." : "支援の有無にかかわらず、すべての機能を無料で利用できます。"}</small>
            </section>
            <nav className="site-footer-meta" aria-label={en ? "Site information" : "運営情報"}>
              <a href={en ? "/en/policy" : "/policy"}>{en ? "Operations and Privacy Policy" : "運営・プライバシー方針"}</a>
              <a
                href="https://github.com/Ranats/vampir-support-hub/issues"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={en ? "Open GitHub Issues for bugs and requests (new tab)" : "不具合・要望をGitHub Issuesで開く（新しいタブ）"}
              >
                {en ? "Bugs and requests" : "不具合・要望"}
              </a>
              <a
                href={DEVELOPER_X_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={en ? "Open developer X account @Kokonoe_variant in a new tab" : "開発者X @Kokonoe_variantを新しいタブで開く"}
              >
                {en ? "Developer on X: @Kokonoe_variant" : "開発者X：@Kokonoe_variant"}
              </a>
            </nav>
          </div>
          <details>
            <summary>{en ? "Sources and verification date" : "情報源と確認日"}</summary>
            <p>
              {en ? `Last verified: July 30, 2026 (${freshnessLabel(now, locale)})` : `最終確認：${VERIFIED_AT}（${freshnessLabel(now)}）`}
              {informationIsStale ? (en ? " · A new review is needed." : "・現在は再確認が必要です。") : ""}
            </p>
            <nav aria-label={en ? "Sources" : "情報源"}>
              <a href={SOURCE_URLS.official} target="_blank" rel="noreferrer">{en ? "Official VAMPIR site (Japanese)" : "VAMPIR公式"}</a>
              <a href={SOURCE_URLS.routines} target="_blank" rel="noreferrer">{en ? "Daily and weekly routines (Japanese)" : "日課・週課"}</a>
              <a href={SOURCE_URLS.gehenna} target="_blank" rel="noreferrer">{en ? "Gehenna schedule (Japanese)" : "ゲヘナ時刻"}</a>
              <a href={SOURCE_URLS.events} target="_blank" rel="noreferrer">{en ? "Event list (Japanese)" : "イベント一覧"}</a>
            </nav>
          </details>
        </footer>
      </div>

      {settingsOpen ? (
        <SettingsSheet
          locale={locale}
          level={level}
          dailyDefaults={dailyTasks}
          weeklyDefaults={weeklyTasks}
          hiddenDefaultIds={routinePreferences.hiddenDefaultIds}
          customRoutines={customRoutines}
          favoriteSpawnCount={favoriteSpawnIds.length}
          notificationPermission={notificationPermission}
          notificationSettings={notificationSettings}
          canInstall={Boolean(installPrompt)}
          isStandalone={isStandalone}
          notificationMessage={notificationMessage}
          notificationMessageIsError={notificationMessageIsError}
          dataMessage={dataMessage}
          dataMessageIsError={dataMessageIsError}
          onClose={closeSettings}
          onSaveLevel={saveLevel}
          onClearLevel={clearLevel}
          onToggleDefault={toggleDefaultRoutine}
          onRestoreDefaults={() => setRoutinePreferences(DEFAULT_ROUTINE_PREFERENCES)}
          onAddCustom={addCustomRoutine}
          onUpdateCustom={updateCustomRoutine}
          onDeleteCustom={deleteCustomRoutine}
          onResetChecks={resetChecks}
          onDeleteAllCustom={deleteAllCustomRoutines}
          onUpdateNotificationSettings={updateNotificationSettings}
          onRequestNotificationPermission={requestNotificationPermission}
          onTestNotification={showTestNotification}
          onInstall={installApp}
          onExportData={exportPersonalData}
          onImportData={importPersonalData}
        />
      ) : null}

      <nav className="mobile-nav" aria-label={en ? "Mobile navigation" : "モバイルナビゲーション"}>
        <a href="#today">{en ? "Today" : "今日"}</a>
        <a href="#checklists">{en ? "Check" : "チェック"}</a>
        <a href="#schedule">{en ? "Times" : "時刻"}</a>
        <a href="#info">{en ? "Info" : "情報"}</a>
      </nav>
    </main>
  );
}
