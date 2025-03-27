import { StripeClient } from "~/server/payments/stripe/types";
import { Prisma, PrismaClient } from "@prisma/client";
import { rootLogger } from "~/logger";
import {
  PaymentService,
  AccountStatus,
  SubscriptionStatus,
  CreateAccountLinkInput,
  CreateAccountLinkResult,
  CreateCheckoutSessionInput,
  CreateAccountInput
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
    clubId: number
  ): Promise<Maybe<AccountStatus>> {
    try {
      const club = await prisma.club.findUniqueOrThrow({
        select: {
          stripeConnectAccountId: true
        },
        where: { id: clubId }
      });

      if (!club.stripeConnectAccountId) {
        logger.info(
          `no account found when retrieving account status for club with id ${clubId}`
        );
        // no connected account
        return null;
      }

      const accountStatus = await stripeClient.getAccountStatus(
        club.stripeConnectAccountId
      );

      logger.info(
        `retrieved account status ${stringify(accountStatus)} for club with id ${clubId}`
      );
      return accountStatus;
    } catch (e) {
      logger.error(
        e,
        `failed to get account status for club with id ${clubId}`
      );
      throw e;
    }
  }

  async function getSubscriptionStatus(
    membershipId: bigint
  ): Promise<Maybe<SubscriptionStatus>> {
    try {
      const membership = await prisma.membership.findUniqueOrThrow({
        select: { stripeSubscriptionId: true },
        where: { id: membershipId }
      });

      if (!membership.stripeSubscriptionId) {
        return null;
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

  async function getCustomerPortalLink(membershipId: bigint): Promise<Url> {
    try {
      const membership = await prisma.membership.findUniqueOrThrow({
        select: {
          stripeCustomerId: true
        },
        where: { id: membershipId }
      });

      if (!membership.stripeCustomerId) {
        throw new Error(
          `no stripe customer id found for membership with id ${membershipId}`
        );
      }

      const email = await stripeClient.getCustomerEmail(
        membership.stripeCustomerId
      );

      const customerPortalLink = `${stripeCustomerPortalUrl}?prefilled_email=${email}`;

      logger.info(
        `retrieved customer portal link ${customerPortalLink} for membership with id ${membershipId}`
      );

      return customerPortalLink;
    } catch (e) {
      logger.error(
        e,
        `failed to get customer portal link for membership with id ${membershipId}`
      );
      throw e;
    }
  }

  async function createAccount(input: CreateAccountInput): Promise<void> {
    return prisma.$transaction(async (tx) => {
      return createAccountInTransaction(input, tx);
    });
  }

  async function createAccountInTransaction(
    input: CreateAccountInput,
    tx: Prisma.TransactionClient
  ) {
    try {
      const club = await tx.club.findUniqueOrThrow({
        select: {
          stripeConnectAccountId: true
        },
        where: { id: input.clubId }
      });

      if (club.stripeConnectAccountId) {
        throw new Error(
          `Stripe Connect account already exists for club with id ${input.clubId}`
        );
      }

      const { accountId } = await stripeClient.createAccount();

      await tx.club.update({
        where: { id: input.clubId },
        data: { stripeConnectAccountId: accountId }
      });

      logger.info(
        `created Stripe Connect account with id ${accountId} for club with id ${input.clubId}`
      );
    } catch (e) {
      logger.error(
        e,
        `failed to create stripe connect account for user with id ${input.clubId}`
      );
      throw e;
    }
  }

  async function createAccountLink(
    input: CreateAccountLinkInput
  ): Promise<CreateAccountLinkResult> {
    try {
      const club = await prisma.club.findUniqueOrThrow({
        select: {
          stripeConnectAccountId: true
        },
        where: { id: input.clubId }
      });

      if (!club.stripeConnectAccountId) {
        throw new Error(
          `no Stripe Connect account found for club with id ${input.clubId}`
        );
      }

      const { redirectUrl } = await stripeClient.createAccountLink({
        accountId: club.stripeConnectAccountId,
        origin: input.origin
      });

      logger.info(
        `created account link with url ${redirectUrl} for club with id ${input.clubId}`
      );
      return { redirectUrl };
    } catch (e) {
      logger.error(
        e,
        `failed to create account link for club with id ${input.clubId}`
      );
      throw e;
    }
  }

  async function createCheckoutSession(input: CreateCheckoutSessionInput) {
    try {
      const membership = await prisma.membership.findUniqueOrThrow({
        select: {
          id: true,
          membershipTier: {
            select: {
              id: true,
              stripePriceId: true,
              clubId: true
            }
          },
          stripeCustomerId: true
        },
        where: { id: input.membershipId }
      });

      if (!membership.stripeCustomerId) {
        throw new Error(
          `no Stripe customer found for membership with id ${input.membershipId}`
        );
      }

      if (!membership.membershipTier.stripePriceId) {
        throw new Error(
          `no Stripe price found for membership tier with id ${membership.membershipTier.id}`
        );
      }

      const { redirectUrl } = await stripeClient.createCheckoutSession({
        customerId: membership.stripeCustomerId,
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
