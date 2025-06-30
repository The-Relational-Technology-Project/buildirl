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
  CreateAccountInput,
  CreateCheckoutSessionResult,
  CreateCustomerPortalSessionResult,
  CreateCustomerPortalSessionInput,
  CreateCustomerForMembershipResult
} from "~/server/payments/types";
import { stringify } from "~/utils";
import { Maybe } from "~/utils/types";
import { AccountIdResolver } from "./accountIdResolver";

const logger = rootLogger.child({ module: "paymentService" });

export function createPaymentService(
  stripeClient: StripeClient,
  prisma: PrismaClient,
  accountIdResolver: AccountIdResolver
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

      const accountId = await accountIdResolver.fromMembership(membershipId);

      const subscriptionStatus = await stripeClient.getSubscriptionStatus(
        membership.stripeSubscriptionId,
        accountId
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

      const { configurationId } =
        await stripeClient.createCustomerPortalConfiguration(accountId);

      await tx.club.update({
        where: { id: input.clubId },
        data: {
          stripeConnectAccountId: accountId,
          stripeCustomerPortalConfigurationId: configurationId
        }
      });

      logger.info(
        `created Stripe Connect account with id ${accountId} with customer portal configuration with id ${configurationId} for club with id ${input.clubId}`
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
        origin: input.origin,
        clubId: input.clubId
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

  async function createCheckoutSession(
    input: CreateCheckoutSessionInput,
    membershipId: bigint
  ): Promise<CreateCheckoutSessionResult> {
    try {
      const membership = await prisma.membership.findUniqueOrThrow({
        select: {
          id: true,
          membershipTier: {
            select: {
              club: {
                select: {
                  publicId: true
                }
              }
            }
          },
          stripeCustomerId: true
        },
        where: { id: membershipId }
      });

      if (!membership.stripeCustomerId) {
        throw new Error(
          `no Stripe customer found for membership with id ${membershipId}`
        );
      }

      const accountId = await accountIdResolver.fromMembership(membershipId);

      const { redirectUrl } =
        await stripeClient.createCheckoutSessionForMembership(
          {
            customerId: membership.stripeCustomerId,
            membershipId: membershipId,
            clubPublicId: membership.membershipTier.club.publicId,
            origin: input.origin
          },
          accountId
        );

      logger.info(
        `created checkout session with url ${redirectUrl} for membership with id ${membershipId}`
      );
      return { redirectUrl };
    } catch (e) {
      logger.error(
        e,
        `failed to create checkout session for membership with id ${membershipId}`
      );
      throw e;
    }
  }

  async function createCustomerPortalSession(
    input: CreateCustomerPortalSessionInput,
    membershipId: bigint
  ): Promise<CreateCustomerPortalSessionResult> {
    try {
      const membership = await prisma.membership.findUniqueOrThrow({
        select: {
          id: true,
          stripeCustomerId: true,
          membershipTier: {
            select: {
              club: {
                select: { id: true, stripeCustomerPortalConfigurationId: true }
              }
            }
          }
        },
        where: { id: membershipId }
      });

      if (!membership.stripeCustomerId) {
        throw new Error(
          `no Stripe customer found for membership with id ${membershipId}`
        );
      }

      if (!membership.membershipTier.club.stripeCustomerPortalConfigurationId) {
        throw new Error(
          `no Stripe customer portal configuration found for club with with id ${membership.membershipTier.club.id}`
        );
      }

      const accountId = await accountIdResolver.fromMembership(membershipId);

      const { redirectUrl } = await stripeClient.createCustomerPortalSession(
        {
          customerId: membership.stripeCustomerId,
          clubId: membership.membershipTier.club.id,
          origin: input.origin,
          configurationId:
            membership.membershipTier.club.stripeCustomerPortalConfigurationId
        },
        accountId
      );

      logger.info(
        `created customer portal session with url ${redirectUrl} for membership with id ${membershipId}`
      );
      return { redirectUrl };
    } catch (e) {
      logger.error(
        e,
        `failed to create customer portal session for membership with id ${membershipId}`
      );
      throw e;
    }
  }

  async function createCustomerForMembership(
    membershipId: bigint,
    tx: Prisma.TransactionClient
  ): Promise<CreateCustomerForMembershipResult> {
    try {
      const membership = await tx.membership.findUniqueOrThrow({
        where: { id: membershipId },
        select: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              settings: {
                select: { email: true }
              }
            }
          }
        }
      });

      if (!membership.user.settings?.email) {
        throw new Error(
          `user with id ${membership.user.id} has no settings with email to create Stripe customer`
        );
      }

      const accountId = await accountIdResolver.fromMembershipInTransaction(
        membershipId,
        tx
      );

      const response = await stripeClient.createCustomerForMembership(
        {
          email: membership.user.settings.email,
          name: `${membership.user.firstName} ${membership.user.lastName}`,
          membershipId: membershipId
        },
        accountId
      );

      logger.info(
        `created stripe customer ${response.customerId} for membership with id ${membershipId}`
      );

      return { customerId: response.customerId };
    } catch (e) {
      logger.error(
        e,
        `failed to create stripe customer for membership with id ${membershipId}`
      );
      throw e;
    }
  }

  return {
    getAccountStatus,
    getSubscriptionStatus,
    createAccount,
    createAccountLink,
    createCheckoutSession,
    createCustomerPortalSession,
    createCustomerForMembership
  };
}
