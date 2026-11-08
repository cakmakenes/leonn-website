import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata = {
  title: "V.I.P Room | Leonn Restaurant",
  description:
    "Unser stilvoller VIP Room im Leonn Restaurant in Köln bietet Platz für bis zu 15 Personen.",
};

export default function VipRoomPage() {
  return (
    <main className={styles.page}>
      <h1 className={`font-tertiary ${styles.title}`}>V.I.P Room</h1>

      <div className={styles.imageFrame}>
        <Image
          src="/vip-room.jpeg"
          alt="VIP Room im Leonn Restaurant mit langem Holztisch"
          fill
          priority
          sizes="(max-width: 860px) 100vw, 800px"
          className={styles.image}
        />
      </div>

      <p className={styles.text}>
        Ob Geburtstage, Familienfeiern, Geschäftsessen oder private Veranstaltungen – unser stilvoller
        VIP Room bietet Platz für bis zu 15 Personen.
      </p>
      <p className={styles.text}>
        Genießen Sie Ihre besonderen Anlässe in einer privaten und gemütlichen Atmosphäre.
      </p>
      <p className={styles.text}>Jetzt reservieren und unvergessliche Momente erleben!</p>

      <Link href="/reservation" className={styles.cta}>
        Jetzt anfragen
      </Link>
    </main>
  );
}
