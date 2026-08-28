import type { Metadata } from "next";
import "./globals.css";
import "./assets.css";
import "./clinic.css";
import "./content-pages.css";
import "./audit-polish.css";
import "./hero-image-fix.css";
import "./responsive-audit.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tanvi-dental-care.vercel.app";

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
    images: [{ url: "/images/tanvi-doctors-web.jpg", width: 700, height: 467, alt: "Tanvi Dental Care doctors" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tanvi Dental Care & Implant Centre | Mangalagiri",
    description: "Dental care and implant centre in Mangalagiri, Andhra Pradesh.",
    images: ["/images/tanvi-doctors-web.jpg"],
  },
  icons: { icon: "/images/tanvi-logo-web.png" },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "Dentist",
  name: "Tanvi Dental Care & Implant Centre",
  url: siteUrl,
  telephone: "+91-9160288388",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Upstairs, Apollo Pharmacy, opposite Axis Bank, near Old Bus Stand",
    addressLocality: "Mangalagiri",
    addressRegion: "Andhra Pradesh",
    postalCode: "522503",
    addressCountry: "IN",
  },
  openingHoursSpecification: [{
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    opens: "09:00",
    closes: "21:00",
  }],
  sameAs: ["https://www.instagram.com/tanvidental/"],
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
