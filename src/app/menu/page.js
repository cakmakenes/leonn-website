"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./page.module.css";

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

const menuData = {
  corbalar: [
    { id: 1, name: "Linsensuppe (Mercimek)", description: "Traditionelle rote Linsensuppe mit Zitrone und Minzöl", price: "7.50" },
    { id: 2, name: "Tomatensuppe", description: "Frische Tomatensuppe mit geriebenem Kaşar-Käse und Croutons", price: "8.00" },
  ],
  kahvalti: [
    { id: 3, name: "Leonn Serpme Kahvaltı", description: "Reichhaltiges türkisches Frühstück (für 2 Personen) mit Käseauswahl, Oliven, Eiervariationen, Pastırma, Honig & Kajmak", price: "38.00" },
    { id: 4, name: "Menemen", description: "Klassisches Pfannengericht aus Eiern, Tomaten, grünem Paprika und Gewürzen", price: "12.50" },
    { id: 5, name: "Sucuklu Yumurta", description: "Gebratene türkische Knoblauchwurst mit Spiegeleiern", price: "13.50" },
  ],
  mezze: [
    { id: 6, name: "Hummus", description: "Kichererbsenpüree mit Sesampaste (Tahini), Zitrone und Olivenöl", price: "8.50" },
    { id: 7, name: "Haydari", description: "Cremiger Joghurt mit Knoblauch, frischer Minze und Olivenöl", price: "7.50" },
    { id: 8, name: "Babagannuş", description: "Gegrillte Auberginen mit Paprika, Granatapfelsirup und Knoblauch", price: "9.00" },
    { id: 9, name: "Mezze Teller (gemischt)", description: "Eine feine Auswahl unserer hausgemachten kalten Vorspeisen", price: "19.50" },
  ],
  izgara: [
    { id: 10, name: "Adana Kebap", description: "Scharf gewürzter Hackfleischspieß vom Grill, serviert mit Bulgur und Salat", price: "24.50" },
    { id: 11, name: "Tavuk Şiş", description: "Marinierter Hähnchenbrustspieß mit Grillgemüse und Reis", price: "21.00" },
    { id: 12, name: "Urfa Kebap", description: "Mild gewürzter Hackfleischspieß vom Grill, serviert mit Bulgur", price: "24.50" },
  ],
  selection: [
    { id: 13, name: "Leonn Selection Ribeye (300g)", description: "Premium Ribeye Steak vom Rind mit Kräuterbutter und Trüffelpommes", price: "45.00" },
    { id: 14, name: "T-Bone Steak (500g)", description: "Am Knochen gereiftes Premium Steak mit gegrilltem Spargel", price: "58.00" },
    { id: 15, name: "Filet Mignon (250g)", description: "Zartes Rinderfilet mit Rotweinjus und Rosmarinkartoffeln", price: "42.00" },
  ],
  kuzu: [
    { id: 16, name: "Kuzu Pirzola", description: "Zarte Lammkoteletts mit Grillgemüse und Rosmarin", price: "32.50" },
    { id: 17, name: "Kuzu İncik", description: "Langsam geschmorte Lammhaxe auf cremigem Auberginenpüree (Hünkar Beğendi)", price: "29.50" },
    { id: 18, name: "Kuzu Şiş", description: "Marinierter Lammspieß mit gegrillten Tomaten und Zwiebel-Sumak-Salat", price: "28.00" },
  ],
  desserts: [
    { id: 19, name: "Klassisches Baklava", description: "Blätterteiggebäck mit Pistazien und Zuckersirup, serviert mit Maraş-Eis", price: "11.50" },
    { id: 20, name: "Künefe", description: "Warmes Engelshaar-Gebäck mit geschmolzenem Käse und Sirup", price: "12.50" },
    { id: 21, name: "San Sebastian Cheesecake", description: "Cremiger, baskischer Käsekuchen mit flüssiger Schokoladensauce", price: "10.50" },
  ],
  homemade_drinks: [
    { id: 22, name: "Leonn Minz-Ayran", description: "Erfrischendes Joghurtgetränk mit frischer Minze und Meersalz", price: "5.00" },
    { id: 23, name: "Hausgemachte Limonade", description: "Frisch gepresste Zitronen-Limonade mit Minze und Erdbeersirup", price: "6.50" },
    { id: 24, name: "Hausgemachter Pfirsich-Eistee", description: "Frisch gebrühter schwarzer Tee mit Pfirsichpüree und Zitrone", price: "6.00" },
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
      const containerRect = container.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      
      // Check if button is already fully visible inside the horizontal scrollbar viewport (with a small safety padding)
      const isVisible = (btnRect.left >= containerRect.left + 20) && (btnRect.right <= containerRect.right - 20);
      
      if (!isVisible) {
        const containerWidth = container.offsetWidth;
        const btnOffsetLeft = activeBtn.offsetLeft;
        const btnWidth = activeBtn.offsetWidth;
        
        const targetScrollLeft = btnOffsetLeft - (containerWidth / 2) + (btnWidth / 2);
        
        container.scrollTo({
          left: targetScrollLeft,
          behavior: "smooth"
        });
      }
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
