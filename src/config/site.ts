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
 * Intentionally empty until business verification supplies the values.
 * Never replace these with guesses or directory-derived information.
 */
export const verifiedContact = {
  phone: null,
  whatsapp: null,
  email: null,
  address: null,
  hours: null,
} as const;
