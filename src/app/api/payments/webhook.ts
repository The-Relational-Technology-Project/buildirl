import { NextApiRequest, NextApiResponse } from "next";
import { rootLogger } from "~/logger";
import { env } from "~/env";
import { stripe } from "~/server/payments/stripe/stripe";
import { assertAsString, stringify } from "~/utils";
import Cors from "micro-cors";
import { prisma } from "~/server/prisma";
import Stripe from "stripe";

const cors = Cors({
  allowMethods: ["POST", "HEAD"]
});

export const config = {
  api: {
    bodyParser: false
  }
};

const logger = rootLogger.child({ module: "stripeWebhookHandler" });

/**
 * Idempotent update of membership with setupIntentId from stripe
 *
 * It is important this is idempotent because stripe can send webhook event
 * multiple times
 */
async function updateMembershipWithStripeSetupIntentId(
  membershipId: bigint,
  setupIntentId: string
): Promise<void> {
  try {
    await prisma.membership.update({
      where: { id: membershipId },
      data: { stripeSetupIntentId: setupIntentId }
    });
    logger.info(
      `updated membership with id ${membershipId} with stripeSetupIntentId ${setupIntentId}`
    );
  } catch (e) {
    logger.error(
      e,
      `failed to update membership with id ${membershipId} with stripeSetupIntentId ${setupIntentId}`
    );
    throw e;
  }
}

function getSetupIntent(
  setupIntent: string | Stripe.SetupIntent
): Promise<Stripe.SetupIntent> {
  if (typeof setupIntent === "string") {
    return stripe.setupIntents.retrieve(setupIntent);
  }
  return Promise.resolve(setupIntent);
}

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

        if (!session.setup_intent) {
          // we cannot guarantee in future there are not other checkout sessions not
          // created by our system
          logger.warn(
            `checkout session ${session.id} completed without a setup intent`
          );
          break;
        }

        const setupIntent = await getSetupIntent(session.setup_intent);

        if (!setupIntent.metadata?.externalMembershipId) {
          const errorMessage = `setup intent ${setupIntent.id} missing externalMembershipId`;
          logger.error(errorMessage);
          // do not throw here because we do not want Stripe to retry even if it is unexpected bad data
          break;
        }

        const membershipId = BigInt(setupIntent.metadata.externalMembershipId);
        await updateMembershipWithStripeSetupIntentId(
          membershipId,
          setupIntent.id
        );

        logger.info(
          `successfully processed checkout.session.completed event for session ${session.id}`
        );
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
    res.status(400).json({ error: `webhook error: ${stringify(e)}` });
  }
}

export default cors(handler as any);
