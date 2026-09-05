import nodemailer from "nodemailer";
import { escapeHtml } from "@/lib/security";
import { formatGermanDate } from "@/lib/format";

let transporter = null;

/**
 * Lazily built SMTP transport.
 *
 * There are no credential fallbacks on purpose: silently falling back to a
 * placeholder host/password made a misconfigured deployment look healthy while
 * every mail failed.
 */
function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 465);

  const missing = [
    !host && "SMTP_HOST",
    !user && "SMTP_USER",
    !pass && "SMTP_PASS",
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(`Missing SMTP configuration: ${missing.join(", ")}`);
  }
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("SMTP_PORT must be a positive integer");
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

function fromAddress() {
  return `"Leonn Restaurant" <${process.env.SMTP_USER}>`;
}

function adminRecipient() {
  const recipient = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  if (!recipient) throw new Error("Neither ADMIN_EMAIL nor SMTP_USER is configured");
  return recipient;
}

const SIGNATURE = `<br /><p>Mit freundlichen Grüßen,<br />Ihr Leonn Team</p>`;

/**
 * Notifies the restaurant about a new reservation request.
 * `approvalUrl` / `rejectUrl` are generated server-side and are not user input.
 */
export const sendAdminNotificationEmail = async (reservation, approvalUrl, rejectUrl) => {
  const { name, email, phone, date, time, guests, specialRequests } = reservation;

  await getTransporter().sendMail({
    from: fromAddress(),
    to: adminRecipient(),
    replyTo: email,
    subject: `NEUE RESERVIERUNGSANFRAGE - ${name}`,
    html: `
      <h2>Neue Reservierungsanfrage</h2>
      <p>Es liegt eine neue offene Reservierungsanfrage vor. Bitte bestätigen oder ablehnen:</p>
      <ul>
        <li><strong>Name:</strong> ${escapeHtml(name)}</li>
        <li><strong>E-Mail:</strong> ${escapeHtml(email)}</li>
        <li><strong>Telefon:</strong> ${escapeHtml(phone)}</li>
        <li><strong>Datum:</strong> ${escapeHtml(formatGermanDate(date))}</li>
        <li><strong>Uhrzeit:</strong> ${escapeHtml(time)}</li>
        <li><strong>Personen:</strong> ${escapeHtml(String(guests))}</li>
        ${specialRequests ? `<li><strong>Besondere Wünsche:</strong> ${escapeHtml(specialRequests)}</li>` : ""}
      </ul>
      <div style="margin: 20px 0;">
        <a href="${escapeHtml(approvalUrl)}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 15px; display: inline-block;">RESERVIERUNG BESTÄTIGEN</a>
        <a href="${escapeHtml(rejectUrl)}" style="background-color: #f44336; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">RESERVIERUNG ABLEHNEN</a>
      </div>
      <p style="font-size: 12px; color: #888;">Beide Links öffnen zunächst eine Bestätigungsseite. Erst der Klick dort ändert den Status.</p>
    `,
  });
};

export const sendCustomerApprovalEmail = async (reservation) => {
  const { name, email, date, time, guests } = reservation;

  await getTransporter().sendMail({
    from: fromAddress(),
    to: email,
    subject: "Bestätigung Ihrer Reservierung - Leonn Restaurant",
    html: `
      <h2>Reservierung bestätigt!</h2>
      <p>Hallo ${escapeHtml(name)},</p>
      <p>wir freuen uns, Ihnen mitteilen zu können, dass Ihre Reservierungsanfrage bestätigt wurde.</p>
      <ul>
        <li><strong>Datum:</strong> ${escapeHtml(formatGermanDate(date))}</li>
        <li><strong>Uhrzeit:</strong> ${escapeHtml(time)}</li>
        <li><strong>Personen:</strong> ${escapeHtml(String(guests))}</li>
      </ul>
      <p>Wir freuen uns darauf, Sie bald bei uns begrüßen zu dürfen!</p>
      ${SIGNATURE}
    `,
  });
};

export const sendCustomerRejectionEmail = async (reservation) => {
  const { name, email, date, time } = reservation;

  await getTransporter().sendMail({
    from: fromAddress(),
    to: email,
    subject: "Ihre Reservierungsanfrage - Leonn Restaurant",
    html: `
      <h2>Reservierungsanfrage leider nicht möglich</h2>
      <p>Hallo ${escapeHtml(name)},</p>
      <p>vielen Dank für Ihre Reservierungsanfrage für den ${escapeHtml(formatGermanDate(date))} um ${escapeHtml(time)} Uhr.</p>
      <p>Leider ist zu diesem Termin kein Tisch mehr frei bzw. können wir die Reservierung nicht wie gewünscht bestätigen.</p>
      <p>Gerne können Sie eine neue Reservierung für einen anderen Zeitpunkt vornehmen.</p>
      ${SIGNATURE}
    `,
  });
};

/**
 * Sends the voucher PDF to the recipient and a purchase confirmation to the buyer.
 * Both mails must succeed, otherwise the caller retries the whole delivery.
 */
export const sendGutscheinEmail = async (gutschein, pdfBuffer) => {
  const { buyerName, buyerEmail, recipientName, recipientEmail, amount, code, message } = gutschein;
  const mailer = getTransporter();

  await mailer.sendMail({
    from: fromAddress(),
    to: recipientEmail,
    subject: "Ein Geschenk für Sie! Gutschein - Leonn Restaurant",
    html: `
      <h2>Hallo ${escapeHtml(recipientName || "Gast")},</h2>
      <p><strong>${escapeHtml(buyerName)}</strong> hat Ihnen einen Gutschein für das Leonn Restaurant im Wert von <strong>${escapeHtml(String(amount))} €</strong> geschenkt!</p>
      <p>Im Anhang finden Sie Ihren Gutschein als PDF-Datei mit einem QR-Code.</p>
      ${message ? `<p>Persönliche Nachricht: <em>"${escapeHtml(message)}"</em></p>` : ""}
      <p>Sie können den Gutschein beim Restaurantbesuch auf Ihrem Handy vorzeigen oder ausdrucken.</p>
      <p>Wir freuen uns auf Ihren Besuch!</p>
      ${SIGNATURE}
    `,
    attachments: [
      {
        filename: `Leonn_Gutschein_${code}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  await mailer.sendMail({
    from: fromAddress(),
    to: buyerEmail,
    subject: "Kaufbestätigung & Zahlungsbeleg - Leonn Restaurant Gutschein",
    html: `
      <h2>Hallo ${escapeHtml(buyerName)},</h2>
      <p>vielen Dank für Ihren Gutscheinkauf im Wert von <strong>${escapeHtml(String(amount))} €</strong>.</p>
      <p>Der Gutschein wurde erfolgreich an <strong>${escapeHtml(recipientName || "den Empfänger")} (${escapeHtml(recipientEmail)})</strong> gesendet.</p>
      <p>Dies ist Ihre Kaufbestätigung (0 % MwSt gemäß § 3 Abs. 15 UStG - Mehrzweck-Gutschein).</p>
      <p>Gutschein-Code: <strong>${escapeHtml(code)}</strong></p>
      ${SIGNATURE}
    `,
  });
};
