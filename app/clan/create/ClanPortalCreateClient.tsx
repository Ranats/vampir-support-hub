"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import ClanScheduleSettings from "../../ClanScheduleSettings";
import {
  CLAN_SCHEDULE_KEY,
  DEFAULT_CLAN_SCHEDULE_SETTINGS,
  parseClanScheduleSettings,
} from "../../clan-schedule";
import {
  MAX_CLAN_PORTAL_NAME,
  buildClanPortalUrl,
  clanPortalAccessStorageKey,
  defaultSharedClanSchedule,
  isClanPortalToken,
  mergeSharedScheduleIntoLocal,
  parseClanPortalSnapshot,
  toSharedClanSchedule,
  type SharedClanSchedule,
} from "../../clan-portal";

type CreatedLinks = {
  adminUrl: string;
  viewUrl: string;
};

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

export default function ClanPortalCreateClient() {
  const [displayName, setDisplayName] = useState("");
  const [schedule, setSchedule] = useState<SharedClanSchedule>(defaultSharedClanSchedule);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [links, setLinks] = useState<CreatedLinks | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSchedule(toSharedClanSchedule(parseClanScheduleSettings(
        window.localStorage.getItem(CLAN_SCHEDULE_KEY),
      )));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const editableSchedule = useMemo(
    () => mergeSharedScheduleIntoLocal(schedule, DEFAULT_CLAN_SCHEDULE_SETTINGS),
    [schedule],
  );

  async function createPortal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!displayName.trim()) {
      setError("クラン名を入力してください。");
      return;
    }

    setCreating(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/clan-portals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, schedule }),
      });
      const payload = await response.json() as Record<string, unknown>;
      if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "作成できませんでした。");

      const portal = parseClanPortalSnapshot(payload.portal);
      const viewToken = payload.viewToken;
      const adminToken = payload.adminToken;
      if (!portal || !isClanPortalToken(viewToken) || !isClanPortalToken(adminToken)) {
        throw new Error("作成結果を確認できませんでした。");
      }

      const origin = window.location.origin;
      const createdLinks = {
        viewUrl: buildClanPortalUrl(origin, portal.id, "viewer", viewToken),
        adminUrl: buildClanPortalUrl(origin, portal.id, "admin", adminToken),
      };
      setLinks(createdLinks);
      try {
        window.localStorage.setItem(
          clanPortalAccessStorageKey(portal.id),
          JSON.stringify({ version: 1, adminToken }),
        );
        setMessage("クラン共有ポータルを作成しました。管理リンクは再表示できないため、安全な場所に保管してください。");
      } catch {
        setMessage("ポータルは作成できましたが、この端末へ管理キーを保存できません。移動する前に管理リンクを必ずコピーしてください。");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "作成できませんでした。");
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="clan-portal-shell">
      <header className="clan-portal-topbar">
        <Link className="brand" href="/" aria-label="VAMPIR 日課ナビへ戻る">
          <span className="brand-mark" aria-hidden="true">V</span>
          <span><strong>VAMPIR</strong><small>日課ナビ</small></span>
        </Link>
        <Link className="policy-back" href="/">日課ナビへ戻る</Link>
      </header>

      <div className="clan-portal-main">
        <div className="clan-portal-heading">
          <span className="eyebrow">CLAN PORTAL</span>
          <h1>クラン共有ポータルを作成</h1>
          <p>クランマスターが曜日と時刻を保存すると、閲覧リンクを持つメンバー全員が同じ予定を確認できます。</p>
        </div>

        {links ? (
          <section className="clan-portal-created panel" aria-labelledby="portal-created-title">
            <div>
              <span className="status-pill good">作成完了</span>
              <h2 id="portal-created-title">2種類のリンクを保存してください</h2>
              {message ? <p className="form-success" role="status">{message}</p> : null}
            </div>
            <div className="portal-link-card">
              <div><strong>メンバー閲覧リンク</strong><small>クランメンバーへ共有するリンク</small></div>
              <input readOnly value={links.viewUrl} aria-label="メンバー閲覧リンク" />
              <button type="button" onClick={() => void copyText(links.viewUrl)}>コピー</button>
            </div>
            <div className="portal-link-card danger">
              <div><strong>クランマスター管理リンク</strong><small>予定の変更・閲覧リンク再発行・削除が可能。共有しないでください。</small></div>
              <input readOnly value={links.adminUrl} aria-label="クランマスター管理リンク" />
              <button type="button" onClick={() => void copyText(links.adminUrl)}>コピー</button>
            </div>
            <a className="primary-action portal-open-link" href={links.adminUrl}>管理ページを開く</a>
          </section>
        ) : (
          <form className="clan-portal-form panel" onSubmit={createPortal}>
            <label className="portal-name-field">
              <span>クラン名</span>
              <input
                value={displayName}
                maxLength={MAX_CLAN_PORTAL_NAME}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="例：深紅の夜"
                autoComplete="organization"
              />
            </label>

            <ClanScheduleSettings
              settings={editableSchedule}
              onChange={(next) => setSchedule(toSharedClanSchedule(next))}
              standalone
              shared
            />

            <div className="portal-data-boundary">
              <strong>共有するデータ</strong>
              <p>クラン名と開催曜日・時刻だけをサーバーへ保存します。個人の完了状況、レベル、通知設定、ゲームアカウント情報は共有しません。</p>
            </div>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <button className="primary-action portal-submit" type="submit" disabled={creating}>
              {creating ? "作成中…" : "共有ポータルを作成"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
