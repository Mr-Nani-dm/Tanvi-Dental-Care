"use client";

import { useEffect, useRef, useState } from "react";
import ClinicIcon from "@/components/ui/ClinicIcon";

const links = [
  ["Home", "#home"],
  ["About Us", "#about"],
  ["Our Doctors", "#doctors"],
  ["Treatments", "#services"],
  ["Patient Guide", "#guide"],
  ["FAQs", "#faq"],
  ["Contact Us", "#contact"],
] as const;

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  const closeMenu = () => setOpen(false);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      menuButtonRef.current?.focus();
      return;
    }

    document.body.style.overflow = "hidden";
    firstLinkRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        ref={menuButtonRef}
        className="mobile-menu"
        type="button"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => setOpen((value) => !value)}
      >
        <ClinicIcon name={open ? "close" : "menu"} size={24} />
      </button>

      {open && (
        <button
          className="mobile-nav-backdrop"
          type="button"
          aria-label="Close navigation menu"
          onClick={closeMenu}
        />
      )}

      <nav
        id="mobile-navigation"
        className={`mobile-navigation${open ? " is-open" : ""}`}
        aria-label="Mobile navigation"
        aria-hidden={!open}
      >
        {links.map(([label, href], index) => (
          <a
            key={href}
            ref={index === 0 ? firstLinkRef : undefined}
            href={href}
            tabIndex={open ? 0 : -1}
            onClick={closeMenu}
          >
            {label}
          </a>
        ))}
      </nav>
    </>
  );
}
