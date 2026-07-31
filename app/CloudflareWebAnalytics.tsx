const CLOUDFLARE_WEB_ANALYTICS_SRC =
  "https://static.cloudflareinsights.com/beacon.min.js";
const CLOUDFLARE_WEB_ANALYTICS_CONFIG = JSON.stringify({
  token: "11a11bdb70184f96822eb5d171c6687b",
  spa: false,
});

export default function CloudflareWebAnalytics() {
  return (
    <script
      defer
      type="module"
      src={CLOUDFLARE_WEB_ANALYTICS_SRC}
      data-cf-beacon={CLOUDFLARE_WEB_ANALYTICS_CONFIG}
    />
  );
}
