import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import connectToDatabase from "@/lib/db";
import Gutschein from "@/models/Gutschein";
import { generateGutscheinPDF } from "@/lib/pdfGenerator";
import { sendGutscheinEmail } from "@/lib/emailService";
import { generateVoucherCode } from "@/lib/security";
import { LIMITS, sanitizeText } from "@/lib/validation";

// pdf-lib and mongoose both require the Node runtime.
export const runtime = "nodejs";

const MAX_CODE_ATTEMPTS = 5;
const DUPLICATE_KEY_ERROR = 11000;

export async function POST(req) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Fail closed. Without the secret we cannot prove the request came from
  // Stripe, and processing it would let anyone mint paid vouchers.
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured; refusing to process webhooks.");
    return NextResponse.json({ error: "Webhook is not configured" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  // The raw body is required for signature verification.
  const rawBody = await req.text();

  let event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error(`Webhook signature verification failed: ${error.message}`);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object;

  if (session.payment_status !== "paid") {
    console.warn(`Session ${session.id} completed with payment_status=${session.payment_status}; skipping.`);
    return NextResponse.json({ received: true });
  }

  try {
    await fulfillGutscheinOrder(session);
  } catch (error) {
    console.error(`Gutschein fulfillment failed for session ${session.id}:`, error);
    // A non-2xx response makes Stripe retry. Fulfillment is idempotent, so a
    // retry either finishes the delivery or is a no-op.
    return NextResponse.json({ error: "Fulfillment failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/**
 * Idempotent fulfillment, keyed on the Stripe session id.
 *
 * Split into two committed steps so that a retry never charges twice, never
 * creates a second voucher and never emails the voucher twice:
 *   1. persist the voucher (unique stripeSessionId)
 *   2. generate the PDF, send the emails, then stamp `deliveredAt`
 */
async function fulfillGutscheinOrder(session) {
  await connectToDatabase();

  let gutschein = await Gutschein.findOne({ stripeSessionId: session.id });

  if (!gutschein) {
    gutschein = await createGutscheinForSession(session);
  }

  if (gutschein.deliveredAt) {
    console.info(`Gutschein ${gutschein.code} already delivered; skipping duplicate delivery.`);
    return;
  }

  const pdfBuffer = await generateGutscheinPDF({
    code: gutschein.code,
    amount: gutschein.initialAmount,
    buyerName: gutschein.buyerName,
    recipientName: gutschein.recipientName,
    message: gutschein.message,
  });

  await sendGutscheinEmail(
    {
      buyerName: gutschein.buyerName,
      buyerEmail: gutschein.buyerEmail,
      recipientName: gutschein.recipientName,
      recipientEmail: gutschein.recipientEmail,
      amount: gutschein.initialAmount,
      code: gutschein.code,
      message: gutschein.message,
    },
    pdfBuffer
  );

  gutschein.deliveredAt = new Date();
  await gutschein.save();

  console.info(`Gutschein ${gutschein.code} (${gutschein.initialAmount} €) delivered.`);
}

async function createGutscheinForSession(session) {
  const metadata = session.metadata || {};

  if (session.currency && session.currency.toLowerCase() !== "eur") {
    throw new Error(`Unsupported currency ${session.currency} for session ${session.id}`);
  }

  // The amount actually charged is authoritative; metadata is only a hint.
  const amount = Number(session.amount_total) / 100;
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`Session ${session.id} has an invalid amount_total`);
  }

  const buyerEmail = sanitizeText(
    metadata.buyerEmail || session.customer_details?.email,
    LIMITS.email
  ).toLowerCase();
  const recipientEmail = sanitizeText(metadata.recipientEmail, LIMITS.email).toLowerCase() || buyerEmail;

  if (!buyerEmail || !recipientEmail) {
    throw new Error(`Session ${session.id} is missing buyer or recipient email`);
  }

  const address = session.customer_details?.address;
  const billingAddress = address
    ? {
        street: [address.line1, address.line2].filter(Boolean).join(", "),
        city: address.city,
        postalCode: address.postal_code,
        country: address.country,
      }
    : undefined;

  const payload = {
    initialAmount: amount,
    currentAmount: amount,
    buyerName:
      sanitizeText(metadata.buyerName || session.customer_details?.name, LIMITS.name) || "Unbekannt",
    buyerEmail,
    recipientName: sanitizeText(metadata.recipientName, LIMITS.name),
    recipientEmail,
    message: sanitizeText(metadata.message, LIMITS.voucherMessage),
    billingAddress,
    stripeSessionId: session.id,
    status: "PAID",
  };

  // Voucher codes are random, so a collision is unlikely but possible. Retry
  // with a fresh code rather than dropping a paid order.
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    try {
      return await Gutschein.create({ ...payload, code: generateVoucherCode() });
    } catch (error) {
      if (error?.code !== DUPLICATE_KEY_ERROR) throw error;

      // A concurrent delivery of the same session won the race.
      if (error.keyPattern?.stripeSessionId) {
        const existing = await Gutschein.findOne({ stripeSessionId: session.id });
        if (existing) return existing;
      }

      console.warn(`Voucher code collision on attempt ${attempt + 1}; retrying.`);
    }
  }

  throw new Error(`Could not allocate a unique voucher code for session ${session.id}`);
}
