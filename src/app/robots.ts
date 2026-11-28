import type { MetadataRoute } from "next";

const PRODUCTION_URL =
  "https://breatheeasy-urban-air-quality-assistant.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${PRODUCTION_URL}/sitemap.xml`,
  };
}
