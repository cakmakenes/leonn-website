"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { formatEuroFromCents } from "@/lib/format";
import styles from "./page.module.css";

/**
 * The interactive part of the public menu: the sticky category bar, the
 * scroll-spy that keeps it in sync with the visible section, and the cards.
 *
 * Content comes from the server component in `page.js`, so this component never
 * fetches and works with whatever the admin panel has published.
 */
export default function MenuView({ categories }) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.slug ?? "");
  const sectionRefs = useRef({});
  const categoryBtnRefs = useRef({});
  const categoryScrollRef = useRef(null);

  const scrollToCategory = useCallback((slug) => {
    const element = sectionRefs.current[slug];
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 90, // 15px gap + floating sticky bar height
        behavior: "smooth",
      });
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 220; // Sticky header + navbar offset

      for (const category of categories) {
        const element = sectionRefs.current[category.slug];
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveCategory(category.slug);
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Check on mount
    return () => window.removeEventListener("scroll", handleScroll);
  }, [categories]);

  useEffect(() => {
    const container = categoryScrollRef.current;
    const activeBtn = categoryBtnRefs.current[activeCategory];
    if (container && activeBtn) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();

      // Only scroll the chip strip when the active chip is not already fully
      // visible (with a small safety padding).
      const isVisible =
        btnRect.left >= containerRect.left + 20 && btnRect.right <= containerRect.right - 20;

      if (!isVisible) {
        const targetScrollLeft =
          activeBtn.offsetLeft - container.offsetWidth / 2 + activeBtn.offsetWidth / 2;
        container.scrollTo({ left: targetScrollLeft, behavior: "smooth" });
      }
    }

    // Notify the Navbar of the category change
    window.dispatchEvent(new CustomEvent("menu-category-change", { detail: activeCategory }));
  }, [activeCategory]);

  useEffect(() => {
    const handleScrollEvent = (e) => scrollToCategory(e.detail);
    window.addEventListener("scroll-to-menu-category", handleScrollEvent);
    return () => window.removeEventListener("scroll-to-menu-category", handleScrollEvent);
  }, [scrollToCategory]);

  const activeName = categories.find((cat) => cat.slug === activeCategory)?.name ?? "";

  return (
    <>
      {/* Sticky Category Bar */}
      <nav className={styles.stickyBar}>
        <div className={styles.stickyBarContent}>
          <div className={styles.activeCategoryDisplay}>
            <span className={styles.indicatorLabel}>Speisekarte</span>
            <span className={styles.indicatorDivider}>|</span>
            <div className={styles.activeCategoryBanner}>
              <span className={styles.bannerText}>{activeName}</span>
            </div>
          </div>

          <div ref={categoryScrollRef} className={styles.categoryScroll}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                ref={(el) => (categoryBtnRefs.current[cat.slug] = el)}
                onClick={() => scrollToCategory(cat.slug)}
                className={`${styles.categoryBtn} ${
                  activeCategory === cat.slug ? styles.active : ""
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
            id={cat.slug}
            ref={(el) => (sectionRefs.current[cat.slug] = el)}
            className={styles.menuSection}
          >
            <h2 className={styles.sectionTitle}>{cat.name}</h2>
            {cat.subtitle && <p className={styles.sectionNote}>{cat.subtitle}</p>}

            {cat.items.length === 0 ? (
              <p className={styles.sectionEmpty}>Bald verfügbar.</p>
            ) : (
              <div className={styles.grid}>
                {cat.items.map((item) => (
                  <article key={item.id} className={styles.card}>
                    {item.imageId && (
                      <div className={styles.cardImage}>
                        <Image
                          src={`/api/menu/image/${item.imageId}`}
                          alt={item.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 380px"
                          className={styles.cardImageInner}
                        />
                      </div>
                    )}
                    <div className={styles.cardHeader}>
                      <h3 className={styles.itemName}>{item.name}</h3>
                      <span className={styles.itemPrice}>
                        {formatEuroFromCents(item.priceCents)} €
                      </span>
                    </div>
                    {item.description && <p className={styles.itemDesc}>{item.description}</p>}
                  </article>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
