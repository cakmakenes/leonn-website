"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function RedeemForm() {
  const searchParams = useSearchParams();
  const codeParam = searchParams.get("code") || "";

  const [code, setCode] = useState(codeParam);
  const [gutschein, setGutschein] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [amountToDeduct, setAmountToDeduct] = useState("");
  const [passcode, setPasscode] = useState("");

  const fetchGutscheinDetails = async (voucherCode) => {
    if (!voucherCode) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/gutschein/redeem?code=${voucherCode}`);
      const data = await res.json();
      if (res.ok) {
        setGutschein(data);
        setAmountToDeduct(data.currentAmount.toString());
      } else {
        setError(data.error || "Gutschein nicht gefunden");
        setGutschein(null);
      }
    } catch (err) {
      setError("Verbindungsfehler");
      setGutschein(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (codeParam) {
      fetchGutscheinDetails(codeParam);
    }
  }, [codeParam]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchGutscheinDetails(code);
  };

  const handleRedeemSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/gutschein/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: gutschein.code,
          amountToDeduct: Number(amountToDeduct),
          passcode
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(`Erfolgreich abgebucht! ${amountToDeduct} € abgezogen.`);
        setGutschein(data); // Update with new balance details returned from server
        setAmountToDeduct(data.currentAmount.toString());
        setPasscode("");
      } else {
        setError(data.error || "Einlösung fehlgeschlagen");
      }
    } catch (err) {
      setError("Systemfehler beim Abbuchen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{
      padding: "12rem 2rem 6rem",
      minHeight: "85vh",
      backgroundColor: "var(--color-background)",
      color: "var(--color-white)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      boxSizing: "border-box"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "600px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(219, 189, 130, 0.15)",
        borderRadius: "20px",
        padding: "3rem 2rem",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
        boxSizing: "border-box"
      }}>
        <h1 className="font-tertiary" style={{
          color: "var(--color-secondary)",
          fontSize: "2.5rem",
          textAlign: "center",
          margin: "0 0 2rem 0"
        }}>Gutschein-Verwaltung</h1>

        {/* Search Bar if no code or error */}
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "10px", marginBottom: "2rem" }}>
          <input 
            type="text" 
            placeholder="Gutschein-Code eingeben..." 
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "white",
              padding: "1rem",
              borderRadius: "8px",
              fontSize: "1rem",
              outline: "none"
            }}
          />
          <button type="submit" style={{
            background: "var(--color-secondary)",
            color: "var(--color-primary)",
            border: "none",
            padding: "0 1.5rem",
            fontWeight: "bold",
            borderRadius: "8px",
            cursor: "pointer"
          }}>Suchen</button>
        </form>

        {loading && <p style={{ textAlign: "center", color: "var(--color-secondary)" }}>Wird geladen...</p>}
        
        {error && (
          <div style={{
            background: "rgba(244, 67, 54, 0.1)",
            border: "1px solid #f44336",
            borderRadius: "8px",
            padding: "1rem",
            color: "#f44336",
            marginBottom: "1.5rem",
            textAlign: "center"
          }}>{error}</div>
        )}

        {success && (
          <div style={{
            background: "rgba(76, 175, 80, 0.1)",
            border: "1px solid #4CAF50",
            borderRadius: "8px",
            padding: "1rem",
            color: "#4CAF50",
            marginBottom: "1.5rem",
            textAlign: "center"
          }}>{success}</div>
        )}

        {gutschein && (
          <div>
            <div style={{
              background: "rgba(255,255,255,0.02)",
              borderRadius: "10px",
              padding: "1.5rem",
              border: "1px solid rgba(255,255,255,0.05)",
              marginBottom: "2rem"
            }}>
              <h3 style={{ margin: "0 0 1rem 0", color: "var(--color-secondary)" }}>Details</h3>
              <p style={{ margin: "5px 0" }}><strong>Code:</strong> {gutschein.code}</p>
              <p style={{ margin: "5px 0" }}><strong>Empfänger:</strong> {gutschein.recipientName || "Nicht angegeben"}</p>
              <p style={{ margin: "5px 0" }}><strong>Käufer:</strong> {gutschein.buyerName}</p>
              <p style={{ margin: "5px 0" }}><strong>Gesamtbetrag:</strong> {gutschein.initialAmount} €</p>
              <p style={{ margin: "5px 0", fontSize: "1.2rem" }}>
                <strong>Verbleibendes Guthaben:</strong> <span style={{ color: "var(--color-secondary)", fontWeight: "bold" }}>{gutschein.currentAmount} €</span>
              </p>
              <p style={{ margin: "5px 0" }}>
                <strong>Status:</strong> <span style={{ 
                  color: gutschein.status === "PAID" ? "#4CAF50" : "#ff9800",
                  fontWeight: "bold"
                }}>{gutschein.status}</span>
              </p>
            </div>

            {gutschein.currentAmount > 0 && gutschein.status === "PAID" && (
              <form onSubmit={handleRedeemSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <h3 style={{ margin: "0", color: "var(--color-secondary)" }}>Einlösen</h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>Abzubuchender Betrag (€):</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0.01"
                    max={gutschein.currentAmount}
                    value={amountToDeduct}
                    onChange={(e) => setAmountToDeduct(e.target.value)}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "white",
                      padding: "1rem",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      outline: "none"
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>Admin Passcode *:</label>
                  <input 
                    type="password" 
                    placeholder="Standard ist 1234"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "white",
                      padding: "1rem",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      outline: "none"
                    }}
                  />
                </div>

                <button type="submit" style={{
                  background: "var(--color-secondary)",
                  color: "var(--color-primary)",
                  border: "none",
                  padding: "1.2rem",
                  fontWeight: "bold",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "1.1rem",
                  marginTop: "10px",
                  textTransform: "uppercase"
                }}>Bestätigen</button>
              </form>
            )}
            
            {gutschein.currentAmount <= 0 && (
              <p style={{ textAlign: "center", color: "#f44336", fontWeight: "bold" }}>
                Dieser Gutschein ist vollständig aufgebraucht.
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function AdminRedeemPage() {
  return (
    <Suspense fallback={<p style={{ textAlign: "center", color: "var(--color-secondary)", paddingTop: "12rem" }}>Wird geladen...</p>}>
      <RedeemForm />
    </Suspense>
  );
}
