import { randomBytes, randomInt } from "node:crypto";

const HTML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * Escapes a value for safe interpolation into HTML markup (email bodies,
 * server-rendered HTML responses). Always use this for anything that
 * originated from user input.
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/**
 * Cryptographically secure, URL-safe random token.
 * 32 bytes => 256 bits of entropy.
 */
export function generateSecureToken(byteLength = 32) {
  return randomBytes(byteLength).toString("base64url");
}

// Ambiguous characters (I, O, 0, 1) are excluded so codes can be read aloud
// or typed from a printed voucher without transcription errors.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Voucher code in the form LEONN-XXXXXXXX.
 * 32^8 = ~1.1e12 possibilities, generated with a CSPRNG.
 */
export function generateVoucherCode(length = 8) {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return `LEONN-${code}`;
}
