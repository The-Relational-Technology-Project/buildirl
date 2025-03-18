import { NextApiRequest, NextApiResponse } from "next";
import { rootLogger } from "~/logger";
import { env } from "~/env";
import { stripe } from "~/server/payments/stripe/stripe";
import { assertAsString, stringify } from "~/utils";
import Cors from "micro-cors";
import Stripe from "stripe";
import { createPaymentEventProcessor } from "~/server/payments/eventProcessor";
import { prisma } from "~/server/prisma";

const cors = Cors({
  allowMethods: ["POST", "HEAD"]
});

export const config = {
  api: {
    bodyParser: false
  }
};

const logger = rootLogger.child({ module: "stripeWebhookHandler" });
const eventProcessor = createPaymentEventProcessor(stripe, prisma);

async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );

    // https://docs.stripe.com/api/events/types
    // https://docs.stripe.com/billing/subscriptions/webhooks
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        await eventProcessor.onCheckoutSessionCompleted(session);
        break;
      default:
        // TODO for failed cases (e.g. invoice.payment_failed), should we at
        //  least alert as error?
        logger.warn(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (e) {
    logger.error(e, `webhook error for req ${stringify(req.body)}`);
    // errors here will be retried by Stripe
    // TODO we can observe if there are classes and distinguish errors that are not retryable
    res.status(500).json({ error: `webhook error: ${stringify(e)}` });
  }
}

export default cors(handler as any);
