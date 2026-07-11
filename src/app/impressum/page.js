export default function ImpressumPage() {
  return (
    <main style={{ padding: "12rem 2rem 5rem 2rem", color: "#fff", maxWidth: "800px", margin: "0 auto", minHeight: "80vh" }}>
      <h1 className="font-tertiary" style={{ color: "var(--color-secondary)", fontSize: "3.5rem", marginBottom: "2rem", textAlign: "center" }}>Impressum</h1>
      <div style={{ background: "#151446", padding: "30px", borderRadius: "10px", border: "1px solid #dbbd82", lineHeight: "1.8" }}>
        <h3 style={{ borderBottom: "1px solid rgba(219,189,130,0.3)", paddingBottom: "10px", marginBottom: "15px" }}>Angaben gemäß § 5 TMG</h3>
        <p style={{ margin: "10px 0" }}>Leonn Restaurant<br/>Musterstraße 12<br/>12345 Musterstadt</p>
        <p style={{ margin: "10px 0" }}><strong>Vertreten durch:</strong><br/>Enes Cakmak</p>
        <p style={{ margin: "20px 0 10px 0" }}><strong>Kontakt:</strong><br/>Telefon: +49 (0) 123 456789<br/>E-Mail: info@leonn.de</p>
      </div>
    </main>
  );
}
