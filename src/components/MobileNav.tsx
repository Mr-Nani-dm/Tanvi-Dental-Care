"use client";

import { useEffect, useState } from "react";

const links = [
  ["Home", "#home"],
  ["About Us", "#about"],
  ["Our Doctors", "#doctors"],
  ["Treatments", "#services"],
  ["Patient Guide", "#guide"],
  ["Contact Us", "#contact"],
] as const;

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        className="mobile-menu"
        type="button"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "×" : "☰"}
      </button>

      {open && <button className="mobile-nav-backdrop" aria-label="Close navigation menu" onClick={() => setOpen(false)} />}

      <nav id="mobile-navigation" className={`mobile-navigation${open ? " is-open" : ""}`} aria-label="Mobile navigation">
        {links.map(([label, href]) => (
          <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>
        ))}
      </nav>
    </>
  );
}
