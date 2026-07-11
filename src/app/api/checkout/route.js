import { NextResponse } from "next/server";
import stripe from "@/lib/stripe";

export async function POST(req) {
  try {
    const { amount, buyerName, buyerEmail, recipientName, message } = await req.json();

    if (!amount || !buyerName || !buyerEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      // Stripe Dashboard'da aktif olan ödeme yöntemleri otomatik gelir (Kart, PayPal, Klarna vb.)
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Leonn Gutschein",
              description: `Gutschein für das Leonn Restaurant im Wert von ${amount}€`,
            },
            unit_amount: amount * 100, // Euro'yu Cent'e çeviriyoruz
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/gutschein/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/gutschein`,
      metadata: {
        amount: amount.toString(),
        buyerName,
        buyerEmail,
        recipientName: recipientName || "",
        message: message || "",
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
