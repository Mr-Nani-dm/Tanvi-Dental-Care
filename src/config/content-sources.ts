import { blogPosts } from "@/content/blog";
import { treatments } from "@/config/clinic";
import { doctors, productionSiteUrl } from "@/config/site";

/** Exact approved destinations. Adding a host never approves the whole host. */
export const EXTERNAL_SOURCES = [
  { id: "ida-dental-visits", title: "Indian Dental Association: visiting a dentist", url: "https://www.ida.org.in/Public/Details/WhyVisitDentist", treatments: ["general-dental-care", "dental-check-ups", "teeth-cleaning-and-scaling", "root-canal-treatment"], terms: ["dental anxiety", "dental check", "dentist", "oral health"] },
  { id: "ida-missing-teeth", title: "Indian Dental Association: missing teeth and implants", url: "https://www.ida.org.in/Public/Details/DTMissingTeeth", treatments: ["dental-implants", "denture-care", "crowns-and-bridges"], terms: ["implant", "missing teeth", "cleaning", "maintenance"] },
  { id: "ida-prosthetic-dentistry", title: "Indian Dental Association: prosthetic dentistry", url: "https://www.ida.org.in/Public/Details/DTProstheticDentistry", treatments: ["dental-implants", "denture-care", "crowns-and-bridges"], terms: ["implant", "assessment", "suitable", "dentures"] },
  { id: "ida-impaction", title: "Indian Dental Association: impacted teeth", url: "https://www.ida.org.in/Public/Details/Impaction", treatments: ["wisdom-tooth-management", "tooth-extractions"], terms: ["wisdom", "impacted", "assessment", "symptoms"] },
  { id: "iacde-patients", title: "Indian Association of Conservative Dentistry and Endodontics: patient information", url: "https://www.iacde.in/patient-info.html", treatments: ["root-canal-treatment", "general-dental-care", "teeth-cleaning-and-scaling"], terms: ["root canal treatment", "root canals", "dental", "cleaning"] },
] as const;

export const INTERNAL_URLS: readonly string[] = [
  "/", "/#contact", "/#opening-hours", "/#guide", "/#faq", "/#about", "/#doctors", "/#services",
  "/doctors", "/treatments", "/blog", "/privacy",
  ...treatments.map((treatment) => `/treatments/${treatment.slug}`),
  ...doctors.map((doctor) => `/doctors/${doctor.slug}`),
  ...blogPosts.map((post) => `/blog/${post.slug}`),
];

export function isApprovedInternalUrl(value: string): boolean {
  if (typeof value !== "string" || /[\s\\\u0000-\u001f]/.test(value)) return false;
  if (INTERNAL_URLS.includes(value)) return true;
  if (!value.startsWith(`${productionSiteUrl}/`)) return false;
  return INTERNAL_URLS.includes(value.slice(productionSiteUrl.length));
}

export function isApprovedSourceUrl(value: string): boolean {
  return typeof value === "string" && EXTERNAL_SOURCES.some((source) => source.url === value);
}
