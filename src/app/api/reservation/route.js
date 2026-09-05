import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Reservation from "@/models/Reservation";
import { sendAdminNotificationEmail } from "@/lib/emailService";
import { generateSecureToken } from "@/lib/security";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { validateReservationInput } from "@/lib/validation";

export const runtime = "nodejs";

const RESERVATION_LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export async function POST(req) {
  // Every request triggers an outbound email, so this endpoint has to be
  // throttled or it doubles as a spam relay.
  const limit = rateLimit({
    key: `reservation:${getClientIp(req)}`,
    limit: RESERVATION_LIMIT,
    windowMs: WINDOW_MS,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." },
      { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } }
    );
  }

  // The approval links are emailed to staff, so the base URL must come from
  // configuration. Deriving it from the request Host header would let an
  // attacker send staff a link pointing at their own domain.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    console.error("NEXT_PUBLIC_SITE_URL is not configured; cannot build reservation approval links.");
    return NextResponse.json(
      { success: false, error: "Reservierungen sind derzeit nicht möglich. Bitte rufen Sie uns an." },
      { status: 503 }
    );
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Ungültige Anfrage." }, { status: 400 });
  }

  const { errors, data } = validateReservationInput(payload);
  if (errors.length > 0) {
    return NextResponse.json({ success: false, error: errors[0], errors }, { status: 400 });
  }

  let reservation;
  try {
    await connectToDatabase();

    reservation = await Reservation.create({
      ...data,
      status: "PENDING",
      approveToken: generateSecureToken(),
      rejectToken: generateSecureToken(),
      tokenExpiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    });
  } catch (error) {
    console.error("Reservation Error:", error);
    return NextResponse.json(
      { success: false, error: "Die Reservierung konnte nicht gespeichert werden. Bitte versuchen Sie es erneut." },
      { status: 500 }
    );
  }

  const base = siteUrl.replace(/\/$/, "");
  const approvalUrl = `${base}/api/reservation/approve?id=${reservation._id}&token=${encodeURIComponent(
    reservation.approveToken
  )}`;
  const rejectUrl = `${base}/api/reservation/reject?id=${reservation._id}&token=${encodeURIComponent(
    reservation.rejectToken
  )}`;

  try {
    await sendAdminNotificationEmail(reservation, approvalUrl, rejectUrl);
  } catch (error) {
    // The reservation is stored, but nobody was notified. Say so instead of
    // showing a success screen for a request that will never be processed.
    console.error(`Reservation ${reservation._id} saved but admin notification failed:`, error);
    return NextResponse.json(
      {
        success: false,
        error:
          "Ihre Anfrage konnte nicht an uns übermittelt werden. Bitte rufen Sie uns an, um Ihren Tisch zu reservieren.",
      },
      { status: 502 }
    );
  }

  // Never echo the stored document: it contains the approval and rejection
  // tokens, which must only ever reach the restaurant's inbox.
  return NextResponse.json({ success: true });
}
