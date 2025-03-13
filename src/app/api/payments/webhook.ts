// noinspection ExceptionCaughtLocallyJS

import { NextApiRequest, NextApiResponse } from "next";
import { rootLogger } from "~/logger";
import { env } from "~/env";
import { stripe } from "~/server/payments/stripe";
import { assertAsString } from "~/utils";

export const config = {
  api: {
    bodyParser: false
  }
};

const logger = rootLogger.child({ module: "stripeWebhookHandler" });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(405).appendHeader("Allow", "POST").end();
    return;
  }

  const signature = assertAsString(req.headers["stripe-signature"]);

  if (!signature) {
    logger.error("missing Stripe signature");
    return res.status(400).json({ error: "missing Stripe signature" });
  }

  try {
    // verify and construct the event
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );

    // https://docs.stripe.com/api/events/types
    //  https://docs.stripe.com/billing/subscriptions/webhooks
    switch (event.type) {
      case "account.updated":
        throw new Error("unimplemented");
      case "customer.created":
        throw new Error("unimplemented");
      case "customer.subscription.created":
        throw new Error("unimplemented");
      case "customer.subscription.updated":
        throw new Error("unimplemented");
      case "customer.subscription.deleted":
        throw new Error("unimplemented");
      case "checkout.session.completed":
        throw new Error("unimplemented");
      case "checkout.session.expired":
        throw new Error("unimplemented");
      case "setup_intent.succeeded":
        throw new Error("unimplemented");
      case "setup_intent.setup_failed":
        throw new Error("unimplemented");
      default:
        // TODO for failure cases, at least log as error?
        // invoice.created
        // invoice.paid
        // invoice.payment_failed
        // payment_intent.created
        // payment_intent.succeeded
        // payment_intent.payment_failed
        // customer.updated
        // customer.deleted
        // customer.subscription.paused
        // customer.subscription.resumed
        // plan.created
        // plan.updated
        // subscription_schedule.created
        // subscription_schedule.updated
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (e) {
    logger.error(e, `webhook error: ${e}`);
    res.status(400).json({ error: `webhook error: ${e}` });
  }
}
