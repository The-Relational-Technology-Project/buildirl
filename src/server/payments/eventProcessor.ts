import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import { rootLogger } from "~/logger";

const logger = rootLogger.child({ module: "paymentEventProcessor" });

export type PaymentEventProcessor = {
  onSetupIntentSuccess(setupIntent: Stripe.SetupIntent): Promise<void>;
};

export function createPaymentEventProcessor(
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
        data: { stripeSetupIntentId: setupIntentId, status: "PENDING" },
        where: { id: membershipId }
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

  async function onSetupIntentSuccess(setupIntent: Stripe.SetupIntent) {
    if (!setupIntent.metadata?.externalMembershipId) {
      const errorMessage = `setup intent ${setupIntent.id} missing externalMembershipId`;
      logger.error(errorMessage);
      // do not throw here because we do not want Stripe to retry even if it is unexpected bad data
      return;
    }

    const membershipId = BigInt(setupIntent.metadata.externalMembershipId);
    await updateMembershipWithStripeSetupIntentId(membershipId, setupIntent.id);

    logger.info(
      `successfully processed setup_intent.success event for setup intent ${setupIntent.id}`
    );
  }
  return {
    onSetupIntentSuccess
  };
}
