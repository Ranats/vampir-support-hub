import {
  CLAN_CONTENT_META,
  CLAN_WEEKDAY_LABELS,
  updateClanScheduleItem,
  type ClanScheduleSettings as ClanScheduleSettingsValue,
} from "./clan-schedule";

type ClanScheduleSettingsProps = {
  settings: ClanScheduleSettingsValue;
  onChange: (settings: ClanScheduleSettingsValue) => void;
  standalone?: boolean;
  shared?: boolean;
};

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export default function ClanScheduleSettings({
  settings,
  onChange,
  standalone = false,
  shared = false,
}: ClanScheduleSettingsProps) {
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
              {standalone ? "開催曜日と時刻" : "クラン予定"}
            </h3>
            <p>
              {shared
                ? "保存すると、閲覧リンクを持つクランメンバー全員へ反映されます。"
                : "クラン内で決めた曜日と時刻を、この端末だけに保存します。"}
            </p>
          </div>
        </div>
      </div>

      <div className="clan-settings-list">
        {CLAN_CONTENT_META.map((meta) => {
          const item = settings.items.find(({ contentId }) => contentId === meta.contentId);
          if (!item) return null;

          return (
            <fieldset className="clan-setting-card" key={meta.contentId}>
              <legend>{meta.name}</legend>
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
                <span>予定を登録する</span>
              </label>

              <div className="clan-setting-controls">
                <label>
                  <span>曜日（JST）</span>
                  <select
                    value={item.day}
                    disabled={!item.scheduled}
                    onChange={(event) => onChange(updateClanScheduleItem(
                      settings,
                      meta.contentId,
                      { day: Number(event.target.value) },
                    ))}
                  >
                    {CLAN_WEEKDAY_LABELS.map((label, day) => (
                      <option value={day} key={label}>{label}曜日</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>開始時刻（JST）</span>
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
                    <span>リマインダー対象</span>
                  </label>
                )}
              </div>
              <small>
                {shared
                  ? "共有するのは曜日と時刻だけです。リマインダー設定と完了状況は各メンバーの端末に残ります。"
                  : "リマインダーは全体通知設定と共通の通知タイミングを使い、サイトを開いている間だけ動作します。"}
              </small>
            </fieldset>
          );
        })}
      </div>
      <p className="notification-note">
        {shared
          ? "この予定はクラン管理者による入力です。ゲーム内スケジュールや公式情報としては扱いません。"
          : "ここで設定する開催時刻はユーザー入力であり、検証済みのゲーム内スケジュールやアカウント連携ではありません。"}
      </p>
    </section>
  );
}
