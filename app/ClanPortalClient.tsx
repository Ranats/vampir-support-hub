"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ClanScheduleSettings from "./ClanScheduleSettings";
import {
  CLAN_CONTENT_META,
  CLAN_SCHEDULE_KEY,
  CLAN_WEEKDAY_LABELS,
  DEFAULT_CLAN_SCHEDULE_SETTINGS,
  nextClanOccurrence,
  parseClanScheduleSettings,
} from "./clan-schedule";
import {
  CLAN_SCHEDULE_TIME_ZONE_KEY,
  JAPAN_TIME_ZONE,
  clanScheduleTimeZoneSettings,
  detectBrowserTimeZone,
  formatClanTimeZoneName,
} from "./clan-time-zone";
import {
  CLAN_PORTAL_POLL_INTERVAL_MS,
  MAX_CLAN_PORTAL_NAME,
  buildClanPortalUrl,
  clanPortalAccessStorageKey,
  isClanPortalToken,
  mergeSharedScheduleIntoLocal,
  parseClanPortalSnapshot,
  parseStoredClanPortalAccess,
  preferredStoredClanPortalToken,
  toSharedClanSchedule,
  withStoredClanPortalToken,
  withoutStoredClanPortalToken,
  type ClanPortalCapability,
  type ClanPortalSnapshot,
  type SharedClanSchedule,
} from "./clan-portal";
import type { Locale } from "./localization";
import { replaceStorageValues } from "./storage-transaction";

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatInTimeZone(date: Date, timeZone: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "ja-JP", {
    timeZone,
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatUpdatedAt(value: string, locale: Locale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return locale === "en" ? "Update time unavailable" : "更新時刻不明";
  return locale === "en"
    ? `Updated ${formatInTimeZone(date, JAPAN_TIME_ZONE, locale)} JST`
    : `${formatInTimeZone(date, JAPAN_TIME_ZONE, locale)} JST更新`;
}

async function copyText(value: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall back to a temporary selection when clipboard permission is denied.
  }
  const textarea = document.createElement("textarea");
  try {
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}

function readStoredAccess(clanId: string) {
  try {
    return parseStoredClanPortalAccess(
      window.localStorage.getItem(clanPortalAccessStorageKey(clanId)),
    );
  } catch {
    return null;
  }
}

function storeAccess(clanId: string, token: string, capability: ClanPortalCapability): boolean {
  try {
    const next = withStoredClanPortalToken(readStoredAccess(clanId), capability, token);
    window.localStorage.setItem(
      clanPortalAccessStorageKey(clanId),
      JSON.stringify(next),
    );
    return true;
  } catch {
    return false;
  }
}

function removeStoredAccess(clanId: string, token?: string): string | null {
  try {
    if (!token) {
      window.localStorage.removeItem(clanPortalAccessStorageKey(clanId));
      return null;
    }
    const next = withoutStoredClanPortalToken(readStoredAccess(clanId), token);
    if (next) {
      window.localStorage.setItem(clanPortalAccessStorageKey(clanId), JSON.stringify(next));
    } else {
      window.localStorage.removeItem(clanPortalAccessStorageKey(clanId));
    }
    return preferredStoredClanPortalToken(next);
  } catch {
    // A blocked storage area must not keep an expired portal usable in memory.
    return null;
  }
}

function stripCapabilityFragment() {
  if (!window.location.hash) return;
  const cleanLocation = `${window.location.pathname}${window.location.search}`;
  try {
    window.history.replaceState(null, "", cleanLocation);
  } catch {
    try {
      window.location.hash = "";
    } catch {
      // History APIs are available in supported browsers; this is a final fallback.
    }
  }
}

export default function ClanPortalClient({
  clanId,
  initialNowMs,
  locale = "ja",
}: {
  clanId: string;
  initialNowMs: number;
  locale?: Locale;
}) {
  const en = locale === "en";
  const homeHref = en ? "/en" : "/";
  const [token, setToken] = useState<string | null>(null);
  const [tokenReady, setTokenReady] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [portal, setPortal] = useState<ClanPortalSnapshot | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftSchedule, setDraftSchedule] = useState<SharedClanSchedule | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [newViewUrl, setNewViewUrl] = useState("");
  const [now, setNow] = useState(() => new Date(initialNowMs));
  const [viewerTimeZone, setViewerTimeZone] = useState<string | null>(null);
  const dirtyRef = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1_000);
    const hydrationTimer = window.setTimeout(() => {
      setViewerTimeZone(detectBrowserTimeZone());
    }, 0);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(hydrationTimer);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const fragmentCapability = fragment.has("admin") ? "admin" : fragment.has("viewer") ? "viewer" : null;
      const fragmentToken = fragmentCapability ? fragment.get(fragmentCapability) : null;
      stripCapabilityFragment();
      const stored = readStoredAccess(clanId);
      const nextToken = isClanPortalToken(fragmentToken)
        ? fragmentToken
        : preferredStoredClanPortalToken(stored);
      if (nextToken) {
        setToken(nextToken);
      }
      setTokenReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [clanId]);

  async function refreshPortal(activeToken = token, silent = false, discardDraft = false) {
    if (!activeToken) return;
    if (!silent) setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/clan-portals/${clanId}`, {
        headers: { Authorization: `Bearer ${activeToken}` },
        cache: "no-store",
      });
      const payload = await response.json() as Record<string, unknown>;
      if (!response.ok) {
        if (response.status === 404) {
          const fallbackToken = removeStoredAccess(clanId, activeToken);
          setPortal(null);
          setToken(fallbackToken);
        }
        throw new Error(en
          ? "The shared schedule could not be loaded."
          : typeof payload.error === "string" ? payload.error : "読み込めませんでした。");
      }
      const nextPortal = parseClanPortalSnapshot(payload.portal);
      if (!nextPortal) {
        throw new Error(en ? "The shared schedule response could not be verified." : "共有予定を確認できませんでした。");
      }
      if (!storeAccess(clanId, activeToken, nextPortal.capability)) {
        setError(en
          ? "The shared key could not be saved in this browser. Keep the original shared link."
          : "このブラウザへ共有キーを保存できません。元の共有リンクを保管してください。");
      }
      if (!discardDraft && dirtyRef.current && portal && nextPortal.revision !== portal.revision) {
        setMessage(en
          ? "Another update has been saved while your edits remain unsaved. Reload the latest schedule before saving to avoid a conflict."
          : "別の更新が保存されています。手元の編集は未保存です。保存すると競合になるため、最新情報を読み直してください。");
        return;
      }
      setPortal(nextPortal);
      if (discardDraft || !dirtyRef.current) {
        if (discardDraft) dirtyRef.current = false;
        setDraftName(nextPortal.displayName);
        setDraftSchedule(nextPortal.schedule);
      }
      if (silent) setMessage(en ? "Updated to the latest shared schedule." : "最新の共有予定へ更新しました。");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : en ? "The shared schedule could not be loaded." : "読み込めませんでした。");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    const timer = window.setTimeout(() => void refreshPortal(token), 0);
    return () => window.clearTimeout(timer);
  // refreshPortal is intentionally driven by the capability token.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, clanId]);

  useEffect(() => {
    if (!token || portal?.capability !== "viewer") return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshPortal(token, true);
    }, CLAN_PORTAL_POLL_INTERVAL_MS);
    const handleFocus = () => void refreshPortal(token, true);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", handleFocus);
    };
  // Polling follows the active viewer capability.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, portal?.capability]);

  const editableSchedule = useMemo(() => (
    draftSchedule
      ? mergeSharedScheduleIntoLocal(draftSchedule, DEFAULT_CLAN_SCHEDULE_SETTINGS)
      : null
  ), [draftSchedule]);

  function acceptManualToken() {
    if (!isClanPortalToken(manualToken.trim())) {
      setError(en ? "Check the shared key format." : "共有キーの形式を確認してください。");
      return;
    }
    const nextToken = manualToken.trim();
    setToken(nextToken);
    setManualToken("");
  }

  function forgetAccess() {
    removeStoredAccess(clanId);
    setPortal(null);
    setToken(null);
    setError("");
    setMessage("");
  }

  async function savePortal() {
    if (!token || !portal || !draftSchedule) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/clan-portals/${clanId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: draftName,
          schedule: draftSchedule,
          expectedRevision: portal.revision,
        }),
      });
      const payload = await response.json() as Record<string, unknown>;
      if (!response.ok) {
        throw new Error(en
          ? "The shared schedule could not be saved."
          : typeof payload.error === "string" ? payload.error : "保存できませんでした。");
      }
      const nextPortal = parseClanPortalSnapshot(payload.portal);
      if (!nextPortal) {
        throw new Error(en ? "The saved result could not be verified." : "保存結果を確認できませんでした。");
      }
      dirtyRef.current = false;
      setPortal(nextPortal);
      setDraftName(nextPortal.displayName);
      setDraftSchedule(nextPortal.schedule);
      setMessage(en ? "Updated the schedule shared with clan members." : "クランメンバーへ共有する予定を更新しました。");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : en ? "The shared schedule could not be saved." : "保存できませんでした。");
    } finally {
      setSaving(false);
    }
  }

  async function reloadPortal() {
    if (!token) return;
    if (dirtyRef.current && !window.confirm(en
      ? "Discard your unsaved edits and reload the latest shared schedule?"
      : "未保存の編集を破棄して、最新の共有予定を読み直しますか？")) {
      return;
    }
    setMessage("");
    await refreshPortal(token, false, true);
  }

  function importToThisDevice() {
    if (!portal) return;
    setError("");
    try {
      const current = parseClanScheduleSettings(window.localStorage.getItem(CLAN_SCHEDULE_KEY));
      const merged = mergeSharedScheduleIntoLocal(portal.schedule, current);
      replaceStorageValues(window.localStorage, new Map([
        [CLAN_SCHEDULE_KEY, JSON.stringify(merged)],
        [
          CLAN_SCHEDULE_TIME_ZONE_KEY,
          JSON.stringify(clanScheduleTimeZoneSettings(portal.schedule.timeZone)),
        ],
      ]));
      setMessage(en
        ? "Copied the shared schedule and time zone to Daily Navigator on this device. Your personal reminder settings and completion were kept."
        : "共有予定とタイムゾーンをこの端末の日課ナビへ反映しました。個人のリマインダー設定と完了状況は維持しています。");
    } catch {
      setError(en
        ? "The schedule could not be saved in this browser. Check your storage settings."
        : "このブラウザへ予定を保存できません。ストレージ設定を確認してください。");
    }
  }

  async function copyPortalLink(value: string) {
    setError("");
    const copied = await copyText(value);
    if (copied) {
      setMessage(en ? "Copied the viewer link." : "閲覧リンクをコピーしました。");
    } else {
      setError(en
        ? "The link could not be copied. Copy it manually from the field."
        : "リンクをコピーできませんでした。入力欄から手動でコピーしてください。");
    }
  }

  async function rotateViewLink() {
    if (!token || !portal || portal.capability !== "admin" || rotating) return;
    setError("");
    setRotating(true);
    try {
      const response = await fetch(`/api/clan-portals/${clanId}/rotate-view`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json() as Record<string, unknown>;
      if (!response.ok || !isClanPortalToken(payload.viewToken)) {
        setError(en
          ? "A new viewer link could not be issued."
          : typeof payload.error === "string" ? payload.error : "閲覧リンクを再発行できませんでした。");
        return;
      }
      setNewViewUrl(buildClanPortalUrl(window.location.origin, clanId, "viewer", payload.viewToken, locale));
      setMessage(en
        ? "Issued a new viewer link. The previous viewer link is now invalid."
        : "新しい閲覧リンクを発行しました。以前の閲覧リンクは無効です。");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : en ? "A new viewer link could not be issued." : "閲覧リンクを再発行できませんでした。");
    } finally {
      setRotating(false);
    }
  }

  async function removePortal() {
    if (!token || !portal || portal.capability !== "admin" || deleting) return;
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/clan-portals/${clanId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const payload = await response.json() as Record<string, unknown>;
        setError(en
          ? "The shared portal could not be deleted."
          : typeof payload.error === "string" ? payload.error : "削除できませんでした。");
        return;
      }
      removeStoredAccess(clanId);
      setPortal(null);
      setToken(null);
      setMessage(en ? "Deleted the shared clan portal." : "クラン共有ポータルを削除しました。");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : en ? "The shared portal could not be deleted." : "削除できませんでした。");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="clan-portal-shell">
      <header className="clan-portal-topbar">
        <Link className="brand" href={homeHref} aria-label={en ? "Back to VAMPIR Daily Navigator" : "VAMPIR 日課ナビへ戻る"}>
          <span className="brand-mark" aria-hidden="true">V</span>
          <span><strong>VAMPIR</strong><small>{en ? "Daily Navigator" : "日課ナビ"}</small></span>
        </Link>
        <Link className="policy-back" href={homeHref}>{en ? "Back to Daily Navigator" : "日課ナビへ戻る"}</Link>
      </header>

      <div className="clan-portal-main">
        {!tokenReady || loading ? <p className="portal-loading" role="status">{en ? "Loading the shared schedule…" : "共有予定を読み込んでいます…"}</p> : null}

        {tokenReady && !token ? (
          <section className="portal-access-card panel" aria-labelledby="portal-access-title">
            <span className="eyebrow">PRIVATE LINK</span>
            <h1 id="portal-access-title">{en ? "Check the shared link" : "共有リンクを確認してください"}</h1>
            <p>{en
              ? "No shared key was found in this link. Open the complete link from your clan master or enter the shared key."
              : "リンクから共有キーを確認できませんでした。クランマスターから受け取った完全なリンクを開くか、共有キーを入力してください。"}</p>
            <label><span>{en ? "Shared key" : "共有キー"}</span><input value={manualToken} onChange={(event) => setManualToken(event.target.value)} /></label>
            <button className="primary-action" type="button" onClick={acceptManualToken}>{en ? "Open schedule" : "予定を開く"}</button>
          </section>
        ) : null}

        {tokenReady && token && !portal && !loading ? (
          <section className="portal-access-card panel" aria-labelledby="portal-retry-title">
            <span className="eyebrow">CONNECTION</span>
            <h1 id="portal-retry-title">{en ? "The shared schedule could not be loaded" : "共有予定を読み込めませんでした"}</h1>
            <p>{error || (en ? "Check your connection and try again." : "通信状態を確認して、もう一度お試しください。")}</p>
            <div className="inline-confirm">
              <button className="primary-action" type="button" onClick={() => void refreshPortal(token)}>{en ? "Try again" : "再試行"}</button>
              <button type="button" onClick={forgetAccess}>{en ? "Use a different shared key" : "別の共有キーを使う"}</button>
            </div>
          </section>
        ) : null}

        {portal ? (
          <>
            <div className="clan-portal-heading portal-heading-row">
              <div>
                <span className="eyebrow">CLAN PORTAL</span>
                <h1>{portal.displayName}</h1>
                <p>{en
                  ? "This schedule was shared by a clan administrator. Always follow the latest in-game information."
                  : "クラン管理者が共有した開催予定です。ゲーム内の最新案内を優先してください。"}</p>
              </div>
              <div className="portal-revision">
                <span>{portal.capability === "admin"
                  ? (en ? "Admin mode" : "管理モード")
                  : (en ? "Viewer mode" : "閲覧モード")}</span>
                <small>{formatUpdatedAt(portal.updatedAt, locale)}</small>
              </div>
            </div>

            {message ? <p className="form-success portal-message" role="status">{message}</p> : null}
            {error ? <p className="form-error portal-message" role="alert">{error}</p> : null}

            {portal.capability === "admin" && editableSchedule && draftSchedule ? (
              <section className="clan-portal-admin panel" aria-labelledby="portal-admin-title">
                <div className="portal-admin-head">
                  <div><span className="eyebrow">MASTER</span><h2 id="portal-admin-title">{en ? "Edit shared schedule" : "共有予定を編集"}</h2></div>
                  <button type="button" onClick={() => void reloadPortal()}>{en ? "Reload latest" : "最新情報を読み直す"}</button>
                </div>
                <label className="portal-name-field">
                  <span>{en ? "Clan name" : "クラン名"}</span>
                  <input
                    value={draftName}
                    maxLength={MAX_CLAN_PORTAL_NAME}
                    onChange={(event) => { dirtyRef.current = true; setDraftName(event.target.value); }}
                  />
                </label>
                <ClanScheduleSettings
                  settings={editableSchedule}
                  onChange={(next) => {
                    dirtyRef.current = true;
                    setDraftSchedule(toSharedClanSchedule(next, draftSchedule.timeZone));
                  }}
                  timeZone={draftSchedule.timeZone}
                  onTimeZoneChange={(timeZone) => {
                    dirtyRef.current = true;
                    setDraftSchedule({ ...draftSchedule, timeZone });
                  }}
                  locale={locale}
                  standalone
                  shared
                />
                <button className="primary-action portal-submit" type="button" disabled={saving} onClick={() => void savePortal()}>
                  {saving
                    ? (en ? "Saving…" : "保存中…")
                    : (en ? "Save schedule for members" : "メンバーへ共有する予定を保存")}
                </button>
              </section>
            ) : (
              <section className="clan-portal-view" aria-labelledby="portal-schedule-title">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">WEEKLY PLAN</span>
                    <h2 id="portal-schedule-title">{en ? "Clan schedule" : "クラン開催予定"}</h2>
                    <p className="portal-time-zone">
                      {en ? "Clan time zone" : "クラン予定のタイムゾーン"}:{" "}
                      <strong>{formatClanTimeZoneName(portal.schedule.timeZone, locale)}</strong>
                    </p>
                  </div>
                  <button type="button" onClick={() => void refreshPortal(token)}>{en ? "Refresh" : "更新"}</button>
                </div>
                <div className="clan-grid">
                  {CLAN_CONTENT_META.map((meta) => {
                    const shared = portal.schedule.items.find((item) => item.contentId === meta.contentId);
                    const local = shared ? { ...shared, reminder: false } : null;
                    const occurrence = local
                      ? nextClanOccurrence(local, now, portal.schedule.timeZone)
                      : null;
                    return (
                      <article className="clan-card panel" key={meta.contentId}>
                        <div className="clan-card-head"><div><span>SHARED</span><h3>{en
                          ? (meta.contentId === "clan-mission" ? "Clan Missions" : "Clan Guard")
                          : meta.name}</h3></div><small>{en ? "Set by admin" : "管理者入力"}</small></div>
                        {shared?.scheduled && occurrence ? (
                          <div className="portal-shared-schedule">
                            <strong>{en
                              ? `Every ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][shared.day]} at ${formatTime(shared.hour, shared.minute)} · ${portal.schedule.timeZone}`
                              : `毎週${CLAN_WEEKDAY_LABELS[shared.day]}曜 ${formatTime(shared.hour, shared.minute)}・${portal.schedule.timeZone}`}</strong>
                            <small>
                              {en ? "Next in clan time" : "次回（クラン時間）"}{" "}
                              {formatInTimeZone(occurrence.startsAt, portal.schedule.timeZone, locale)}
                            </small>
                            {viewerTimeZone && viewerTimeZone !== portal.schedule.timeZone ? (
                              <small>
                                {en ? "Your local time" : "あなたの現地時間"}{" "}
                                {formatInTimeZone(occurrence.startsAt, viewerTimeZone, locale)}{" "}
                                ({viewerTimeZone})
                              </small>
                            ) : null}
                          </div>
                        ) : <p className="portal-unscheduled">{en ? "No schedule has been added." : "開催予定は未登録です。"}</p>}
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="portal-personal-actions panel" aria-labelledby="portal-personal-title">
              <div><h2 id="portal-personal-title">{en ? "Copy to your Daily Navigator" : "自分の日課ナビへ反映"}</h2><p>{en
                ? "The shared schedule and clan time zone are copied together. Personal reminders and completion are not overwritten."
                : "共有予定とクラン予定のタイムゾーンを一緒にコピーします。個人のリマインダー設定と完了状況は上書きしません。"}</p></div>
              <button type="button" onClick={importToThisDevice}>{en ? "Copy to this device" : "この端末へ反映"}</button>
            </section>

            {portal.capability === "admin" ? (
              <details className="portal-admin-tools panel">
                <summary>{en ? "Admin link and portal management" : "管理リンク・ポータル管理"}</summary>
                <div className="portal-admin-tool-body">
                  <div>
                    <strong>{en ? "Replace the member viewer link" : "メンバー閲覧リンクを再発行"}</strong>
                    <p>{en ? "Invalidate the current viewer link and issue a new one." : "現在の閲覧リンクを無効にし、新しいリンクを発行します。"}</p>
                    <button type="button" disabled={rotating} onClick={() => void rotateViewLink()}>{rotating
                      ? (en ? "Issuing…" : "再発行中…")
                      : (en ? "Issue new viewer link" : "閲覧リンクを再発行")}</button>
                    {newViewUrl ? (
                      <div className="portal-link-card">
                        <input readOnly value={newViewUrl} aria-label={en ? "New member viewer link" : "新しいメンバー閲覧リンク"} />
                        <button type="button" onClick={() => void copyPortalLink(newViewUrl)}>{en ? "Copy" : "コピー"}</button>
                      </div>
                    ) : null}
                  </div>
                  <div className="portal-delete-zone">
                    <strong>{en ? "Delete portal" : "ポータルを削除"}</strong>
                    <p>{en ? "Invalidate the shared schedule and every link. This cannot be undone." : "共有予定とすべてのリンクを無効にします。元に戻せません。"}</p>
                    {deleteConfirm ? (
                      <div className="inline-confirm">
                        <button type="button" disabled={deleting} onClick={() => void removePortal()}>{deleting
                          ? (en ? "Deleting…" : "削除中…")
                          : (en ? "Delete" : "削除する")}</button>
                        <button type="button" onClick={() => setDeleteConfirm(false)}>{en ? "Back" : "戻る"}</button>
                      </div>
                    ) : <button type="button" onClick={() => setDeleteConfirm(true)}>{en ? "Confirm deletion" : "削除を確認"}</button>}
                  </div>
                </div>
              </details>
            ) : null}
          </>
        ) : null}

        {!portal && !token && error ? <p className="form-error portal-message" role="alert">{error}</p> : null}
        {!portal && message ? <p className="form-success portal-message" role="status">{message}</p> : null}
      </div>
    </main>
  );
}
