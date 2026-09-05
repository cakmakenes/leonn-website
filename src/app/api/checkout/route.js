import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { validateCheckoutInput } from "@/lib/validation";

export const runtime = "nodejs";

const CHECKOUT_LIMIT = 10;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(req) {
  const limit = rateLimit({
    key: `checkout:${getClientIp(req)}`,
    limit: CHECKOUT_LIMIT,
    windowMs: WINDOW_MS,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." },
      { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } }
    );
  }

  // Redirect targets must come from configuration, never from the request Host
  // header, otherwise a spoofed host turns success_url into an open redirect.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    console.error("NEXT_PUBLIC_SITE_URL is not configured; cannot build Stripe redirect URLs.");
    return NextResponse.json({ error: "Zahlung ist derzeit nicht verfügbar." }, { status: 503 });
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const { errors, data } = validateCheckoutInput(payload);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0], errors }, { status: 400 });
  }

  const amountEuros = data.amountCents / 100;

  try {
    const session = await getStripe().checkout.sessions.create({
      billing_address_collection: "required",
      customer_email: data.buyerEmail,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Leonn Gutschein",
              description: `Gutschein für das Leonn Restaurant im Wert von ${amountEuros} €`,
            },
            // Validated server-side; the client-supplied value is never trusted.
            unit_amount: data.amountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${siteUrl}/gutschein/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/gutschein`,
      metadata: {
        amount: String(amountEuros),
        buyerName: data.buyerName,
        buyerEmail: data.buyerEmail,
        recipientName: data.recipientName,
        recipientEmail: data.recipientEmail,
        message: data.message,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    // Stripe error messages can leak configuration details, so keep the
    // client-facing text generic and log the detail server-side.
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json(
      { error: "Die Zahlung konnte nicht gestartet werden. Bitte versuchen Sie es später erneut." },
      { status: 502 }
    );
  }
}
