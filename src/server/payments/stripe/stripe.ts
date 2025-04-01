import Stripe from "stripe";
import { env } from "~/env";

const createStripeClient = () =>
  new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
    maxNetworkRetries: 3
  });

const globalForStripe = globalThis as unknown as {
  stripe: ReturnType<typeof createStripeClient> | undefined;
};

export const stripe = globalForStripe.stripe ?? createStripeClient();

if (env.NODE_ENV !== "production") globalForStripe.stripe = stripe;
