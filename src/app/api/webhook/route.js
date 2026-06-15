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
    const { amount, buyerName, buyerEmail, recipientName, message } = session.metadata;

    await connectToDatabase();

    // Benzersiz Gutschein kodu üret
    const uniqueCode = `LEONN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    try {
      // 1. Veritabanına Kaydet
      await Gutschein.create({
        code: uniqueCode,
        amount: Number(amount),
        buyerName,
        buyerEmail,
        recipientName,
        message,
        stripeSessionId: session.id,
        status: "PAID",
        paymentDate: new Date(),
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
        { buyerName, buyerEmail, recipientName, amount, code: uniqueCode, message },
        pdfBuffer
      );
    } catch (err) {
      console.error("Error fulfilling Gutschein order:", err);
      // Stripe webhook'un retry atması için 500 dönebilirsiniz ama e-posta hatası DB'yi bozmamalı
    }
  }

  return NextResponse.json({ received: true });
}
