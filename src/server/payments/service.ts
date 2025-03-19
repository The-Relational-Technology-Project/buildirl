import { StripeClient } from "~/server/payments/stripe/types";
import { Prisma, PrismaClient } from "@prisma/client";
import { rootLogger } from "~/logger";
import {
  PaymentService,
  AccountStatus,
  SubscriptionStatus,
  CreateAccountLinkInput,
  CreateAccountLinkResult,
  CreateCheckoutSessionInput
} from "~/server/payments/types";
import { stringify } from "~/utils";
import { Url } from "~/server/service/types";
import { Maybe } from "~/utils/types";

const logger = rootLogger.child({ module: "paymentService" });

export function createPaymentService(
  stripeClient: StripeClient,
  prisma: PrismaClient,
  stripeCustomerPortalUrl: string
): PaymentService {
  async function getAccountStatus(
    userId: number
  ): Promise<Maybe<AccountStatus>> {
    try {
      const result = await prisma.userSettings.findUniqueOrThrow({
        select: {
          stripeConnectAccountId: true
        },
        where: { userId }
      });

      if (!result.stripeConnectAccountId) {
        logger.info(
          `no account found when retrieving account status for user with id ${userId}`
        );
        // no connected account
        return null;
      }

      const accountStatus = await stripeClient.getAccountStatus(
        result.stripeConnectAccountId
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
  ): Promise<Maybe<SubscriptionStatus>> {
    try {
      const result = await prisma.membership.findUniqueOrThrow({
        select: { stripeSubscriptionId: true },
        where: { id: membershipId }
      });

      if (!result.stripeSubscriptionId) {
        return null;
      }

      const subscriptionStatus = await stripeClient.getSubscriptionStatus(
        result.stripeSubscriptionId
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
      const result = await prisma.userSettings.findUniqueOrThrow({
        select: {
          stripeCustomerId: true
        },
        where: { userId }
      });

      // TODO! remove this once this field is made required after back-fill
      if (!result.stripeCustomerId) {
        throw new Error(
          `no stripe customer id found for user with id ${userId}`
        );
      }

      const email = await stripeClient.getCustomerEmail(
        result.stripeCustomerId
      );

      const customerPortalLink = `${stripeCustomerPortalUrl}?prefilled_email=${email}`;

      logger.info(
        `retrieved customer portal link ${customerPortalLink} for user with id ${userId}`
      );

      return customerPortalLink;
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
      return createAccountInTransaction(userId, tx);
    });
  }

  async function createAccountInTransaction(
    userId: number,
    tx: Prisma.TransactionClient
  ) {
    try {
      const result = await tx.userSettings.findUniqueOrThrow({
        select: {
          stripeConnectAccountId: true,
          email: true
        },
        where: { userId }
      });

      if (result.stripeConnectAccountId) {
        throw new Error(
          `Stripe Connect account already exists for user with id ${userId}`
        );
      }

      if (!result.email) {
        throw new Error(
          `user with id ${userId} has no email to create Stripe Connect account`
        );
      }

      const { accountId } = await stripeClient.createAccount({
        email: result.email
      });

      await tx.userSettings.update({
        where: { userId },
        data: { stripeConnectAccountId: accountId }
      });

      logger.info(
        `created Stripe Connect account with id ${accountId} for user with id ${userId}`
      );
    } catch (e) {
      logger.error(
        e,
        `failed to create stripe connect account for user with id ${userId}`
      );
      throw e;
    }
  }

  async function createAccountLink(
    input: CreateAccountLinkInput,
    userId: number
  ): Promise<CreateAccountLinkResult> {
    try {
      const result = await prisma.userSettings.findUniqueOrThrow({
        select: {
          stripeConnectAccountId: true
        },
        where: { userId }
      });

      if (!result.stripeConnectAccountId) {
        throw new Error(
          `no Stripe Connect account found for user with id ${userId}`
        );
      }

      const { redirectUrl } = await stripeClient.createAccountLink({
        accountId: result.stripeConnectAccountId,
        origin: input.origin
      });

      logger.info(
        `created account link with url ${redirectUrl} for user with id ${userId}`
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
  ) {
    try {
      const userSettings = await prisma.userSettings.findUniqueOrThrow({
        select: {
          stripeCustomerId: true
        },
        where: { userId }
      });

      if (!userSettings.stripeCustomerId) {
        throw new Error(`no Stripe customer found for user with id ${userId}`);
      }

      const membership = await prisma.membership.findUniqueOrThrow({
        where: { id: input.membershipId },
        select: {
          id: true,
          membershipTier: {
            select: {
              id: true,
              stripePriceId: true,
              clubId: true
            }
          }
        }
      });

      if (!membership.membershipTier.stripePriceId) {
        throw new Error(
          `no Stripe price found for membership tier with id ${membership.membershipTier.id}`
        );
      }

      const { redirectUrl } = await stripeClient.createCheckoutSession({
        customerId: userSettings.stripeCustomerId,
        priceId: membership.membershipTier.stripePriceId,
        membershipId: membership.id,
        clubId: membership.membershipTier.clubId,
        origin: input.origin
      });

      logger.info(
        `created checkout session with url ${redirectUrl} for membership with id ${input.membershipId}`
      );
      return { redirectUrl };
    } catch (e) {
      logger.error(
        e,
        `failed to create checkout session for membership with id ${input.membershipId}`
      );
      throw e;
    }
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
