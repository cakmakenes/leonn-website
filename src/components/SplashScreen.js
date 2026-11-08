"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import LogoFull from "./LogoFull";
import styles from "./SplashScreen.module.css";

export default function SplashScreen({ children }) {
  // The home page opens straight on the intro video, so no splash in front of it.
  const isHome = usePathname() === "/";
  const [isVisible, setIsVisible] = useState(!isHome);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // 1 saniye bekle, sonra yavaşça silinmeye başla
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 1000);

    // 1.8 saniye sonra (0.8s silinme süresi bitince) DOM'dan tamamen kaldır
    const removeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 1800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <>
      {isVisible && (
        <div className={`${styles.splash} ${isFading ? styles.fadeOut : ''}`}>
          <div className={styles.logoContainer}>
            <LogoFull className={styles.splashLogo} vertical />
          </div>
        </div>
      )}
      
      {children}
    </>
  );
}
