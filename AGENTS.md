# Project guidance

## Project scope

- Repository source of truth: the `main` branch on GitHub. Keep the local `main` branch aligned with it before starting new work.
- Source of truth: `app/game-content.ts` for displayed schedules, routines, source classifications, verification dates, and validators; `app/HomeClient.tsx` for clan plans and localized UI; `app/clan-time-zone.ts` for personal clan time-zone storage and defaults; `db/schema.ts` and `app/clan-portal.ts` for shared clan portal data; `docs/TRAFFIC_MONETIZATION_ROADMAP.md` for PV stages and monetization decisions; linked official VAMPIR pages and dated reference articles for factual values.
- Read order: `AGENTS.md`, localized route pages and layouts under `app/(ja)` and `app/(en)`, `app/game-content.ts`, `app/HomeClient.tsx`, `app/clan-time-zone.ts`, `app/clan-portal.ts`, `db/schema.ts`, localized policy pages, `app/progress-cycle.ts`, `app/globals.css`, `docs/TRAFFIC_MONETIZATION_ROADMAP.md`, then tests.
- Supported users and environments: Japanese- and English-speaking VAMPIR players using current desktop or mobile browsers; the production site is publicly accessible without sign-in.

## Change boundaries

- Preserve: the `vampir-level`, `vampir-daily-checks`, and `vampir-weekly-checks` localStorage keys and their existing JSON shapes; daily 05:00 JST and weekly Monday 05:00 JST resets.
- Preserve: `vampir-custom-routines-v1` for user-authored routines and `vampir-routine-preferences-v1` for hidden default IDs. These preferences stay device-local and must not be presented as verified game information.
- Preserve: `vampir-favorite-spawns-v1` and `vampir-notification-settings-v1` as device-local preferences. Notification permission must be requested only from an explicit user action and the UI must state that scheduled notification works only while the site is running.
- Preserve: `vampir-clan-schedule-v1` for user-entered clan weekdays, times, and reminder choices. These plans stay device-local, reuse the existing weekly completion IDs, and must remain visually distinct from verified game schedules.
- Preserve: `vampir-clan-schedule-time-zone-v1` as a separate strict versioned record for the personal clan IANA time zone. Existing schedules without this key and new Japanese users default to `Asia/Tokyo`; new English users default once to a valid browser IANA zone or `UTC`, and later locale changes must not change it. Official schedules and daily/weekly reset cycles remain fixed JST.
- Preserve: shared clan portals store only a clan display name and administrator-entered content weekday/time/time zone. Personal reminders, completion, level, favorites, custom routines, and notification settings remain device-local and are never uploaded with a portal schedule. Stored shared v1 schedules remain readable as `Asia/Tokyo`; all new writes require shared schedule v2.
- Preserve: viewer and administrator portal capabilities use independent 32-byte secrets. Persist only their SHA-256 hashes; remove URL fragments after capture; authorize every read and mutation server-side; keep portal responses private and non-indexable.
- Preserve: a Today-first experience that works without screen-sharing, OCR, account access, or game-client integration.
- Preserve: Ko-fi and OFUSE support actions as optional external links. Keep every feature free, do not embed checkout or third-party tracking scripts, and state that support is optional.
- Preserve: sharing uses the canonical `https://vampir.cilabworks.com/` URL through an X Web Intent or the browser share API with clipboard fallback. Do not embed X widgets or tracking scripts.
- Preserve: `/` and `/policy` are Japanese; `/en` and `/en/policy` are English. Keep route-specific `html lang`, canonical URLs, JA/EN alternates, localized share targets, and the device-local `vampir-language-v1` preference aligned. Do not add the language preference to the personal-backup schema or translate user-authored routine titles and notes.
- Preserve: `https://vampir.cilabworks.com/` is the canonical public origin. Keep metadata, `robots.txt`, `sitemap.xml`, and legacy-host redirects aligned with it.
- Preserve: `/policy` and `/en/policy` accurately describe current device-local storage, notifications, external services, analytics/advertising status, the public GitHub Issues contact route, and the developer X profile at `https://x.com/Kokonoe_variant`. Update both before introducing analytics, advertising, affiliate tracking, or another data flow.
- Preserve: the public Cloudflare Web Analytics site token `11a11bdb70184f96822eb5d171c6687b` is an embed identifier, not an API credential. Render its manual beacon exactly once in the initial HTML for `/`, `/policy`, `/en`, and `/en/policy`, with `spa: false`, and never render it from a shared layout or under `/clan/*` or `/en/clan/*`.
- Preserve: Cloudflare API credentials, account/zone identifiers, and PV history stay outside the public site, client JavaScript, D1, Git history, and public CI logs. Use only a least-privilege read-only secret in a private operations context after validating its metric against the Cloudflare dashboard.
- Out of scope: unverified game-menu routes, destination instructions, memory or traffic inspection, automated game input, claims of official affiliation, cloud sync of personal progress/settings, and claims of background scheduled Push without a verified server-side scheduler.
- Display only schedule times, limits, deadlines, and unlock conditions that have a dated source. Keep the game client's current schedule and official notices authoritative.

## Required validation

- Commands: `npm test`, `npm run lint`, and `npm run build`.
- Acceptance criteria: no horizontal page scroll at 390px; the first view shows the next occurrence and up to three unfinished visible tasks; removed OCR and destination copy is absent; existing progress restores without migration.
- Acceptance criteria: hiding a default routine removes it from Today and progress counts without deleting its completion; custom daily and weekly routines use the existing frequency-specific reset cycles; level settings explain every filtering effect and that no game account is connected.
- Acceptance criteria: backup v2 round-trips the separate clan time zone only after whole-file validation; backup v1 migrates to `Asia/Tokyo`; an invalid v2 time zone rejects the whole file; expired imported cycle progress is not restored into the current cycle; same-browser tabs converge without changing established storage shapes.
- Acceptance criteria: Japanese and English manifests use their matching language and start route, and both include 192px and 512px raster icons; service-worker requests remain network-first for time-sensitive content; notification permission is never requested on first load; no copy implies notification after the site is closed.
- Acceptance criteria: the last verified date and a stale warning are visible while the game client and official notices remain authoritative.
- Acceptance criteria: every game-content definition has a dated source reference; sources are labelled official or supplementary in both locales; invalid content definitions fail closed before rendering.
- Acceptance criteria: both support links open their stated external destinations, are keyboard accessible, and do not load third-party payment code on the Site.
- Acceptance criteria: the X share link prepopulates the canonical URL and introduction text; the general share action uses the browser share menu when available and otherwise copies the canonical URL.
- Acceptance criteria: the localized footers and policy pages link to `https://x.com/Kokonoe_variant` as the developer and update-information contact without embedding X widgets or tracking scripts.
- Acceptance criteria: the initial HTML for `/`, `/policy`, `/en`, and `/en/policy` each contains exactly one manual `https://static.cloudflareinsights.com/beacon.min.js` script with the configured public site token and `spa: false`; `/clan/*` and `/en/clan/*` contain none, including after SPA navigation or an offline navigation fallback. The service worker must not intercept, fetch, cache, read from cache for, or provide an offline fallback to `/clan`, `/clan/*`, `/en/clan`, or `/en/clan/*`.
- Acceptance criteria: all four public routes publish canonical URLs on `vampir.cilabworks.com`; `robots.txt` advertises the canonical sitemap; the sitemap contains all four public routes; the legacy `vampir-support-hub.codarrr.chatgpt.site` hostname redirects to the equivalent canonical path and query.
- Acceptance criteria: all four public routes (`/`, `/policy`, `/en`, `/en/policy`) are in the sitemap; publish social images only after the saved asset passes visual QA in its target language.
- Acceptance criteria: clan mission and guard plans accept a weekly IANA time zone/day/time while official schedules and reset cycles remain JST; recurrence uses DST-safe calendar weeks with compatible gap handling and the earlier overlap instant; completion stays in the existing Monday 05:00 JST weekly cycle; reminders work only while the site is running; settings survive backups and same-browser tab sync; copy never implies a game-account connection or an official clan timetable.
- Acceptance criteria: opening clan settings from a clan card shows only the clan schedule controls and restores focus to that card when closed; each visible limited-event card is a keyboard-accessible external link to a verified announcement or details page.
- Acceptance criteria: the server-rendered initial timestamp is serialized once and reused by the first client render; initial load produces no hydration mismatch from clocks, countdowns, event filtering, or cycle keys.
- Acceptance criteria: a clan master receives separate one-time viewer/admin links; viewer access is read-only and refreshes on focus or within 30 seconds; admin updates use optimistic revision checks and can rotate the viewer link or delete the portal.
- Acceptance criteria: shared schedule v2 includes `timeZone` but excludes reminder and completion fields; v1 reads normalize to v2 `Asia/Tokyo`; create/update reject v1 writes; viewers see the clan-zone next occurrence and a browser-local conversion when different; explicitly copying a shared schedule writes schedule and time zone atomically while preserving that device's reminder choices, completion, and established schedule JSON shape.

## Deliverables

- Outputs: a validated GitHub `main` branch and the production Sites deployment at `https://vampir.cilabworks.com/` when a release is requested.

## External actions

- Remote roles: `origin` is the GitHub development remote; `sites` is the existing Sites source/deployment remote.
- History boundary: keep the legacy Sites ancestry on the local-only `sites-sync` branch. Never push `sites-sync` or the `sites` remote history to GitHub; public GitHub history starts from the reviewed standalone snapshot.
- Publication boundary: commit and push only reviewed project changes to GitHub. Update the Sites remote and deploy to the existing public URL only when a release is requested. Preserve the current public access mode unless the user explicitly requests a change.
