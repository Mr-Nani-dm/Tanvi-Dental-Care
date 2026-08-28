import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { doctors } from "@/config/doctors";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const routes = ["/", "/about", "/doctors", "/services", "/faq", "/contact"];
  const doctorRoutes = doctors.map((doctor) => `/doctors/${doctor.slug}`);

  return [...routes, ...doctorRoutes].map((path) => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path.startsWith("/doctors/") ? 0.8 : 0.7,
  }));
}
