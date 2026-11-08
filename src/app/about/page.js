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
        Die Geschichte von Leonn ist eng mit unseren türkischen Wurzeln, unserer Küche und der
        türkischen Gastfreundschaft verbunden. Es ist unsere Leidenschaft, die Aromen, Traditionen und
        die besondere Bedeutung des gemeinsamen Essens, mit denen wir aufgewachsen sind, unseren Gästen
        näherzubringen.
      </p>
      <p className={styles.text}>
        In unserer Küche werden täglich mehr als 70 verschiedene Speisen frisch zubereitet. Vom
        Frühstück über Mezze und Grillgerichte bis hin zu traditionellen anatolischen Spezialitäten und
        Desserts legen wir großen Wert auf Frische, hochwertige Zutaten und eine sorgfältige
        Zubereitung. Traditionelle Rezepte bewahren wir dabei und verbinden sie mit der eigenen
        Handschrift von Leonn.
      </p>
      <p className={styles.text}>
        In der türkischen Kultur ist der gedeckte Tisch weit mehr als nur ein Ort zum Essen. Er steht
        für Gemeinschaft, Teilen und Gastfreundschaft. Genau dieses Gefühl möchten wir bei Leonn
        weitergeben und jedem Gast das Gefühl vermitteln, herzlich willkommen zu sein.
      </p>
      <p className={styles.text}>
        Diese Speisekarte ist Ausdruck unserer Verbundenheit mit der türkischen Küche, unseren Wurzeln
        und der Gastfreundschaft, die uns seit jeher begleitet.
      </p>
      <p className={styles.text}>Herzlich willkommen bei Leonn. Afiyet olsun.</p>
    </main>
  );
}
