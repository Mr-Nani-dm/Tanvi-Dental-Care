export const clinic = {
  name: "Tanvi Dental Care & Implant Centre",
  phone: "9160288388",
  phoneHref: "tel:+919160288388",
  whatsappHref:
    "https://wa.me/919160288388?text=Hello%20Tanvi%20Dental%20Care%2C%20I%20would%20like%20to%20book%20a%20dental%20appointment.",
  hours: "9:00 AM - 9:00 PM (IST)",
  address:
    "Upstairs, Apollo Pharmacy, opposite Axis Bank, near Old Bus Stand, Mangalagiri, Andhra Pradesh 522503, India",
  shortAddress: "Near Old Bus Stand, Mangalagiri, Andhra Pradesh 522503",
  googlePlaceId: "ChIJzRZdD-rxNToRhByJSASPSpw",
  googleMapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Tanvi%20Dental%20Care%20%26%20Implant%20Centre%2C%20Mangalagiri%2C%20Andhra%20Pradesh&query_place_id=ChIJzRZdD-rxNToRhByJSASPSpw",
  googleRating: 5.0,
  googleReviewCount: 26,
  social: {
    facebook: null,
    instagram: null,
  },
} as const;

/**
 * Treatment catalogue used for navigation and patient education.
 * Individual treatment availability is confirmed during consultation.
 */
export const treatments = [
  {
    name: "Dental Implants",
    description: "Tooth-replacement options for missing teeth, planned around your oral health.",
    icon: "implant",
  },
  {
    name: "Root Canal Treatment",
    description: "Treatment designed to remove infection and help preserve a natural tooth.",
    icon: "root",
  },
  {
    name: "Crowns & Bridges",
    description: "Restorative options to rebuild damaged teeth and replace missing tooth spaces.",
    icon: "crown",
  },
  {
    name: "Cosmetic Dentistry",
    description: "Smile-focused dental treatments planned around your goals and tooth health.",
    icon: "cosmetic",
  },
  {
    name: "Teeth Cleaning & Scaling",
    description: "Professional cleaning to support healthier teeth and gums and remove deposits.",
    icon: "cleaning",
  },
  {
    name: "Wisdom Tooth Management",
    description: "Assessment and treatment planning for wisdom-tooth pain, impaction or removal.",
    icon: "wisdom",
  },
  {
    name: "Denture Care",
    description: "Tooth-replacement options for patients who need removable dental prostheses.",
    icon: "denture",
  },
  {
    name: "Gum & Periodontal Care",
    description: "Assessment and care for gum health, inflammation and periodontal concerns.",
    icon: "gum",
  },
  {
    name: "Dental Check-ups",
    description: "Routine oral examinations to identify concerns early and plan preventive care.",
    icon: "checkup",
  },
  {
    name: "Tooth-Coloured Fillings",
    description: "Restorative treatment for suitable cavities and damaged tooth structure.",
    icon: "filling",
  },
  {
    name: "Tooth Extractions",
    description: "Removal of teeth when clinically necessary after examination and diagnosis.",
    icon: "extraction",
  },
  {
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
    answer:
      "The website currently lists the clinic hours as 9:00 AM to 9:00 PM IST. Please call before visiting if you need to confirm availability for a specific time or treatment.",
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
    question: "Is the Google rating shown on the website verified?",
    answer:
      "The current Google Business listing surfaced for Tanvi Dental Care & Implant Centre shows a 5.0 rating from 26 reviews at the time this website data was updated. Ratings and review counts can change, so the Google listing should be treated as the live source.",
  },
  {
    question: "Are all treatments suitable for every patient?",
    answer:
      "No. Dental treatment is individual. A dentist should examine your teeth, gums and overall oral-health needs before recommending a specific procedure.",
  },
] as const;
