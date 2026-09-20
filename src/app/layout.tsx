import type { Metadata } from "next";
import { clinicEntityId, siteConfig } from "@/config/site";
import { clinic, clinicHours } from "@/config/clinic";
import "./globals.css";
import "./assets.css";
import "./clinic.css";
import "./content-pages.css";
import "./audit-polish.css";
import "./hero-image-fix.css";
import "./responsive-audit.css";
import "./blog.css";

const siteUrl = siteConfig.url;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Tanvi Dental Care & Implant Centre | Mangalagiri",
    template: "%s | Tanvi Dental Care",
  },
  description: "Tanvi Dental Care & Implant Centre in Mangalagiri, Andhra Pradesh. Dental implants, root canal care, restorative, cosmetic and preventive dental treatment information.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Tanvi Dental Care & Implant Centre | Mangalagiri",
    description: "Tanvi Dental Care & Implant Centre in Mangalagiri, Andhra Pradesh.",
    type: "website",
    url: siteUrl,
    siteName: "Tanvi Dental Care & Implant Centre",
    images: [{ url: "/images/tanvi-doctor-realfinal.png", width: 700, height: 467, alt: "Tanvi Dental Care doctors" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tanvi Dental Care & Implant Centre | Mangalagiri",
    description: "Dental care and implant centre in Mangalagiri, Andhra Pradesh.",
    images: ["/images/tanvi-doctor-realfinal.png"],
  },
  icons: { icon: "/images/tanvi-logo-web.png" },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "Dentist",
  "@id": clinicEntityId,
  name: clinic.name,
  url: siteUrl,
  image: `${siteUrl}/images/tanvi-doctor-realfinal.png`,
  logo: `${siteUrl}/images/tanvi-logo-web.png`,
  telephone: clinic.phoneHref.replace("tel:", ""),
  hasMap: clinic.googleMapsUrl,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Upstairs, Apollo Pharmacy, opposite Axis Bank, near Old Bus Stand",
    addressLocality: "Mangalagiri",
    addressRegion: "Andhra Pradesh",
    postalCode: "522503",
    addressCountry: "IN",
  },
  openingHoursSpecification: clinicHours.flatMap((group) => group.periods.map((period) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: group.days,
    opens: period.opens,
    closes: period.closes,
  }))),
  sameAs: [clinic.googleMapsUrl, clinic.social.instagram],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
      </body>
    </html>
  );
}
