import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/adminAuth";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

/**
 * Shared entry checks for the admin menu API.
 *
 * `proxy.js` already gates these paths, but every handler re-verifies the
 * session: a mistake in the matcher must not be enough to expose a write
 * endpoint. This mirrors the approach in the voucher redemption route.
 */

const WRITE_LIMIT = 120;
const WINDOW_MS = 5 * 60 * 1000;

export function jsonError(message, status = 400, extraHeaders = {}) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "cache-control": "no-store", ...extraHeaders } }
  );
}

export function jsonOk(payload = { success: true }, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

/**
 * Returns a response to send back when the request must be refused, or null
 * when the handler may proceed.
 */
export async function guardAdminRequest(req, bucket) {
  if (!(await isAuthenticatedAdmin(req))) {
    return jsonError("Nicht autorisiert. Bitte melden Sie sich an.", 401);
  }

  const limit = rateLimit({
    key: `admin-menu-${bucket}:${getClientIp(req)}`,
    limit: WRITE_LIMIT,
    windowMs: WINDOW_MS,
  });

  if (!limit.allowed) {
    return jsonError("Zu viele Anfragen. Bitte versuchen Sie es später erneut.", 429, {
      "retry-after": String(limit.retryAfterSeconds),
    });
  }

  return null;
}

/** Parses a JSON body, returning null instead of throwing on malformed input. */
export async function readJsonBody(req) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

/**
 * Flattens a multipart form into a plain object of string fields plus the
 * uploaded file, so the same validators can serve JSON and form submissions.
 */
export async function readFormBody(req) {
  let form;
  try {
    form = await req.formData();
  } catch {
    return null;
  }

  const fields = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") fields[key] = value;
  }

  const image = form.get("image");
  return { fields, image: image && typeof image === "object" ? image : null };
}
