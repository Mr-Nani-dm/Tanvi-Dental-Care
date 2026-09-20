import type { MetadataRoute } from "next";
import { treatments } from "@/config/clinic";
import { doctors, siteConfig } from "@/config/site";
import { blogPosts } from "@/content/blog";
import { getTreatmentAuthorityContent } from "@/content/treatment-authority";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url;

  return [
    { url: baseUrl },
    { url: `${baseUrl}/treatments` },
    { url: `${baseUrl}/doctors` },
    { url: `${baseUrl}/privacy` },
    ...doctors.map((doctor) => ({
      url: `${baseUrl}/doctors/${doctor.slug}`,
    })),
    { url: `${baseUrl}/blog` },
    ...treatments.map((treatment) => {
      const authority = getTreatmentAuthorityContent(treatment.slug);
      return {
        url: `${baseUrl}/treatments/${treatment.slug}`,
        ...(authority?.updatedAt ? { lastModified: authority.updatedAt } : {}),
      };
    }),
    ...blogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt || post.publishedAt,
    })),
  ];
}
