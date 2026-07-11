import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  // throw new Error("Missing STRIPE_SECRET_KEY in .env");
  console.warn("Missing STRIPE_SECRET_KEY in .env");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2023-10-16",
});

export default stripe;
