import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Reservation from "@/models/Reservation";
import { sendReservationEmail } from "@/lib/emailService";

export async function POST(req) {
  try {
    const body = await req.json();
    
    await connectToDatabase();

    // Veritabanına kaydet
    const reservation = await Reservation.create(body);

    // E-posta gönder (asenkron, cevabı beklemeden)
    sendReservationEmail(body).catch((err) => {
      console.error("Failed to send reservation email:", err);
    });

    return NextResponse.json({ success: true, reservation });
  } catch (error) {
    console.error("Reservation Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
