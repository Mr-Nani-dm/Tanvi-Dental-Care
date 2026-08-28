export type Doctor = {
  slug: string;
  name: string;
  credentials: string;
  specialty: string;
  image: string;
  imageAlt: string;
};

export const doctors = [
  {
    slug: "naga-swathi-pokala",
    name: "Dr. Naga Swathi Pokala",
    credentials: "BDS, MDS",
    specialty: "Oral & Maxillofacial Surgeon",
    image: "/images/doctors/naga-swathi.webp",
    imageAlt: "Dr. Naga Swathi Pokala",
  },
  {
    slug: "prathap-naidu",
    name: "Dr. Prathap Naidu",
    credentials: "BDS, MDS",
    specialty: "Endodontist",
    image: "/images/doctors/prathap-naidu.webp",
    imageAlt: "Dr. Prathap Naidu",
  },
] as const satisfies readonly Doctor[];
