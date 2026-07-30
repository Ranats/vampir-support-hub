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

type DefaultRoutineSummary = {
  id: string;
  title: string;
  note: string;
};

type SettingsSheetProps = {
  level: number | null;
  dailyDefaults: readonly DefaultRoutineSummary[];
  weeklyDefaults: readonly DefaultRoutineSummary[];
  hiddenDefaultIds: readonly string[];
  customRoutines: readonly CustomRoutine[];
  favoriteSpawnCount: number;
  notificationPermission: NotificationPermission | "unsupported";
  notificationSettings: NotificationSettings;
  canInstall: boolean;
  isStandalone: boolean;
  notificationMessage: string;
  dataMessage: string;
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
  onUpdateNotificationSettings: (settings: NotificationSettings) => void;
  onRequestNotificationPermission: () => Promise<void>;
  onTestNotification: () => Promise<void>;
  onInstall: () => Promise<void>;
  onExportData: () => void;
  onImportData: (file: File) => Promise<void>;
};

export default function SettingsSheet({
  level,
  dailyDefaults,
  weeklyDefaults,
  hiddenDefaultIds,
  customRoutines,
  favoriteSpawnCount,
  notificationPermission,
  notificationSettings,
  canInstall,
  isStandalone,
  notificationMessage,
  dataMessage,
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
  onUpdateNotificationSettings,
  onRequestNotificationPermission,
  onTestNotification,
  onInstall,
  onExportData,
  onImportData,
}: SettingsSheetProps) {
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
      setLevelError("1〜200の整数で入力してください。");
      return;
    }
    onSaveLevel(numeric);
    setLevelError("");
  }

  function submitCustom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = { title, note, frequency };
    if (!title.trim()) {
      setCustomError("項目名を入力してください。");
      return;
    }

    if (editingId) {
      onUpdateCustom(editingId, input);
      resetCustomForm();
      return;
    }

    if (!onAddCustom(input)) {
      setCustomError(`追加できる自分の項目は${MAX_CUSTOM_ROUTINES}件までです。`);
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
            <span className="eyebrow">PERSONALIZE</span>
            <h2 id="settings-title">表示とチェックリスト設定</h2>
          </div>
          <button className="settings-close" type="button" onClick={onClose} autoFocus>
            閉じる
          </button>
        </header>

        <div className="settings-body">
          <section className="settings-section" aria-labelledby="level-settings-title">
            <div className="settings-section-heading">
              <div>
                <span>1</span>
                <div><h3 id="level-settings-title">キャラクターレベル</h3><p>ゲームとは連携せず、Today候補・進捗・出現予定だけを絞ります。</p></div>
              </div>
            </div>
            <div className="level-explanation">
              <strong>{level ? `現在 Lv${level}で絞り込み中` : "現在は未設定・すべて表示"}</strong>
              <ul>
                <li>未解放の日課・週課をToday候補と進捗率から除外</li>
                <li>参加できるゲヘナの出現予定だけを表示</li>
              </ul>
            </div>
            <form className="level-form" onSubmit={submitLevel}>
              <label>
                <span>キャラLv</span>
                <input
                  type="number"
                  min="1"
                  max="200"
                  inputMode="numeric"
                  value={levelDraft}
                  onChange={(event) => setLevelDraft(event.target.value)}
                  placeholder="例：55"
                />
              </label>
              <button className="primary-action" type="submit">レベルを保存</button>
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
                  未設定に戻す
                </button>
              ) : null}
            </form>
            {levelError ? <p className="form-error" role="alert">{levelError}</p> : null}
          </section>

          <section className="settings-section" aria-labelledby="visibility-settings-title">
            <div className="settings-section-heading split">
              <div>
                <span>2</span>
                <div><h3 id="visibility-settings-title">既定項目の表示</h3><p>不要な項目は非表示にできます。チェック履歴は消えません。</p></div>
              </div>
              {hiddenDefaultIds.length ? (
                <button className="text-action" type="button" onClick={onRestoreDefaults}>すべて表示</button>
              ) : null}
            </div>
            <div className="visibility-grid">
              {visibilityGroup("毎日", dailyDefaults)}
              {visibilityGroup("毎週", weeklyDefaults)}
            </div>
          </section>

          <section className="settings-section" aria-labelledby="custom-settings-title">
            <div className="settings-section-heading">
              <div>
                <span>3</span>
                <div><h3 id="custom-settings-title">自分の項目</h3><p>自分用メモとして追加します。サイトが確認した攻略情報とは別扱いです。</p></div>
              </div>
            </div>

            {customRoutines.length ? (
              <div className="custom-manager-list">
                {customRoutines.map((routine) => (
                  <div className="custom-manager-row" key={routine.id}>
                    <div>
                      <span>{routine.frequency === "daily" ? "毎日" : "毎週"}</span>
                      <strong>{routine.title}</strong>
                      {routine.note ? <small>{routine.note}</small> : null}
                    </div>
                    {deleteId === routine.id ? (
                      <div className="inline-confirm">
                        <span>削除しますか？</span>
                        <button
                          type="button"
                          aria-label={`${routine.title}を削除する`}
                          onClick={() => { onDeleteCustom(routine.id); setDeleteId(null); }}
                        >
                          削除
                        </button>
                        <button type="button" onClick={() => setDeleteId(null)}>戻る</button>
                      </div>
                    ) : (
                      <div className="row-actions">
                        <button
                          type="button"
                          aria-label={`${routine.title}を編集`}
                          onClick={() => beginEdit(routine)}
                        >
                          編集
                        </button>
                        <button
                          type="button"
                          aria-label={`${routine.title}を削除`}
                          onClick={() => setDeleteId(routine.id)}
                        >
                          削除
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : <p className="settings-empty">自分の項目はまだありません。</p>}

            <form className="custom-form" onSubmit={submitCustom}>
              <div className="custom-form-title">
                <strong>{editingId ? "自分の項目を編集" : "＋ 自分の項目を追加"}</strong>
                {editingId ? <button className="text-action" type="button" onClick={resetCustomForm}>編集をやめる</button> : null}
              </div>
              <div className="custom-form-grid">
                <label>
                  <span>繰り返し</span>
                  <select value={frequency} onChange={(event) => setFrequency(event.target.value as RoutineFrequency)}>
                    <option value="daily">毎日</option>
                    <option value="weekly">毎週</option>
                  </select>
                </label>
                <label className="wide-field">
                  <span>項目名</span>
                  <input
                    value={title}
                    maxLength={MAX_CUSTOM_TITLE}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="例：倉庫を整理"
                  />
                </label>
                <label className="full-field">
                  <span>メモ（任意）</span>
                  <textarea
                    value={note}
                    maxLength={MAX_CUSTOM_NOTE}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="自分だけに分かる短いメモ"
                    rows={2}
                  />
                </label>
              </div>
              {customError ? <p className="form-error" role="alert">{customError}</p> : null}
              <button className="primary-action" type="submit">{editingId ? "変更を保存" : "項目を追加"}</button>
            </form>
          </section>

          <section className="settings-section" aria-labelledby="notification-settings-title">
            <div className="settings-section-heading">
              <div>
                <span>4</span>
                <div>
                  <h3 id="notification-settings-title">ホーム画面と通知</h3>
                  <p>お気に入りにした出現予定を、サイトを開いている間にお知らせします。</p>
                </div>
              </div>
            </div>

            <div className="pwa-settings-grid">
              <div className="pwa-setting-card">
                <div>
                  <strong>ホーム画面に追加</strong>
                  <small>
                    {isStandalone
                      ? "ホーム画面アプリとして起動中です。"
                      : canInstall
                        ? "アプリのように素早く開けます。"
                        : "ブラウザメニューの「ホーム画面に追加」も利用できます。"}
                  </small>
                </div>
                {isStandalone ? (
                  <span className="setting-status good">追加済み</span>
                ) : canInstall ? (
                  <button type="button" onClick={() => void onInstall()}>追加する</button>
                ) : (
                  <span className="setting-status">ブラウザ操作</span>
                )}
              </div>

              <div className="pwa-setting-card notification-card">
                <div>
                  <strong>出現前の通知</strong>
                  <small>
                    お気に入り {favoriteSpawnCount}件・ページを閉じた後の定刻通知には対応していません。
                  </small>
                </div>
                {notificationPermission === "unsupported" ? (
                  <span className="setting-status">非対応</span>
                ) : notificationPermission === "denied" ? (
                  <span className="setting-status warning">ブラウザで拒否中</span>
                ) : notificationPermission !== "granted" ? (
                  <button type="button" onClick={() => void onRequestNotificationPermission()}>
                    通知を許可
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
                    <span>{notificationSettings.enabled ? "通知オン" : "通知オフ"}</span>
                  </label>
                )}
              </div>
            </div>

            {notificationPermission === "granted" ? (
              <div className="notification-options">
                <label>
                  <span>何分前に知らせる</span>
                  <select
                    value={notificationSettings.leadMinutes}
                    onChange={(event) => onUpdateNotificationSettings({
                      ...notificationSettings,
                      leadMinutes: Number(event.target.value) as NotificationSettings["leadMinutes"],
                    })}
                  >
                    <option value="5">5分前</option>
                    <option value="10">10分前</option>
                    <option value="30">30分前</option>
                  </select>
                </label>
                <button type="button" onClick={() => void onTestNotification()}>
                  テスト通知
                </button>
              </div>
            ) : null}
            <p className="notification-note">
              初回表示で勝手に許可を求めません。通知対象は「次の出現予定」の☆で選べます。
            </p>
            {notificationMessage ? (
              <p
                className={`data-message${/できません|拒否|対応していません|有効になりません/.test(notificationMessage) ? " error" : ""}`}
                role="status"
              >
                {notificationMessage}
              </p>
            ) : null}
          </section>

          <section className="settings-section" aria-labelledby="data-settings-title">
            <div className="settings-section-heading">
              <div>
                <span>5</span>
                <div><h3 id="data-settings-title">データ管理</h3><p>バックアップ・復元と、項目ごとのリセットを行えます。</p></div>
              </div>
            </div>
            <div className="data-actions">
              <div>
                <div><strong>バックアップ</strong><small>レベル、チェック、表示設定、自分の項目、通知設定を書き出す</small></div>
                <button type="button" onClick={onExportData}>書き出す</button>
              </div>
              <div>
                <div><strong>バックアップから復元</strong><small>このサイトから書き出したJSONファイルを読み込む</small></div>
                <button type="button" onClick={() => importInputRef.current?.click()}>ファイルを選ぶ</button>
                <input
                  ref={importInputRef}
                  className="visually-hidden"
                  type="file"
                  tabIndex={-1}
                  accept="application/json,.json"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file && window.confirm(
                      "現在の端末内データをバックアップ内容で置き換えます。先に書き出しておくことをおすすめします。復元しますか？",
                    )) {
                      void onImportData(file);
                    }
                    event.target.value = "";
                  }}
                />
              </div>
              <div>
                <div><strong>チェック状況</strong><small>日課・週課の完了だけを解除</small></div>
                {dataAction === "checks" ? (
                  <div className="inline-confirm">
                    <span>すべて未完了に戻しますか？</span>
                    <button type="button" onClick={() => { onResetChecks(); setDataAction(null); }}>リセット</button>
                    <button type="button" onClick={() => setDataAction(null)}>戻る</button>
                  </div>
                ) : <button type="button" onClick={() => setDataAction("checks")}>チェックをリセット</button>}
              </div>
              <div>
                <div><strong>自分の項目</strong><small>追加した項目だけをまとめて削除</small></div>
                {dataAction === "customs" ? (
                  <div className="inline-confirm">
                    <span>自分の項目をすべて削除しますか？</span>
                    <button type="button" onClick={() => { onDeleteAllCustom(); resetCustomForm(); setDataAction(null); }}>すべて削除</button>
                    <button type="button" onClick={() => setDataAction(null)}>戻る</button>
                  </div>
                ) : <button type="button" disabled={!customRoutines.length} onClick={() => setDataAction("customs")}>自分の項目を削除</button>}
              </div>
            </div>
            {dataMessage ? (
              <p
                className={`data-message${/できません|拒否|対応していません|有効になりません/.test(dataMessage) ? " error" : ""}`}
                role="status"
              >
                {dataMessage}
              </p>
            ) : null}
          </section>

          <aside className="local-data-note">
            <strong>この端末だけに保存</strong>
            <p>レベル、チェック、表示設定、自分の項目、通知設定は外部送信されません。同じブラウザのタブ間では反映されますが、端末間では同期されません。機種変更前はバックアップを書き出してください。個人情報は入力しないでください。</p>
          </aside>
        </div>
      </section>
    </div>
  );
}
