import type { Metadata } from "next";

const siteUrl = "https://tanvi-dental-care.vercel.app";

export function absoluteUrl(path = "/") {
  return new URL(path, siteUrl).toString();
}

export function createMetadata(input: {
  title: string;
  description: string;
  path?: string;
}): Metadata {
  const canonical = absoluteUrl(input.path ?? "/");
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      siteName: "Tanvi Dental Care & Implant Centre",
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
    },
  };
}
