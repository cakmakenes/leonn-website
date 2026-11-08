"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import LogoFull from "./LogoFull";
import styles from "./Navbar.module.css";

const menuItems = [
  { name: "Menü", href: "/menu" },
  { name: "Über Uns", href: "/about" },
  { name: "Reservieren", href: "/reservation" },
  { name: "Gutschein", href: "/gutschein" },
  { name: "V.I.P Room", href: "/vip-room" },
  { name: "Kontakt", href: "/contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const isMenuPage = pathname === "/menu";

  // Track window scroll to toggle floating capsule state
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when hamburger menu is open to optimize rendering performance
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <nav className={`${styles.navbar} ${isScrolled ? styles.floating : ""} ${isMenuPage && isScrolled ? styles.menuFloating : ""}`}>
        <div className={styles.navContainer}>
          <button 
            className={styles.hamburgerBtn}
            onClick={() => setIsOpen(true)}
            aria-label="Open Menu"
          >
            <Menu size={32} />
          </button>
          
          <div className={styles.logoWrapper}>
            <Link href="/" aria-label="Leonn Restaurant Startseite">
              <LogoFull className={styles.svgLogo} />
            </Link>
          </div>
          
          <div style={{ width: 32 }}></div>
        </div>
      </nav>
 
      <div className={`${styles.overlay} ${isOpen ? styles.open : ""}`}>
        <button 
          className={styles.closeBtn}
          onClick={() => setIsOpen(false)}
          aria-label="Close Menu"
        >
          <X size={40} />
        </button>
        
        <div className={styles.menuLinks}>
          {menuItems.map((item) => (
            <Link 
              key={item.name}
              href={item.href} 
              className={styles.link}
              onClick={() => setIsOpen(false)}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
