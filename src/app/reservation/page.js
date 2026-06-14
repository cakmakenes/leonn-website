"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import styles from "./page.module.css";

export default function ReservationPage() {
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    guests: "2",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Rezervasyon isteğiniz alındı!\nTarih: ${formData.date}\nSaat: ${formData.time}\nKişi: ${formData.guests}`);
  };

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <h1 className="font-tertiary">Tisch Reservieren</h1>
        <p className={styles.subtitle}>Sichern Sie sich Ihren Platz im Leonn Restaurant</p>
      </div>

      <motion.div 
        className={styles.formWrapper}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          
          <div className={styles.section}>
            <h3>1. Wann und wie viele?</h3>
            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label>Datum *</label>
                <input 
                  type="date" 
                  name="date" 
                  required 
                  className={styles.input}
                  value={formData.date}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Uhrzeit *</label>
                <input 
                  type="time" 
                  name="time" 
                  required 
                  className={styles.input}
                  value={formData.time}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Personen *</label>
                <select 
                  name="guests" 
                  className={styles.input}
                  value={formData.guests}
                  onChange={handleChange}
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'Person' : 'Personen'}</option>
                  ))}
                  <option value="12+">Mehr als 12 (Bitte kontaktieren)</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3>2. Ihre Kontaktdaten</h3>
            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label>Vorname *</label>
                <input type="text" name="firstName" required className={styles.input} value={formData.firstName} onChange={handleChange} />
              </div>
              <div className={styles.inputGroup}>
                <label>Nachname *</label>
                <input type="text" name="lastName" required className={styles.input} value={formData.lastName} onChange={handleChange} />
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label>E-Mail *</label>
                <input type="email" name="email" required className={styles.input} value={formData.email} onChange={handleChange} />
              </div>
              <div className={styles.inputGroup}>
                <label>Telefonnummer *</label>
                <input type="tel" name="phone" required className={styles.input} value={formData.phone} onChange={handleChange} />
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>Anmerkungen / Wünsche</label>
              <textarea 
                name="message" 
                rows="4" 
                className={styles.input} 
                placeholder="Z.B. Allergien, Geburtstag..."
                value={formData.message}
                onChange={handleChange}
              ></textarea>
            </div>
          </div>

          <button type="submit" className={styles.submitBtn}>
            Jetzt Reservieren
          </button>
          <p className={styles.infoText}>
            Nach dem Absenden erhalten Sie keine automatische Bestätigung. Wir prüfen Ihre Anfrage und melden uns schnellstmöglich per E-Mail bei Ihnen.
          </p>
        </form>
      </motion.div>
    </main>
  );
}
