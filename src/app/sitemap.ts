import type { MetadataRoute } from "next";
import { treatments } from "@/config/clinic";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tanvi-dental-care.vercel.app";
  const now = new Date();

  return [
    { url: baseUrl, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${baseUrl}/treatments`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/doctors`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    ...treatments.map((treatment) => ({
      url: `${baseUrl}/treatments/${treatment.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ];
}
