"use client";

export default function GutscheinCancelPage() {
  return (
    <main style={{
      padding: "12rem 2rem 6rem",
      minHeight: "85vh",
      backgroundColor: "var(--color-background)",
      color: "var(--color-white)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      boxSizing: "border-box"
    }}>
      <div style={{
        maxWidth: "600px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(219, 189, 130, 0.15)",
        borderRadius: "20px",
        padding: "3.5rem 2rem",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
        boxSizing: "border-box"
      }}>
        <div style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: "rgba(244, 67, 54, 0.1)",
          border: "2px solid #f44336",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "2.5rem",
          color: "#f44336",
          marginBottom: "2rem",
          marginLeft: "auto",
          marginRight: "auto"
        }}>
          ✕
        </div>
        <h1 className="font-tertiary" style={{
          color: "#f44336",
          fontSize: "3rem",
          margin: "0 0 1rem 0"
        }}>Abgebrochen</h1>
        <p style={{
          fontSize: "1.2rem",
          color: "rgba(255, 255, 255, 0.9)",
          lineHeight: "1.6",
          marginBottom: "2rem"
        }}>
          Der Bezahlvorgang wurde abgebrochen.
        </p>
        <p style={{
          fontSize: "1rem",
          color: "rgba(255, 255, 255, 0.6)",
          lineHeight: "1.6",
          marginBottom: "2.5rem"
        }}>
          Es wurde keine Zahlung durchgeführt und kein Gutschein erstellt. Sie können es gerne erneut versuchen.
        </p>
        <a href="/gutschein" style={{
          background: "var(--color-secondary)",
          color: "var(--color-primary)",
          border: "none",
          padding: "1rem 2rem",
          fontSize: "1rem",
          fontWeight: "bold",
          textTransform: "uppercase",
          letterSpacing: "1px",
          borderRadius: "8px",
          textDecoration: "none",
          transition: "background 0.3s ease",
          display: "inline-block"
        }}
        onMouseOver={(e) => e.currentTarget.style.background = "#e8cca0"}
        onMouseOut={(e) => e.currentTarget.style.background = "var(--color-secondary)"}
        >
          Zurück zum Shop
        </a>
      </div>
    </main>
  );
}
