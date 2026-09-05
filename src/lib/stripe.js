import Stripe from "stripe";

let client = null;

/**
 * Lazily constructed Stripe client.
 *
 * Deliberately not created at module scope: importing this file must not
 * silently fall back to a placeholder key. A missing key now fails loudly at
 * request time with a clear message instead of producing confusing Stripe
 * errors much later.
 */
export function getStripe() {
  if (client) return client;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  client = new Stripe(secretKey, { apiVersion: "2023-10-16" });
  return client;
}
