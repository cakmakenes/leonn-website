import { CONTACT, CONTACT_ADDRESS_LINE } from "@/lib/contact";

export const metadata = {
  title: "Kontakt | Leonn Restaurant",
  description: "So erreichen Sie das Leonn Restaurant in Köln.",
};

export default function ContactPage() {
  return (
    <main
      style={{
        padding: "12rem 2rem 5rem 2rem",
        textAlign: "center",
        color: "#fff",
        maxWidth: "800px",
        margin: "0 auto",
        minHeight: "80vh",
      }}
    >
      <h1 className="font-tertiary" style={{ color: "var(--color-secondary)", fontSize: "4rem", marginBottom: "2rem" }}>
        Kontakt
      </h1>
      <p style={{ fontSize: "1.2rem", lineHeight: "1.8", color: "rgba(255,255,255,0.8)", marginBottom: "2.5rem" }}>
        Haben Sie Fragen oder möchten Sie direkt telefonisch reservieren? Wir freuen uns auf Ihre Kontaktaufnahme.
      </p>

      <div
        style={{
          background: "var(--color-surface)",
          padding: "30px",
          borderRadius: "10px",
          border: "1px solid var(--color-secondary)",
          textAlign: "left",
          display: "inline-block",
          margin: "0 auto 2.5rem",
        }}
      >
        <p style={{ margin: "10px 0" }}>
          <strong>Adresse:</strong> {CONTACT.name}, {CONTACT_ADDRESS_LINE}
        </p>
        <p style={{ margin: "10px 0" }}>
          <strong>Telefon:</strong>{" "}
          <a href={`tel:${CONTACT.phoneHref}`} style={{ color: "var(--color-secondary)" }}>
            {CONTACT.phone}
          </a>
        </p>
      </div>

      {/* Embedded map so guests can find the restaurant without leaving the page. */}
      <div
        style={{
          borderRadius: "10px",
          overflow: "hidden",
          border: "1px solid rgba(219,189,130,0.3)",
          lineHeight: 0,
        }}
      >
        <iframe
          title="Standort Leonn Restaurant"
          src={`https://www.google.com/maps?q=${encodeURIComponent(
            `${CONTACT.street}, ${CONTACT.postalCode} ${CONTACT.city}`
          )}&output=embed`}
          width="100%"
          height="360"
          style={{ border: 0, display: "block" }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    </main>
  );
}
