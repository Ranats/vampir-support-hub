"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import LanguageSwitch from "./LanguageSwitch";
import { GAME_CONTENT_SOURCES, SPAWN_EVENTS } from "./game-content";
import type { Locale } from "./localization";
import {
  formatSpawnCountdown,
  formatSpawnVerifiedAt,
  localizedSpawnEvents,
  upcomingSpawnOccurrences,
} from "./spawn-schedule";
import {
  DEFAULT_SPAWN_SERVER_REGION,
  SPAWN_SERVER_REGION_KEY,
  formatSpawnServerClock,
  formatSpawnServerTime,
  parseSpawnServerRegion,
  spawnScheduleLabel,
  spawnServerRegionSettings,
  spawnTimeZoneLabel,
} from "./spawn-server-region";
import type { SpawnServerRegion } from "./game-content";

const spawnSourceIds = new Set<string>(SPAWN_EVENTS.flatMap((event) => event.sourceIds));
const spawnSources = GAME_CONTENT_SOURCES.filter((source) => spawnSourceIds.has(source.id));
const verifiedAt = SPAWN_EVENTS.map((event) => event.verifiedAt)
  .reduce((oldest, value) => Date.parse(value) < Date.parse(oldest) ? value : oldest);

export default function SchedulePageClient({
  locale,
  initialNowMs,
}: {
  locale: Locale;
  initialNowMs: number;
}) {
  const [now, setNow] = useState(() => new Date(initialNowMs));
  const [spawnServerRegion, setSpawnServerRegion] = useState<SpawnServerRegion>(
    DEFAULT_SPAWN_SERVER_REGION,
  );
  const en = locale === "en";
  const events = useMemo(() => localizedSpawnEvents(locale), [locale]);
  const upcoming = useMemo(() => upcomingSpawnOccurrences(events, now), [events, now]);
  const next = upcoming[0];

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      setSpawnServerRegion(parseSpawnServerRegion(
        window.localStorage.getItem(SPAWN_SERVER_REGION_KEY),
      ));
    }, 0);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === SPAWN_SERVER_REGION_KEY) {
        setSpawnServerRegion(parseSpawnServerRegion(event.newValue));
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      window.clearTimeout(hydrationTimer);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  function updateSpawnServerRegion(region: SpawnServerRegion) {
    setSpawnServerRegion(region);
    window.localStorage.setItem(
      SPAWN_SERVER_REGION_KEY,
      JSON.stringify(spawnServerRegionSettings(region)),
    );
  }

  return (
    <main className="schedule-search-page">
      <header className="schedule-search-header">
        <Link className="wordmark" href={en ? "/en" : "/"} aria-label={en ? "VAMPIR Daily Navigator home" : "VAMPIR 日課ナビのホーム"}>
          <span>VAMPIR</span>
          <small>{en ? "Daily Navigator" : "日課ナビ"}</small>
        </Link>
        <div className="schedule-search-actions">
          <LanguageSwitch locale={locale} page="schedule" />
          <Link className="schedule-search-back" href={en ? "/en" : "/"}>{en ? "Daily Navigator" : "日課ナビへ"}</Link>
        </div>
      </header>

      <section className="schedule-search-hero" aria-labelledby="schedule-page-title">
        <p className="eyebrow">VAMPIR SPAWN SCHEDULE</p>
        <h1 id="schedule-page-title">{en ? "VAMPIR Event Boss, World Boss, and Gehenna Schedule" : "VAMPIR イベントボス・ワールドボス・ゲヘナ出現時間"}</h1>
        <p className="schedule-search-intro">{en ? "Check the next listed spawn and the published timetable at a glance." : "次の出現予定と、確認済みの出現時刻をすぐ確認できます。"}</p>
        <label className="schedule-region-select">
          <span>{en ? "Event boss server region" : "イベントボスのサーバー地域"}</span>
          <select
            value={spawnServerRegion}
            onChange={(event) => updateSpawnServerRegion(event.target.value as SpawnServerRegion)}
          >
            <option value="japan-korea">{en ? "Japan / Korea (11:50, 19:50)" : "日本・韓国（11:50／19:50）"}</option>
            <option value="taiwan-hong-kong-macau">{en ? "Taiwan / Hong Kong / Macau (10:50, 18:50)" : "台湾・香港・マカオ（10:50／18:50）"}</option>
          </select>
          <small>{en ? "Only confirmed event-boss times change. Other schedules remain in JST." : "地域別時刻が確認できたイベントボスだけを切り替えます。その他はJSTです。"}</small>
        </label>
      </section>

      {next ? (
        <section className="schedule-next-card" aria-labelledby="next-spawn-title">
          <div>
            <p className="eyebrow">{en ? "NEXT LISTED SPAWN" : "次の出現予定"}</p>
            <h2 id="next-spawn-title">{next.title}</h2>
            <p>{formatSpawnServerTime(next.at, next, spawnServerRegion, false, locale)} {spawnTimeZoneLabel(next, spawnServerRegion, locale)} · {spawnScheduleLabel(next, spawnServerRegion, locale)}{next.minLevel ? ` · Lv${next.minLevel}+` : ""}</p>
          </div>
          <strong aria-label={en ? `Starts in ${formatSpawnCountdown(next.at, now, locale)}` : `開始まで ${formatSpawnCountdown(next.at, now, locale)}`}>{formatSpawnCountdown(next.at, now, locale)}</strong>
        </section>
      ) : null}

      <section className="schedule-search-section" aria-labelledby="timetable-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">TIMETABLE</p>
            <h2 id="timetable-title">{en ? "Published spawn times" : "掲載中の出現時刻"}</h2>
          </div>
          <p>{en ? "Event boss times use the selected server region. Other times remain in Japan Standard Time (JST)." : "イベントボスは選択したサーバー地域、その他は日本標準時（JST）です。"}</p>
        </div>
        <div className="schedule-search-list">
          {events.map((event) => (
            <article className="schedule-search-row" key={event.id}>
              <time>{formatSpawnServerClock(event, spawnServerRegion)}<small>{spawnTimeZoneLabel(event, spawnServerRegion, locale)}</small></time>
              <div><strong>{event.title}</strong><small>{spawnScheduleLabel(event, spawnServerRegion, locale)}{event.minLevel ? ` · Lv${event.minLevel}+` : ""}</small></div>
            </article>
          ))}
        </div>
        <p className="schedule-note">{en ? "Times can change after events such as territory battles. The in-game schedule and official notices are authoritative." : "争奪戦などで時刻が変わる場合があります。ゲーム内時刻表と公式告知を正本として確認してください。"}</p>
      </section>

      <section className="schedule-search-section schedule-search-sources" aria-labelledby="schedule-sources-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">SOURCES</p>
            <h2 id="schedule-sources-title">{en ? "Sources and verification" : "情報源と確認日"}</h2>
          </div>
          <p>{en ? `Listed values verified ${formatSpawnVerifiedAt(verifiedAt, locale)}.` : `掲載値の確認日：${formatSpawnVerifiedAt(verifiedAt, locale)}。`}</p>
        </div>
        <ul className="schedule-source-list">
          {spawnSources.map((source) => (
            <li key={source.id}>
              <a href={source.url} target="_blank" rel="noreferrer">{source.authority === "official" ? (en ? "Official: " : "公式：") : (en ? "Supplementary: " : "補足：")}{source.label[locale]}</a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
