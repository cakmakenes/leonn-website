"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navigation, UtensilsCrossed } from "lucide-react";
import InstagramIcon from "./InstagramIcon";
import { CONTACT } from "@/lib/contact";
import styles from "./BottomBar.module.css";

/** Quick actions fixed to the bottom of every public page. */
export default function BottomBar() {
  if (usePathname().startsWith("/admin")) return null;

  return (
    <nav className={styles.bar} aria-label="Schnellzugriff">
      <a href={CONTACT.googleMapsUrl} target="_blank" rel="noreferrer" aria-label="Route auf Google Maps">
        <Navigation size={24} />
      </a>
      <a href={CONTACT.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram">
        <InstagramIcon size={24} />
      </a>
      <Link href="/menu" aria-label="Speisekarte">
        <UtensilsCrossed size={24} />
      </Link>
    </nav>
  );
}
