"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  MAX_CUSTOM_NOTE,
  MAX_CUSTOM_ROUTINES,
  MAX_CUSTOM_TITLE,
  type CustomRoutine,
  type CustomRoutineInput,
  type RoutineFrequency,
} from "./routine-customization";
import type { NotificationSettings } from "./notification-settings";
import type { Locale } from "./localization";
import ClanScheduleSettings from "./ClanScheduleSettings";
import type { ClanScheduleSettings as ClanScheduleSettingsValue } from "./clan-schedule";

type DefaultRoutineSummary = {
  id: string;
  title: string;
  note: string;
};

type SettingsSheetProps = {
  locale?: Locale;
  mode: "all" | "clan";
  level: number | null;
  dailyDefaults: readonly DefaultRoutineSummary[];
  weeklyDefaults: readonly DefaultRoutineSummary[];
  hiddenDefaultIds: readonly string[];
  customRoutines: readonly CustomRoutine[];
  clanSchedule: ClanScheduleSettingsValue;
  clanScheduleTimeZone: string;
  favoriteSpawnCount: number;
  clanReminderCount: number;
  notificationPermission: NotificationPermission | "unsupported";
  notificationSettings: NotificationSettings;
  canInstall: boolean;
  isStandalone: boolean;
  notificationMessage: string;
  notificationMessageIsError: boolean;
  dataMessage: string;
  dataMessageIsError: boolean;
  onClose: () => void;
  onSaveLevel: (level: number) => void;
  onClearLevel: () => void;
  onToggleDefault: (id: string) => void;
  onRestoreDefaults: () => void;
  onAddCustom: (input: CustomRoutineInput) => boolean;
  onUpdateCustom: (id: string, input: CustomRoutineInput) => void;
  onDeleteCustom: (id: string) => void;
  onResetChecks: () => void;
  onDeleteAllCustom: () => void;
  onUpdateClanSchedule: (settings: ClanScheduleSettingsValue) => void;
  onUpdateClanScheduleTimeZone: (timeZone: string) => void;
  onUpdateNotificationSettings: (settings: NotificationSettings) => void;
  onRequestNotificationPermission: () => Promise<void>;
  onTestNotification: () => Promise<void>;
  onInstall: () => Promise<void>;
  onExportData: () => void;
  onImportData: (file: File) => Promise<void>;
};

export default function SettingsSheet({
  locale = "ja",
  mode,
  level,
  dailyDefaults,
  weeklyDefaults,
  hiddenDefaultIds,
  customRoutines,
  clanSchedule,
  clanScheduleTimeZone,
  favoriteSpawnCount,
  clanReminderCount,
  notificationPermission,
  notificationSettings,
  canInstall,
  isStandalone,
  notificationMessage,
  notificationMessageIsError,
  dataMessage,
  dataMessageIsError,
  onClose,
  onSaveLevel,
  onClearLevel,
  onToggleDefault,
  onRestoreDefaults,
  onAddCustom,
  onUpdateCustom,
  onDeleteCustom,
  onResetChecks,
  onDeleteAllCustom,
  onUpdateClanSchedule,
  onUpdateClanScheduleTimeZone,
  onUpdateNotificationSettings,
  onRequestNotificationPermission,
  onTestNotification,
  onInstall,
  onExportData,
  onImportData,
}: SettingsSheetProps) {
  const en = locale === "en";
  const dialogRef = useRef<HTMLElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [levelDraft, setLevelDraft] = useState(level ? String(level) : "");
  const [levelError, setLevelError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<RoutineFrequency>("daily");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [customError, setCustomError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dataAction, setDataAction] = useState<"checks" | "customs" | null>(null);

  useEffect(() => {
    const previous = document.body.style.overflow;
    const handleDialogKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = [...dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]):not(.visually-hidden), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;

      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey
        && (document.activeElement === last || !dialog.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleDialogKeys);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", handleDialogKeys);
    };
  }, [onClose]);

  function resetCustomForm() {
    setEditingId(null);
    setFrequency("daily");
    setTitle("");
    setNote("");
    setCustomError("");
  }

  function submitLevel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numeric = Number(levelDraft);
    if (!Number.isInteger(numeric) || numeric < 1 || numeric > 200) {
      setLevelError(en ? "Enter a whole number from 1 to 200." : "1〜200の整数で入力してください。");
      return;
    }
    onSaveLevel(numeric);
    setLevelError("");
  }

  function submitCustom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = { title, note, frequency };
    if (!title.trim()) {
      setCustomError(en ? "Enter a task name." : "項目名を入力してください。");
      return;
    }

    if (editingId) {
      onUpdateCustom(editingId, input);
      resetCustomForm();
      return;
    }

    if (!onAddCustom(input)) {
      setCustomError(en ? `You can add up to ${MAX_CUSTOM_ROUTINES} personal tasks.` : `追加できる自分の項目は${MAX_CUSTOM_ROUTINES}件までです。`);
      return;
    }
    resetCustomForm();
  }

  function beginEdit(routine: CustomRoutine) {
    setEditingId(routine.id);
    setFrequency(routine.frequency);
    setTitle(routine.title);
    setNote(routine.note);
    setCustomError("");
  }

  function visibilityGroup(
    label: string,
    routines: readonly DefaultRoutineSummary[],
  ) {
    return (
      <fieldset className="visibility-group">
        <legend>{label}</legend>
        {routines.map((routine) => {
          const visible = !hiddenDefaultIds.includes(routine.id);
          return (
            <label className="visibility-row" key={routine.id}>
              <input
                type="checkbox"
                checked={visible}
                onChange={() => onToggleDefault(routine.id)}
              />
              <span>
                <strong>{routine.title}</strong>
                <small>{routine.note}</small>
              </span>
            </label>
          );
        })}
      </fieldset>
    );
  }

  return (
    <div
      className="settings-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="settings-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <header className="settings-head">
          <div>
            <span className="eyebrow">{mode === "clan" ? "CLAN PLAN" : "PERSONALIZE"}</span>
            <h2 id="settings-title">
              {mode === "clan"
                ? (en ? "Set clan schedule" : "クラン予定を設定")
                : (en ? "Display and checklist settings" : "表示とチェックリスト設定")}
            </h2>
          </div>
          <button className="settings-close" type="button" onClick={onClose} autoFocus>
            {en ? "Close" : "閉じる"}
          </button>
        </header>

        <div className={`settings-body${mode === "clan" ? " clan-settings-body" : ""}`}>
          {mode === "clan" ? (
            <ClanScheduleSettings
              locale={locale}
              settings={clanSchedule}
              onChange={onUpdateClanSchedule}
              timeZone={clanScheduleTimeZone}
              onTimeZoneChange={onUpdateClanScheduleTimeZone}
              standalone
            />
          ) : (
            <>
          <section className="settings-section" aria-labelledby="level-settings-title">
            <div className="settings-section-heading">
              <div>
                <span>1</span>
                <div><h3 id="level-settings-title">{en ? "Character level" : "キャラクターレベル"}</h3><p>{en ? "This only filters Today suggestions, progress, and spawns. It does not connect to the game." : "ゲームとは連携せず、Today候補・進捗・出現予定だけを絞ります。"}</p></div>
              </div>
            </div>
            <div className="level-explanation">
              <strong>{level ? (en ? `Filtering for Lv${level}` : `現在 Lv${level}で絞り込み中`) : (en ? "No level set — showing everything" : "現在は未設定・すべて表示")}</strong>
              <ul>
                <li>{en ? "Excludes locked routines from Today suggestions and progress" : "未解放の日課・週課をToday候補と進捗率から除外"}</li>
                <li>{en ? "Shows only Gehenna spawns available at your level" : "参加できるゲヘナの出現予定だけを表示"}</li>
              </ul>
            </div>
            <form className="level-form" onSubmit={submitLevel}>
              <label>
                <span>{en ? "Character Lv" : "キャラLv"}</span>
                <input
                  type="number"
                  min="1"
                  max="200"
                  inputMode="numeric"
                  value={levelDraft}
                  onChange={(event) => setLevelDraft(event.target.value)}
                  placeholder={en ? "e.g. 55" : "例：55"}
                />
              </label>
              <button className="primary-action" type="submit">{en ? "Save level" : "レベルを保存"}</button>
              {level ? (
                <button
                  className="text-action"
                  type="button"
                  onClick={() => {
                    onClearLevel();
                    setLevelDraft("");
                    setLevelError("");
                  }}
                >
                  {en ? "Clear level" : "未設定に戻す"}
                </button>
              ) : null}
            </form>
            {levelError ? <p className="form-error" role="alert">{levelError}</p> : null}
          </section>

          <section className="settings-section" aria-labelledby="visibility-settings-title">
            <div className="settings-section-heading split">
              <div>
                <span>2</span>
                <div><h3 id="visibility-settings-title">{en ? "Default task visibility" : "既定項目の表示"}</h3><p>{en ? "Hide tasks you do not need. Their completion history is preserved." : "不要な項目は非表示にできます。チェック履歴は消えません。"}</p></div>
              </div>
              {hiddenDefaultIds.length ? (
                <button className="text-action" type="button" onClick={onRestoreDefaults}>{en ? "Show all" : "すべて表示"}</button>
              ) : null}
            </div>
            <div className="visibility-grid">
              {visibilityGroup(en ? "Daily" : "毎日", dailyDefaults)}
              {visibilityGroup(en ? "Weekly" : "毎週", weeklyDefaults)}
            </div>
          </section>

          <section className="settings-section" aria-labelledby="custom-settings-title">
            <div className="settings-section-heading">
              <div>
                <span>3</span>
                <div><h3 id="custom-settings-title">{en ? "Personal tasks" : "自分の項目"}</h3><p>{en ? "Add your own reminders. They remain separate from information verified by this site." : "自分用メモとして追加します。サイトが確認した攻略情報とは別扱いです。"}</p></div>
              </div>
            </div>

            {customRoutines.length ? (
              <div className="custom-manager-list">
                {customRoutines.map((routine) => (
                  <div className="custom-manager-row" key={routine.id}>
                    <div>
                      <span>{routine.frequency === "daily" ? (en ? "Daily" : "毎日") : (en ? "Weekly" : "毎週")}</span>
                      <strong>{routine.title}</strong>
                      {routine.note ? <small>{routine.note}</small> : null}
                    </div>
                    {deleteId === routine.id ? (
                      <div className="inline-confirm">
                        <span>{en ? "Delete this task?" : "削除しますか？"}</span>
                        <button
                          type="button"
                          aria-label={en ? `Delete ${routine.title}` : `${routine.title}を削除する`}
                          onClick={() => { onDeleteCustom(routine.id); setDeleteId(null); }}
                        >
                          {en ? "Delete" : "削除"}
                        </button>
                        <button type="button" onClick={() => setDeleteId(null)}>{en ? "Back" : "戻る"}</button>
                      </div>
                    ) : (
                      <div className="row-actions">
                        <button
                          type="button"
                          aria-label={en ? `Edit ${routine.title}` : `${routine.title}を編集`}
                          onClick={() => beginEdit(routine)}
                        >
                          {en ? "Edit" : "編集"}
                        </button>
                        <button
                          type="button"
                          aria-label={en ? `Delete ${routine.title}` : `${routine.title}を削除`}
                          onClick={() => setDeleteId(routine.id)}
                        >
                          {en ? "Delete" : "削除"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : <p className="settings-empty">{en ? "No personal tasks yet." : "自分の項目はまだありません。"}</p>}

            <form className="custom-form" onSubmit={submitCustom}>
              <div className="custom-form-title">
                <strong>{editingId ? (en ? "Edit personal task" : "自分の項目を編集") : (en ? "+ Add a personal task" : "＋ 自分の項目を追加")}</strong>
                {editingId ? <button className="text-action" type="button" onClick={resetCustomForm}>{en ? "Cancel editing" : "編集をやめる"}</button> : null}
              </div>
              <div className="custom-form-grid">
                <label>
                  <span>{en ? "Repeats" : "繰り返し"}</span>
                  <select value={frequency} onChange={(event) => setFrequency(event.target.value as RoutineFrequency)}>
                    <option value="daily">{en ? "Daily" : "毎日"}</option>
                    <option value="weekly">{en ? "Weekly" : "毎週"}</option>
                  </select>
                </label>
                <label className="wide-field">
                  <span>{en ? "Task name" : "項目名"}</span>
                  <input
                    value={title}
                    maxLength={MAX_CUSTOM_TITLE}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder={en ? "e.g. Organize storage" : "例：倉庫を整理"}
                  />
                </label>
                <label className="full-field">
                  <span>{en ? "Note (optional)" : "メモ（任意）"}</span>
                  <textarea
                    value={note}
                    maxLength={MAX_CUSTOM_NOTE}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder={en ? "A short note for yourself" : "自分だけに分かる短いメモ"}
                    rows={2}
                  />
                </label>
              </div>
              {customError ? <p className="form-error" role="alert">{customError}</p> : null}
              <button className="primary-action" type="submit">{editingId ? (en ? "Save changes" : "変更を保存") : (en ? "Add task" : "項目を追加")}</button>
            </form>
          </section>

          <ClanScheduleSettings
            locale={locale}
            settings={clanSchedule}
            onChange={onUpdateClanSchedule}
            timeZone={clanScheduleTimeZone}
            onTimeZoneChange={onUpdateClanScheduleTimeZone}
          />

          <section className="settings-section" aria-labelledby="notification-settings-title">
            <div className="settings-section-heading">
              <div>
                <span>5</span>
                <div>
                  <h3 id="notification-settings-title">{en ? "Home screen and notifications" : "ホーム画面と通知"}</h3>
                  <p>{en ? "Get alerts for favorite spawns and saved clan plans while this site is open." : "お気に入りの出現予定と登録したクラン予定を、サイトを開いている間にお知らせします。"}</p>
                </div>
              </div>
            </div>

            <div className="pwa-settings-grid">
              <div className="pwa-setting-card">
                <div>
                  <strong>{en ? "Add to Home Screen" : "ホーム画面に追加"}</strong>
                  <small>
                    {isStandalone
                      ? (en ? "Running as a Home Screen app." : "ホーム画面アプリとして起動中です。")
                      : canInstall
                        ? (en ? "Open it quickly like an app." : "アプリのように素早く開けます。")
                        : (en ? "You can also use Add to Home Screen from your browser menu." : "ブラウザメニューの「ホーム画面に追加」も利用できます。")}
                  </small>
                </div>
                {isStandalone ? (
                  <span className="setting-status good">{en ? "Added" : "追加済み"}</span>
                ) : canInstall ? (
                  <button type="button" onClick={() => void onInstall()}>{en ? "Add" : "追加する"}</button>
                ) : (
                  <span className="setting-status">{en ? "Browser action" : "ブラウザ操作"}</span>
                )}
              </div>

              <div className="pwa-setting-card notification-card">
                <div>
                  <strong>{en ? "Pre-spawn alerts" : "出現前の通知"}</strong>
                  <small>
                    {en
                      ? `${favoriteSpawnCount} favorite${favoriteSpawnCount === 1 ? "" : "s"} · ${clanReminderCount} clan reminder${clanReminderCount === 1 ? "" : "s"} · Scheduled alerts are unavailable after you close the page.`
                      : `お気に入り ${favoriteSpawnCount}件・クラン予定 ${clanReminderCount}件・ページを閉じた後の定刻通知には対応していません。`}
                  </small>
                </div>
                {notificationPermission === "unsupported" ? (
                  <span className="setting-status">{en ? "Unsupported" : "非対応"}</span>
                ) : notificationPermission === "denied" ? (
                  <span className="setting-status warning">{en ? "Blocked by browser" : "ブラウザで拒否中"}</span>
                ) : notificationPermission !== "granted" ? (
                  <button type="button" onClick={() => void onRequestNotificationPermission()}>
                    {en ? "Allow notifications" : "通知を許可"}
                  </button>
                ) : (
                  <label className="notification-toggle">
                    <input
                      type="checkbox"
                      checked={notificationSettings.enabled}
                      onChange={(event) => onUpdateNotificationSettings({
                        ...notificationSettings,
                        enabled: event.target.checked,
                      })}
                    />
                    <span>{notificationSettings.enabled ? (en ? "Alerts on" : "通知オン") : (en ? "Alerts off" : "通知オフ")}</span>
                  </label>
                )}
              </div>
            </div>

            {notificationPermission === "granted" ? (
              <div className="notification-options">
                <label>
                  <span>{en ? "Notify me before" : "何分前に知らせる"}</span>
                  <select
                    value={notificationSettings.leadMinutes}
                    onChange={(event) => onUpdateNotificationSettings({
                      ...notificationSettings,
                      leadMinutes: Number(event.target.value) as NotificationSettings["leadMinutes"],
                    })}
                  >
                    <option value="5">{en ? "5 minutes" : "5分前"}</option>
                    <option value="10">{en ? "10 minutes" : "10分前"}</option>
                    <option value="30">{en ? "30 minutes" : "30分前"}</option>
                  </select>
                </label>
                <button type="button" onClick={() => void onTestNotification()}>
                  {en ? "Test notification" : "テスト通知"}
                </button>
              </div>
            ) : null}
            <p className="notification-note">
              {en ? "We never request permission on first load. Choose alert targets with the stars under Upcoming spawns and in each saved clan plan." : "初回表示で勝手に許可を求めません。出現予定の☆と、登録したクラン予定ごとに通知対象を選べます。"}
            </p>
            {notificationMessage ? (
              <p
                className={`data-message${notificationMessageIsError ? " error" : ""}`}
                role="status"
              >
                {notificationMessage}
              </p>
            ) : null}
          </section>

          <section className="settings-section" aria-labelledby="data-settings-title">
            <div className="settings-section-heading">
              <div>
                <span>6</span>
                <div><h3 id="data-settings-title">{en ? "Data management" : "データ管理"}</h3><p>{en ? "Back up, restore, or reset selected data." : "バックアップ・復元と、項目ごとのリセットを行えます。"}</p></div>
              </div>
            </div>
            <div className="data-actions">
              <div>
                <div><strong>{en ? "Backup" : "バックアップ"}</strong><small>{en ? "Export level, checks, display settings, personal tasks, clan plans, and notification settings" : "レベル、チェック、表示設定、自分の項目、クラン予定、通知設定を書き出す"}</small></div>
                <button type="button" onClick={onExportData}>{en ? "Export" : "書き出す"}</button>
              </div>
              <div>
                <div><strong>{en ? "Restore from backup" : "バックアップから復元"}</strong><small>{en ? "Import a JSON file exported from this site" : "このサイトから書き出したJSONファイルを読み込む"}</small></div>
                <button type="button" onClick={() => importInputRef.current?.click()}>{en ? "Choose file" : "ファイルを選ぶ"}</button>
                <input
                  ref={importInputRef}
                  className="visually-hidden"
                  type="file"
                  tabIndex={-1}
                  accept="application/json,.json"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file && window.confirm(
                      en ? "This replaces the data on this device with the backup. We recommend exporting your current data first. Restore now?" : "現在の端末内データをバックアップ内容で置き換えます。先に書き出しておくことをおすすめします。復元しますか？",
                    )) {
                      void onImportData(file);
                    }
                    event.target.value = "";
                  }}
                />
              </div>
              <div>
                <div><strong>{en ? "Checklist progress" : "チェック状況"}</strong><small>{en ? "Clear daily and weekly completion only" : "日課・週課の完了だけを解除"}</small></div>
                {dataAction === "checks" ? (
                  <div className="inline-confirm">
                    <span>{en ? "Mark everything incomplete?" : "すべて未完了に戻しますか？"}</span>
                    <button type="button" onClick={() => { onResetChecks(); setDataAction(null); }}>{en ? "Reset" : "リセット"}</button>
                    <button type="button" onClick={() => setDataAction(null)}>{en ? "Back" : "戻る"}</button>
                  </div>
                ) : <button type="button" onClick={() => setDataAction("checks")}>{en ? "Reset checks" : "チェックをリセット"}</button>}
              </div>
              <div>
                <div><strong>{en ? "Personal tasks" : "自分の項目"}</strong><small>{en ? "Delete only the tasks you added" : "追加した項目だけをまとめて削除"}</small></div>
                {dataAction === "customs" ? (
                  <div className="inline-confirm">
                    <span>{en ? "Delete all personal tasks?" : "自分の項目をすべて削除しますか？"}</span>
                    <button type="button" onClick={() => { onDeleteAllCustom(); resetCustomForm(); setDataAction(null); }}>{en ? "Delete all" : "すべて削除"}</button>
                    <button type="button" onClick={() => setDataAction(null)}>{en ? "Back" : "戻る"}</button>
                  </div>
                ) : <button type="button" disabled={!customRoutines.length} onClick={() => setDataAction("customs")}>{en ? "Delete personal tasks" : "自分の項目を削除"}</button>}
              </div>
            </div>
            {dataMessage ? (
              <p
                className={`data-message${dataMessageIsError ? " error" : ""}`}
                role="status"
              >
                {dataMessage}
              </p>
            ) : null}
          </section>

          <aside className="local-data-note">
            <strong>{en ? "Saved only on this device" : "この端末だけに保存"}</strong>
            <p>{en ? "Your level, checks, display settings, personal tasks, clan plans, and notification settings are not sent elsewhere. They sync across tabs in the same browser, but not across devices. Export a backup before changing devices. Do not enter personal information." : "レベル、チェック、表示設定、自分の項目、クラン予定、通知設定は外部送信されません。同じブラウザのタブ間では反映されますが、端末間では同期されません。機種変更前はバックアップを書き出してください。個人情報は入力しないでください。"}</p>
          </aside>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
