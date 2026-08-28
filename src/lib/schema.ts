import { clinic } from "@/config/clinic";
import { doctors } from "@/config/doctors";

export function clinicSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Dentist",
    name: clinic.name,
    telephone: "+91-9160288388",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Upstairs, Apollo Pharmacy, opposite Axis Bank, near Old Bus Stand",
      addressLocality: "Mangalagiri",
      addressRegion: "Andhra Pradesh",
      postalCode: "522503",
      addressCountry: "IN",
    },
    url: "https://tanvi-dental-care.vercel.app/",
    openingHours: "Mo-Su 09:00-21:00",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: clinic.googleRating,
      reviewCount: clinic.googleReviewCount,
    },
  };
}

export function doctorSchema(doctor: (typeof doctors)[number]) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: doctor.name,
    jobTitle: doctor.specialty,
    worksFor: {
      "@type": "Dentist",
      name: clinic.name,
    },
  };
}
