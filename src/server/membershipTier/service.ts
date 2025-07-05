import { Prisma, type PrismaClient } from "@prisma/client";
import { rootLogger } from "~/logger";
import { stringify } from "~/utils";
import { DEFAULT_FREE_MEMBERSHIP_TIER_V2 } from "~/server/utils/defaults";
import {
  CreateMembershipTierInputV2,
  MembershipTierService,
  UpdateMembershipTierInput,
  UpdateMembershipTierInputV2
} from "~/server/membershipTier/types";
import { MutationResult, NO_ID_MUTATION_RESULT } from "~/server/utils/types";
import { 
  isPrismaResultDefaultFreeTierV2
} from "~/server/membershipTier/utils";
import { PaymentService } from "~/server/payments/types";

const logger = rootLogger.child({ module: "membershipTierService" });

export function createMembershipTierService(
  prisma: PrismaClient,
  paymentService: PaymentService
): MembershipTierService {
  async function createMembershipTierV2(
    clubId: number,
    input: CreateMembershipTierInputV2
  ): Promise<MutationResult> {
    return prisma.$transaction(async (tx) => {
      return createMembershipTierV2InTransaction(clubId, input, tx);
    });
  }

  async function createMembershipTierV2InTransaction(
    clubId: number,
    input: CreateMembershipTierInputV2,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    try {
      const { id } = await tx.membershipTier.create({
        data: {
          clubId: clubId,
          // default
          status: "PUBLISHED",
          // temporary:"Pass 0" strategy for V1 compatibility
          costPerMonthInUSD: 0,
          ...input
        },
        select: {
          id: true
        }
      });

      await createStripeProductAndPricesV2(id, input, tx);

      logger.info(
        `created V2 membership tier from input ${stringify(input)} with id ${id}`
      );
      return { createdEntityId: id };
    } catch (e) {
      logger.error(
        e,
        `failed to create V2 membership tier from input ${stringify(input)}`
      );
      throw e;
    }
  }

  async function createStripeProductAndPricesV2(
    membershipTierId: number,
    input: CreateMembershipTierInputV2,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    try {
      const { productId, priceId, initiationFeePriceId } =
        await paymentService.createProductAndPricesForMembershipTierV2(
          {
            name: input.name,
            description: input.benefitDescription,
            pricePerBillingInterval: input.costPerBillingInterval,
            billingInterval: input.billingInterval,
            initiationFeeInUSD: input.initiationFeeCostInUSD,
            membershipTierId: membershipTierId
          },
          tx
        );

      // Only update the database if products were created (not null for free tier)
      if (productId && priceId) {
        await tx.membershipTier.update({
          where: { id: membershipTierId },
          data: {
            stripeProductId: productId,
            stripePriceId: priceId,
            initiationFeeStripePriceId: initiationFeePriceId
          }
        });
        logger.info(
          `updated V2 membership tier with id ${membershipTierId} with stripeProductId ${productId}, stripePriceId ${priceId}, and initiationFeeStripePriceId ${initiationFeePriceId}`
        );
      }
    } catch (e) {
      logger.error(
        e,
        `failed to create stripe product and prices for V2 membership tier with id ${membershipTierId}`
      );
      throw e;
    }
  }
  
  async function createDefaultFreeMembershipTier(
    clubId: number,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    return createMembershipTierV2InTransaction(
      clubId,
      DEFAULT_FREE_MEMBERSHIP_TIER_V2,
      tx
    );
  }

  async function hasActiveMembersOrPendingApplicationsOnMembershipTier(
    membershipTierId: number
  ) {
    try {
      const count = await prisma.membership.count({
        where: {
          membershipTierId: membershipTierId,
          status: { in: ["ACTIVE", "PENDING"] }
        }
      });
      logger.info(
        `queried active membership and pending application count ${count} for membership tier with id ${membershipTierId}`
      );
      return count > 0;
    } catch (e) {
      logger.error(
        e,
        `failed to query active membership and pending application for membership tier with id ${membershipTierId}`
      );
      throw e;
    }
  }

  async function isDefaultFreeTierByIdV2(
    membershipTierId: number
  ): Promise<boolean> {
    try {
      const membershipTier = await prisma.membershipTier.findUniqueOrThrow({
        where: { id: membershipTierId },
        select: { costPerMonthInUSD: true, costPerBillingInterval: true }
      });
      logger.info(
        `checked if membership tier with id ${membershipTierId} is V2 free tier with result ${isPrismaResultDefaultFreeTierV2(membershipTier)}`
      );
      return isPrismaResultDefaultFreeTierV2(membershipTier);
    } catch (e) {
      logger.error(
        e,
        `failed to check if membership tier with id ${membershipTierId} is V2 free tier`
      );
      throw e;
    }
  }

  async function checkIsNotDefaultFreeMembershipTier(membershipTierId: number) {
    if (await isDefaultFreeTierByIdV2(membershipTierId)) {
      throw new Error("cannot delete default free membership tier");
    }
  }

  async function checkIsNotDefaultFreeMembershipTierAndUpdatingCostV2(
    membershipTierId: number,
    input: UpdateMembershipTierInputV2
  ) {
    if (
      (await isDefaultFreeTierByIdV2(membershipTierId)) &&
      input.costPerBillingInterval !== 0
    ) {
      throw new Error(
        "cannot update cost of default free membership tier to non-zero value"
      );
    }
  }

  async function checkIsNotUpdatingMembershipTierToZeroCostV2(
    membershipTierId: number,
    input: UpdateMembershipTierInputV2
  ) {
    if (
      !(await isDefaultFreeTierByIdV2(membershipTierId)) &&
      input.costPerBillingInterval === 0
    ) {
      throw new Error("cannot update cost of membership tier to zero value");
    }
  }

  async function isUpdateOnCostPerBillingIntervalV2(
    membershipTierId: number,
    input: UpdateMembershipTierInputV2
  ): Promise<boolean> {
    try {
      const membershipTier = await prisma.membershipTier.findUniqueOrThrow({
        where: { id: membershipTierId },
        select: { costPerBillingInterval: true, costPerMonthInUSD: true, billingInterval: true }
      });

      const currentCost = membershipTier.costPerBillingInterval !== null 
        ? membershipTier.costPerBillingInterval.toNumber()
        : membershipTier.costPerMonthInUSD.toNumber();
      
      const currentInterval = membershipTier.billingInterval;

      logger.info(
        `queried V2 cost and interval for membership tier with id ${membershipTierId} with result cost=${currentCost}, interval=${currentInterval}`
      );
      
      return (
        currentCost !== input.costPerBillingInterval ||
        currentInterval !== input.billingInterval
      );
    } catch (e) {
      logger.error(
        e,
        `failed to query V2 cost and interval for membership tier with id ${membershipTierId}`
      );
      throw e;
    }
  }

  async function checkNotUpdatingCostPerBillingIntervalWithActiveOrPendingApplicationsOnMembershipTierV2(
    membershipTierId: number,
    input: UpdateMembershipTierInputV2
  ): Promise<void> {
    const updatingCost = await isUpdateOnCostPerBillingIntervalV2(
      membershipTierId,
      input
    );
    const hasActiveMembersOrPendingApplications =
      await hasActiveMembersOrPendingApplicationsOnMembershipTier(
        membershipTierId
      );
    if (updatingCost && hasActiveMembersOrPendingApplications) {
      throw new Error(
        "cannot update cost of membership tier if there are active members or pending applications"
      );
    }
  }

  async function isUpdateOnInitiationFeeInUSD(
    membershipTierId: number,
    input: UpdateMembershipTierInput
  ): Promise<boolean> {
    try {
      const membershipTier = await prisma.membershipTier.findUniqueOrThrow({
        where: { id: membershipTierId },
        select: { initiationFeeCostInUSD: true }
      });

      const initiationFeeCostInUSD =
        null === membershipTier.initiationFeeCostInUSD
          ? null
          : membershipTier.initiationFeeCostInUSD.toNumber();

      logger.info(
        `queried initiationFeeCostInUSD for membership tier with id ${membershipTierId} with result ${initiationFeeCostInUSD}`
      );
      return initiationFeeCostInUSD !== input.initiationFeeCostInUSD;
    } catch (e) {
      logger.error(
        e,
        `failed to query initiationFeeCostInUSD for membership tier with id ${membershipTierId}`
      );
      throw e;
    }
  }

  async function hasPendingApplicationsOnMembershipTier(
    membershipTierId: number
  ) {
    try {
      const count = await prisma.membership.count({
        where: {
          membershipTierId: membershipTierId,
          status: { in: ["PENDING"] }
        }
      });
      logger.info(
        `queried pending application count ${count} for membership tier with id ${membershipTierId}`
      );
      return count > 0;
    } catch (e) {
      logger.error(
        e,
        `failed to query pending application for membership tier with id ${membershipTierId}`
      );
      throw e;
    }
  }

  async function checkNotUpdatingInitiationFeeCostInUSDWithPendingApplicationsOnMembershipTier(
    membershipTierId: number,
    input: UpdateMembershipTierInput
  ): Promise<void> {
    const updatingInitiationFee = await isUpdateOnInitiationFeeInUSD(
      membershipTierId,
      input
    );
    const hasPendingApplications =
      await hasPendingApplicationsOnMembershipTier(membershipTierId);
    if (updatingInitiationFee && hasPendingApplications) {
      throw new Error(
        "cannot update initiation fee cost of membership tier if there are pending applications"
      );
    }
  }

  async function updateMembershipTierV2(
    id: number,
    input: UpdateMembershipTierInputV2
  ): Promise<MutationResult> {
    await checkNotUpdatingCostPerBillingIntervalWithActiveOrPendingApplicationsOnMembershipTierV2(
      id,
      input
    );
    // Initiation fee validation is the same for V1 and V2, so we create a compatible input
    await checkNotUpdatingInitiationFeeCostInUSDWithPendingApplicationsOnMembershipTier(
      id,
      { ...input, costPerMonthInUSD: 0 } // Add required V1 field for validation
    );
    await checkIsNotDefaultFreeMembershipTierAndUpdatingCostV2(id, input);
    await checkIsNotUpdatingMembershipTierToZeroCostV2(id, input);

    return prisma.$transaction(async (tx) => {
      return updateMembershipTierV2InTransaction(id, input, tx);
    });
  }

  async function updateMembershipTierV2InTransaction(
    id: number,
    input: UpdateMembershipTierInputV2,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    try {
      await tx.membershipTier.update({
        data: {
          // "Pass 0" strategy for V1 compatibility
          costPerMonthInUSD: 0,
          ...input
        },
        where: {
          id: id
        }
      });

      await updateStripeProductAndPricesV2(id, input, tx);

      logger.info(
        `updated V2 membership tier with id ${id} from input ${stringify(input)}`
      );
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        e,
        `failed to update V2 membership tier with id ${id} from input ${stringify(input)}`
      );
      throw e;
    }
  }

  async function updateStripeProductAndPricesV2(
    membershipTierId: number,
    input: UpdateMembershipTierInputV2,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    try {
      const { updatedPriceId, updatedInitiationFeePriceId } =
        await paymentService.updateProductAndPricesForMembershipTierV2(
          {
            name: input.name,
            description: input.benefitDescription,
            pricePerBillingInterval: input.costPerBillingInterval,
            billingInterval: input.billingInterval,
            initiationFeeInUSD: input.initiationFeeCostInUSD,
            membershipTierId: membershipTierId
          },
          tx
        );

      // only update price ids if they have changed
      if (!!updatedPriceId) {
        await tx.membershipTier.update({
          where: { id: membershipTierId },
          data: { stripePriceId: updatedPriceId }
        });
        logger.info(
          `updated V2 membership tier with id ${membershipTierId} with stripePriceId ${updatedPriceId}`
        );
      }
      if (!!updatedInitiationFeePriceId) {
        await tx.membershipTier.update({
          where: { id: membershipTierId },
          data: {
            initiationFeeStripePriceId:
              updatedInitiationFeePriceId.updatedPriceId
          }
        });
        logger.info(
          `updated V2 membership tier with id ${membershipTierId} with initiationFeeStripePriceId ${updatedInitiationFeePriceId.updatedPriceId}`
        );
      }
    } catch (e) {
      logger.error(
        e,
        `failed to update stripe product and prices for V2 membership tier with id ${membershipTierId}`
      );
      throw e;
    }
  }

  async function checkNoActiveMembersOrPendingApplicationsOnMembershipTier(
    membershipTierId: number
  ): Promise<void> {
    if (
      await hasActiveMembersOrPendingApplicationsOnMembershipTier(
        membershipTierId
      )
    ) {
      throw new Error(
        "cannot update membership tier if there are active members or pending applications"
      );
    }
  }

  async function deleteMembershipTier(id: number): Promise<MutationResult> {
    await checkNoActiveMembersOrPendingApplicationsOnMembershipTier(id);
    await checkIsNotDefaultFreeMembershipTier(id);
    if (await isMembershipTierLastPublishedTier(id)) {
      throw new Error("cannot delete last published membership tier");
    }

    return prisma.$transaction(async (tx) => {
      return deleteMembershipTierInTransaction(id, tx);
    });
  }

  async function deleteMembershipTierInTransaction(
    id: number,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    try {
      await archiveStripeProductAndPrices(id, tx);

      await tx.membershipTier.delete({
        where: {
          id: id
        }
      });

      logger.info(`deleted membership tier with id ${id}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(e, `failed to delete membership tier with id ${id}`);
      throw e;
    }
  }

  async function archiveStripeProductAndPrices(
    membershipTierId: number,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    try {
      await paymentService.archiveProductAndPricesForMembershipTier(
        membershipTierId,
        tx
      );
    } catch (e) {
      logger.error(
        e,
        `failed to archive stripe product and prices for membership tier with id ${membershipTierId}`
      );
      throw e;
    }
  }

  async function isMembershipTierPublished(
    membershipTierId: number
  ): Promise<boolean> {
    try {
      const membershipTier = await prisma.membershipTier.findUniqueOrThrow({
        select: {
          status: true
        },
        where: {
          id: membershipTierId
        }
      });
      logger.info(
        `queried status ${membershipTier.status} for membership tier with id ${membershipTierId}`
      );
      return membershipTier.status === "PUBLISHED";
    } catch (e) {
      logger.error(
        e,
        `failed to query status for membership tier with id ${membershipTierId}`
      );
      throw e;
    }
  }

  async function publishMembershipTier(id: number): Promise<MutationResult> {
    if (await isMembershipTierPublished(id)) {
      throw new Error("Cannot publish an already published membership tier.");
    }

    return prisma.$transaction(async (tx) => {
      return publishMembershipTierInTransaction(id, tx);
    });
  }

  async function publishMembershipTierInTransaction(
    id: number,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    try {
      await tx.membershipTier.update({
        data: { status: "PUBLISHED" },
        where: {
          id: id
        }
      });

      await publishStripeProductAndPrices(id, tx);

      logger.info(`published membership tier with id ${id}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(e, `failed to publish membership tier with id ${id}`);
      throw e;
    }
  }

  async function publishStripeProductAndPrices(
    membershipTierId: number,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    try {
      await paymentService.publishProductAndPricesForMembershipTier(
        membershipTierId,
        tx
      );
    } catch (e) {
      logger.error(
        e,
        `failed to publish stripe product and prices for membership tier with id ${membershipTierId}`
      );
      throw e;
    }
  }

  async function isMembershipTierLastPublishedTier(membershipTierId: number) {
    try {
      const allPublishedMembershipTiers = await prisma.membershipTier.findMany({
        where: { status: "PUBLISHED" }
      });
      logger.info(
        `queried all published membership tiers with result ${stringify(allPublishedMembershipTiers)}`
      );
      return (
        allPublishedMembershipTiers.length === 1 &&
        allPublishedMembershipTiers[0]!.id === membershipTierId
      );
    } catch (e) {
      logger.error(e, `failed to query all published membership tiers`);
      throw e;
    }
  }

  async function unpublishMembershipTier(id: number): Promise<MutationResult> {
    if (!(await isMembershipTierPublished(id))) {
      throw new Error(
        "cannot unpublish an already unpublished membership tier"
      );
    }
    if (await isMembershipTierLastPublishedTier(id)) {
      throw new Error("cannot unpublish last published membership tier");
    }

    return prisma.$transaction(async (tx) => {
      return unpublishMembershipTierInTransaction(id, tx);
    });
  }

  async function unpublishMembershipTierInTransaction(
    id: number,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    try {
      await tx.membershipTier.update({
        data: { status: "UNPUBLISHED" },
        where: {
          id: id
        }
      });

      await archiveStripeProductAndPrices(id, tx);

      logger.info(`unpublished membership tier with id ${id}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(e, `failed to unpublish membership tier with id ${id}`);
      throw e;
    }
  }

  async function getClubIdFromMembershipTierId(
    membershipTierId: number
  ): Promise<number> {
    try {
      const membershipTier = await prisma.membershipTier.findUniqueOrThrow({
        select: { clubId: true },
        where: { id: membershipTierId }
      });
      logger.info(
        `queried clubId for membership tier with membershipTierId ${membershipTierId} with result ${membershipTier.clubId}`
      );
      return membershipTier.clubId;
    } catch (e) {
      logger.error(
        e,
        `failed to query clubId for membership tier with membershipTierId ${membershipTierId}`
      );
      throw e;
    }
  }

  // @ts-expect-error - Temporary during V1 removal, fixed in Step 2
  return {
    isMembershipTierPublished,
    isDefaultFreeTierById: isDefaultFreeTierByIdV2, // Temporary alias until Step 2
    isDefaultFreeTierByIdV2,
    getClubIdFromMembershipTierId,
    createMembershipTierV2,
    updateMembershipTierV2,
    deleteMembershipTier,
    publishMembershipTier,
    unpublishMembershipTier,
    createDefaultFreeMembershipTier
  };
}
