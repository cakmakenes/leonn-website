import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import Reservation from "@/models/Reservation";
import { sendCustomerApprovalEmail, sendCustomerRejectionEmail } from "@/lib/emailService";
import { escapeHtml } from "@/lib/security";
import { formatGermanDate } from "@/lib/format";
import { htmlErrorResponse, htmlResponse, renderHtmlPage } from "@/lib/htmlPage";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

const DECISION_LIMIT = 30;
const WINDOW_MS = 5 * 60 * 1000;

export const DECISIONS = {
  approve: {
    tokenField: "approveToken",
    targetStatus: "CONFIRMED",
    actionPath: "/api/reservation/approve",
    confirmHeading: "Reservierung bestätigen?",
    confirmButtonLabel: "Jetzt bestätigen",
    buttonColor: "#4CAF50",
    doneHeading: "Erfolgreich bestätigt!",
    doneNote: "Eine Bestätigungs-E-Mail wurde an den Gast gesendet.",
    alreadyHeading: "Bereits bestätigt",
    alreadyNote: "Diese Reservierung wurde bereits zuvor bestätigt.",
    sendCustomerEmail: sendCustomerApprovalEmail,
  },
  reject: {
    tokenField: "rejectToken",
    targetStatus: "CANCELLED",
    actionPath: "/api/reservation/reject",
    confirmHeading: "Reservierung ablehnen?",
    confirmButtonLabel: "Jetzt ablehnen",
    buttonColor: "#f44336",
    doneHeading: "Erfolgreich abgelehnt",
    doneNote: "Eine Ablehnungs-E-Mail wurde an den Gast gesendet.",
    alreadyHeading: "Bereits abgelehnt",
    alreadyNote: "Diese Reservierung wurde bereits zuvor abgelehnt.",
    sendCustomerEmail: sendCustomerRejectionEmail,
  },
};

const INVALID_LINK_MESSAGE =
  "Dieser Link ist ungültig oder abgelaufen. Bitte öffnen Sie die Reservierung direkt in der Verwaltung.";

function tooManyRequests() {
  return htmlErrorResponse("Zu viele Anfragen. Bitte versuchen Sie es später erneut.", 429);
}

function isRateLimited(req) {
  return !rateLimit({
    key: `reservation-decision:${getClientIp(req)}`,
    limit: DECISION_LIMIT,
    windowMs: WINDOW_MS,
  }).allowed;
}

function reservationSummaryHtml(reservation) {
  return `<p>
      <strong>${escapeHtml(reservation.name)}</strong><br />
      ${escapeHtml(formatGermanDate(reservation.date))} um ${escapeHtml(reservation.time)} Uhr<br />
      ${escapeHtml(String(reservation.guests))} Personen${reservation.vipRoom ? "<br />V.I.P. Room angefragt" : ""}
    </p>`;
}

function readParams(searchParams) {
  return {
    id: searchParams.get("id") || "",
    token: searchParams.get("token") || "",
  };
}

async function readBodyParams(req) {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await req.json();
    return { id: String(body?.id || ""), token: String(body?.token || "") };
  }

  const form = await req.formData();
  return { id: String(form.get("id") || ""), token: String(form.get("token") || "") };
}

function isUsableToken(reservation, decision, token) {
  if (!reservation) return false;
  if (reservation[decision.tokenField] !== token) return false;
  if (reservation.tokenExpiresAt && reservation.tokenExpiresAt.getTime() < Date.now()) return false;
  return true;
}

/**
 * Renders a confirmation page with a POST form.
 *
 * The state change deliberately does not happen on GET: mail clients, link
 * scanners and prefetchers routinely fetch URLs, which previously could
 * auto-confirm or auto-reject a reservation without anyone clicking.
 */
export async function handleDecisionGet(req, decisionKey) {
  const decision = DECISIONS[decisionKey];

  if (isRateLimited(req)) return tooManyRequests();

  try {
    const { id, token } = readParams(new URL(req.url).searchParams);

    if (!id || !token || !mongoose.Types.ObjectId.isValid(id)) {
      return htmlErrorResponse(INVALID_LINK_MESSAGE, 400);
    }

    await connectToDatabase();
    const reservation = await Reservation.findById(id);

    if (!isUsableToken(reservation, decision, token)) {
      return htmlErrorResponse(INVALID_LINK_MESSAGE, 404);
    }

    if (reservation.status === decision.targetStatus) {
      return htmlResponse(
        renderHtmlPage({
          title: "Leonn Restaurant",
          heading: decision.alreadyHeading,
          bodyHtml: `${reservationSummaryHtml(reservation)}<p>${decision.alreadyNote}</p>`,
        })
      );
    }

    if (reservation.status !== "PENDING") {
      return htmlErrorResponse(
        "Diese Reservierung wurde bereits anders bearbeitet und kann nicht mehr geändert werden.",
        409
      );
    }

    return htmlResponse(
      renderHtmlPage({
        title: "Leonn Restaurant",
        heading: decision.confirmHeading,
        bodyHtml: `${reservationSummaryHtml(reservation)}
      <form method="post" action="${decision.actionPath}">
        <input type="hidden" name="id" value="${escapeHtml(String(reservation._id))}" />
        <input type="hidden" name="token" value="${escapeHtml(token)}" />
        <button type="submit" style="background:${decision.buttonColor}">${decision.confirmButtonLabel}</button>
      </form>`,
      })
    );
  } catch (error) {
    console.error(`Reservation ${decisionKey} (GET) error:`, error);
    return htmlErrorResponse("Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.", 500);
  }
}

/**
 * Applies the decision. The update is a conditional findOneAndUpdate, so two
 * concurrent submissions can never both transition the reservation and send a
 * duplicate customer email.
 */
export async function handleDecisionPost(req, decisionKey) {
  const decision = DECISIONS[decisionKey];

  if (isRateLimited(req)) return tooManyRequests();

  try {
    let id;
    let token;
    try {
      ({ id, token } = await readBodyParams(req));
    } catch {
      return htmlErrorResponse(INVALID_LINK_MESSAGE, 400);
    }

    if (!id || !token || !mongoose.Types.ObjectId.isValid(id)) {
      return htmlErrorResponse(INVALID_LINK_MESSAGE, 400);
    }

    await connectToDatabase();

    const updated = await Reservation.findOneAndUpdate(
      {
        _id: id,
        status: "PENDING",
        [decision.tokenField]: token,
        $or: [{ tokenExpiresAt: { $exists: false } }, { tokenExpiresAt: { $gt: new Date() } }],
      },
      { $set: { status: decision.targetStatus } },
      { new: true }
    );

    if (!updated) {
      // Distinguish "already handled" from "bad link" without leaking data to
      // someone who does not hold a valid token.
      const existing = await Reservation.findById(id);

      if (isUsableToken(existing, decision, token) && existing.status === decision.targetStatus) {
        return htmlResponse(
          renderHtmlPage({
            title: "Leonn Restaurant",
            heading: decision.alreadyHeading,
            bodyHtml: `${reservationSummaryHtml(existing)}<p>${decision.alreadyNote}</p>`,
          })
        );
      }

      return htmlErrorResponse(INVALID_LINK_MESSAGE, 404);
    }

    try {
      await decision.sendCustomerEmail(updated);
    } catch (emailError) {
      // The status change is already committed; surface the mail failure
      // instead of silently pretending the guest was notified.
      console.error(`Reservation ${decisionKey}: customer email failed:`, emailError);
      return htmlResponse(
        renderHtmlPage({
          title: "Leonn Restaurant",
          heading: decision.doneHeading,
          bodyHtml: `${reservationSummaryHtml(updated)}
        <p style="color:#ff9800">Der Status wurde geändert, aber die E-Mail an den Gast konnte nicht gesendet werden. Bitte kontaktieren Sie den Gast direkt.</p>`,
        })
      );
    }

    return htmlResponse(
      renderHtmlPage({
        title: "Leonn Restaurant",
        heading: decision.doneHeading,
        bodyHtml: `${reservationSummaryHtml(updated)}<p>${decision.doneNote}</p>`,
      })
    );
  } catch (error) {
    console.error(`Reservation ${decisionKey} (POST) error:`, error);
    return htmlErrorResponse("Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.", 500);
  }
}
