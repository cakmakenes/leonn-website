import nodemailer from "nodemailer";

// SMTP Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.example.com",
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: parseInt(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || "info@leonnrestaurant.com",
    pass: process.env.SMTP_PASS || "password",
  },
});

export const sendReservationEmail = async (reservationDetails) => {
  const { name, email, phone, date, time, guests, specialRequests } = reservationDetails;
  
  const mailOptions = {
    from: `"Leonn Restaurant" <${process.env.SMTP_USER || "info@leonnrestaurant.com"}>`,
    to: email, // Müşteriye
    cc: process.env.SMTP_USER, // Restorana kopya
    subject: `Reservierungsbestätigung - Leonn Restaurant`,
    html: `
      <h2>Vielen Dank für Ihre Reservierungsanfrage, ${name}!</h2>
      <p>Ihre Reservierung wurde empfangen und wird bearbeitet.</p>
      <ul>
        <li><strong>Datum:</strong> ${new Date(date).toLocaleDateString("de-DE")}</li>
        <li><strong>Uhrzeit:</strong> ${time}</li>
        <li><strong>Personen:</strong> ${guests}</li>
        <li><strong>Telefon:</strong> ${phone}</li>
        ${specialRequests ? `<li><strong>Besondere Wünsche:</strong> ${specialRequests}</li>` : ""}
      </ul>
      <p>Wir freuen uns auf Ihren Besuch!</p>
      <br/>
      <p>Mit freundlichen Grüßen,<br/>Ihr Leonn Team</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendGutscheinEmail = async (gutscheinDetails, pdfBuffer) => {
  const { buyerName, buyerEmail, recipientName, amount, code, message } = gutscheinDetails;
  
  const mailOptions = {
    from: `"Leonn Restaurant" <${process.env.SMTP_USER || "info@leonnrestaurant.com"}>`,
    to: buyerEmail,
    subject: `Ihr Leonn Gutschein (${amount}€)`,
    html: `
      <h2>Hallo ${buyerName},</h2>
      <p>Vielen Dank für Ihren Gutscheinkauf im Wert von ${amount}€.</p>
      <p>Im Anhang finden Sie Ihren Gutschein als PDF-Datei. Der Code lautet: <strong>${code}</strong></p>
      ${recipientName ? `<p>Dieser Gutschein ist für: ${recipientName}</p>` : ""}
      ${message ? `<p>Ihre Nachricht: "${message}"</p>` : ""}
      <br/>
      <p>Wir freuen uns darauf, Sie oder den Beschenkten bald im Leonn Restaurant begrüßen zu dürfen!</p>
    `,
    attachments: [
      {
        filename: `Leonn_Gutschein_${code}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  };

  await transporter.sendMail(mailOptions);
};
