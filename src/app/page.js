"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react"; 

const InstagramIcon = ({ size = 40 }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);
import styles from "./page.module.css";

const sections = [
  { title: "Reservieren", href: "/reservation", color: "var(--color-secondary)" },
  { title: "Menü", href: "/menu", color: "var(--color-white)" },
  { title: "Gutschein", href: "/gutschein", color: "var(--color-secondary)" },
  { title: "Kontakt", href: "/contact", color: "var(--color-white)" },
  { title: "Impressum", href: "/impressum", color: "var(--color-secondary)" },
  { title: "Veranstaltung", href: "/events", color: "var(--color-white)" },
];

export default function Home() {
  return (
    <main className={styles.main}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <Image 
            src="/hero-bg.png" 
            alt="Leonn Restaurant Entrance" 
            fill 
            priority
            className={styles.heroImage}
          />
          <div className={styles.overlay}></div>
        </div>
        
        <div className={styles.heroContent}>
          <motion.h1 
            className="font-tertiary"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Hoşgeldiniz
          </motion.h1>
          <motion.div 
            className={styles.scrollIndicator}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
          >
            <span>Aşağı Kaydırın</span>
            <div className={styles.scrollArrow}></div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Links Section */}
      <section className={styles.linksSection}>
        {sections.map((section, index) => (
          <motion.div
            key={section.title}
            className={styles.linkWrapper}
            initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <Link href={section.href}>
              <h2 style={{ color: section.color }}>{section.title}</h2>
            </Link>
          </motion.div>
        ))}
      </section>

      {/* Footer / Info Section */}
      <footer className={styles.footer} id="hours">
        <div className={styles.hours}>
          <h3 className="font-tertiary" style={{ fontSize: "3rem", marginBottom: "1.5rem" }}>Öffnungszeiten</h3>
          <ul>
            <li><span>Montag</span> <span>Geschlossen</span></li>
            <li><span>Dienstag</span> <span>17:00 - 23:00</span></li>
            <li><span>Mittwoch</span> <span>17:00 - 23:00</span></li>
            <li><span>Donnerstag</span> <span>17:00 - 23:00</span></li>
            <li><span>Freitag</span> <span>17:00 - 00:00</span></li>
            <li><span>Samstag</span> <span>15:00 - 00:00</span></li>
            <li><span>Sonntag</span> <span>10:00 - 22:00</span></li>
          </ul>
        </div>
        
        <div className={styles.social}>
          <a href="#" target="_blank" rel="noreferrer" aria-label="Instagram">
            <InstagramIcon size={40} />
          </a>
          <a href="#" target="_blank" rel="noreferrer" aria-label="Google Maps">
            <MapPin size={40} />
          </a>
        </div>
      </footer>
    </main>
  );
}
