import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import { rootLogger } from "~/logger";
import { Maybe } from "~/utils/types";

const logger = rootLogger.child({ module: "paymentEventProcessor" });

export type PaymentEventProcessor = {
  onCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void>;
};

export function createPaymentEventProcessor(
  stripe: Maybe<Stripe>,
  prisma: PrismaClient
): PaymentEventProcessor {
  async function updateMembershipWithStripeSetupIntentId(
    membershipId: bigint,
    setupIntentId: string
  ): Promise<void> {
    try {
      // it is important this is idempotent because stripe can send webhook event
      // multiple times
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
      // hacky to make this nullable to work with tests, we should think of better
      // strategy for mocking if we add to this
      if (!stripe) {
        throw new Error(
          "stripe client not found, are you in a test environment?"
        );
      }
      return stripe.setupIntents.retrieve(setupIntent);
    }
    return Promise.resolve(setupIntent);
  }

  async function onCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    if (!session.setup_intent) {
      // we cannot guarantee in future there are not other checkout sessions not
      // created by our system
      logger.warn(
        `checkout session ${session.id} completed without a setup intent`
      );
      return;
    }

    const setupIntent = await getSetupIntent(session.setup_intent);

    if (!setupIntent.metadata?.externalMembershipId) {
      const errorMessage = `setup intent ${setupIntent.id} missing externalMembershipId`;
      logger.error(errorMessage);
      // do not throw here because we do not want Stripe to retry even if it is unexpected bad data
      return;
    }

    const membershipId = BigInt(setupIntent.metadata.externalMembershipId);
    await updateMembershipWithStripeSetupIntentId(membershipId, setupIntent.id);

    logger.info(
      `successfully processed checkout.session.completed event for session ${session.id}`
    );
  }
  return {
    onCheckoutSessionCompleted
  };
}
