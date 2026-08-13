import type { Metadata } from "next";
import Link from "next/link";
import CloudflareWebAnalytics from "../../../CloudflareWebAnalytics";
import LanguageSwitch from "../../../LanguageSwitch";

const GITHUB_ISSUES_URL = "https://github.com/Ranats/vampir-support-hub/issues";
const DEVELOPER_X_URL = "https://x.com/Kokonoe_variant";

export const metadata: Metadata = {
  title: "Operations and Privacy Policy | VAMPIR Daily Navigator",
  description:
    "Learn about VAMPIR Daily Navigator's operating policy, device-local data, external services, disclaimers, and contact options.",
  alternates: {
    canonical: "/en/policy",
    languages: { ja: "/policy", en: "/en/policy" },
  },
  openGraph: {
    type: "website",
    url: "/en/policy",
    locale: "en_US",
    alternateLocale: ["ja_JP"],
    title: "Operations and Privacy Policy | VAMPIR Daily Navigator",
    description:
      "Learn about VAMPIR Daily Navigator's operating policy, device-local data, external services, disclaimers, and contact options.",
  },
  twitter: {
    card: "summary",
    title: "Operations and Privacy Policy | VAMPIR Daily Navigator",
    description:
      "Learn about VAMPIR Daily Navigator's operating policy, device-local data, external services, disclaimers, and contact options.",
  },
};

export default function EnglishPolicyPage() {
  return (
    <div className="policy-shell">
      <header className="policy-header">
        <Link className="brand" href="/en" aria-label="Return to VAMPIR Daily Navigator">
          <span className="brand-mark" aria-hidden="true">V</span>
          <span><strong>VAMPIR</strong><small>Daily Navigator</small></span>
        </Link>
        <div className="policy-header-actions">
          <LanguageSwitch locale="en" page="policy" />
          <Link className="policy-back" href="/en">
            <span className="policy-back-full">Back to Daily Navigator</span>
            <span className="policy-back-short">Back</span>
          </Link>
        </div>
      </header>

      <main className="policy-main">
        <div className="policy-heading">
          <span className="eyebrow">SITE INFORMATION</span>
          <h1>Operations and Privacy Policy</h1>
          <p>This page explains the information this site provides and how it handles user data.</p>
          <time dateTime="2026-08-14">Last updated: August 14, 2026</time>
        </div>

        <div className="policy-sections">
          <section className="policy-card">
            <h2>Unofficial tool</h2>
            <p>VAMPIR Daily Navigator is an unofficial support tool operated by an individual. It is not affiliated with Netmarble or the companies that operate or develop VAMPIR. English labels on this site are unofficial translations of Japanese source information.</p>
            <p>Verification dates are shown for listed times, limits, and deadlines. Always prioritize the in-game display and official notices. We do not guarantee that the information is complete, accurate, or continuously available.</p>
          </section>

          <section className="policy-card">
            <h2>Data saved on your device</h2>
            <p>Your level, daily, weekly, and event-mission checklist progress, personal tasks, display preferences, spawn alert targets, notification settings, language preference, notification deduplication records, personal clan plans and their time zone, and clan portal viewer or administrator keys are saved in your browser&apos;s local storage.</p>
            <ul>
              <li>We do not connect to your game account or retrieve game data automatically.</li>
              <li>When you create or update a shared clan portal, its clan name, weekday, time, and clan schedule time zone are sent to the API. The corresponding secret key is sent for authentication when viewing or administering the portal.</li>
              <li>Other device-local settings—including level, daily, weekly, and event-mission checklist progress, personal reminders, and notification settings—are not sent to the operator&apos;s server.</li>
              <li>Backups are exported or imported only when you explicitly request those actions.</li>
              <li>Deleting browser data may also delete content saved on this device.</li>
            </ul>
          </section>

          <section className="policy-card">
            <h2>Shared clan portals</h2>
            <p>A personal clan plan&apos;s weekday, time, and time zone can be used as the initial values for the shared portal form. Only after a clan master selects Create shared portal are the clan name, current weekdays and times, and clan schedule time zone stored in the server database. Personal reminders, completion, level, notification settings, and game-account information are not shared.</p>
            <ul>
              <li>Viewer and administrator links use separate secret keys. Only their verification hashes are stored in the database.</li>
              <li>An administrator can change the shared schedule, rotate the viewer link, or delete the portal.</li>
              <li>The selected time zone applies only to user-entered clan plans. Official spawn and event schedules and daily or weekly resets remain in JST.</li>
              <li>To limit abusive bulk creation, the site derives a temporary verification key from the network address. The original address is not stored, and verification records older than two hours are removed during later portal creation.</li>
              <li>The shared schedule remains stored until an administrator deletes the portal.</li>
            </ul>
          </section>

          <section className="policy-card">
            <h2>Notifications and PWA</h2>
            <p>Notification permission is requested only when you choose that action in Settings. Current pre-spawn alerts work only while the site is running; we do not guarantee scheduled alerts after the site is closed. Removing the PWA may leave browser-stored data in place.</p>
          </section>

          <section className="policy-card">
            <h2>Analytics and advertising</h2>
            <p>We use Cloudflare Web Analytics on the Japanese and English public home and policy pages. It aggregates page views, visits, referrers, country, device type, browser, operating system, page-load performance, and Core Web Vitals. Information required for measurement is sent to Cloudflare.</p>
            <p>Cloudflare Web Analytics does not receive your game account, device-local daily, weekly, or event-mission checklist progress, level, notification settings, personal clan plans, or clan portal viewer or administrator keys. Shared clan portal routes (<code>/clan/*</code> and <code>/en/clan/*</code>) do not include the analytics tag. We currently do not install advertising tags or affiliate-tracking tags.</p>
            <p>If other analytics or advertising is introduced in the future, we will add its purpose and handling to this page first. Sponsorships and advertisements will be clearly distinguished from normal site guidance.</p>
          </section>

          <section className="policy-card">
            <h2>External services and support</h2>
            <p>We link to official information, reference articles, X, GitHub, Ko-fi, and OFUSE. Information and payments after leaving this site are governed by each service&apos;s policies. We do not embed external checkout screens or tracking scripts from support or external-link providers.</p>
            <p>Support is optional. All features remain free whether or not you choose to support us.</p>
          </section>

          <section className="policy-card" id="developer">
            <h2>Developer and updates</h2>
            <p>
              Developed and operated by: <a href={DEVELOPER_X_URL} target="_blank" rel="noopener noreferrer" aria-label="Open developer X account @Kokonoe_variant in a new tab">@Kokonoe_variant</a>. This X profile is provided for update information and contact.
            </p>
          </section>

          <section className="policy-card" id="contact">
            <h2>Bugs and requests</h2>
            <p>
              Report bugs and improvement requests through the public <a href={GITHUB_ISSUES_URL} target="_blank" rel="noopener noreferrer" aria-label="Open GitHub Issues in a new tab">GitHub Issues</a> page. Do not post personal information such as game-account details or email addresses, or a clan portal administrator link.
            </p>
          </section>
        </div>
      </main>

      <footer className="policy-footer"><Link href="/en">Back to VAMPIR Daily Navigator</Link></footer>
      <CloudflareWebAnalytics />
    </div>
  );
}
