import assert from "node:assert/strict";
import test from "node:test";

const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
const workerPromise = import(workerUrl.href).then(({ default: worker }) => worker);

const env = {
  ASSETS: {
    fetch: async () => new Response("Not found", { status: 404 }),
  },
};

const context = {
  waitUntil() {},
  passThroughOnException() {},
};

async function request(path, options = {}) {
  const worker = await workerPromise;
  return worker.fetch(new Request(`http://localhost${path}`, options), env, context);
}

const CLOUDFLARE_WEB_ANALYTICS_SRC =
  "https://static.cloudflareinsights.com/beacon.min.js";
const CLOUDFLARE_WEB_ANALYTICS_TOKEN = "11a11bdb70184f96822eb5d171c6687b";

function cloudflareWebAnalyticsScripts(html) {
  return [
    ...html.matchAll(
      /<script\b[^>]*src="https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js"[^>]*><\/script>/gi,
    ),
  ].map(([script]) => script.replaceAll("&quot;", '"'));
}

function assertSingleCloudflareWebAnalyticsScript(html) {
  const scripts = cloudflareWebAnalyticsScripts(html);
  assert.equal(scripts.length, 1);
  assert.ok(
    scripts[0].includes(
      `data-cf-beacon="{\"token\":\"${CLOUDFLARE_WEB_ANALYTICS_TOKEN}\",\"spa\":false}"`,
    ),
  );
}

test("publishes canonical metadata on the primary page", async () => {
  const response = await request("/", {
    headers: { accept: "text/html" },
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(
    html,
    /<link\b[^>]*rel="canonical"[^>]*href="https:\/\/vampir\.cilabworks\.com\/"/i,
  );
  assert.match(
    html,
    /<meta\b[^>]*property="og:url"[^>]*content="https:\/\/vampir\.cilabworks\.com\/"/i,
  );
  assert.match(html, /https:\/\/vampir\.cilabworks\.com\/og\.png\?v=20260730-2/i);
  assertSingleCloudflareWebAnalyticsScript(html);
});

test("serves robots and sitemap for the canonical domain", async () => {
  const robotsResponse = await request("/robots.txt");
  const robots = await robotsResponse.text();
  assert.equal(robotsResponse.status, 200);
  assert.match(robots, /User-Agent: \*/i);
  assert.match(robots, /Allow: \//i);
  assert.match(robots, /Host: https:\/\/vampir\.cilabworks\.com/i);
  assert.match(robots, /Sitemap: https:\/\/vampir\.cilabworks\.com\/sitemap\.xml/i);

  const sitemapResponse = await request("/sitemap.xml");
  const sitemap = await sitemapResponse.text();
  assert.equal(sitemapResponse.status, 200);
  assert.match(sitemap, /<loc>https:\/\/vampir\.cilabworks\.com\/<\/loc>/i);
  assert.match(sitemap, /<loc>https:\/\/vampir\.cilabworks\.com\/policy<\/loc>/i);
  assert.match(sitemap, /<loc>https:\/\/vampir\.cilabworks\.com\/en<\/loc>/i);
  assert.match(sitemap, /<loc>https:\/\/vampir\.cilabworks\.com\/en\/policy<\/loc>/i);
});

test("publishes English canonical, language alternates, and text-only social metadata", async () => {
  const response = await request("/en", { headers: { accept: "text/html" } });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /rel="canonical"[^>]*href="https:\/\/vampir\.cilabworks\.com\/en"/i);
  assert.match(html, /hreflang="ja"[^>]*href="https:\/\/vampir\.cilabworks\.com\/"/i);
  assert.match(html, /hreflang="en"[^>]*href="https:\/\/vampir\.cilabworks\.com\/en"/i);
  assert.doesNotMatch(html, /property="og:image"/i);
  assert.doesNotMatch(html, /name="twitter:image"/i);
  assertSingleCloudflareWebAnalyticsScript(html);
});

test("publishes the localized English policy", async () => {
  const response = await request("/en/policy", { headers: { accept: "text/html" } });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /<html[^>]*lang="en"/i);
  assert.match(html, /Operations and Privacy Policy/);
  assert.match(html, /We do not connect to your game account or retrieve game data automatically/);
  assert.match(html, /Shared clan portals/);
  assert.match(html, /Viewer and administrator links use separate secret keys/);
  assert.match(html, /verification hashes are stored in the database/);
  assert.match(html, /We use Cloudflare Web Analytics on the Japanese and English public home and policy pages/);
  assert.match(html, /page views, visits, referrers, country, device type, browser, operating system, page-load performance, and Core Web Vitals/);
  assert.match(html, /Information required for measurement is sent to Cloudflare/);
  assert.match(html, /does not receive your game account, device-local daily, weekly, or event-mission checklist progress, level, notification settings/);
  assert.match(html, /Shared clan portal routes \(<code>\/clan\/\*<\/code> and <code>\/en\/clan\/\*<\/code>\) do not include the analytics tag/);
  assert.match(html, /We currently do not install advertising tags or affiliate-tracking tags/);
  assert.match(html, /rel="canonical"[^>]*href="https:\/\/vampir\.cilabworks\.com\/en\/policy"/i);
  assert.doesNotMatch(html, /property="og:image"/i);
  assertSingleCloudflareWebAnalyticsScript(html);
});

test("publishes the operation and privacy policy", async () => {
  const response = await request("/policy", {
    headers: { accept: "text/html" },
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /運営・プライバシー方針/);
  assert.match(html, /ゲームアカウントへの接続や、ゲーム情報の自動取得は行いません/);
  assert.match(html, /通知の重複防止記録/);
  assert.match(html, /個人用クラン予定とそのタイムゾーン、クラン共有ポータルの閲覧・管理キー/);
  assert.match(html, /個人用クラン予定の曜日・時刻・タイムゾーンは、共有ポータル作成フォームの初期値として使用します/);
  assert.match(html, /公式の出現・イベント予定と日次・週次リセットはJSTのまま/);
  assert.match(html, /個人用リマインダー、完了状況、レベル、通知設定、ゲームアカウント情報は共有しません/);
  assert.match(html, /閲覧・管理操作時に対応する秘密キーを認証のためAPIへ送信します/);
  assert.match(html, /秘密キーそのものはデータベースへ保存せず、照合用のハッシュだけを保存します/);
  assert.match(html, /管理の秘密キーはポータル作成時に作成したブラウザへ保存し/);
  assert.match(html, /Cloudflare Web Analyticsを使用しています/);
  assert.match(html, /ページビュー、訪問、参照元、国、端末種別、ブラウザ、OS、ページ読み込み性能/);
  assert.match(html, /計測に必要な情報をCloudflareへ送信します/);
  assert.match(html, /ゲームアカウント、端末内の日課・週課・イベントミッションのチェック状況、レベル、通知設定/);
  assert.match(html, /クラン共有ポータル（<code>\/clan\/\*<\/code>、<code>\/en\/clan\/\*<\/code>）には解析タグを設置していません/);
  assert.match(html, /現在、広告配信タグとアフィリエイト追跡タグは設置していません/);
  assert.match(html, /https:\/\/github\.com\/Ranats\/vampir-support-hub\/issues/);
  assert.match(html, /開発者・更新情報/);
  assert.match(html, /https:\/\/x\.com\/Kokonoe_variant/);
  assert.match(
    html,
    /<link\b[^>]*rel="canonical"[^>]*href="https:\/\/vampir\.cilabworks\.com\/policy"/i,
  );
  assertSingleCloudflareWebAnalyticsScript(html);
});

test("does not publish Cloudflare Web Analytics on localized clan routes", async () => {
  for (const path of ["/clan/create", "/en/clan/create"]) {
    const response = await request(path, {
      headers: { accept: "text/html" },
    });
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.equal(cloudflareWebAnalyticsScripts(html).length, 0);
    assert.doesNotMatch(html, new RegExp(CLOUDFLARE_WEB_ANALYTICS_SRC));
    assert.doesNotMatch(html, new RegExp(CLOUDFLARE_WEB_ANALYTICS_TOKEN));
  }
});

test("redirects the legacy Sites hostname to the custom domain", async () => {
  const worker = await workerPromise;
  const response = await worker.fetch(
    new Request("https://vampir-support-hub.codarrr.chatgpt.site/policy?from=old"),
    env,
    context,
  );

  assert.equal(response.status, 308);
  assert.equal(
    response.headers.get("location"),
    "https://vampir.cilabworks.com/policy?from=old",
  );

  const canonicalResponse = await worker.fetch(
    new Request("https://vampir.cilabworks.com/policy"),
    env,
    context,
  );
  assert.equal(canonicalResponse.status, 200);
  assert.equal(canonicalResponse.headers.get("location"), null);
});
