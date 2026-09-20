import type { MetadataRoute } from "next";
import { treatments } from "@/config/clinic";
import { blogPosts } from "@/content/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.tanvidental.in";

  return [
    { url: baseUrl },
    { url: `${baseUrl}/treatments` },
    { url: `${baseUrl}/doctors` },
    { url: `${baseUrl}/blog` },
    ...treatments.map((treatment) => ({
      url: `${baseUrl}/treatments/${treatment.slug}`,
    })),
    ...blogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt || post.publishedAt,
    })),
  ];
}
