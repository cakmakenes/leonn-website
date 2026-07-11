export default function ContactPage() {
  return (
    <main style={{ padding: "12rem 2rem 5rem 2rem", textAlign: "center", color: "#fff", maxWidth: "800px", margin: "0 auto", minHeight: "80vh" }}>
      <h1 className="font-tertiary" style={{ color: "var(--color-secondary)", fontSize: "4rem", marginBottom: "2rem" }}>Kontakt</h1>
      <p style={{ fontSize: "1.2rem", lineHeight: "1.8", color: "rgba(255,255,255,0.8)", marginBottom: "2.5rem" }}>
        Haben Sie Fragen oder möchten Sie direkt telefonisch reservieren? Wir freuen uns auf Ihre Kontaktaufnahme.
      </p>
      <div style={{ background: "#151446", padding: "30px", borderRadius: "10px", border: "1px solid #dbbd82", textAlign: "left", display: "inline-block", margin: "0 auto" }}>
        <p style={{ margin: "10px 0" }}><strong>Adresse:</strong> Leonn Restaurant, Musterstraße 12, 12345 Musterstadt</p>
        <p style={{ margin: "10px 0" }}><strong>Telefon:</strong> +49 (0) 123 456789</p>
        <p style={{ margin: "10px 0" }}><strong>E-Mail:</strong> info@leonn.de</p>
      </div>
    </main>
  );
}
