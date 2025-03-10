import { env } from "~/env";

export const stripe = require("stripe")(env.STRIPE_SECRET_KEY);
