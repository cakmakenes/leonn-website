"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";
import styles from "./Navbar.module.css";

const categories = [
  { id: "corbalar", name: "Çorbalar" },
  { id: "kahvalti", name: "Kahvaltı" },
  { id: "mezze", name: "Mezze" },
  { id: "izgara", name: "Izgara" },
  { id: "selection", name: "Selection" },
  { id: "kuzu", name: "Kuzu" },
  { id: "desserts", name: "Desserts" },
  { id: "homemade_drinks", name: "Homemade drinks" },
];

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
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeCategory, setActiveCategory] = useState("corbalar");
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

  // Listen to active category changes from the menu page scroll handler
  useEffect(() => {
    if (!isMenuPage) return;
    const handleCategoryChange = (e) => {
      setActiveCategory(e.detail);
    };
    window.addEventListener("menu-category-change", handleCategoryChange);
    return () => window.removeEventListener("menu-category-change", handleCategoryChange);
  }, [isMenuPage]);

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

  const handleCategoryClick = (catId) => {
    setActiveCategory(catId);
    window.dispatchEvent(new CustomEvent("scroll-to-menu-category", { detail: catId }));
  };

  return (
    <>
      <nav className={`${styles.navbar} ${isScrolled ? styles.floating : ""} ${isMenuPage && isScrolled ? styles.menuFloating : ""}`}>
        <div className={styles.navContainer}>
          {/* Hamburger button on the left */}
          <button 
            className={styles.hamburgerBtn}
            onClick={() => setIsOpen(true)}
            aria-label="Open Menu"
          >
            <Menu size={28} />
          </button>
          
          {/* Logo container - hides on scroll on menu page */}
          <div className={`${styles.logoWrapper} ${isMenuPage && isScrolled ? styles.hidden : ""}`}>
            <Link href="/" aria-label="Leonn Homepage">
              <Logo className={styles.svgLogo} />
            </Link>
          </div>

          {/* Categories navigation in Navbar - visible only on scroll on menu page */}
          {isMenuPage && isScrolled && (
            <div className={styles.navbarCategories}>
              <div className={styles.categoryScroll}>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`${styles.categoryBtn} ${
                      activeCategory === cat.id ? styles.active : ""
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Balancing element (only present when logo is visible to keep layout centered) */}
          <div className={styles.balanceDiv} style={{ width: isMenuPage && isScrolled ? 0 : 28 }}></div>
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
