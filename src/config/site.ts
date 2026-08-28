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
 * Contact values stay null until the business verification layer supplies
 * current values. This prevents accidental publication of stale or guessed data.
 */
export const verifiedContact = {
  phone: null as string | null,
  whatsapp: null as string | null,
  email: null as string | null,
  address: null as string | null,
  hours: null as string | null,
};
