import { StripeClient } from "~/server/payments/stripe/types";
import { PrismaClient } from "@prisma/client";
import { rootLogger } from "~/logger";
import {
  PaymentService,
  AccountStatus,
  SubscriptionStatus,
  CreateAccountLinkInput,
  CreateAccountLinkResult,
  CreateCheckoutSessionInput,
  CreateCheckoutSessionResult
} from "~/server/payments/types";
import { stringify } from "~/utils";
import { Url } from "~/server/service/types";

const logger = rootLogger.child({ module: "paymentService" });

export function createPaymentService(
  stripeClient: StripeClient,
  prisma: PrismaClient
): PaymentService {
  async function getAccountStatus(userId: number): Promise<AccountStatus> {
    try {
      const userSettings = await prisma.userSettings.findUniqueOrThrow({
        where: { userId }
      });

      if (!userSettings.stripeConnectAccountId) {
        return {
          isComplete: false,
          missingRequirements: ["Stripe Connect account not created"]
        };
      }

      const accountStatus = await stripeClient.getAccountStatus(
        userSettings.stripeConnectAccountId
      );

      logger.info(
        `retrieved account status ${stringify(accountStatus)} for user with id ${userId}`
      );
      return accountStatus;
    } catch (e) {
      logger.error(
        e,
        `failed to get account status for user with id ${userId}`
      );
      throw e;
    }
  }

  async function getSubscriptionStatus(
    membershipId: bigint
  ): Promise<SubscriptionStatus> {
    try {
      const membership = await prisma.membership.findUniqueOrThrow({
        where: { id: membershipId }
      });

      if (!membership.stripeSubscriptionId) {
        return {
          isActive: false,
          status: "no_subscription"
        };
      }

      const subscriptionStatus = await stripeClient.getSubscriptionStatus(
        membership.stripeSubscriptionId
      );

      logger.info(
        `retrieved subscription status ${stringify(subscriptionStatus)} for membership with id ${membershipId}`
      );
      return subscriptionStatus;
    } catch (e) {
      logger.error(
        e,
        `failed to get subscription status for membership with id ${membershipId}`
      );
      throw e;
    }
  }

  async function getCustomerPortalLink(userId: number): Promise<Url> {
    try {
      const userSettings = await prisma.userSettings.findUniqueOrThrow({
        where: { userId }
      });

      if (!userSettings.stripeCustomerId) {
        throw new Error(
          `no stripe customer id found for user with id ${userId}`
        );
      }

      // TODO: Implement customer portal link generation
      // This would require additional Stripe API integration
      throw new Error("customer portal link generation not implemented");
    } catch (e) {
      logger.error(
        e,
        `failed to get customer portal link for user with id ${userId}`
      );
      throw e;
    }
  }

  async function createAccount(userId: number): Promise<void> {
    return prisma.$transaction(async (tx) => {
      try {
        const userSettings = await tx.userSettings.findUniqueOrThrow({
          where: { userId }
        });

        if (userSettings.stripeConnectAccountId) {
          throw new Error(
            `stripe connect account already exists for user with id ${userId}`
          );
        }

        const { accountId } = await stripeClient.createAccount();

        await tx.userSettings.update({
          where: { userId },
          data: { stripeConnectAccountId: accountId }
        });

        logger.info(
          `created stripe connect account with id ${accountId} for user with id ${userId}`
        );
      } catch (e) {
        logger.error(
          e,
          `failed to create stripe connect account for user with id ${userId}`
        );
        throw e;
      }
    });
  }

  async function createAccountLink(
    input: CreateAccountLinkInput,
    userId: number
  ): Promise<CreateAccountLinkResult> {
    try {
      const userSettings = await prisma.userSettings.findUniqueOrThrow({
        where: { userId }
      });

      if (!userSettings.stripeConnectAccountId) {
        throw new Error(
          `no stripe connect account found for user with id ${userId}`
        );
      }

      const { redirectUrl } = await stripeClient.createAccountLink({
        accountId: userSettings.stripeConnectAccountId,
        origin: input.origin
      });

      logger.info(
        `created account link with redirect url ${redirectUrl} for user with id ${userId}`
      );
      return { redirectUrl };
    } catch (e) {
      logger.error(
        e,
        `failed to create account link for user with id ${userId}`
      );
      throw e;
    }
  }

  async function createCheckoutSession(
    input: CreateCheckoutSessionInput,
    userId: number
  ): Promise<CreateCheckoutSessionResult> {
    return prisma.$transaction(async (tx) => {
      try {
        const userSettings = await tx.userSettings.findUniqueOrThrow({
          where: { userId }
        });

        if (!userSettings.stripeCustomerId) {
          throw new Error(
            `no stripe customer found for user with id ${userId}`
          );
        }

        const membership = await tx.membership.findUniqueOrThrow({
          where: { id: input.membershipId },
          include: { membershipTier: true }
        });

        if (!membership.membershipTier.stripePriceId) {
          throw new Error(
            `no stripe price found for membership tier with id ${membership.membershipTierId}`
          );
        }

        const { redirectUrl } = await stripeClient.createCheckoutSession({
          customerId: userSettings.stripeCustomerId,
          priceId: membership.membershipTier.stripePriceId,
          membershipId: Number(membership.id),
          clubId: membership.membershipTier.clubId,
          origin: input.origin
        });

        logger.info(
          `created checkout session with redirect url ${redirectUrl} for membership with id ${input.membershipId}`
        );
        return { redirectUrl };
      } catch (e) {
        logger.error(
          e,
          `failed to create checkout session for membership with id ${input.membershipId}`
        );
        throw e;
      }
    });
  }

  return {
    getAccountStatus,
    getSubscriptionStatus,
    getCustomerPortalLink,
    createAccount,
    createAccountLink,
    createCheckoutSession
  };
}
