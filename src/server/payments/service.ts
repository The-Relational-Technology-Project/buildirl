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
  CreateSubscriptionForMembershipInput,
  CreateProductAndPricesForMembershipTierInput,
  UpdateProductAndPricesForMembershipTierInput
} from "~/server/payments/types";
import { stringify, asNullFilteredList } from "~/utils";
import { Maybe } from "~/utils/types";
import { AccountIdResolver } from "./accountIdResolver";
import { isPrismaResultDefaultFreeTier } from "~/server/membershipTier/utils";

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
            origin: input.origin,
            flowType: input.flowType
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
  ): Promise<void> {
    try {
      const membership = await tx.membership.findUniqueOrThrow({
        where: { id: membershipId },
        select: {
          stripeCustomerId: true,
          membershipTier: {
            select: {
              costPerBillingInterval: true
            }
          },
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

      if (membership.stripeCustomerId !== null) {
        // already have a stripeCustomerId, no need to create a new one
        logger.info(
          `membership with id ${membershipId} already has stripeCustomerId ${membership.stripeCustomerId}`
        );
        return;
      }
      // no Stripe customer needed for default free tier
      if (isPrismaResultDefaultFreeTier(membership.membershipTier)) {
        logger.info(
          `membership with id ${membershipId} is free tier, no Stripe customer needed`
        );
        return;
      }

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

      await tx.membership.update({
        data: { stripeCustomerId: response.customerId },
        where: { id: membershipId }
      });

      logger.info(
        `created stripe customer ${response.customerId} for membership with id ${membershipId}`
      );
    } catch (e) {
      logger.error(
        e,
        `failed to create stripe customer for membership with id ${membershipId}`
      );
      throw e;
    }
  }

  async function createSubscriptionForMembership(
    input: CreateSubscriptionForMembershipInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    try {
      const membership = await tx.membership.findUniqueOrThrow({
        select: {
          stripeSetupIntentId: true,
          stripeCustomerId: true,
          stripeSubscriptionId: true,
          membershipTier: {
            select: {
              id: true,
              updatedAt: true,
              stripePriceId: true,
              costPerBillingInterval: true,
              initiationFeeStripePriceId: true,
              club: {
                select: {
                  id: true,
                  stripeConnectAccountId: true
                }
              }
            }
          }
        },
        where: { id: input.membershipId }
      });

      if (membership.stripeSubscriptionId) {
        throw new Error(
          `Subscription ${membership.stripeSubscriptionId} already exists for membership ${input.membershipId}`
        );
      }

      // free tier does not need to create subscription
      if (isPrismaResultDefaultFreeTier(membership.membershipTier)) {
        logger.info(
          `membership with id ${input.membershipId} is free tier, no subscription needed`
        );
        return;
      }

      const customerId = membership.stripeCustomerId;
      const stripeAccountId =
        membership.membershipTier.club.stripeConnectAccountId;
      const setupIntentId = membership.stripeSetupIntentId;
      const priceId = membership.membershipTier.stripePriceId;
      const initiationFeeStripePriceId =
        membership.membershipTier.initiationFeeStripePriceId;
      const membershipTierUpdatedAt = membership.membershipTier.updatedAt;

      if (!customerId) {
        throw new Error(
          `membership with id ${input.membershipId} has no stripeCustomerId to create subscription`
        );
      }
      if (!stripeAccountId) {
        throw new Error(
          `club with id ${membership.membershipTier.club.id} has no stripeAccountId create subscription`
        );
      }
      if (!setupIntentId) {
        throw new Error(
          `membership with id ${input.membershipId} has no stripeSetupIntentId to create subscription`
        );
      }
      if (!priceId) {
        throw new Error(
          `membership tier with id ${membership.membershipTier.id} has no priceId to create subscription`
        );
      }

      const accountId = await accountIdResolver.fromMembershipInTransaction(
        input.membershipId,
        tx
      );

      const { subscriptionId } =
        await stripeClient.createSubscriptionForMembership(
          {
            setupIntentId: setupIntentId,
            customerId: customerId,
            priceId: priceId,
            membershipId: input.membershipId,
            initiationFeePriceId: initiationFeeStripePriceId,
            membershipTierUpdatedAtMs: membershipTierUpdatedAt.getTime()
          },
          accountId
        );

      await tx.membership.update({
        data: {
          stripeSubscriptionId: subscriptionId
        },
        where: { id: input.membershipId }
      });

      logger.info(
        `created stripe subscription ${subscriptionId} for membership with id ${input.membershipId}`
      );
    } catch (e) {
      logger.error(
        e,
        `failed to create stripe subscription for membership with id ${input.membershipId}`
      );
      throw e;
    }
  }

  async function cancelSubscription(
    membershipId: bigint,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    try {
      const membership = await tx.membership.findUniqueOrThrow({
        select: {
          membershipTier: {
            select: {
              id: true,
              costPerBillingInterval: true
            }
          },
          stripeSubscriptionId: true
        },
        where: { id: membershipId }
      });

      // free tier does not need to cancel subscription
      if (isPrismaResultDefaultFreeTier(membership.membershipTier)) {
        logger.info(
          `membership with id ${membershipId} is free tier, no subscription to cancel`
        );
        return;
      }

      if (!membership.stripeSubscriptionId) {
        // unexpected and we should look into but since it is non-actionable and doesn't result in bad state,
        // we should not block
        logger.error(
          `membership with id ${membershipId} has no stripeSubscriptionId to cancel`
        );
        return;
      }

      const accountId = await accountIdResolver.fromMembershipInTransaction(
        membershipId,
        tx
      );

      await stripeClient.cancelSubscription(
        membership.stripeSubscriptionId,
        accountId
      );

      await tx.membership.update({
        data: {
          stripeSubscriptionId: null
        },
        where: { id: membershipId }
      });
      logger.info(
        `updated membership with id ${membershipId} to set subscriptionId to null and cancelled stripe subscription ${membership.stripeSubscriptionId}`
      );
    } catch (e) {
      logger.error(
        e,
        `failed to cancel stripe subscription for membership with id ${membershipId}`
      );
      throw e;
    }
  }

  async function updateSubscription(
    membershipId: bigint,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    try {
      const membership = await tx.membership.findUniqueOrThrow({
        select: {
          stripeSubscriptionId: true,
          membershipTier: {
            select: {
              costPerBillingInterval: true,
              stripePriceId: true,
              initiationFeeStripePriceId: true
            }
          }
        },
        where: { id: membershipId }
      });

      if (isPrismaResultDefaultFreeTier(membership.membershipTier)) {
        throw new Error(
          `cannot update subscription to free tier for membership ${membershipId}`
        );
      }

      if (!membership.stripeSubscriptionId) {
        throw new Error(
          `membership with id ${membershipId} does not have stripeSubscriptionId`
        );
      }

      if (!membership.membershipTier.stripePriceId) {
        throw new Error(
          `membership tier for membership ${membershipId} does not have stripePriceId`
        );
      }

      const accountId = await accountIdResolver.fromMembership(membershipId);

      await stripeClient.updateSubscription(
        {
          subscriptionId: membership.stripeSubscriptionId,
          newPriceId: membership.membershipTier.stripePriceId,
          newInitiationFeePriceId:
            membership.membershipTier.initiationFeeStripePriceId
        },
        accountId
      );

      logger.info(
        `updated stripe subscription ${membership.stripeSubscriptionId} for membership with id ${membershipId}`
      );
      return;
    } catch (e) {
      logger.error(
        e,
        `failed to update stripe subscription for membership with id ${membershipId}`
      );
      throw e;
    }
  }

  async function createProductAndPricesForMembershipTier(
    input: CreateProductAndPricesForMembershipTierInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    try {
      const membershipTier = await tx.membershipTier.findUniqueOrThrow({
        where: { id: input.membershipTierId },
        select: {
          costPerBillingInterval: true
        }
      });

      // free tier does not require Stripe product and prices
      if (isPrismaResultDefaultFreeTier(membershipTier)) {
        logger.info(
          `membership tier with id ${input.membershipTierId} is free tier, no Stripe products needed`
        );
        return;
      }

      const accountId = await accountIdResolver.fromMembershipTierInTransaction(
        input.membershipTierId,
        tx
      );

      const { productId, priceId, initiationFeePriceId } =
        await stripeClient.createProductAndPricesForMembershipTier(
          {
            name: input.name,
            description: input.description ?? undefined,
            pricePerBillingInterval: input.pricePerBillingInterval,
            billingInterval: input.billingInterval,
            initiationFeeInUSD: input.initiationFeeInUSD,
            membershipTierId: input.membershipTierId
          },
          accountId
        );

      await tx.membershipTier.update({
        where: { id: input.membershipTierId },
        data: {
          stripeProductId: productId,
          stripePriceId: priceId,
          initiationFeeStripePriceId: initiationFeePriceId
        }
      });

      logger.info(
        `created stripe product and prices for membership tier with id ${input.membershipTierId}`
      );
    } catch (e) {
      logger.error(
        e,
        `failed to create stripe product and prices for membership tier with id ${input.membershipTierId}`
      );
      throw e;
    }
  }

  async function archiveProductAndPricesForMembershipTier(
    membershipTierId: number,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    try {
      const membershipTier = await tx.membershipTier.findUniqueOrThrow({
        select: {
          costPerBillingInterval: true,
          stripeProductId: true,
          stripePriceId: true,
          initiationFeeStripePriceId: true
        },
        where: { id: membershipTierId }
      });

      // free tier does not need to archive product
      if (isPrismaResultDefaultFreeTier(membershipTier)) {
        logger.info(
          `membership tier with id ${membershipTierId} is free tier, no Stripe products to archive`
        );
        return;
      }

      if (!membershipTier.stripeProductId || !membershipTier.stripePriceId) {
        // unexpected and we should look into but since it is non-actionable and doesn't result in bad state,
        // we should not block
        logger.error(
          `membership tier with id ${membershipTierId} requires stripeProductId and stripePriceId to be archived`
        );
        return;
      }

      const accountId = await accountIdResolver.fromMembershipTierInTransaction(
        membershipTierId,
        tx
      );

      await stripeClient.archiveProductAndPricesForMembershipTier(
        {
          productId: membershipTier.stripeProductId,
          priceIds: asNullFilteredList(
            membershipTier.stripePriceId,
            membershipTier.initiationFeeStripePriceId
          )
        },
        accountId
      );

      logger.info(
        `archived stripe product ${membershipTier.stripeProductId} for membership tier with id ${membershipTierId}`
      );
    } catch (e) {
      logger.error(
        e,
        `failed to archive stripe product and prices for membership tier with id ${membershipTierId}`
      );
      throw e;
    }
  }

  async function publishProductAndPricesForMembershipTier(
    membershipTierId: number,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    try {
      const membershipTier = await tx.membershipTier.findUniqueOrThrow({
        select: {
          costPerBillingInterval: true,
          stripeProductId: true,
          stripePriceId: true,
          initiationFeeStripePriceId: true
        },
        where: { id: membershipTierId }
      });

      // free tier does not need to publish product
      if (isPrismaResultDefaultFreeTier(membershipTier)) {
        logger.info(
          `membership tier with id ${membershipTierId} is free tier, no Stripe products to publish`
        );
        return;
      }

      if (!membershipTier.stripeProductId || !membershipTier.stripePriceId) {
        throw new Error(
          `membership tier with id ${membershipTierId} requires stripeProductId and stripePriceId to be published`
        );
      }

      const accountId = await accountIdResolver.fromMembershipTierInTransaction(
        membershipTierId,
        tx
      );

      await stripeClient.publishProductAndPricesForMembershipTier(
        {
          productId: membershipTier.stripeProductId,
          priceIds: asNullFilteredList(
            membershipTier.stripePriceId,
            membershipTier.initiationFeeStripePriceId
          )
        },
        accountId
      );

      logger.info(
        `published stripe product ${membershipTier.stripeProductId} for membership tier with id ${membershipTierId}`
      );
    } catch (e) {
      logger.error(
        e,
        `failed to publish stripe product and prices for membership tier with id ${membershipTierId}`
      );
      throw e;
    }
  }

  async function updateProductAndPricesForMembershipTier(
    input: UpdateProductAndPricesForMembershipTierInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    try {
      const membershipTier = await tx.membershipTier.findUniqueOrThrow({
        where: { id: input.membershipTierId },
        select: {
          stripeProductId: true,
          stripePriceId: true,
          initiationFeeStripePriceId: true,
          costPerBillingInterval: true
        }
      });

      // free tier does not require Stripe product and prices
      if (isPrismaResultDefaultFreeTier(membershipTier)) {
        logger.info(
          `membership tier with id ${input.membershipTierId} is free tier, no Stripe products to update`
        );
        return;
      }

      if (!membershipTier.stripeProductId) {
        throw new Error(
          `membership tier with id ${input.membershipTierId} requires stripeProductId to be updated`
        );
      }
      if (!membershipTier.stripePriceId) {
        throw new Error(
          `membership tier with id ${input.membershipTierId} requires stripePriceId to be updated`
        );
      }

      const accountId = await accountIdResolver.fromMembershipTierInTransaction(
        input.membershipTierId,
        tx
      );

      const { updatedPriceId, updatedInitiationFeePriceId } =
        await stripeClient.updateProductAndPricesForMembershipTier(
          {
            productId: membershipTier.stripeProductId,
            name: input.name,
            description: input.description,
            priceId: membershipTier.stripePriceId,
            pricePerBillingInterval: input.pricePerBillingInterval,
            billingInterval: input.billingInterval,
            initiationFee: {
              priceId: membershipTier.initiationFeeStripePriceId,
              priceInUSD: input.initiationFeeInUSD
            }
          },
          accountId
        );

      // only update price ids if they have changed
      if (!!updatedPriceId) {
        await tx.membershipTier.update({
          where: { id: input.membershipTierId },
          data: { stripePriceId: updatedPriceId }
        });
        logger.info(
          `updated membership tier with id ${input.membershipTierId} with stripePriceId ${updatedPriceId}`
        );
      }
      if (!!updatedInitiationFeePriceId) {
        await tx.membershipTier.update({
          where: { id: input.membershipTierId },
          data: {
            initiationFeeStripePriceId:
              updatedInitiationFeePriceId.updatedPriceId
          }
        });
        logger.info(
          `updated membership tier with id ${input.membershipTierId} with initiationFeeStripePriceId ${updatedInitiationFeePriceId.updatedPriceId}`
        );
      }
    } catch (e) {
      logger.error(
        e,
        `failed to update stripe product and prices for membership tier with id ${input.membershipTierId}`
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
    createCustomerForMembership,
    createSubscriptionForMembership,
    cancelSubscription,
    updateSubscription,
    createProductAndPricesForMembershipTier,
    archiveProductAndPricesForMembershipTier,
    publishProductAndPricesForMembershipTier,
    updateProductAndPricesForMembershipTier
  };
}
