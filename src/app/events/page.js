import Image from "next/image";
import Link from "next/link";
import { CONTACT } from "@/lib/contact";
import styles from "./page.module.css";

export const metadata = {
  title: "Veranstaltungen | Leonn Restaurant",
  description: "Feiern Sie private Events und Firmenfeiern im Leonn Restaurant in Köln.",
};

export default function EventsPage() {
  return (
    <main className={styles.page}>
      <h1 className={`font-tertiary ${styles.title}`}>Veranstaltungen</h1>

      <p className={styles.text}>
        Planen Sie ein privates Event, eine Geburtstagsfeier oder eine Firmenveranstaltung? Das Leonn
        Restaurant bietet den perfekten Rahmen für bis zu 80 Personen. Kontaktieren Sie uns gerne für
        ein individuelles Menüangebot.
      </p>

      {/* TODO(owner): Fotos von Veranstaltungen/Räumlichkeiten einsetzen (ersetzen die Platzhalter). */}
      <div className={styles.gallery}>
        <div className={styles.imageFrame}>
          <Image
            src="/hero-bg.png"
            alt="Festlich gedeckter Tisch im Leonn Restaurant"
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className={styles.image}
          />
        </div>
        <div className={styles.imageFrame}>
          <Image
            src="/menu-header-bg.png"
            alt="Ambiente für Feiern im Leonn Restaurant"
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className={styles.image}
          />
        </div>
      </div>

      <Link href="/contact" className={styles.cta}>
        Jetzt anfragen
      </Link>
      <p className={styles.contactLine}>
        oder direkt:{" "}
        <a href={`tel:${CONTACT.phoneHref}`}>{CONTACT.phone}</a>
      </p>
    </main>
  );
}
