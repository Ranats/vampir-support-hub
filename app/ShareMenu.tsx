"use client";

import { useEffect, useId, useRef, useState } from "react";

const SHARE_URL = "https://vampir.cilabworks.com/";
const SHARE_TEXT = "VAMPIR 日課ナビ｜次の出現時刻・日課・週課をまとめて確認";
const X_SHARE_URL = `https://twitter.com/intent/tweet?${new URLSearchParams({
  text: SHARE_TEXT,
  url: SHARE_URL,
  hashtags: "VAMPIR,ヴァンピール",
}).toString()}`;

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

export default function ShareMenu() {
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
      await navigator.clipboard.writeText(SHARE_URL);
      setMessage("URLをコピーしました");
    } catch {
      window.prompt("このURLをコピーしてください", SHARE_URL);
      setMessage("URLを表示しました");
    }
  }

  async function shareFromDevice() {
    if (typeof navigator.share !== "function") {
      await copyUrl();
      return;
    }

    try {
      await navigator.share({
        title: "VAMPIR 日課ナビ",
        text: SHARE_TEXT,
        url: SHARE_URL,
      });
      setMessage("共有メニューへ送りました");
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
        href={X_SHARE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="XでVAMPIR 日課ナビを共有する（外部サイト）"
      >
        <span className="x-share-mark" aria-hidden="true">X</span>
        <span className="x-share-label">で共有</span>
      </a>

      <div className="share-control" ref={rootRef}>
        <button
          ref={triggerRef}
          className="share-trigger"
          type="button"
          aria-label="その他の共有メニューを開く"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => {
            setMessage("");
            setOpen((current) => !current);
          }}
        >
          <ShareIcon />
          <span>その他共有</span>
        </button>

        <div className="share-menu" id={menuId} hidden={!open}>
          <div className="share-menu-heading">
            <strong>その他の共有</strong>
            <small>アプリで送るか、URLをコピーできます</small>
          </div>
          <button
            className="share-menu-item"
            type="button"
            onClick={shareFromDevice}
          >
            <span className="share-menu-icon"><ShareIcon /></span>
            <span><strong>端末で共有</strong><small>未対応の場合はURLをコピー</small></span>
            <span className="share-menu-arrow" aria-hidden="true">›</span>
          </button>
          <button
            className="share-menu-item"
            type="button"
            onClick={copyUrl}
          >
            <span className="share-menu-icon"><CopyIcon /></span>
            <span><strong>URLをコピー</strong><small>{SHARE_URL}</small></span>
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
