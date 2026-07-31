"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "./localization";

const SHARE_CONFIG = {
  ja: {
    url: "https://vampir.cilabworks.com/",
    title: "VAMPIR 日課ナビ",
    text: "VAMPIR 日課ナビで、次の出現時刻・日課・週課をまとめて確認できます。",
    hashtags: "VAMPIR日課ナビ,ヴァンピール",
  },
  en: {
    url: "https://vampir.cilabworks.com/en",
    title: "VAMPIR Daily Navigator",
    text: "Track upcoming VAMPIR spawns, daily tasks, and weekly tasks in one place.",
    hashtags: "VAMPIR日課ナビ,VAMPIR",
  },
} as const;

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5M5 12v6.5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V12" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

export default function ShareMenu({ locale = "ja" }: { locale?: Locale }) {
  const isEnglish = locale === "en";
  const share = SHARE_CONFIG[locale];
  const xShareUrl = `https://twitter.com/intent/tweet?${new URLSearchParams({
    text: share.text,
    url: share.url,
    hashtags: share.hashtags,
  }).toString()}`;
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(share.url);
      setMessage(isEnglish ? "URL copied" : "URLをコピーしました");
    } catch {
      window.prompt(isEnglish ? "Copy this URL" : "このURLをコピーしてください", share.url);
      setMessage(isEnglish ? "URL displayed" : "URLを表示しました");
    }
  }

  async function shareFromDevice() {
    if (typeof navigator.share !== "function") {
      await copyUrl();
      return;
    }

    try {
      await navigator.share({
        title: share.title,
        text: share.text,
        url: share.url,
      });
      setMessage(isEnglish ? "Sent to the share menu" : "共有メニューへ送りました");
      setOpen(false);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      await copyUrl();
    }
  }

  return (
    <div className="header-share-actions">
      <a
        className="x-share-trigger"
        href={xShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={isEnglish ? "Share VAMPIR Daily Navigator on X (external site)" : "XでVAMPIR 日課ナビをシェアする（外部サイト）"}
      >
        <span className="x-share-mark" aria-hidden="true">𝕏</span>
        <span className="x-share-label">{isEnglish ? "Share" : "でシェア"}</span>
      </a>

      <div className="share-control" ref={rootRef}>
        <button
          ref={triggerRef}
          className="share-trigger"
          type="button"
          aria-label={isEnglish ? "Open more sharing options" : "その他の共有メニューを開く"}
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => {
            setMessage("");
            setOpen((current) => !current);
          }}
        >
          <ShareIcon />
          <span>{isEnglish ? "More" : "その他共有"}</span>
        </button>

        <div className="share-menu" id={menuId} hidden={!open}>
          <div className="share-menu-heading">
            <strong>{isEnglish ? "More sharing options" : "その他の共有"}</strong>
            <small>{isEnglish ? "Share with an app or copy the URL" : "アプリで送るか、URLをコピーできます"}</small>
          </div>
          <button
            className="share-menu-item"
            type="button"
            onClick={shareFromDevice}
          >
            <span className="share-menu-icon"><ShareIcon /></span>
            <span><strong>{isEnglish ? "Share from this device" : "端末で共有"}</strong><small>{isEnglish ? "Copies the URL if unavailable" : "未対応の場合はURLをコピー"}</small></span>
            <span className="share-menu-arrow" aria-hidden="true">›</span>
          </button>
          <button
            className="share-menu-item"
            type="button"
            onClick={copyUrl}
          >
            <span className="share-menu-icon"><CopyIcon /></span>
            <span><strong>{isEnglish ? "Copy URL" : "URLをコピー"}</strong><small>{share.url}</small></span>
            <span className="share-menu-arrow" aria-hidden="true">›</span>
          </button>
          {message ? (
            <small className="share-menu-status" role="status" aria-live="polite">
              {message}
            </small>
          ) : null}
        </div>
      </div>
    </div>
  );
}
