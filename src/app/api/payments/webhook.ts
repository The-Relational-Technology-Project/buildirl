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
    // https://docs.stripe.com/billing/subscriptions/webhooks
    switch (event.type) {
      case "checkout.session.completed":
        throw new Error("unimplemented");
      default:
        // TODO for failed cases (e.g. invoice.payment_failed), should we at
        //  least alert as error?
        logger.warn(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (e) {
    logger.error(e, `webhook error: ${e}`);
    res.status(400).json({ error: `webhook error: ${e}` });
  }
}
