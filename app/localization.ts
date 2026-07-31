export const LANGUAGE_KEY = "vampir-language-v1";

export type Locale = "ja" | "en";

export function parseLocalePreference(value: string | null): Locale | null {
  return value === "ja" || value === "en" ? value : null;
}

export function localePath(locale: Locale, path: "home" | "policy") {
  if (locale === "en") return path === "home" ? "/en" : "/en/policy";
  return path === "home" ? "/" : "/policy";
}

export function preferredEnglishPath(
  value: string | null,
  page: "home" | "policy",
) {
  return parseLocalePreference(value) === "en" ? localePath("en", page) : null;
}
