"use client";

import { useState, useEffect } from "react";
import Logo from "./Logo";
import styles from "./SplashScreen.module.css";

export default function SplashScreen({ children }) {
  const [isVisible, setIsVisible] = useState(true);
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
            <Logo className={styles.splashLogo} />
          </div>
        </div>
      )}
      
      {children}
    </>
  );
}
