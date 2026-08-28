"use client";

import { useEffect, useRef, useState } from "react";

const links = [
  ["Home", "#home"],
  ["About Us", "#about"],
  ["Our Doctors", "#doctors"],
  ["Treatments", "#services"],
  ["Patient Guide", "#guide"],
  ["FAQs", "#faq"],
  ["Contact Us", "#contact"],
] as const;

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      {open ? <><path d="M6 6l12 12"/><path d="M18 6 6 18"/></> : <><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></>}
    </svg>
  );
}

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  const closeMenu = () => setOpen(false);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
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

  useEffect(() => {
    if (!open) menuButtonRef.current?.focus();
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
        <MenuIcon open={open} />
      </button>

      {open && <button className="mobile-nav-backdrop" type="button" aria-label="Close navigation menu" onClick={closeMenu} />}

      <nav id="mobile-navigation" className={`mobile-navigation${open ? " is-open" : ""}`} aria-label="Mobile navigation" aria-hidden={!open}>
        {links.map(([label, href], index) => (
          <a key={href} ref={index === 0 ? firstLinkRef : undefined} href={href} tabIndex={open ? 0 : -1} onClick={closeMenu}>
            {label}
          </a>
        ))}
      </nav>
    </>
  );
}
