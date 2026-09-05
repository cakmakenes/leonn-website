import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createAdminSessionToken,
  getAdminAuthConfigError,
  verifyAdminPasscode,
} from "@/lib/adminAuth";
import { getClientIp, rateLimit, resetRateLimit } from "@/lib/rateLimit";

const ATTEMPT_LIMIT = 10;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

export async function POST(req) {
  const configError = getAdminAuthConfigError();
  if (configError) {
    console.error(`Admin login unavailable: ${configError}`);
    return NextResponse.json(
      { error: "Die Verwaltung ist nicht konfiguriert. Bitte kontaktieren Sie den Administrator." },
      { status: 503 }
    );
  }

  const rateKey = `admin-login:${getClientIp(req)}`;
  const limit = rateLimit({ key: rateKey, limit: ATTEMPT_LIMIT, windowMs: ATTEMPT_WINDOW_MS });

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Zu viele Anmeldeversuche. Bitte versuchen Sie es später erneut." },
      { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } }
    );
  }

  let passcode;
  try {
    ({ passcode } = await req.json());
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  if (typeof passcode !== "string" || !verifyAdminPasscode(passcode)) {
    // Deliberately generic: do not reveal whether the passcode was close.
    return NextResponse.json({ error: "Ungültiger Passcode." }, { status: 401 });
  }

  resetRateLimit(rateKey);

  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, await createAdminSessionToken(), adminSessionCookieOptions());
  return response;
}
