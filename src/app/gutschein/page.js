"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import styles from "./page.module.css";

const presetAmounts = [25, 50, 100, 150, 200];

export default function GutscheinPage() {
  const [amount, setAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("paypal");

  const handleCustomAmountChange = (e) => {
    const val = e.target.value;
    setCustomAmount(val);
    if (val && !isNaN(val)) {
      setAmount(Number(val));
    }
  };

  const handlePresetSelect = (val) => {
    setAmount(val);
    setCustomAmount("");
  };

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.target);
    const buyerName = `${formData.get("firstName")} ${formData.get("lastName")}`;
    const buyerEmail = formData.get("email");
    const recipientName = formData.get("recipientName") || "";
    const message = formData.get("message") || "";

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, buyerName, buyerEmail, recipientName, message })
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Ein Fehler ist aufgetreten: " + (data.error || "Unbekannt"));
        setIsLoading(false);
      }
    } catch (err) {
      alert("Systemfehler beim Checkout.");
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <h1 className="font-tertiary">Gutschein Verschenken</h1>
        <p className={styles.subtitle}>Schenken Sie ein unvergessliches kulinarisches Erlebnis</p>
      </div>

      <div className={styles.content}>
        <div className={styles.imageWrapper}>
          {/* We use the hero image temporarily as placeholder for Gutschein design */}
          <div className={styles.cardPreview}>
            <Image 
              src="/hero-bg.png" 
              alt="Leonn Restaurant Gutschein" 
              fill 
              className={styles.cardBg}
            />
            <div className={styles.cardOverlay}>
              <h2 className="font-tertiary">Leonn</h2>
              <div className={styles.cardAmount}>{amount} €</div>
              <p className={styles.cardText}>Gutschein</p>
            </div>
          </div>
        </div>

        <motion.div 
          className={styles.formWrapper}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <form className={styles.form} onSubmit={handleSubmit}>
            
            <div className={styles.section}>
              <h3>1. Betrag wählen</h3>
              <div className={styles.amountGrid}>
                {presetAmounts.map((val) => (
                  <button
                    type="button"
                    key={val}
                    className={`${styles.amountBtn} ${amount === val && !customAmount ? styles.active : ""}`}
                    onClick={() => handlePresetSelect(val)}
                  >
                    {val} €
                  </button>
                ))}
              </div>
              <div className={styles.customAmount}>
                <label>Eigener Betrag (€):</label>
                <input 
                  type="number" 
                  min="10" 
                  placeholder="Z.B. 75" 
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.section}>
              <h3>2. Persönliche Daten</h3>
              <div className={styles.inputGroup}>
                <input type="email" name="email" placeholder="Ihre E-Mail-Adresse *" required className={styles.input} />
              </div>
              <div className={styles.row}>
                <input type="text" name="firstName" placeholder="Vorname *" required className={styles.input} />
                <input type="text" name="lastName" placeholder="Nachname *" required className={styles.input} />
              </div>
              <div className={styles.inputGroup}>
                <input type="text" name="recipientName" placeholder="Für wen ist der Gutschein? (Optional)" className={styles.input} />
              </div>
              <div className={styles.inputGroup}>
                <textarea name="message" placeholder="Ihre persönliche Nachricht (Optional)" className={styles.input} rows={3} style={{resize: 'none'}} />
              </div>
            </div>

            <div className={styles.section}>
              <h3>3. Zahlungsmethode</h3>
              <div className={styles.paymentMethods}>
                <label className={`${styles.paymentRadio} ${paymentMethod === 'paypal' ? styles.activePayment : ''}`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value="paypal" 
                    checked={paymentMethod === 'paypal'} 
                    onChange={() => setPaymentMethod('paypal')}
                  />
                  <span>PayPal</span>
                </label>
                <label className={`${styles.paymentRadio} ${paymentMethod === 'klarna' ? styles.activePayment : ''}`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value="klarna" 
                    checked={paymentMethod === 'klarna'} 
                    onChange={() => setPaymentMethod('klarna')}
                  />
                  <span>Klarna</span>
                </label>
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
              {isLoading ? "Bitte warten..." : `Zahlungspflichtig bestellen (${amount} €)`}
            </button>
          </form>
        </motion.div>
      </div>
    </main>
  );
}
