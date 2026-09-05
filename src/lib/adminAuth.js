/**
 * Admin session handling.
 *
 * Deliberately implemented with the Web Crypto API and no Node built-ins so
 * that the same module can run inside `middleware.js` (Edge runtime) and
 * inside Node route handlers.
 *
 * The session is a stateless HMAC-signed token: `v1.<expiresAt>.<signature>`.
 * There is no server-side session store, so revocation happens by rotating
 * ADMIN_SESSION_SECRET.
 */

export const ADMIN_SESSION_COOKIE = "leonn_admin_session";

const SESSION_TTL_SECONDS = 8 * 60 * 60; // 8 hours
const MIN_PASSCODE_LENGTH = 8;
const MIN_SECRET_LENGTH = 32;

const encoder = new TextEncoder();

function base64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Length-independent comparison. Avoids leaking how many leading characters
 * of a secret were guessed correctly.
 */
export function constantTimeEqual(a, b) {
  const left = String(a ?? "");
  const right = String(b ?? "");
  const length = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;
  for (let i = 0; i < length; i += 1) {
    diff |= (left.charCodeAt(i) || 0) ^ (right.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/**
 * Returns null when the admin area is correctly configured, otherwise a
 * human-readable reason. Callers must fail closed on a non-null result.
 */
export function getAdminAuthConfigError() {
  const passcode = process.env.ADMIN_PASSCODE;
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!passcode) return "ADMIN_PASSCODE is not set";
  if (passcode.length < MIN_PASSCODE_LENGTH) {
    return `ADMIN_PASSCODE must be at least ${MIN_PASSCODE_LENGTH} characters`;
  }
  if (!secret) return "ADMIN_SESSION_SECRET is not set";
  if (secret.length < MIN_SECRET_LENGTH) {
    return `ADMIN_SESSION_SECRET must be at least ${MIN_SECRET_LENGTH} characters`;
  }
  return null;
}

export function isAdminAuthConfigured() {
  return getAdminAuthConfigError() === null;
}

async function sign(payload) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not configured");

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return base64url(new Uint8Array(signature));
}

export function verifyAdminPasscode(candidate) {
  if (!isAdminAuthConfigured()) return false;
  return constantTimeEqual(candidate, process.env.ADMIN_PASSCODE);
}

export async function createAdminSessionToken() {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = `v1.${expiresAt}`;
  return `${payload}.${await sign(payload)}`;
}

export async function verifyAdminSessionToken(token) {
  if (!token || !isAdminAuthConfigured()) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [version, expiresAt, signature] = parts;
  if (version !== "v1") return false;

  const expiry = Number(expiresAt);
  if (!Number.isFinite(expiry) || expiry <= Date.now()) return false;

  try {
    const expected = await sign(`${version}.${expiresAt}`);
    return constantTimeEqual(signature, expected);
  } catch {
    return false;
  }
}

/**
 * Works with both NextRequest (`req.cookies.get`) and plain Request objects.
 */
export async function isAuthenticatedAdmin(req) {
  let token = req?.cookies?.get?.(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    const cookieHeader = req?.headers?.get?.("cookie");
    if (cookieHeader) {
      const match = cookieHeader
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${ADMIN_SESSION_COOKIE}=`));
      if (match) token = decodeURIComponent(match.slice(ADMIN_SESSION_COOKIE.length + 1));
    }
  }

  return verifyAdminSessionToken(token);
}

export function adminSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
