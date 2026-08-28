import type { Metadata } from "next";
import "./globals.css";
import "./assets.css";
import "./clinic.css";

export const metadata: Metadata = {
  title: "Tanvi Dental Care & Implant Centre | Mangalagiri",
  description: "Tanvi Dental Care & Implant Centre in Mangalagiri, Andhra Pradesh. Dental implants, root canal care, restorative, cosmetic and preventive dental treatment information.",
  openGraph: {
    title: "Tanvi Dental Care & Implant Centre | Mangalagiri",
    description: "Tanvi Dental Care & Implant Centre in Mangalagiri, Andhra Pradesh.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
