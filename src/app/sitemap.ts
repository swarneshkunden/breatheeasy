import { MetadataRoute } from "next";

const PRODUCTION_URL =
  "https://breatheeasy-urban-air-quality-assistant.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: PRODUCTION_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${PRODUCTION_URL}/app`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];
}
