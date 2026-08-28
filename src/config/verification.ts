export type VerificationStatus =
  | "VERIFIED"
  | "BUSINESS_VERIFICATION_REQUIRED"
  | "RESEARCH_OBSERVATION"
  | "STRATEGIC_INFERENCE"
  | "HYPOTHESIS";

/**
 * Treatment availability is intentionally kept separate from research assumptions.
 * Confirm these with the clinic before promoting any item to a definitive service claim.
 */
export const treatmentVerification: Record<string, VerificationStatus> = {
  "Dental Implants": "BUSINESS_VERIFICATION_REQUIRED",
  "Root Canal Treatment": "BUSINESS_VERIFICATION_REQUIRED",
  "Crowns & Bridges": "BUSINESS_VERIFICATION_REQUIRED",
  "Cosmetic Dentistry": "BUSINESS_VERIFICATION_REQUIRED",
  "Teeth Cleaning & Scaling": "BUSINESS_VERIFICATION_REQUIRED",
  "Wisdom Tooth Management": "BUSINESS_VERIFICATION_REQUIRED",
  "Denture Care": "BUSINESS_VERIFICATION_REQUIRED",
  "Gum & Periodontal Care": "BUSINESS_VERIFICATION_REQUIRED",
  "Dental Check-ups": "BUSINESS_VERIFICATION_REQUIRED",
  "Tooth-Coloured Fillings": "BUSINESS_VERIFICATION_REQUIRED",
  "Tooth Extractions": "BUSINESS_VERIFICATION_REQUIRED",
  "Emergency Dental Care": "BUSINESS_VERIFICATION_REQUIRED",
};
