// Confirmed by the clinic owner on 20 September 2026. All times are local (IST).
const openingHours = [
  {
    label: "Monday, Tuesday, Thursday, Friday & Saturday",
    shortLabel: "Mon, Tue, Thu, Fri & Sat",
    days: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
    periods: [{ opens: "10:00", closes: "14:00" }, { opens: "17:00", closes: "21:00" }],
  },
  {
    label: "Wednesday",
    shortLabel: "Wednesday",
    days: ["Wednesday"],
    periods: [{ opens: "09:30", closes: "14:00" }, { opens: "17:00", closes: "21:00" }],
  },
  {
    label: "Sunday",
    shortLabel: "Sunday",
    days: ["Sunday"],
    periods: [{ opens: "10:00", closes: "13:30" }],
  },
] as const;

function formatClinicTime(time: string) {
  const [hour, minutes] = time.split(":");
  const hourNumber = Number(hour);
  return `${hourNumber % 12 || 12}${minutes === "00" ? "" : `:${minutes}`} ${hourNumber < 12 ? "AM" : "PM"}`;
}

export const clinicHours = openingHours.map((group) => ({
  ...group,
  displayHours: group.periods.map((period) => `${formatClinicTime(period.opens)}–${formatClinicTime(period.closes)}`).join("; "),
}));

export const clinic = {
  name: "Tanvi Dental Care & Implant Centre",
  phone: "9160288388",
  phoneHref: "tel:+919160288388",
  whatsappHref:
    "https://wa.me/919160288388?text=Hello%20Tanvi%20Dental%20Care%2C%20I%20would%20like%20to%20book%20a%20dental%20appointment.",
  hours: `${clinicHours.map((group) => `${group.label}: ${group.displayHours}`).join(". ")}. All times IST.`,
  sundayHours: clinicHours.find((group) => group.label === "Sunday")!.displayHours,
  address:
    "Upstairs, Apollo Pharmacy, opposite Axis Bank, near Old Bus Stand, Mangalagiri, Andhra Pradesh 522503, India",
  shortAddress: "Near Old Bus Stand, Mangalagiri, Andhra Pradesh 522503",
  googlePlaceId: "ChIJzRZdD-rxNToRhByJSASPSpw",
  googleMapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Tanvi%20Dental%20Care%20%26%20Implant%20Centre%2C%20Mangalagiri%2C%20Andhra%20Pradesh&query_place_id=ChIJzRZdD-rxNToRhByJSASPSpw",
  googleRating: 5.0,
  googleReviewCount: 28,
  googleReviewSnapshotDate: "20 September 2026",
  social: {
    facebook: null,
    instagram: "https://www.instagram.com/tanvidental/",
  },
} as const;

/**
 * Treatment catalogue used for navigation and patient education.
 * Individual treatment availability is confirmed during consultation.
 */
export const treatments = [
  {
    slug: "dental-implants",
    name: "Dental Implants",
    description: "Tooth-replacement options for missing teeth, planned around your oral health.",
    icon: "implant",
  },
  {
    slug: "root-canal-treatment",
    name: "Root Canal Treatment",
    description: "Treatment designed to remove infection and help preserve a natural tooth.",
    icon: "root",
  },
  {
    slug: "crowns-and-bridges",
    name: "Crowns & Bridges",
    description: "Restorative options to rebuild damaged teeth and replace missing tooth spaces.",
    icon: "crown",
  },
  {
    slug: "cosmetic-dentistry",
    name: "Cosmetic Dentistry",
    description: "Smile-focused dental treatments planned around your goals and tooth health.",
    icon: "cosmetic",
  },
  {
    slug: "teeth-cleaning-and-scaling",
    name: "Teeth Cleaning & Scaling",
    description: "Professional cleaning to support healthier teeth and gums and remove deposits.",
    icon: "cleaning",
  },
  {
    slug: "wisdom-tooth-management",
    name: "Wisdom Tooth Management",
    description: "Assessment and treatment planning for wisdom-tooth pain, impaction or removal.",
    icon: "wisdom",
  },
  {
    slug: "denture-care",
    name: "Denture Care",
    description: "Tooth-replacement options for patients who need removable dental prostheses.",
    icon: "denture",
  },
  {
    slug: "gum-and-periodontal-care",
    name: "Gum & Periodontal Care",
    description: "Assessment and care for gum health, inflammation and periodontal concerns.",
    icon: "gum",
  },
  {
    slug: "dental-check-ups",
    name: "Dental Check-ups",
    description: "Routine oral examinations to identify concerns early and plan preventive care.",
    icon: "checkup",
  },
  {
    slug: "tooth-coloured-fillings",
    name: "Tooth-Coloured Fillings",
    description: "Restorative treatment for suitable cavities and damaged tooth structure.",
    icon: "filling",
  },
  {
    slug: "tooth-extractions",
    name: "Tooth Extractions",
    description: "Removal of teeth when clinically necessary after examination and diagnosis.",
    icon: "extraction",
  },
  {
    slug: "emergency-dental-care",
    name: "Emergency Dental Care",
    description: "Prompt assessment for urgent dental pain, swelling, trauma or other concerns.",
    icon: "emergency",
  },
] as const;

export const faqs = [
  {
    question: "How can I book a dental appointment?",
    answer:
      "Call 9160288388 or use WhatsApp to request an appointment. The clinic team can confirm the available time and treatment requirements.",
  },
  {
    question: "What are the clinic timings?",
    answer: clinic.hours,
  },
  {
    question: "Where is Tanvi Dental Care & Implant Centre located?",
    answer:
      "The publicly listed location is upstairs at Apollo Pharmacy, opposite Axis Bank, near the Old Bus Stand, Mangalagiri, Andhra Pradesh 522503, India.",
  },
  {
    question: "Do you provide dental implants?",
    answer:
      "Dental implants are included in the clinic's treatment catalogue. Suitability depends on an individual examination and treatment plan, so the dentist will advise you on the appropriate option.",
  },
  {
    question: "Do you treat wisdom-tooth problems?",
    answer:
      "Yes, wisdom-tooth management is included in the treatment catalogue. The appropriate approach depends on the tooth position, symptoms and clinical findings.",
  },
  {
    question: "Can I contact the clinic on WhatsApp?",
    answer:
      "Yes. WhatsApp is available for appointment requests and general enquiries. For urgent or severe symptoms, contact the clinic directly by phone and seek appropriate emergency care when necessary.",
  },
  {
    question: "Is the Google rating shown on the website live?",
    answer:
      "The website uses a verified Google rating snapshot and links to the live Google listing. Ratings and review counts can change, so the Google listing is the live source.",
  },
  {
    question: "Are all treatments suitable for every patient?",
    answer:
      "No. Dental treatment is individual. A dentist should examine your teeth, gums and overall oral-health needs before recommending a specific procedure.",
  },
] as const;
