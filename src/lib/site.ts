export const site = {
  name: "Tanvi Dental Care & Implant Centre",
  primaryMarket: "Mangalagiri",
  secondaryMarkets: ["Vijayawada", "Guntur"],
  doctors: [
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
  ],
} as const;

/**
 * Business facts intentionally kept in one boundary.
 * Do not add phone, WhatsApp, address, hours, pricing, services,
 * facilities, reviews or other claims until verified by the business.
 */
