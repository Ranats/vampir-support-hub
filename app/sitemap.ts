import type { MetadataRoute } from "next";

const SITE_URL = "https://vampir.cilabworks.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/policy`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}
