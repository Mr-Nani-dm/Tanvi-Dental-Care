import type { Metadata } from "next";
import "./globals.css";
import "./assets.css";

export const metadata: Metadata = {
  title: "Tanvi Dental Care & Implant Centre | Mangalagiri",
  description: "Compassionate dental care in Mangalagiri, Andhra Pradesh.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

