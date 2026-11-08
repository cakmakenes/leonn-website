import { CONTACT } from "@/lib/contact";

export const metadata = {
  title: "Impressum | Leonn Restaurant",
  robots: { index: false, follow: true },
};

const panelStyle = {
  background: "var(--color-surface)",
  padding: "30px",
  borderRadius: "10px",
  border: "1px solid var(--color-secondary)",
  lineHeight: "1.8",
  marginBottom: "2rem",
};

const headingStyle = {
  borderBottom: "1px solid rgba(219,189,130,0.3)",
  paddingBottom: "10px",
  marginBottom: "15px",
};

export default function ImpressumPage() {
  return (
    <main style={{ padding: "12rem 2rem 5rem 2rem", color: "#fff", maxWidth: "800px", margin: "0 auto", minHeight: "80vh" }}>
      <h1
        className="font-tertiary"
        style={{ color: "var(--color-secondary)", fontSize: "3.5rem", marginBottom: "2rem", textAlign: "center" }}
      >
        Impressum
      </h1>

      <section style={panelStyle}>
        <h3 style={headingStyle}>Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz)</h3>
        <p style={{ margin: "10px 0" }}>
          LEONN Restaurant
          <br />
          Inhaber: Muhsin Aslan
          <br />
          {CONTACT.street}
          <br />
          {CONTACT.postalCode} {CONTACT.city}
          <br />
          {CONTACT.country}
        </p>
        <p style={{ margin: "20px 0 10px 0" }}>
          <strong>Kontakt</strong>
          <br />
          Telefon: {CONTACT.phones.map((phone) => phone.display).join(" / ")}
          <br />
          E-Mail:{" "}
          <a href={`mailto:${CONTACT.email}`} style={{ color: "var(--color-secondary)" }}>
            {CONTACT.email}
          </a>
        </p>
        <p style={{ margin: "20px 0 10px 0" }}>
          <strong>Umsatzsteuer-Identifikationsnummer</strong>
          <br />
          Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:
          <br />
          DE327525348
        </p>
        <p style={{ margin: "20px 0 10px 0" }}>
          <strong>Verbraucherstreitbeilegung gemäß § 36 VSBG</strong>
          <br />
          Wir sind bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
          teilzunehmen.
        </p>
        <p style={{ margin: "10px 0" }}>
          Zuständige Verbraucherschlichtungsstelle:
          <br />
          Universalschlichtungsstelle des Bundes
          <br />
          Zentrum für Schlichtung e. V.
          <br />
          Straßburger Straße 8
          <br />
          77694 Kehl am Rhein
          <br />
          Deutschland
        </p>
        <p style={{ margin: "10px 0" }}>
          Website:{" "}
          <a
            href="https://www.universalschlichtungsstelle.de"
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--color-secondary)" }}
          >
            https://www.universalschlichtungsstelle.de
          </a>
        </p>
      </section>

      <section id="agb" style={panelStyle}>
        <h3 style={headingStyle}>Allgemeine Geschäftsbedingungen (AGB)</h3>
        <p style={{ margin: "10px 0" }}>
          Die nachfolgenden Bedingungen gelten für den Kauf von Gutscheinen und für Tischreservierungen
          über diese Website.
        </p>
        <p style={{ margin: "10px 0" }}>
          <strong>Gutscheine:</strong> Gutscheine sind ab Ausstellungsdatum drei Jahre gültig und können
          bei einem Besuch im {CONTACT.name} eingelöst werden. Eine Barauszahlung des Guthabens ist nicht
          möglich. Ein Restguthaben bleibt erhalten und kann bei einem weiteren Besuch verwendet werden.
        </p>
        <p style={{ margin: "10px 0" }}>
          <strong>Reservierungen:</strong> Eine Reservierungsanfrage stellt noch keine bestätigte
          Reservierung dar. Verbindlich wird sie erst mit unserer ausdrücklichen Bestätigung per E-Mail.
        </p>
        {/* TODO(owner): Vollständige, rechtlich geprüfte AGB einsetzen (Widerruf, Zahlung, Haftung). */}
        <p style={{ margin: "10px 0", color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>
          Diese Zusammenfassung ersetzt keine vollständigen AGB. Die endgültige Fassung wird vor dem Start
          ergänzt.
        </p>
      </section>

      <section id="datenschutz" style={panelStyle}>
        <h3 style={headingStyle}>Datenschutzerklärung</h3>
        <p style={{ margin: "10px 0" }}>
          Wir verarbeiten personenbezogene Daten (Name, E-Mail-Adresse, Telefonnummer) ausschließlich zur
          Bearbeitung Ihrer Reservierungs- und Gutscheinanfragen und geben sie nicht an Dritte weiter,
          soweit dies nicht zur Zahlungsabwicklung erforderlich ist.
        </p>
        <p style={{ margin: "10px 0" }}>
          <strong>Zahlungsabwicklung:</strong> Gutscheinzahlungen werden über Stripe abgewickelt. Dabei
          werden die für die Zahlung erforderlichen Daten an Stripe übermittelt.
        </p>
        <p style={{ margin: "10px 0" }}>
          <strong>Ihre Rechte:</strong> Sie haben das Recht auf Auskunft, Berichtigung und Löschung Ihrer
          gespeicherten Daten. Wenden Sie sich hierzu an {CONTACT.email}.
        </p>
        {/* TODO(owner): Vollständige Datenschutzerklärung (DSGVO Art. 13/14) einsetzen. */}
        <p style={{ margin: "10px 0", color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>
          Diese Zusammenfassung ersetzt keine vollständige Datenschutzerklärung. Die endgültige Fassung
          wird vor dem Start ergänzt.
        </p>
      </section>
    </main>
  );
}
