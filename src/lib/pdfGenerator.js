import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import { CONTACT, CONTACT_ADDRESS_LINE } from "@/lib/contact";

const PAGE_WIDTH = 600;
const PAGE_HEIGHT = 400;
const CONTENT_LEFT = 50;
// The amount is drawn on the right, so left-hand text must stop before it.
const TEXT_MAX_WIDTH = 350;

const GOLD = rgb(219 / 255, 189 / 255, 130 / 255);
const DARK_BLUE = rgb(21 / 255, 20 / 255, 70 / 255);
const WHITE = rgb(1, 1, 1);
const MUTED = rgb(0.8, 0.8, 0.8);

// The characters WinAnsiEncoding maps in the 0x80-0x9F range. Everything in
// 0x20-0x7E and 0xA0-0xFF is also representable.
const WINANSI_EXTRA = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";

// Characters that have no WinAnsi equivalent but a sensible ASCII stand-in.
const TRANSLITERATIONS = {
  ı: "i",
  İ: "I",
  ş: "s",
  Ş: "S",
  ğ: "g",
  Ğ: "G",
  ł: "l",
  Ł: "L",
  đ: "d",
  Đ: "D",
  ő: "o",
  Ő: "O",
  ű: "u",
  Ű: "U",
  ć: "c",
  Ć: "C",
  č: "c",
  Č: "C",
  ž: "z",
  Ž: "Z",
  š: "s",
  Š: "S",
  ș: "s",
  Ș: "S",
  ț: "t",
  Ț: "T",
};

function isWinAnsiChar(char) {
  const code = char.codePointAt(0);
  if (code >= 0x20 && code <= 0x7e) return true;
  if (code >= 0xa0 && code <= 0xff) return true;
  return WINANSI_EXTRA.includes(char);
}

/**
 * Makes a string safe for the standard Helvetica font.
 *
 * pdf-lib's standard fonts use WinAnsiEncoding, and `drawText` throws on any
 * character outside it. A Turkish, Polish or Cyrillic recipient name used to
 * blow up voucher generation for an order that had already been paid for, so
 * unsupported characters are transliterated or dropped instead.
 */
export function toWinAnsi(value) {
  if (value === null || value === undefined) return "";

  let output = "";
  for (const char of String(value)) {
    if (isWinAnsiChar(char)) {
      output += char;
      continue;
    }

    const mapped = TRANSLITERATIONS[char];
    if (mapped !== undefined) {
      output += mapped;
      continue;
    }

    // Strip diacritics (é -> e) and keep whatever survives.
    for (const decomposed of char.normalize("NFKD").replace(/\p{M}/gu, "")) {
      if (isWinAnsiChar(decomposed)) output += decomposed;
    }
  }

  return output.replace(/\s+/g, " ").trim();
}

function truncateToWidth(text, font, size, maxWidth) {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;

  let truncated = text;
  while (truncated.length > 1 && font.widthOfTextAtSize(`${truncated}...`, size) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated.trim()}...`;
}

function wrapText(text, font, size, maxWidth, maxLines) {
  const words = text.split(" ").filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;

    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) lines.push(current);

    if (lines.length === maxLines) return lines;

    // A single word longer than the line gets hard-truncated.
    current = font.widthOfTextAtSize(word, size) > maxWidth
      ? truncateToWidth(word, font, size, maxWidth)
      : word;
  }

  if (current && lines.length < maxLines) lines.push(current);
  return lines;
}

function formatAmount(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "0 €";
  return Number.isInteger(value)
    ? `${value} €`
    : `${value.toFixed(2).replace(".", ",")} €`;
}

/**
 * Renders the gift voucher as a landscape PDF and returns it as a Buffer.
 * @param {{code: string, amount: number, buyerName?: string, recipientName?: string, message?: string}} gutschein
 */
export const generateGutscheinPDF = async (gutschein) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: DARK_BLUE });
  page.drawRectangle({
    x: 20,
    y: 20,
    width: PAGE_WIDTH - 40,
    height: PAGE_HEIGHT - 40,
    borderColor: GOLD,
    borderWidth: 2,
  });

  page.drawText("LEONN", { x: 240, y: 320, size: 40, font: boldFont, color: GOLD });
  page.drawText("GUTSCHEIN", { x: 250, y: 290, size: 16, font, color: WHITE });

  // Right-aligned so a longer amount cannot run off the page.
  const amountLabel = toWinAnsi(formatAmount(gutschein.amount));
  const amountWidth = boldFont.widthOfTextAtSize(amountLabel, 60);
  page.drawText(amountLabel, {
    x: PAGE_WIDTH - 40 - amountWidth,
    y: 190,
    size: 60,
    font: boldFont,
    color: GOLD,
  });

  const recipientName = toWinAnsi(gutschein.recipientName);
  if (recipientName) {
    page.drawText(truncateToWidth(`Für: ${recipientName}`, font, 16, TEXT_MAX_WIDTH), {
      x: CONTENT_LEFT,
      y: 230,
      size: 16,
      font,
      color: WHITE,
    });
  }

  const message = toWinAnsi(gutschein.message);
  if (message) {
    const lines = wrapText(`"${message}"`, font, 12, TEXT_MAX_WIDTH, 4);
    lines.forEach((line, index) => {
      page.drawText(line, {
        x: CONTENT_LEFT,
        y: 200 - index * 16,
        size: 12,
        font,
        color: MUTED,
      });
    });
  }

  const code = toWinAnsi(gutschein.code);
  page.drawText(`Code: ${code}`, {
    x: CONTENT_LEFT,
    y: 60,
    size: 16,
    font: boldFont,
    color: GOLD,
  });
  page.drawText(toWinAnsi(`${CONTACT.website}  -  ${CONTACT_ADDRESS_LINE}`), {
    x: CONTENT_LEFT,
    y: 40,
    size: 10,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  // A missing QR code is not fatal: the code is printed above and can be typed
  // into the admin dashboard by hand.
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://leonnrestaurant.com";
    const verificationUrl = `${siteUrl.replace(/\/$/, "")}/admin/redeem?code=${encodeURIComponent(
      gutschein.code
    )}`;

    const qrBuffer = await QRCode.toBuffer(verificationUrl, {
      color: { dark: "#dbbd82", light: "#151446" },
    });

    const qrImage = await pdfDoc.embedPng(qrBuffer);
    page.drawImage(qrImage, { x: 470, y: 40, width: 90, height: 90 });
  } catch (error) {
    console.error(`QR code generation failed for voucher ${gutschein.code}:`, error);
  }

  return Buffer.from(await pdfDoc.save());
};
