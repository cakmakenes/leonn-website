import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";

export const generateGutscheinPDF = async (gutschein) => {
  // gutschein: { code, amount, buyerName, recipientName, message }
  
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]); // Geniş Gutschein boyutu (Yatay)
  
  // Altın sarısı: #dbbd82 -> R:219/255, G:189/255, B:130/255
  const goldColor = rgb(219/255, 189/255, 130/255);
  const darkBlue = rgb(21/255, 20/255, 70/255);
  
  // Arka plan (Koyu Mavi)
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 600,
    height: 400,
    color: darkBlue,
  });

  // Çerçeve (Altın)
  page.drawRectangle({
    x: 20,
    y: 20,
    width: 560,
    height: 360,
    borderColor: goldColor,
    borderWidth: 2,
  });

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Başlık
  page.drawText("LEONN", {
    x: 240,
    y: 320,
    size: 40,
    font: boldFont,
    color: goldColor,
  });

  page.drawText("GUTSCHEIN", {
    x: 250,
    y: 290,
    size: 16,
    font: font,
    color: rgb(1, 1, 1),
  });

  // Tutar
  page.drawText(`${gutschein.amount} €`, {
    x: 430,
    y: 190,
    size: 60,
    font: boldFont,
    color: goldColor,
  });

  // Kime
  if (gutschein.recipientName) {
    page.drawText(`Für: ${gutschein.recipientName}`, {
      x: 50,
      y: 220,
      size: 16,
      font: font,
      color: rgb(1, 1, 1),
    });
  }

  // Mesaj
  if (gutschein.message) {
    page.drawText(`"${gutschein.message}"`, {
      x: 50,
      y: 190,
      size: 14,
      font: font,
      color: rgb(0.8, 0.8, 0.8),
    });
  }

  // Kod
  page.drawText(`Code: ${gutschein.code}`, {
    x: 50,
    y: 60,
    size: 16,
    font: boldFont,
    color: goldColor,
  });
  
  page.drawText(`www.leonnrestaurant.com`, {
    x: 50,
    y: 40,
    size: 10,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });

  // QR Kod oluştur
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://leonnrestaurant.com";
    const verificationUrl = `${siteUrl}/admin/redeem?code=${gutschein.code}`;
    
    const qrBuffer = await QRCode.toBuffer(verificationUrl, {
      color: {
        dark: '#dbbd82',  // Altın
        light: '#15144a' // Arka planla aynı
      }
    });
    
    const qrImage = await pdfDoc.embedPng(qrBuffer);
    page.drawImage(qrImage, {
      x: 470,
      y: 40,
      width: 90,
      height: 90,
    });
  } catch (err) {
    console.error("QR Code generation failed:", err);
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};
