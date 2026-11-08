"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CONTACT, CONTACT_ADDRESS_LINE } from "@/lib/contact";
import styles from "./SiteFooter.module.css";

/**
 * Small footer on every public page. It is what keeps the Impressum reachable
 * from anywhere, since the link is no longer in the hamburger menu.
 */
export default function SiteFooter() {
  if (usePathname().startsWith("/admin")) return null;

  return (
    <footer className={styles.footer}>
      <nav className={styles.links} aria-label="Weitere Links">
        <Link href="/impressum">Impressum</Link>
        <Link href="/#hours">Öffnungszeiten</Link>
      </nav>

      <address className={styles.address}>
        {CONTACT.name} · {CONTACT_ADDRESS_LINE}
        <br />
        <a href={`tel:${CONTACT.phoneHref}`}>{CONTACT.phone}</a>
      </address>
    </footer>
  );
}
