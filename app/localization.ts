export const LANGUAGE_KEY = "vampir-language-v1";

export type Locale = "ja" | "en";

export function parseLocalePreference(value: string | null): Locale | null {
  return value === "ja" || value === "en" ? value : null;
}

export function localePath(locale: Locale, path: "home" | "policy" | "schedule") {
  if (locale === "en") {
    if (path === "home") return "/en";
    return path === "policy" ? "/en/policy" : "/en/schedule";
  }
  if (path === "home") return "/";
  return path === "policy" ? "/policy" : "/schedule";
}

export function preferredEnglishPath(
  value: string | null,
  page: "home" | "policy" | "schedule",
) {
  return parseLocalePreference(value) === "en" ? localePath("en", page) : null;
}
