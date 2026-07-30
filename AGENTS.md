# Project guidance

## Project scope

- Repository source of truth: the `main` branch on GitHub. Keep the local `main` branch aligned with it before starting new work.
- Source of truth: `app/page.tsx` for displayed schedules and routines; linked official VAMPIR pages and dated reference articles for factual values.
- Read order: `AGENTS.md`, `app/page.tsx`, `app/progress-cycle.ts`, `app/globals.css`, then tests.
- Supported users and environments: Japanese VAMPIR players using current desktop or mobile browsers; the production site is publicly accessible without sign-in.

## Change boundaries

- Preserve: the `vampir-level`, `vampir-daily-checks`, and `vampir-weekly-checks` localStorage keys and their existing JSON shapes; daily 05:00 JST and weekly Monday 05:00 JST resets.
- Preserve: `vampir-custom-routines-v1` for user-authored routines and `vampir-routine-preferences-v1` for hidden default IDs. These preferences stay device-local and must not be presented as verified game information.
- Preserve: `vampir-favorite-spawns-v1` and `vampir-notification-settings-v1` as device-local preferences. Notification permission must be requested only from an explicit user action and the UI must state that scheduled notification works only while the site is running.
- Preserve: `vampir-clan-schedule-v1` for user-entered clan weekdays, times, and reminder choices. These plans stay device-local, reuse the existing weekly completion IDs, and must remain visually distinct from verified game schedules.
- Preserve: a Today-first experience that works without screen-sharing, OCR, account access, or game-client integration.
- Preserve: Ko-fi and OFUSE support actions as optional external links. Keep every feature free, do not embed checkout or third-party tracking scripts, and state that support is optional.
- Preserve: sharing uses the canonical `https://vampir.cilabworks.com/` URL through an X Web Intent or the browser share API with clipboard fallback. Do not embed X widgets or tracking scripts.
- Out of scope: unverified game-menu routes, destination instructions, memory or traffic inspection, automated game input, claims of official affiliation, cloud sync, and claims of background scheduled Push without a verified server-side scheduler.
- Display only schedule times, limits, deadlines, and unlock conditions that have a dated source. Keep the game client's current schedule and official notices authoritative.

## Required validation

- Commands: `npm test`, `npm run lint`, and `npm run build`.
- Acceptance criteria: no horizontal page scroll at 390px; the first view shows the next occurrence and up to three unfinished visible tasks; removed OCR and destination copy is absent; existing progress restores without migration.
- Acceptance criteria: hiding a default routine removes it from Today and progress counts without deleting its completion; custom daily and weekly routines use the existing frequency-specific reset cycles; level settings explain every filtering effect and that no game account is connected.
- Acceptance criteria: backups round-trip only after whole-file validation; expired imported cycle progress is not restored into the current cycle; same-browser tabs converge without changing the established storage shapes.
- Acceptance criteria: the manifest includes 192px and 512px raster icons; service-worker requests remain network-first for time-sensitive content; notification permission is never requested on first load; no copy implies notification after the site is closed.
- Acceptance criteria: the last verified date and a stale warning are visible while the game client and official notices remain authoritative.
- Acceptance criteria: both support links open their stated external destinations, are keyboard accessible, and do not load third-party payment code on the Site.
- Acceptance criteria: the X share link prepopulates the canonical URL and introduction text; the general share action uses the browser share menu when available and otherwise copies the canonical URL.
- Acceptance criteria: clan mission and guard plans accept a weekly JST day/time, keep completion in the existing Monday 05:00 weekly cycle, notify only while the site is running, survive backups and same-browser tab sync, and never imply a game-account connection or an official clan timetable.
- Acceptance criteria: opening clan settings from a clan card shows only the clan schedule controls and restores focus to that card when closed; each visible limited-event card is a keyboard-accessible external link to a verified announcement or details page.

## Deliverables

- Outputs: a validated GitHub `main` branch and the production Sites deployment at `https://vampir.cilabworks.com/` when a release is requested.

## External actions

- Remote roles: `origin` is the GitHub development remote; `sites` is the existing Sites source/deployment remote.
- History boundary: keep the legacy Sites ancestry on the local-only `sites-sync` branch. Never push `sites-sync` or the `sites` remote history to GitHub; public GitHub history starts from the reviewed standalone snapshot.
- Publication boundary: commit and push only reviewed project changes to GitHub. Update the Sites remote and deploy to the existing public URL only when a release is requested. Preserve the current public access mode unless the user explicitly requests a change.
