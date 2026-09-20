import { clinic } from "@/config/clinic";

export const productionSiteUrl = "https://www.tanvidental.in" as const;
export const productionHost = "www.tanvidental.in" as const;
export const clinicEntityId = `${productionSiteUrl}/#clinic` as const;

export const siteConfig = {
  url: productionSiteUrl,
  host: productionHost,
  name: "Tanvi Dental Care & Implant Centre",
  markets: {
    primary: "Mangalagiri",
    secondary: ["Vijayawada", "Guntur"],
  },
  positioning: "Professional enough to trust. Warm enough to approach.",
  conversion: "Phone / WhatsApp → Consultation",
} as const;

export const doctors = [
  {
    slug: "naga-swathi-pokala",
    name: "Dr. Naga Swathi Pokala",
    qualifications: "BDS, MDS",
    specialty: "Oral & Maxillofacial Surgeon",
    image: "/images/doctors/naga-swathi.webp",
    relatedTreatmentSlugs: ["wisdom-tooth-management", "tooth-extractions"],
  },
  {
    slug: "prathap-naidu",
    name: "Dr. Prathap Naidu",
    qualifications: "BDS, MDS",
    specialty: "Endodontist",
    image: "/images/doctors/prathap-naidu.webp",
    relatedTreatmentSlugs: ["root-canal-treatment"],
  },
] as const;

/**
 * Verified business contact values used across the website.
 */
export const verifiedContact = {
  phone: "9160288388",
  whatsapp: "9160288388",
  email: null as string | null,
  address: "Mangalagiri, Andhra Pradesh",
  hours: clinic.hours,
} as const;
