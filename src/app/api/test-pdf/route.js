import { NextResponse } from "next/server";
import { generateGutscheinPDF } from "@/lib/pdfGenerator";

export async function GET() {
  try {
    // Örnek bir hediye çeki verisi oluşturuyoruz
    const mockGutschein = {
      code: "LEONN-TEST99",
      amount: 150,
      buyerName: "Max Mustermann",
      recipientName: "Erika Musterfrau",
      message: "Alles Gute zum Geburtstag! Genieß dein Abendessen.",
    };

    // PDF'i üret
    const pdfBuffer = await generateGutscheinPDF(mockGutschein);

    // PDF'i doğrudan tarayıcıda göstermek için uygun header'larla döndür
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="test-gutschein.pdf"',
      },
    });
  } catch (error) {
    console.error("Test PDF Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
