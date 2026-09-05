"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const DEFAULT_TARGET = "/admin/redeem";

/**
 * Only same-origin paths inside /admin are accepted, otherwise the `next`
 * query parameter would be an open-redirect vector.
 */
function safeRedirectTarget(value) {
  if (!value || typeof value !== "string") return DEFAULT_TARGET;
  if (!value.startsWith("/admin/") || value.startsWith("//")) return DEFAULT_TARGET;
  return value;
}

const inputStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "white",
  padding: "1rem",
  borderRadius: "8px",
  fontSize: "1rem",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const target = safeRedirectTarget(searchParams.get("next"));

  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();

      if (res.ok) {
        setPasscode("");
        router.replace(target);
        router.refresh();
      } else {
        setError(data.error || "Anmeldung fehlgeschlagen.");
        setLoading(false);
      }
    } catch {
      setError("Verbindungsfehler.");
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        padding: "12rem 2rem 6rem",
        minHeight: "85vh",
        backgroundColor: "var(--color-background)",
        color: "var(--color-white)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(219, 189, 130, 0.15)",
          borderRadius: "20px",
          padding: "3rem 2rem",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
          boxSizing: "border-box",
        }}
      >
        <h1
          className="font-tertiary"
          style={{
            color: "var(--color-secondary)",
            fontSize: "2.2rem",
            textAlign: "center",
            margin: "0 0 2rem 0",
          }}
        >
          Anmeldung
        </h1>

        {error && (
          <div
            style={{
              background: "rgba(244, 67, 54, 0.1)",
              border: "1px solid #f44336",
              borderRadius: "8px",
              padding: "1rem",
              color: "#f44336",
              marginBottom: "1.5rem",
              textAlign: "center",
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <label htmlFor="admin-passcode" style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>
            Admin Passcode
          </label>
          <input
            id="admin-passcode"
            name="passcode"
            type="password"
            autoComplete="current-password"
            required
            value={passcode}
            onChange={(event) => setPasscode(event.target.value)}
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              background: "var(--color-secondary)",
              color: "var(--color-primary)",
              border: "none",
              padding: "1.2rem",
              fontWeight: "bold",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "1.1rem",
              marginTop: "10px",
              textTransform: "uppercase",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Wird geprüft..." : "Anmelden"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <p style={{ textAlign: "center", color: "var(--color-secondary)", paddingTop: "12rem" }}>
          Wird geladen...
        </p>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
