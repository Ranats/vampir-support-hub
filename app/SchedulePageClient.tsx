"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import LanguageSwitch from "./LanguageSwitch";
import { GAME_CONTENT_SOURCES, SPAWN_EVENTS } from "./game-content";
import type { Locale } from "./localization";
import {
  formatSpawnCountdown,
  formatSpawnJst,
  formatSpawnVerifiedAt,
  localizedSpawnEvents,
  upcomingSpawnOccurrences,
} from "./spawn-schedule";

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
  const en = locale === "en";
  const events = useMemo(() => localizedSpawnEvents(locale), [locale]);
  const upcoming = useMemo(() => upcomingSpawnOccurrences(events, now), [events, now]);
  const next = upcoming[0];

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

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
        <p className="eyebrow">VAMPIR SPAWN SCHEDULE · JST</p>
        <h1 id="schedule-page-title">{en ? "VAMPIR World Boss and Gehenna Schedule" : "VAMPIR ワールドボス・ゲヘナ出現時間"}</h1>
        <p>{en ? "Check the next listed spawn and the regular JST timetable at a glance." : "次の出現予定と、JSTの定例時刻をすぐ確認できます。"}</p>
      </section>

      {next ? (
        <section className="schedule-next-card" aria-labelledby="next-spawn-title">
          <div>
            <p className="eyebrow">{en ? "NEXT LISTED SPAWN" : "次の出現予定"}</p>
            <h2 id="next-spawn-title">{next.title}</h2>
            <p>{formatSpawnJst(next.at, false, locale)} JST · {next.label}{next.minLevel ? ` · Lv${next.minLevel}+` : ""}</p>
          </div>
          <strong aria-label={en ? `Starts in ${formatSpawnCountdown(next.at, now, locale)}` : `開始まで ${formatSpawnCountdown(next.at, now, locale)}`}>{formatSpawnCountdown(next.at, now, locale)}</strong>
        </section>
      ) : null}

      <section className="schedule-search-section" aria-labelledby="timetable-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">TIMETABLE</p>
            <h2 id="timetable-title">{en ? "Regular spawn times" : "定例の出現時刻"}</h2>
          </div>
          <p>{en ? "All times are Japan Standard Time (JST)." : "すべて日本標準時（JST）です。"}</p>
        </div>
        <div className="schedule-search-list">
          {events.map((event) => (
            <article className="schedule-search-row" key={event.id}>
              <time>{`${String(event.hour).padStart(2, "0")}:${String(event.minute).padStart(2, "0")}`} JST</time>
              <div><strong>{event.title}</strong><small>{event.label}{event.minLevel ? ` · Lv${event.minLevel}+` : ""}</small></div>
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
