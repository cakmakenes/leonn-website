import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Gutschein from "@/models/Gutschein";
import { isAuthenticatedAdmin } from "@/lib/adminAuth";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { normalizeVoucherCode, parseRedemptionAmount } from "@/lib/validation";

const LOOKUP_LIMIT = 60;
const REDEEM_LIMIT = 30;
const WINDOW_MS = 5 * 60 * 1000;
const MAX_CAS_ATTEMPTS = 3;

const unauthorized = () =>
  NextResponse.json({ error: "Nicht autorisiert. Bitte melden Sie sich an." }, { status: 401 });

function serializeGutschein(doc) {
  return {
    code: doc.code,
    initialAmount: doc.initialAmount,
    currentAmount: doc.currentAmount,
    buyerName: doc.buyerName,
    recipientName: doc.recipientName,
    message: doc.message,
    status: doc.status,
    createdAt: doc.createdAt,
  };
}

/**
 * Deducts an amount from a voucher.
 *
 * Authorization comes from the admin session cookie. `proxy.js` already gates
 * this path; the check below is defence in depth.
 */
export async function POST(req) {
  // Defence in depth: never rely on the proxy alone for a money-moving route.
  if (!(await isAuthenticatedAdmin(req))) return unauthorized();

  const limit = rateLimit({
    key: `gutschein-redeem:${getClientIp(req)}`,
    limit: REDEEM_LIMIT,
    windowMs: WINDOW_MS,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." },
      { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } }
    );
  }

  try {
    let payload;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
    }

    const code = normalizeVoucherCode(payload?.code);
    const amountToDeduct = parseRedemptionAmount(payload?.amountToDeduct);

    if (!code) {
      return NextResponse.json({ error: "Ungültiger Gutschein-Code." }, { status: 400 });
    }
    if (amountToDeduct === null) {
      return NextResponse.json({ error: "Ungültiger Betrag." }, { status: 400 });
    }

    await connectToDatabase();

    // Compare-and-swap loop: the update only applies if `currentAmount` still
    // holds the value we validated against, which makes concurrent redemptions
    // of the same voucher safe against double-spending.
    for (let attempt = 0; attempt < MAX_CAS_ATTEMPTS; attempt += 1) {
      const current = await Gutschein.findOne({ code });

      if (!current) {
        return NextResponse.json({ error: "Gutschein nicht gefunden" }, { status: 404 });
      }
      if (current.status !== "PAID") {
        return NextResponse.json(
          { error: "Gutschein ist nicht aktiv oder unbezahlt" },
          { status: 400 }
        );
      }
      if (current.currentAmount < amountToDeduct) {
        return NextResponse.json(
          { error: `Ungenügendes Guthaben. Aktuelles Guthaben: ${current.currentAmount} €` },
          { status: 400 }
        );
      }

      const nextAmount = Number((current.currentAmount - amountToDeduct).toFixed(2));

      const updated = await Gutschein.findOneAndUpdate(
        { _id: current._id, status: "PAID", currentAmount: current.currentAmount },
        {
          $set: { currentAmount: nextAmount },
          $push: { redemptions: { amount: amountToDeduct, redeemedAt: new Date() } },
        },
        { new: true }
      );

      if (updated) {
        console.info(
          `Gutschein ${updated.code}: ${amountToDeduct} € eingelöst, neues Guthaben ${updated.currentAmount} €`
        );
        return NextResponse.json({ success: true, ...serializeGutschein(updated) });
      }
      // Lost the race, re-read and try again.
    }

    return NextResponse.json(
      { error: "Der Gutschein wurde gleichzeitig geändert. Bitte erneut versuchen." },
      { status: 409 }
    );
  } catch (error) {
    console.error("Gutschein Redeem Error:", error);
    return NextResponse.json({ error: "Systemfehler bei der Einlösung" }, { status: 500 });
  }
}

/**
 * Looks up a voucher. Returns buyer name and the personal message, so this
 * must stay behind admin authentication.
 */
export async function GET(req) {
  if (!(await isAuthenticatedAdmin(req))) return unauthorized();

  const limit = rateLimit({
    key: `gutschein-lookup:${getClientIp(req)}`,
    limit: LOOKUP_LIMIT,
    windowMs: WINDOW_MS,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." },
      { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } }
    );
  }

  try {
    const code = normalizeVoucherCode(new URL(req.url).searchParams.get("code"));

    if (!code) {
      return NextResponse.json({ error: "Ungültiger Gutschein-Code." }, { status: 400 });
    }

    await connectToDatabase();

    const gutschein = await Gutschein.findOne({ code });

    if (!gutschein) {
      return NextResponse.json({ error: "Gutschein nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json(serializeGutschein(gutschein));
  } catch (error) {
    console.error("Gutschein Fetch Error:", error);
    return NextResponse.json({ error: "Systemfehler" }, { status: 500 });
  }
}
