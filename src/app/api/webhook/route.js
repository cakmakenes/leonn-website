import { NextResponse } from "next/server";
import { headers } from "next/headers";
import stripe from "@/lib/stripe";
import connectToDatabase from "@/lib/db";
import Gutschein from "@/models/Gutschein";
import { generateGutscheinPDF } from "@/lib/pdfGenerator";
import { sendGutscheinEmail } from "@/lib/emailService";

export async function POST(req) {
  const body = await req.text();
  const signature = headers().get("stripe-signature");

  let event;

  try {
    // Sadece test için webhook secret yoksa es geçiyoruz, gerçek ortamda şart
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      event = JSON.parse(body);
    } else {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    }
  } catch (error) {
    console.error(`Webhook Error: ${error.message}`);
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Metadata'yı al
    const { amount, buyerName, buyerEmail, recipientName, recipientEmail, message } = session.metadata;

    // Get billing address from Stripe Session details
    const billingAddress = session.customer_details?.address ? {
      street: session.customer_details.address.line1 + (session.customer_details.address.line2 ? `, ${session.customer_details.address.line2}` : ""),
      city: session.customer_details.address.city,
      postalCode: session.customer_details.address.postal_code,
      country: session.customer_details.address.country,
    } : undefined;

    await connectToDatabase();

    // Benzersiz Gutschein kodu üret
    const uniqueCode = `LEONN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    try {
      // 1. Veritabanına Kaydet
      await Gutschein.create({
        code: uniqueCode,
        initialAmount: Number(amount),
        currentAmount: Number(amount),
        buyerName,
        buyerEmail,
        recipientName,
        recipientEmail,
        message,
        billingAddress,
        stripeSessionId: session.id,
        status: "PAID",
      });

      // 2. PDF Üret
      const pdfBuffer = await generateGutscheinPDF({
        code: uniqueCode,
        amount: Number(amount),
        buyerName,
        recipientName,
        message,
      });

      // 3. E-posta Gönder
      await sendGutscheinEmail(
        { buyerName, buyerEmail, recipientName, recipientEmail, amount, code: uniqueCode, message },
        pdfBuffer
      );
    } catch (err) {
      console.error("Error fulfilling Gutschein order:", err);
    }
  }

  return NextResponse.json({ received: true });
}
