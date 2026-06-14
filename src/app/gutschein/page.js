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

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Checkout işlemi başlatılıyor...\nTutar: ${amount}€\nÖdeme Yöntemi: ${paymentMethod}`);
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
              <h3>2. Empfänger & Rechnungsadresse</h3>
              <div className={styles.inputGroup}>
                <input type="email" placeholder="E-Mail des Empfängers *" required className={styles.input} />
              </div>
              <div className={styles.row}>
                <input type="text" placeholder="Vorname *" required className={styles.input} />
                <input type="text" placeholder="Nachname *" required className={styles.input} />
              </div>
              <div className={styles.inputGroup}>
                <input type="text" placeholder="Straße und Hausnummer *" required className={styles.input} />
              </div>
              <div className={styles.row}>
                <input type="text" placeholder="PLZ *" required className={styles.input} />
                <input type="text" placeholder="Stadt *" required className={styles.input} />
              </div>
              <div className={styles.inputGroup}>
                <input type="text" placeholder="Land *" required className={styles.input} />
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

            <button type="submit" className={styles.submitBtn}>
              Zahlungspflichtig bestellen ({amount} €)
            </button>
          </form>
        </motion.div>
      </div>
    </main>
  );
}
