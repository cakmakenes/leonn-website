import Image from "next/image";
import styles from "./page.module.css";

export const metadata = {
  title: "Über Uns | Leonn Restaurant",
  description: "Lernen Sie das Leonn Restaurant in Köln kennen.",
};

export default function AboutPage() {
  return (
    <main className={styles.page}>
      <h1 className={`font-tertiary ${styles.title}`}>Über Uns</h1>

      {/* TODO(owner): Innenaufnahme des Restaurants einsetzen (ersetzt das Platzhalterbild). */}
      <div className={styles.imageFrame}>
        <Image
          src="/menu-header-bg.png"
          alt="Impressionen aus dem Leonn Restaurant"
          fill
          sizes="(max-width: 768px) 100vw, 800px"
          className={styles.image}
          priority
        />
      </div>

      <p className={styles.text}>
        Willkommen im Leonn Restaurant. Wir bieten Ihnen eine exklusive Auswahl an erlesenen
        Fleischspezialitäten, Mezze und frisch zubereiteten Gerichten. Genießen Sie die einzigartige
        Atmosphäre und lassen Sie sich von unserer kulinarischen Vielfalt verzaubern.
      </p>
    </main>
  );
}
