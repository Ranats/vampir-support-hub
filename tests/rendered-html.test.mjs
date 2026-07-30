import assert from "node:assert/strict";
import test from "node:test";

test("renders finished Japanese site metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(html, /<html[^>]*\blang=["']ja["']/i);
  assert.match(html, /VAMPIR 日課ナビ/);
  assert.match(html, /今日、次にやること/);
  assert.match(html, /次の出現/);
  assert.match(html, /日課・週課/);
  assert.match(html, /あなた向け表示/);
  assert.match(html, /表示とリストを編集/);
  assert.match(html, /Lv未設定/);
  assert.match(html, /クラン任務を確認/);
  assert.match(html, /クラン守護を確認/);
  assert.match(html, /id="clan"/);
  assert.match(html, /クラン予定/);
  assert.match(html, /この端末だけに保存/);
  assert.match(html, /検証済みのゲーム開催時刻でも、ゲームアカウント連携でもありません/);
  assert.match(html, /https:\/\/guide\.netmarble\.com\/thered\/110/);
  assert.match(html, /クラン機能 公式ガイド（韓国語）/);
  assert.match(html, /日課・週課・クラン概要（日本語解説）/);
  assert.match(html, /og\.png/);
  assert.match(html, /og\.png\?v=20260730-2/);
  assert.match(html, /favicon\.png\?v=20260730-1/);
  assert.match(html, /manifest\.webmanifest/);
  assert.match(html, /https:\/\/vampir\.cilabworks\.com\//);
  assert.match(html, /情報源を見る/);
  assert.match(html, /お気に入り/);
  assert.match(html, /このツールを応援する/);
  assert.match(html, /https:\/\/ko-fi\.com\/ranats/);
  assert.match(html, /https:\/\/ofuse\.me\/d2c3aa65/);
  assert.match(
    html,
    /<a\b[^>]*class="support-banner support-banner-kofi"[^>]*href="https:\/\/ko-fi\.com\/ranats"[^>]*target="_blank"[^>]*rel="noopener noreferrer"[^>]*>/i,
  );
  assert.match(
    html,
    /<a\b[^>]*class="support-banner support-banner-ofuse"[^>]*href="https:\/\/ofuse\.me\/d2c3aa65"[^>]*target="_blank"[^>]*rel="noopener noreferrer"[^>]*>/i,
  );
  assert.match(html, /すべての機能を無料で利用できます/);
  assert.match(html, /運営・プライバシー方針/);
  assert.match(html, /https:\/\/github\.com\/Ranats\/vampir-support-hub\/issues/);
  assert.match(html, /開発者X：@Kokonoe_variant/);
  assert.match(
    html,
    /<a\b[^>]*href="https:\/\/x\.com\/Kokonoe_variant"[^>]*target="_blank"[^>]*rel="noopener noreferrer"[^>]*>/i,
  );
  assert.match(html, /https:\/\/twitter\.com\/intent\/tweet\?/);
  assert.match(html, /https%3A%2F%2Fvampir\.cilabworks\.com%2F/);
  assert.match(html, /class="header-share-actions"/);
  assert.match(
    html,
    /<a\b[^>]*class="x-share-trigger"[^>]*href="https:\/\/twitter\.com\/intent\/tweet\?[^>]*target="_blank"[^>]*rel="noopener noreferrer"[^>]*>/i,
  );
  assert.match(html, /その他の共有メニューを開く/);
  assert.match(html, /class="share-menu"/);
  assert.doesNotMatch(html, /role="menu(?:item)?"/);
  assert.match(html, /aria-label="XでVAMPIR 日課ナビをシェアする（外部サイト）"/);
  assert.match(html, /class="x-share-mark"[^>]*>𝕏<\/span>/);
  assert.match(html, /class="x-share-label">でシェア<\/span>/);
  assert.match(html, /その他の共有/);
  assert.match(html, /URLをコピー/);
  assert.doesNotMatch(html, /class="share-panel"/);
  assert.doesNotMatch(html, /画面検知を開始|SCREEN SYNC|目的地|行き先/);
  assert.doesNotMatch(html, /buymeacoffee|support-widget|payment-script/i);
  assert.doesNotMatch(html, /platform\.twitter\.com|widgets\.js|publish\.x\.com/i);
  assert.doesNotMatch(
    html,
    /<(?:script|iframe)\b[^>]*\bsrc=["'][^"']*(?:ko-fi\.com|ofuse\.me)[^"']*["']/i,
  );
  assert.doesNotMatch(
    html,
    /<form\b[^>]*\baction=["'][^"']*(?:ko-fi\.com|ofuse\.me)[^"']*["']/i,
  );
  assert.doesNotMatch(html, /\bcodex-preview\b/i);
});
