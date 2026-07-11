import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Reservation from "@/models/Reservation";
import { sendAdminNotificationEmail } from "@/lib/emailService";

export async function POST(req) {
  try {
    const body = await req.json();
    
    await connectToDatabase();

    // Benzersiz güvenli onay token'ı üret
    const secureToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Veritabanına PENDING durumunda ve token ile kaydet
    const reservation = await Reservation.create({
      ...body,
      status: "PENDING",
      secureToken,
    });

    // İstek yapılan alan adını al (Vercel domain veya localhost)
    const origin = req.nextUrl.origin;
    const approvalUrl = `${origin}/api/reservation/approve?id=${reservation._id}&token=${secureToken}`;
    const rejectUrl = `${origin}/api/reservation/reject?id=${reservation._id}&token=${secureToken}`;

    // Admin'e bildirim e-postası gönder
    await sendAdminNotificationEmail(reservation, approvalUrl, rejectUrl);

    return NextResponse.json({ success: true, reservation });
  } catch (error) {
    console.error("Reservation Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
