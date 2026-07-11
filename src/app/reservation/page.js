"use client";

import { useState, useEffect, useRef } from "react";
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

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Dynamic minimum date and time restrictions
  const [minDate, setMinDate] = useState("");
  const [minTime, setMinTime] = useState("");

  // Refs for auto-focus transition
  const dateInputRef = useRef(null);
  const timeInputRef = useRef(null);
  const guestsInputRef = useRef(null);
  const firstNameInputRef = useRef(null);
  const lastNameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const messageInputRef = useRef(null);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Calculate today's date in local YYYY-MM-DD
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setMinDate(`${yyyy}-${mm}-${dd}`);

    // If date is today, calculate minimum time (now + 30 minutes)
    const updateMinTime = () => {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 30);
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      setMinTime(`${hh}:${min}`);
    };

    updateMinTime();
    const interval = setInterval(updateMinTime, 60000); // Keep it updated every minute
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleKeyDown = (e, nextRef) => {
    if (e.key === "Enter") {
      e.preventDefault();
      nextRef.current?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate that selected date/time is at least 30 minutes in the future
    const selectedDateTime = new Date(`${formData.date}T${formData.time}`);
    const minAllowedDateTime = new Date();
    minAllowedDateTime.setMinutes(minAllowedDateTime.getMinutes() + 30);
    
    if (selectedDateTime < minAllowedDateTime) {
      alert("Für Reservierungen am selben Tag muss die Uhrzeit mindestens 30 Minuten in der Zukunft liegen.");
      setIsLoading(false);
      return;
    }
    
    try {
      const res = await fetch("/api/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          date: formData.date,
          time: formData.time,
          guests: Number(formData.guests) || 12,
          specialRequests: formData.message,
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        alert("Ein Fehler ist aufgetreten: " + (data.error || "Unbekannt"));
      }
    } catch (err) {
      alert("Systemfehler bei der Reservierung.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  if (success) {
    return (
      <main className={styles.container}>
        <div className={styles.header}>
          <h1 className="font-tertiary">Vielen Dank!</h1>
          <p className={styles.subtitle}>Ihre Reservierungsanfrage wurde erfolgreich übermittelt.</p>
        </div>
        <div style={{textAlign: "center", color: "var(--color-secondary)", marginTop: "2rem", fontSize: "1.2rem", padding: "0 1.5rem", lineHeight: "1.6"}}>
          Ihre Anfrage wird von uns geprüft. Sobald die Reservierung bestätigt ist, erhalten Sie eine E-Mail von uns.
        </div>
      </main>
    );
  }

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
                  ref={dateInputRef}
                  min={minDate}
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
                  ref={timeInputRef}
                  min={formData.date === minDate ? minTime : undefined}
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
                  ref={guestsInputRef}
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
                <input 
                  type="text" 
                  name="firstName" 
                  ref={firstNameInputRef}
                  required 
                  className={styles.input} 
                  value={formData.firstName} 
                  onChange={handleChange}
                  onKeyDown={(e) => handleKeyDown(e, lastNameInputRef)}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Nachname *</label>
                <input 
                  type="text" 
                  name="lastName" 
                  ref={lastNameInputRef}
                  required 
                  className={styles.input} 
                  value={formData.lastName} 
                  onChange={handleChange} 
                  onKeyDown={(e) => handleKeyDown(e, emailInputRef)}
                />
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label>E-Mail *</label>
                <input 
                  type="email" 
                  name="email" 
                  ref={emailInputRef}
                  required 
                  className={styles.input} 
                  value={formData.email} 
                  onChange={handleChange} 
                  onKeyDown={(e) => handleKeyDown(e, phoneInputRef)}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Telefonnummer *</label>
                <input 
                  type="tel" 
                  name="phone" 
                  ref={phoneInputRef}
                  required 
                  className={styles.input} 
                  value={formData.phone} 
                  onChange={handleChange} 
                  onKeyDown={(e) => handleKeyDown(e, messageInputRef)}
                />
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>Anmerkungen / Wünsche</label>
              <textarea 
                name="message" 
                ref={messageInputRef}
                rows="4" 
                className={styles.input} 
                placeholder="Z.B. Allergien, Geburtstag..."
                value={formData.message}
                onChange={handleChange}
              ></textarea>
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? "Bitte warten..." : "Jetzt Reservieren"}
          </button>
          <p className={styles.infoText}>
            Nach dem Absenden erhalten Sie keine automatische Bestätigung. Wir prüfen Ihre Anfrage und melden uns schnellstmöglich per E-Mail bei Ihnen.
          </p>
        </form>
      </motion.div>
    </main>
  );
}
