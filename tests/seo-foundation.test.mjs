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
  assert.match(html, /現在、サイト独自のアクセス解析タグ、広告配信タグ、アフィリエイト追跡タグは設置していません/);
  assert.match(html, /https:\/\/github\.com\/Ranats\/vampir-support-hub\/issues/);
  assert.match(html, /開発者・更新情報/);
  assert.match(html, /https:\/\/x\.com\/Kokonoe_variant/);
  assert.match(
    html,
    /<link\b[^>]*rel="canonical"[^>]*href="https:\/\/vampir\.cilabworks\.com\/policy"/i,
  );
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
