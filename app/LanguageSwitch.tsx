"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  LANGUAGE_KEY,
  localePath,
  parseLocalePreference,
  type Locale,
} from "./localization";

export default function LanguageSwitch({
  locale,
  page,
}: {
  locale: Locale;
  page: "home" | "policy" | "schedule";
}) {
  useEffect(() => {
    const savedLocale = parseLocalePreference(
      window.localStorage.getItem(LANGUAGE_KEY),
    );
    if (locale === "en" || savedLocale === null) {
      window.localStorage.setItem(LANGUAGE_KEY, locale);
    }
  }, [locale]);

  return (
    <nav className="language-switch" aria-label={locale === "ja" ? "言語を選択" : "Choose language"}>
      <Link
        href={localePath("ja", page)}
        lang="ja"
        hrefLang="ja"
        aria-current={locale === "ja" ? "page" : undefined}
        onClick={() => window.localStorage.setItem(LANGUAGE_KEY, "ja")}
      >
        JA
      </Link>
      <span aria-hidden="true">/</span>
      <Link
        href={localePath("en", page)}
        lang="en"
        hrefLang="en"
        aria-current={locale === "en" ? "page" : undefined}
        onClick={() => window.localStorage.setItem(LANGUAGE_KEY, "en")}
      >
        EN
      </Link>
    </nav>
  );
}
