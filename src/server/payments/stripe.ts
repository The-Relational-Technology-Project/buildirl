import Stripe from "stripe";
import { env } from "~/env";

// TODO singleton pattern https://vercel.com/guides/getting-started-with-nextjs-typescript-stripe
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia"
});
