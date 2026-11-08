"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { CONTACT } from "@/lib/contact";

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
  { title: "V.I.P Room", href: "/vip-room", color: "var(--color-secondary)" },
];

export default function Home() {
  const introVideoRef = useRef(null);

  // React sets `muted` as a property only, so it is missing from the server
  // HTML and Safari refuses that autoplay. Starting it again here covers that.
  useEffect(() => {
    const video = introVideoRef.current;
    if (!video) return;
    video.muted = true;
    video.play().catch(() => {
      // Autoplay can still be blocked (e.g. iOS Low Power Mode); the poster stays.
    });
  }, []);

  return (
    <main className={styles.main}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <Image
            src="/motif-v5.webp"
            alt="Leonn Background Motif"
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
            Herzlich Willkommen
          </motion.h1>
          <motion.div
            className={styles.videoFrame}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <video
              ref={introVideoRef}
              className={styles.heroVideo}
              src="/intro-gif.mp4"
              poster="/motif-v5.webp"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden="true"
            />
          </motion.div>
          <motion.div 
            className={styles.scrollIndicator}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 1 }}
          >
            <span>Scrollen</span>
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
            <li><span>Montag - Sonntag</span> <span>09:00 - 23:00</span></li>
          </ul>
        </div>
        
        <div className={styles.social}>
          <a href={CONTACT.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram">
            <InstagramIcon size={40} />
          </a>
          <a href={CONTACT.googleMapsUrl} target="_blank" rel="noreferrer" aria-label="Google Maps">
            <MapPin size={40} />
          </a>
        </div>
      </footer>
    </main>
  );
}
