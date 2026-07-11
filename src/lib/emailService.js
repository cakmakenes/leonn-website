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
  const { buyerName, buyerEmail, recipientName, recipientEmail, amount, code, message } = gutscheinDetails;
  
  // 1. Send voucher to recipient
  const recipientMailOptions = {
    from: `"Leonn Restaurant" <${process.env.SMTP_USER || "info@leonnrestaurant.com"}>`,
    to: recipientEmail,
    subject: `Ein Geschenk für Sie! Gutschein - Leonn Restaurant`,
    html: `
      <h2>Hallo ${recipientName || "Gast"},</h2>
      <p><strong>${buyerName}</strong> hat Ihnen einen Gutschein für das Leonn Restaurant im Wert von <strong>${amount}€</strong> geschenkt!</p>
      <p>Im Anhang finden Sie Ihren Gutschein als PDF-Datei mit einem QR-Code.</p>
      ${message ? `<p>Persönliche Nachricht: <em>"${message}"</em></p>` : ""}
      <br/>
      <p>Sie können diesen Gutschein einfach auf Ihrem Handy beim Restaurantbesuch vorzeigen oder ausdrucken.</p>
      <p>Wir freuen uns auf Ihren Besuch!</p>
      <br/>
      <p>Mit freundlichen Grüßen,<br/>Ihr Leonn Team</p>
    `,
    attachments: [
      {
        filename: `Leonn_Gutschein_${code}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  };

  await transporter.sendMail(recipientMailOptions);

  // 2. Send purchase confirmation to buyer
  const buyerMailOptions = {
    from: `"Leonn Restaurant" <${process.env.SMTP_USER || "info@leonnrestaurant.com"}>`,
    to: buyerEmail,
    subject: `Kaufbestätigung & Zahlungsbeleg - Leonn Restaurant Gutschein`,
    html: `
      <h2>Hallo ${buyerName},</h2>
      <p>Vielen Dank für Ihren Gutscheinkauf im Wert von <strong>${amount}€</strong>.</p>
      <p>Der Gutschein wurde erfolgreich an <strong>${recipientName} (${recipientEmail})</strong> gesendet.</p>
      <p>Dies ist Ihre Kaufbestätigung (%0 MwSt gemäß § 3 Abs. 15 UStG - Mehrzweck-Gutschein).</p>
      <p>Gutschein-Code: <strong>${code}</strong></p>
      <br/>
      <p>Mit freundlichen Grüßen,<br/>Ihr Leonn Team</p>
    `
  };

  await transporter.sendMail(buyerMailOptions);
};

export const sendAdminNotificationEmail = async (reservationDetails, approvalUrl, rejectUrl) => {
  const { name, email, phone, date, time, guests, specialRequests } = reservationDetails;
  
  const mailOptions = {
    from: `"Leonn Restaurant" <${process.env.SMTP_USER || "info@leonnrestaurant.com"}>`,
    to: process.env.ADMIN_EMAIL || process.env.SMTP_USER || "info@leonnrestaurant.com",
    subject: `NEUE RESERVIERUNGSANFRAGE - ${name}`,
    html: `
      <h2>Neue Reservierungsanfrage</h2>
      <p>Es gibt eine neue ausstehende Reservierungsanfrage. Bitte prüfen Sie das Defter ve onaylayın/reddedin:</p>
      <ul>
        <li><strong>Name:</strong> ${name}</li>
        <li><strong>E-Mail:</strong> ${email}</li>
        <li><strong>Telefon:</strong> ${phone}</li>
        <li><strong>Datum:</strong> ${new Date(date).toLocaleDateString("de-DE")}</li>
        <li><strong>Uhrzeit:</strong> ${time}</li>
        <li><strong>Personen:</strong> ${guests}</li>
        ${specialRequests ? `<li><strong>Besondere Wünsche:</strong> ${specialRequests}</li>` : ""}
      </ul>
      <br/>
      <div style="margin: 20px 0;">
        <a href="${approvalUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 15px; display: inline-block;">RESERVIERUNG BESTÄTIGEN</a>
        <a href="${rejectUrl}" style="background-color: #f44336; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">RESERVIERUNG ABLEHNEN</a>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendCustomerApprovalEmail = async (reservationDetails) => {
  const { name, email, date, time, guests } = reservationDetails;
  
  const mailOptions = {
    from: `"Leonn Restaurant" <${process.env.SMTP_USER || "info@leonnrestaurant.com"}>`,
    to: email,
    subject: `Bestätigung Ihrer Reservierung - Leonn Restaurant`,
    html: `
      <h2>Reservierung Bestätigt!</h2>
      <p>Hallo ${name},</p>
      <p>Wir freuen uns, Ihnen mitteilen zu können, dass Ihre Reservierungsanfrage erfolgreich bestätigt wurde!</p>
      <ul>
        <li><strong>Datum:</strong> ${new Date(date).toLocaleDateString("de-DE")}</li>
        <li><strong>Uhrzeit:</strong> ${time}</li>
        <li><strong>Personen:</strong> ${guests}</li>
      </ul>
      <p>Wir freuen uns darauf, Sie bald bei uns begrüßen zu dürfen!</p>
      <br/>
      <p>Mit freundlichen Grüßen,<br/>Ihr Leonn Team</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendCustomerRejectionEmail = async (reservationDetails) => {
  const { name, email, date, time } = reservationDetails;
  
  const mailOptions = {
    from: `"Leonn Restaurant" <${process.env.SMTP_USER || "info@leonnrestaurant.com"}>`,
    to: email,
    subject: `Ihre Reservierungsanfrage - Leonn Restaurant`,
    html: `
      <h2>Reservierungsanfrage leider nicht möglich</h2>
      <p>Hallo ${name},</p>
      <p>Vielen Dank für Ihre Reservierungsanfrage für den ${new Date(date).toLocaleDateString("de-DE")} um ${time} Uhr.</p>
      <p>Leider ist zu diesem Termin bei uns kein Tisch mehr frei bzw. können wir die Reservierung nicht wie gewünscht bestätigen.</p>
      <p>Gerne können Sie eine neue Reservierung für einen anderen Zeitpunkt vornehmen.</p>
      <br/>
      <p>Mit freundlichen Grüßen,<br/>Ihr Leonn Team</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
