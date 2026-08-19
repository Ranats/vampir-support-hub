"use client";

import { useEffect, useState } from "react";
import {
  CLAN_CONTENT_META,
  CLAN_WEEKDAY_LABELS,
  updateClanScheduleItem,
  type ClanScheduleSettings as ClanScheduleSettingsValue,
} from "./clan-schedule";
import {
  JAPAN_TIME_ZONE,
  formatClanTimeZoneName,
  supportedClanTimeZones,
} from "./clan-time-zone";
import type { Locale } from "./localization";

type ClanScheduleSettingsProps = {
  locale?: Locale;
  settings: ClanScheduleSettingsValue;
  onChange: (settings: ClanScheduleSettingsValue) => void;
  timeZone?: string;
  onTimeZoneChange?: (timeZone: string) => void;
  standalone?: boolean;
  shared?: boolean;
};

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export default function ClanScheduleSettings({
  locale = "ja",
  settings,
  onChange,
  timeZone = JAPAN_TIME_ZONE,
  onTimeZoneChange,
  standalone = false,
  shared = false,
}: ClanScheduleSettingsProps) {
  const en = locale === "en";
  const [timeZones, setTimeZones] = useState(() => [timeZone]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTimeZones(supportedClanTimeZones(timeZone));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [timeZone]);
  const weekdayLabels = en
    ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    : CLAN_WEEKDAY_LABELS;
  const contentNames: Record<string, string> = {
    "clan-mission": "Clan Missions",
    "clan-guard": "Clan Guard",
  };

  return (
    <section
      className={`settings-section${standalone ? " clan-settings-standalone" : ""}`}
      aria-labelledby="clan-schedule-settings-title"
    >
      <div className="settings-section-heading">
        <div>
          {standalone ? null : <span>4</span>}
          <div>
            <h3 id="clan-schedule-settings-title">
              {standalone
                ? (en ? "Schedule day and time" : "開催曜日と時刻")
                : (en ? "Clan plans" : "クラン予定")}
            </h3>
            <p>
              {shared
                ? (en ? "Saving updates the schedule for every clan member with the viewer link." : "保存すると、閲覧リンクを持つクランメンバー全員へ反映されます。")
                : (en ? "Save the day and time agreed by your clan on this device only." : "クラン内で決めた曜日と時刻を、この端末だけに保存します。")}
            </p>
          </div>
        </div>
      </div>

      <div className="clan-time-zone-setting">
        <label>
          <span>{en ? "Clan schedule time zone" : "クラン予定のタイムゾーン"}</span>
          <select
            value={timeZone}
            disabled={!onTimeZoneChange}
            onChange={(event) => onTimeZoneChange?.(event.target.value)}
          >
            {timeZones.map((value) => (
              <option value={value} key={value}>
                {formatClanTimeZoneName(value, locale)}
              </option>
            ))}
          </select>
        </label>
        <small>
          {shared
            ? (en
                ? "Members see these weekly times in this clan time zone. This setting does not change official schedules or reset times."
                : "メンバーには、このタイムゾーンの毎週予定として表示します。この設定で公式予定やリセット時刻は変わりません。")
            : (en
                ? "This applies only to your user-entered clan plans. This setting does not change official schedules or daily/weekly resets."
                : "ユーザー入力のクラン予定だけに適用します。この設定で公式予定や日次・週次リセットは変わりません。")}
        </small>
      </div>

      <div className="clan-settings-list">
        {CLAN_CONTENT_META.map((meta) => {
          const item = settings.items.find(({ contentId }) => contentId === meta.contentId);
          if (!item) return null;

          return (
            <fieldset className="clan-setting-card" key={meta.contentId}>
              <legend>{en ? contentNames[meta.contentId] : meta.name}</legend>
              <label className="clan-setting-enabled">
                <input
                  type="checkbox"
                  checked={item.scheduled}
                  onChange={(event) => onChange(updateClanScheduleItem(
                    settings,
                    meta.contentId,
                    { scheduled: event.target.checked },
                  ))}
                />
                <span>{en ? "Add this plan" : "予定を登録する"}</span>
              </label>

              <div className="clan-setting-controls">
                <label>
                  <span>{en ? "Day" : "曜日"}</span>
                  <select
                    value={item.day}
                    disabled={!item.scheduled}
                    onChange={(event) => onChange(updateClanScheduleItem(
                      settings,
                      meta.contentId,
                      { day: Number(event.target.value) },
                    ))}
                  >
                    {weekdayLabels.map((label, day) => (
                      <option value={day} key={label}>{en ? label : `${label}曜日`}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>{en ? "Start time" : "開始時刻"}</span>
                  <input
                    type="time"
                    value={formatTime(item.hour, item.minute)}
                    disabled={!item.scheduled}
                    onChange={(event) => {
                      const [hour, minute] = event.target.value.split(":").map(Number);
                      if (!Number.isInteger(hour) || !Number.isInteger(minute)) return;
                      onChange(updateClanScheduleItem(
                        settings,
                        meta.contentId,
                        { hour, minute },
                      ));
                    }}
                  />
                </label>
                {shared ? null : (
                  <label className="clan-reminder-toggle">
                    <input
                      type="checkbox"
                      checked={item.reminder}
                      disabled={!item.scheduled}
                      onChange={(event) => onChange(updateClanScheduleItem(
                        settings,
                        meta.contentId,
                        { reminder: event.target.checked },
                      ))}
                    />
                    <span>{en ? "Include in reminders" : "リマインダー対象"}</span>
                  </label>
                )}
              </div>
              <small>
                {shared
                  ? (en ? "Only the day, time, and clan time zone are shared. Reminder settings and completion stay on each member's device." : "共有するのは曜日・時刻・クラン予定のタイムゾーンだけです。リマインダー設定と完了状況は各メンバーの端末に残ります。")
                  : (en ? "Reminders use the global notification timing and work only while this site is open." : "リマインダーは全体通知設定と共通の通知タイミングを使い、サイトを開いている間だけ動作します。")}
              </small>
            </fieldset>
          );
        })}
      </div>
      <p className="notification-note">
        {shared
          ? (en ? "This schedule is entered by a clan administrator and is not an official in-game schedule." : "この予定はクラン管理者による入力です。ゲーム内スケジュールや公式情報としては扱いません。")
          : (en ? "These times are user-entered, not verified in-game schedules or data from a connected account." : "ここで設定する開催時刻はユーザー入力であり、検証済みのゲーム内スケジュールやアカウント連携ではありません。")}
      </p>
    </section>
  );
}
