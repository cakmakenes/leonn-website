import { handleDecisionGet, handleDecisionPost } from "@/lib/reservationDecision";

export const runtime = "nodejs";

/** Shows a confirmation page. Does not change any state. */
export async function GET(req) {
  return handleDecisionGet(req, "approve");
}

/** Confirms the reservation and notifies the guest. */
export async function POST(req) {
  return handleDecisionPost(req, "approve");
}
