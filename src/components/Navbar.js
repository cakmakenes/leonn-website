"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./Navbar.module.css";

const menuItems = [
  { name: "Menü", href: "/menu" },
  { name: "Über Uns", href: "/about" },
  { name: "Reservieren", href: "/reservation" },
  { name: "Gutschein", href: "/gutschein" },
  { name: "Veranstaltung", href: "/events" },
  { name: "Kontakt", href: "/contact" },
  { name: "Impressum", href: "/impressum" },
  { name: "Öffnungszeiten", href: "/#hours" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

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
      <nav className={styles.navbar}>
        <div className={styles.navContainer}>
          <button 
            className={styles.hamburgerBtn}
            onClick={() => setIsOpen(true)}
            aria-label="Open Menu"
          >
            <Menu size={32} />
          </button>
          
          <div className={styles.logoWrapper}>
            <Link href="/" aria-label="Leonn Homepage">
              <Logo className={styles.svgLogo} />
            </Link>
          </div>
          
          {/* Boş div, hamburger menünün ve logonun ortalanması için kullanılıyor */}
          <div style={{ width: 32 }}></div>
        </div>
      </nav>
 
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className={styles.overlay}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
            style={{ willChange: "transform" }}
          >
            <button 
              className={styles.closeBtn}
              onClick={() => setIsOpen(false)}
              aria-label="Close Menu"
            >
              <X size={40} />
            </button>
            
            <motion.div 
              className={styles.menuLinks}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3, ease: "easeOut" }}
            >
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
