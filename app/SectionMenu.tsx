"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "./localization";

const SECTIONS = [
  { href: "#today", code: "01", ja: "今日やること", en: "Today" },
  { href: "#checklists", code: "02", ja: "日課・週課", en: "Checklists" },
  { href: "#clan", code: "03", ja: "クラン予定", en: "Clan plans" },
  { href: "#schedule", code: "04", ja: "次の出現予定", en: "Spawn times" },
  { href: "#events", code: "05", ja: "イベント進捗", en: "Event progress" },
  { href: "#info", code: "06", ja: "情報源・運営情報", en: "Sources and site info" },
] as const;

export default function SectionMenu({ locale = "ja" }: { locale?: Locale }) {
  const en = locale === "en";
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

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

  return (
    <div className="section-menu-control" ref={rootRef}>
      <button
        className="section-menu-trigger"
        ref={triggerRef}
        type="button"
        aria-label={en ? "Open section navigation" : "セクション一覧を開く"}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="section-menu-icon" aria-hidden="true"><i /><i /><i /></span>
        <span>{en ? "Sections" : "セクション"}</span>
      </button>

      <nav
        className="section-menu-panel"
        id={menuId}
        aria-label={en ? "Page sections" : "ページ内セクション"}
        hidden={!open}
      >
        <div className="section-menu-heading">
          <strong>{en ? "Jump to a section" : "見たい項目へ移動"}</strong>
          <small>{en ? "Go directly to any main area" : "主要な6項目へすぐ移動できます"}</small>
        </div>
        <div className="section-menu-links">
          {SECTIONS.map((section) => (
            <a href={section.href} key={section.href} onClick={() => setOpen(false)}>
              <span>{section.code}</span>
              <strong>{en ? section.en : section.ja}</strong>
              <b aria-hidden="true">↓</b>
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}
