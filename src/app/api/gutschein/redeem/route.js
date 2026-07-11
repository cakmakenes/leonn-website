import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Gutschein from "@/models/Gutschein";

export async function POST(req) {
  try {
    const { code, amountToDeduct, passcode } = await req.json();

    if (!code || !amountToDeduct || amountToDeduct <= 0) {
      return NextResponse.json({ error: "Ungültige Parameter" }, { status: 400 });
    }

    // Passcode validation
    const expectedPasscode = process.env.ADMIN_PASSCODE || "1234";
    if (passcode !== expectedPasscode) {
      return NextResponse.json({ error: "Ungültiger Admin-Passcode" }, { status: 401 });
    }

    await connectToDatabase();

    const gutschein = await Gutschein.findOne({ code });

    if (!gutschein) {
      return NextResponse.json({ error: "Gutschein nicht gefunden" }, { status: 404 });
    }

    if (gutschein.status !== "PAID") {
      return NextResponse.json({ error: "Gutschein ist nicht aktiv oder unbezahlt" }, { status: 400 });
    }

    if (gutschein.currentAmount < amountToDeduct) {
      return NextResponse.json({ 
        error: `Ungenügendes Guthaben. Aktuelles Guthaben: ${gutschein.currentAmount} €` 
      }, { status: 400 });
    }

    // Deduct amount
    gutschein.currentAmount = Number((gutschein.currentAmount - amountToDeduct).toFixed(2));
    await gutschein.save();

    return NextResponse.json({ 
      success: true, 
      code: gutschein.code,
      initialAmount: gutschein.initialAmount,
      currentAmount: gutschein.currentAmount,
      recipientName: gutschein.recipientName
    });

  } catch (error) {
    console.error("Gutschein Redeem Error:", error);
    return NextResponse.json({ error: "Systemfehler bei der Einlösung" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "Code fehlt" }, { status: 400 });
    }

    await connectToDatabase();

    const gutschein = await Gutschein.findOne({ code });

    if (!gutschein) {
      return NextResponse.json({ error: "Gutschein nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json({ 
      code: gutschein.code,
      initialAmount: gutschein.initialAmount,
      currentAmount: gutschein.currentAmount,
      buyerName: gutschein.buyerName,
      recipientName: gutschein.recipientName,
      message: gutschein.message,
      status: gutschein.status,
      createdAt: gutschein.createdAt
    });

  } catch (error) {
    console.error("Gutschein Fetch Error:", error);
    return NextResponse.json({ error: "Systemfehler" }, { status: 500 });
  }
}
