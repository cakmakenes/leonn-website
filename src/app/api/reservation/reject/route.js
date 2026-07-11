import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Reservation from "@/models/Reservation";
import { sendCustomerRejectionEmail } from "@/lib/emailService";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const token = searchParams.get("token");

    if (!id || !token) {
      return new NextResponse(
        `<html><body style="font-family: sans-serif; text-align: center; margin-top: 50px; background-color: #0d0c22; color: #fff;"><h1 style="color: #f44336;">Ungültiger Anfrage-Link.</h1></body></html>`,
        { headers: { "content-type": "text/html; charset=utf-8" } }
      );
    }

    await connectToDatabase();

    const reservation = await Reservation.findById(id);

    if (!reservation || reservation.secureToken !== token) {
      return new NextResponse(
        `<html><body style="font-family: sans-serif; text-align: center; margin-top: 50px; background-color: #0d0c22; color: #fff;"><h1 style="color: #f44336;">Reservierung nicht gefunden oder ungültiger Token.</h1></body></html>`,
        { headers: { "content-type": "text/html; charset=utf-8" } }
      );
    }

    if (reservation.status === "CANCELLED") {
      return new NextResponse(
        `<html>
          <body style="font-family: sans-serif; text-align: center; background-color: #0d0c22; color: #fff; padding-top: 80px;">
            <div style="max-width: 600px; margin: 0 auto; background: #151446; padding: 40px; border-radius: 10px; border: 1px solid #dbbd82; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
              <h1 style="color: #dbbd82; font-size: 2.5rem; margin-bottom: 20px;">Bereits Abgelehnt</h1>
              <p style="font-size: 1.2rem; line-height: 1.6; color: rgba(255,255,255,0.8);">
                Die Reservierung für <strong>${reservation.name}</strong> am <strong>${new Date(reservation.date).toLocaleDateString("de-DE")}</strong> wurde bereits abgelehnt.
              </p>
            </div>
          </body>
        </html>`,
        { headers: { "content-type": "text/html; charset=utf-8" } }
      );
    }

    // Durumu CANCELLED olarak güncelle
    reservation.status = "CANCELLED";
    await reservation.save();

    // Müşteriye red e-postası gönder
    await sendCustomerRejectionEmail(reservation);

    return new NextResponse(
      `<html>
        <body style="font-family: sans-serif; text-align: center; background-color: #0d0c22; color: #fff; padding-top: 80px;">
          <div style="max-width: 600px; margin: 0 auto; background: #151446; padding: 40px; border-radius: 10px; border: 1px solid #dbbd82; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
            <h1 style="color: #dbbd82; font-size: 2.5rem; margin-bottom: 20px;">Erfolgreich Abgelehnt!</h1>
            <p style="font-size: 1.2rem; line-height: 1.6; color: rgba(255,255,255,0.8);">
              Die Reservierung für <strong>${reservation.name}</strong> am <strong>${new Date(reservation.date).toLocaleDateString("de-DE")}</strong> um <strong>${reservation.time}</strong> wurde abgelehnt.
            </p>
            <p style="font-size: 1.1rem; color: #f44336; font-weight: bold; margin-top: 20px;">
              Eine Ablehnungs-E-Mail wurde an den Kunden gesendet.
            </p>
            <div style="margin-top: 40px; font-size: 0.9rem; color: rgba(255,255,255,0.4);">
              Leonn Restaurant | Deftere yazmanıza gerek kalmadı.
            </div>
          </div>
        </body>
      </html>`,
      { headers: { "content-type": "text/html; charset=utf-8" } }
    );
  } catch (error) {
    console.error("Rejection Error:", error);
    return new NextResponse(
      `<html><body style="font-family: sans-serif; text-align: center; margin-top: 50px; background-color: #0d0c22; color: #fff;"><h1 style="color: #f44336;">Fehler: ${error.message}</h1></body></html>`,
      { headers: { "content-type": "text/html; charset=utf-8" } }
    );
  }
}
