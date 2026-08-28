export const siteConfig = {
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
    name: "Dr. Naga Swathi Pokala",
    qualifications: "BDS, MDS",
    specialty: "Oral & Maxillofacial Surgeon",
  },
  {
    name: "Dr. Prathap Naidu",
    qualifications: "BDS, MDS",
    specialty: "Endodontist",
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
  hours: "9:00 AM - 9:00 PM (IST)",
} as const;
