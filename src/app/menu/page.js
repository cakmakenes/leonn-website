"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./page.module.css";

const categories = [
  { id: "vorspeisen", name: "Vorspeisen" },
  { id: "hauptgerichte", name: "Hauptgerichte" },
  { id: "desserts", name: "Desserts" },
  { id: "getranke", name: "Getränke" },
];

const menuData = {
  vorspeisen: [
    { id: 1, name: "Carpaccio vom Rind", description: "Mit Rucola, Parmesan und Trüffelöl", price: "18.50" },
    { id: 2, name: "Burrata", description: "Mit bunten Kirschtomaten und Basilikumpesto", price: "16.00" },
    { id: 3, name: "Bruschetta", description: "Geröstetes Brot mit Tomaten, Knoblauch und Olivenöl", price: "9.50" },
  ],
  hauptgerichte: [
    { id: 4, name: "Rinderfilet (250g)", description: "Mit Rosmarinkartoffeln und Rotweinjus", price: "42.00" },
    { id: 5, name: "Lachsfilet", description: "Auf grünem Spargel mit Zitronen-Butter-Sauce", price: "32.00" },
    { id: 6, name: "Truffel Pasta", description: "Frische Tagliatelle mit schwarzem Trüffel", price: "28.00" },
    { id: 7, name: "Wiener Schnitzel", description: "Vom Kalb mit Kartffelsalat", price: "26.50" },
  ],
  desserts: [
    { id: 8, name: "Tiramisu", description: "Klassisches italienisches Dessert", price: "10.50" },
    { id: 9, name: "Panna Cotta", description: "Mit frischen Waldbeeren", price: "9.00" },
    { id: 10, name: "Schokoladenfondant", description: "Mit flüssigem Kern und Vanilleeis", price: "12.00" },
  ],
  getranke: [
    { id: 11, name: "San Pellegrino 0.75l", description: "Mineralwasser mit Kohlensäure", price: "7.50" },
    { id: 12, name: "Coca Cola 0.33l", description: "Erfrischungsgetränk", price: "4.50" },
    { id: 13, name: "Chardonnay 0.2l", description: "Weißwein, trocken", price: "9.50" },
    { id: 14, name: "Espresso", description: "Klassischer italienischer Espresso", price: "3.50" },
  ],
};

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState(categories[0].id);
  const sectionRefs = useRef({});
  const categoryBtnRefs = useRef({});
  const categoryScrollRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 220; // Adjusted offset for sticky header + navbar

      for (const category of categories) {
        const element = sectionRefs.current[category.id];
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveCategory(category.id);
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check on mount
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const container = categoryScrollRef.current;
    const activeBtn = categoryBtnRefs.current[activeCategory];
    if (container && activeBtn) {
      const containerWidth = container.offsetWidth;
      const btnOffsetLeft = activeBtn.offsetLeft;
      const btnWidth = activeBtn.offsetWidth;
      
      const targetScrollLeft = btnOffsetLeft - (containerWidth / 2) + (btnWidth / 2);
      
      container.scrollTo({
        left: targetScrollLeft,
        behavior: "smooth"
      });
    }
  }, [activeCategory]);

  const scrollToCategory = (id) => {
    const element = sectionRefs.current[id];
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 210, // Adjusted offset so the section header sits below the sticky bar
        behavior: "smooth",
      });
    }
  };

  return (
    <main className={styles.menuContainer}>
      <div className={styles.header}>
        <h1 className="font-tertiary">Unsere Speisekarte</h1>
        <p className={styles.subtitle}>Entdecken Sie unsere kulinarischen Highlights</p>
      </div>

      {/* Sticky Category Bar */}
      <nav className={styles.stickyBar}>
        <div className={styles.stickyBarContent}>
          {/* Active Category Display */}
          <div className={styles.activeCategoryDisplay}>
            <span className={styles.indicatorLabel}>Speisekarte</span>
            <span className={styles.indicatorDivider}>|</span>
            <div className={styles.activeCategoryBanner}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={activeCategory}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className={styles.bannerText}
                >
                  {categories.find((cat) => cat.id === activeCategory)?.name}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* Categories Navigation */}
          <div ref={categoryScrollRef} className={styles.categoryScroll}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                ref={(el) => (categoryBtnRefs.current[cat.id] = el)}
                onClick={() => scrollToCategory(cat.id)}
                className={`${styles.categoryBtn} ${
                  activeCategory === cat.id ? styles.active : ""
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Menu Sections */}
      <div className={styles.menuContent}>
        {categories.map((cat) => (
          <section
            key={cat.id}
            id={cat.id}
            ref={(el) => (sectionRefs.current[cat.id] = el)}
            className={styles.menuSection}
          >
            <h2 className={styles.sectionTitle}>{cat.name}</h2>
            <div className={styles.grid}>
              {menuData[cat.id].map((item) => (
                <motion.div
                  key={item.id}
                  className={styles.card}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                >
                  <div className={styles.cardHeader}>
                    <h3 className={styles.itemName}>{item.name}</h3>
                    <span className={styles.itemPrice}>{item.price} €</span>
                  </div>
                  <p className={styles.itemDesc}>{item.description}</p>
                </motion.div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
