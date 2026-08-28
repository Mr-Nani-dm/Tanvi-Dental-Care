import type { Metadata } from "next";
import "./globals.css";
import "./assets.css";
import "./clinic.css";
import { clinicSchema } from "@/lib/schema";

export const metadata: Metadata = {
  metadataBase: new URL("https://tanvi-dental-care.vercel.app"),
  title: {
    default: "Tanvi Dental Care & Implant Centre | Mangalagiri",
    template: "%s | Tanvi Dental Care",
  },
  description:
    "Tanvi Dental Care & Implant Centre in Mangalagiri, Andhra Pradesh. Specialist-led dental care with clear patient guidance and convenient clinic contact options.",
  applicationName: "Tanvi Dental Care & Implant Centre",
  keywords: ["Tanvi Dental Care", "dentist Mangalagiri", "dental clinic Mangalagiri"],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Tanvi Dental Care & Implant Centre | Mangalagiri",
    description:
      "Specialist-led dental care in Mangalagiri, Andhra Pradesh.",
    url: "https://tanvi-dental-care.vercel.app/",
    siteName: "Tanvi Dental Care & Implant Centre",
    locale: "en_IN",
    type: "website",
    images: [{ url: "/images/tanvi-doctors-hero.jpg", width: 1100, height: 700, alt: "Tanvi Dental Care doctors" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tanvi Dental Care & Implant Centre | Mangalagiri",
    description: "Specialist-led dental care in Mangalagiri, Andhra Pradesh.",
    images: ["/images/tanvi-doctors-hero.jpg"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const schema = clinicSchema();
  return (
    <html lang="en-IN">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        {children}
      </body>
    </html>
  );
}
