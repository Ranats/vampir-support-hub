"use client";

import { useEffect } from "react";
import { LANGUAGE_KEY, preferredEnglishPath } from "./localization";

export default function LanguagePreferenceRedirect({
  page,
}: {
  page: "home" | "policy";
}) {
  useEffect(() => {
    const preferredPath = preferredEnglishPath(
      window.localStorage.getItem(LANGUAGE_KEY),
      page,
    );
    if (!preferredPath) return;

    window.location.replace(
      `${preferredPath}${window.location.search}${window.location.hash}`,
    );
  }, [page]);

  return null;
}
