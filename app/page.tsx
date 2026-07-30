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

const SHARE_URL = "https://vampir.cilabworks.com/";
const SHARE_TEXT = "VAMPIR 日課ナビ｜次の出現時刻・日課・週課をまとめて確認";
const X_SHARE_URL = `https://twitter.com/intent/tweet?${new URLSearchParams({
  text: SHARE_TEXT,
  url: SHARE_URL,
  hashtags: "VAMPIR,ヴァンピール",
}).toString()}`;

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

function upcomingOccurrences(now: Date, level: number, take = 6) {
  const items: Occurrence[] = [];
  const jst = shiftedToJst(now);

  for (let offset = 0; offset < 8; offset += 1) {
    const cursor = new Date(jst);
    cursor.setUTCDate(cursor.getUTCDate() + offset);

    for (const event of SPAWN_EVENTS) {
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

function formatCountdown(target: Date, now: Date) {
  const total = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const clock = [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
  return days ? `${days}日 ${clock}` : clock;
}

function formatJst(date: Date, withSeconds = false) {
  return new Intl.DateTimeFormat("ja-JP", {
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

function freshnessLabel(now: Date) {
  const elapsedDays = Math.max(
    0,
    Math.floor((now.getTime() - new Date(VERIFIED_AT_ISO).getTime()) / 86_400_000),
  );
  if (elapsedDays === 0) return "本日確認";
  if (elapsedDays === 1) return "1日前に確認";
  return `${elapsedDays}日前に確認`;
}

function RoutineRow({
  task,
  done,
  locked,
  onToggle,
}: {
  task: Routine;
  done: boolean;
  locked: boolean;
  onToggle: () => void;
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
          ? "自分"
          : locked
            ? `Lv${task.minLevel}`
            : task.unlock ?? (task.minLevel ? `Lv${task.minLevel}+` : "")}
      </span>
    </button>
  );
}

export default function Home() {
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
  const [dataMessage, setDataMessage] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsReturnFocusRef = useRef<HTMLButtonElement | null>(null);
  const settingsFallbackFocusRef = useRef<HTMLButtonElement | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const visibleDaily = visibleRoutines(
    DAILY_TASKS,
    customRoutines,
    routinePreferences,
    "daily",
  ) as Routine[];
  const visibleWeekly = visibleRoutines(
    WEEKLY_TASKS,
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
    () => upcomingOccurrences(now, effectiveLevel),
    [now, effectiveLevel],
  );
  const next = upcoming[0];
  const todayTasks = selectTodayTasks(
    visibleDaily,
    visibleWeekly,
    dailyDone,
    weeklyDone,
    effectiveLevel,
  );
  const visibleDefaultCount = [...DAILY_TASKS, ...WEEKLY_TASKS].filter(
    (routine) => !routinePreferences.hiddenDefaultIds.includes(routine.id),
  ).length;
  const activeEvents = LIMITED_EVENTS.filter((event) => event.deadline > now).sort(
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
        [...DAILY_TASKS, ...WEEKLY_TASKS].map((routine) => routine.id),
      ));
      setFavoriteSpawnIds(parseFavoriteSpawnIds(
        window.localStorage.getItem(FAVORITE_SPAWNS_KEY),
        SPAWN_EVENTS.map((event) => event.id),
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
  }, [dailyCycle, weeklyCycle]);

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
          [...DAILY_TASKS, ...WEEKLY_TASKS].map((routine) => routine.id),
        );
        setRoutinePreferences((current) => (
          JSON.stringify(current) === JSON.stringify(nextPreferences) ? current : nextPreferences
        ));
      } else if (event.key === FAVORITE_SPAWNS_KEY) {
        const nextFavorites = parseFavoriteSpawnIds(
          event.newValue,
          SPAWN_EVENTS.map((spawn) => spawn.id),
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
  }, [dailyCycle, hydrated, weeklyCycle]);

  useEffect(() => {
    if (
      !hydrated
      || !notificationSettings.enabled
      || notificationPermission !== "granted"
      || favoriteSpawnIds.length === 0
    ) return;

    const leadMilliseconds = notificationSettings.leadMinutes * 60_000;
    const candidates = upcomingOccurrences(now, effectiveLevel, 20).filter((event) => {
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
          `${event.title}まであと約${remainingMinutes}分`,
          {
            body: `${formatJst(event.at)} JST開始予定。ゲーム内時刻表を優先してください。`,
            icon: "/icon-192.png",
            tag: occurrenceKey,
            data: { url: "/#schedule" },
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
  }

  async function requestNotificationPermission() {
    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      setNotificationMessage("このブラウザは通知に対応していません。");
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
        ? "通知を有効にしました。お気に入りの予定をサイト表示中にお知らせします。"
        : permission === "denied"
          ? "通知が拒否されています。ブラウザのサイト設定から変更できます。"
          : "通知は有効になりませんでした。",
    );
  }

  async function showTestNotification() {
    if (notificationPermission !== "granted") return;
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification("VAMPIR 日課ナビ：テスト通知", {
        body: "通知は正常です。実際の出現時刻はゲーム内時刻表を優先してください。",
        icon: "/icon-192.png",
        tag: "vampir-test-notification",
        data: { url: "/#schedule" },
      });
      setNotificationMessage("テスト通知を送信しました。");
    } catch {
      setNotificationMessage("テスト通知を表示できませんでした。ブラウザの通知設定を確認してください。");
    }
  }

  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setNotificationMessage("ホーム画面への追加を開始しました。");
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
    setDataMessage("バックアップを書き出しました。");
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
        [...DAILY_TASKS, ...WEEKLY_TASKS].map((routine) => routine.id),
      ));
      setFavoriteSpawnIds(parseFavoriteSpawnIds(
        JSON.stringify(data.favoriteSpawnIds),
        SPAWN_EVENTS.map((event) => event.id),
      ));
      setNotificationSettings(data.notificationSettings);
      setDataMessage("バックアップを復元しました。期限切れのチェックは現在の周期に合わせて未完了に戻しました。");
    } catch {
      setDataMessage("このファイルは復元できません。VAMPIR 日課ナビのバックアップを選んでください。");
    }
  }

  async function shareTool() {
    const shareData = {
      title: "VAMPIR 日課ナビ",
      text: SHARE_TEXT,
      url: SHARE_URL,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareMessage("共有しました。");
        return;
      }

      await navigator.clipboard.writeText(SHARE_URL);
      setShareMessage("URLをコピーしました。");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;

      try {
        await navigator.clipboard.writeText(SHARE_URL);
        setShareMessage("URLをコピーしました。");
      } catch {
        setShareMessage("共有できませんでした。URLを直接コピーしてください。");
      }
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
        <a className="brand" href="#today" aria-label="VAMPIR 日課ナビ ホーム">
          <span className="brand-mark" aria-hidden="true">V</span>
          <span><strong>VAMPIR</strong><small>日課ナビ</small></span>
        </a>
        <div className="header-tools">
          <a
            className={`verified${informationIsStale ? " stale" : ""}`}
            href="#info"
            title={`最終確認 ${VERIFIED_AT}。ゲーム内表示と公式告知を優先してください。`}
          >
            {informationIsStale ? "要再確認" : freshnessLabel(now)}
          </a>
          <button
            ref={settingsFallbackFocusRef}
            className="settings-trigger"
            type="button"
            onClick={openSettings}
            aria-label="表示とチェックリスト設定を開く"
          >
            <span>{level ? `Lv${level}` : "Lv未設定"}</span>
            <small>設定</small>
          </button>
        </div>
      </header>

      <div className="content">
        <section className="today-section" id="today" aria-labelledby="today-title">
          <div className="today-heading">
            <div>
              <span className="eyebrow">TODAY</span>
              <h1 id="today-title">今日、次にやること</h1>
            </div>
            <time dateTime={now.toISOString()}>{formatJst(now, true)} JST</time>
          </div>

          <div className="today-grid">
            <article className="next-card panel">
              <div className="card-label">次の出現</div>
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
                        aria-label={`${next.title} ${String(next.hour).padStart(2, "0")}:${String(next.minute).padStart(2, "0")}をお気に入り${favoriteSpawnIds.includes(next.id) ? "から外す" : "に追加"}`}
                        onClick={() => toggleFavoriteSpawn(next.id)}
                      >
                        <span aria-hidden="true">{favoriteSpawnIds.includes(next.id) ? "★" : "☆"}</span>
                        {favoriteSpawnIds.includes(next.id) ? "通知対象" : "お気に入り"}
                      </button>
                    </div>
                  </div>
                  <div className="countdown" aria-label={`開始まで ${formatCountdown(next.at, now)}`}>{formatCountdown(next.at, now)}</div>
                  <p>開始時刻はゲーム内の最新時刻表を優先してください。</p>
                </>
              ) : null}
            </article>

            <article className="quick-card panel">
              <div className="quick-head">
                <div>
                  <span className="card-label">次にやること</span>
                  <h2>未完了の3件</h2>
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
                        <small>{isDaily ? "今日" : "今週"}{task.custom ? "・自分" : ""}</small>
                      </span>
                    </button>
                  );
                }) : (
                  <p className="all-done">表示中の項目は完了です。</p>
                )}
              </div>
              <a href="#checklists">すべてのチェックを見る</a>
            </article>
          </div>

          <div className="reset-strip">
            <span>日次05:00まで <strong>{formatCountdown(nextDailyReset(now), now)}</strong></span>
            <span>週次・月曜05:00まで <strong>{formatCountdown(nextWeeklyReset(now), now)}</strong></span>
          </div>

          <div className="personalization-strip">
            <div>
              <span>あなた向け表示</span>
              <strong>
                {level
                  ? `Lv${level}で候補・集計・予定を絞り込み中`
                  : "レベル未設定のため、すべてのコンテンツを表示中"}
              </strong>
              <small>
                既定 {visibleDefaultCount}件を表示
                {routinePreferences.hiddenDefaultIds.length
                  ? `・${routinePreferences.hiddenDefaultIds.length}件を非表示`
                  : ""}
                {customRoutines.length ? `・自分の項目 ${customRoutines.length}件` : ""}
              </small>
            </div>
            <button type="button" onClick={openSettings}>
              表示とリストを編集
            </button>
          </div>
        </section>

        <section className="check-section section-block" id="checklists" aria-labelledby="check-title">
          <div className="section-heading">
            <div>
              <span className="eyebrow">CHECK</span>
              <h2 id="check-title">日課・週課</h2>
            </div>
            <div className="section-heading-actions">
              <p>チェックはこの端末に保存され、リセット時刻に自動更新されます。</p>
              <button type="button" onClick={openSettings}>リストを編集</button>
            </div>
          </div>

          <div className="check-grid">
            <details className="routine-panel panel" open>
              <summary>
                <span><small>DAILY</small><strong>毎日やること</strong></span>
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
                    />
                  );
                })}
                {!visibleDaily.length ? (
                  <button className="empty-routine-action" type="button" onClick={openSettings}>
                    毎日の項目を追加・再表示
                  </button>
                ) : null}
              </div>
            </details>

            <details className="routine-panel panel">
              <summary>
                <span><small>WEEKLY</small><strong>毎週やること</strong></span>
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
                    />
                  );
                })}
                {!visibleWeekly.length ? (
                  <button className="empty-routine-action" type="button" onClick={openSettings}>
                    毎週の項目を追加・再表示
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
              <h2 id="schedule-title">次の出現予定</h2>
            </div>
            <p>
              {level
                ? `Lv${level}で参加できる予定をJSTで表示しています。`
                : "レベル未設定のため、すべての予定をJSTで表示しています。"}
              {favoriteSpawnIds.length ? ` お気に入り${favoriteSpawnIds.length}件。` : ""}
            </p>
          </div>
          <div className={`information-status${informationIsStale ? " stale" : ""}`}>
            <div>
              <strong>{informationIsStale ? "掲載情報が古い可能性があります" : `掲載情報は${freshnessLabel(now)}です`}</strong>
              <small>最終確認 {VERIFIED_AT}・時刻変更時はゲーム内時刻表を正本とします。</small>
            </div>
            <a href="#info">情報源を見る</a>
          </div>
          <div className="schedule-list panel">
            {upcoming.map((event) => (
              <article className="schedule-row" key={`${event.id}-${event.at.toISOString()}`}>
                <time dateTime={event.at.toISOString()}>{formatJst(event.at)}</time>
                <div><strong>{event.title}</strong><small>{event.label}{event.minLevel ? `・Lv${event.minLevel}+` : ""}</small></div>
                <b>{formatCountdown(event.at, now)}</b>
                <button
                  className={`schedule-favorite${favoriteSpawnIds.includes(event.id) ? " active" : ""}`}
                  type="button"
                  aria-pressed={favoriteSpawnIds.includes(event.id)}
                  aria-label={`${event.title} ${formatJst(event.at)}をお気に入り${favoriteSpawnIds.includes(event.id) ? "から外す" : "に追加"}`}
                  onClick={() => toggleFavoriteSpawn(event.id)}
                >
                  <span aria-hidden="true">{favoriteSpawnIds.includes(event.id) ? "★" : "☆"}</span>
                </button>
              </article>
            ))}
          </div>
          <p className="schedule-note">争奪戦後などに時刻が変わる場合があります。ゲーム内時刻表を正本として確認してください。</p>
        </section>

        {activeEvents.length ? (
          <section className="event-section section-block" id="events" aria-labelledby="event-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">DEADLINES</span>
                <h2 id="event-title">期限が近いイベント</h2>
              </div>
              <p>名称と終了時刻だけを掲載しています。</p>
            </div>
            <div className="event-list panel">
              {activeEvents.map((event) => (
                <article className="event-row" key={event.id}>
                  <div><strong>{event.title}</strong><small>終了 {formatJst(event.deadline)} JST</small></div>
                  <b>あと {formatCountdown(event.deadline, now)}</b>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <footer className="site-footer" id="info">
          <div className="site-footer-about">
            <strong>VAMPIR 日課ナビ</strong>
            <p>非公式ツールです。時刻・イベント期間はゲーム内表示と公式告知を優先してください。</p>
            <section className="share-panel" aria-labelledby="share-title">
              <div>
                <strong id="share-title">このツールを共有する</strong>
                <p>独自ドメインのURLと紹介文を共有できます。</p>
              </div>
              <div className="share-actions">
                <a
                  className="share-button share-button-x"
                  href={X_SHARE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="XでVAMPIR 日課ナビを共有する（外部サイト）"
                >
                  <span aria-hidden="true">X</span>
                  Xで共有
                </a>
                <button
                  className="share-button share-button-native"
                  type="button"
                  onClick={shareTool}
                >
                  <span aria-hidden="true">↗</span>
                  共有する
                </button>
              </div>
              {shareMessage ? (
                <small className="share-status" role="status" aria-live="polite">
                  {shareMessage}
                </small>
              ) : null}
            </section>
            <section className="support-panel" aria-labelledby="support-title">
              <div>
                <strong id="support-title">このツールを応援する</strong>
                <p>継続的な確認・更新への支援は任意です。</p>
              </div>
              <div className="support-links">
                <a
                  className="support-banner support-banner-kofi"
                  href={SUPPORT_URLS.kofi}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Ko-fiで応援する（外部サイト）"
                >
                  <span aria-hidden="true">☕</span>
                  <span><strong>Ko-fi</strong><small>外部サイトで応援</small></span>
                </a>
                <a
                  className="support-banner support-banner-ofuse"
                  href={SUPPORT_URLS.ofuse}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="OFUSEで応援する（外部サイト）"
                >
                  <span aria-hidden="true">♥</span>
                  <span><strong>OFUSE</strong><small>外部サイトで応援</small></span>
                </a>
              </div>
              <small className="support-note">支援の有無にかかわらず、すべての機能を無料で利用できます。</small>
            </section>
          </div>
          <details>
            <summary>情報源と確認日</summary>
            <p>
              最終確認：{VERIFIED_AT}（{freshnessLabel(now)}）
              {informationIsStale ? "・現在は再確認が必要です。" : ""}
            </p>
            <nav aria-label="情報源">
              <a href={SOURCE_URLS.official} target="_blank" rel="noreferrer">VAMPIR公式</a>
              <a href={SOURCE_URLS.routines} target="_blank" rel="noreferrer">日課・週課</a>
              <a href={SOURCE_URLS.gehenna} target="_blank" rel="noreferrer">ゲヘナ時刻</a>
              <a href={SOURCE_URLS.events} target="_blank" rel="noreferrer">イベント一覧</a>
            </nav>
          </details>
        </footer>
      </div>

      {settingsOpen ? (
        <SettingsSheet
          level={level}
          dailyDefaults={DAILY_TASKS}
          weeklyDefaults={WEEKLY_TASKS}
          hiddenDefaultIds={routinePreferences.hiddenDefaultIds}
          customRoutines={customRoutines}
          favoriteSpawnCount={favoriteSpawnIds.length}
          notificationPermission={notificationPermission}
          notificationSettings={notificationSettings}
          canInstall={Boolean(installPrompt)}
          isStandalone={isStandalone}
          notificationMessage={notificationMessage}
          dataMessage={dataMessage}
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

      <nav className="mobile-nav" aria-label="モバイルナビゲーション">
        <a href="#today">今日</a>
        <a href="#checklists">チェック</a>
        <a href="#schedule">時刻</a>
        <a href="#info">情報</a>
      </nav>
    </main>
  );
}
