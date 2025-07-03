import { Prisma, type PrismaClient } from "@prisma/client";
import { rootLogger } from "~/logger";
import { stringify } from "~/utils";
import { DEFAULT_FREE_MEMBERSHIP_TIER } from "~/server/utils/defaults";
import {
  CreateMembershipTierInput,
  CreateMembershipTierInputV2,
  MembershipTierService,
  UpdateMembershipTierInput,
  UpdateMembershipTierInputV2
} from "~/server/membershipTier/types";
import { MutationResult, NO_ID_MUTATION_RESULT } from "~/server/utils/types";
import { isPrismaResultDefaultFreeTier } from "~/server/membershipTier/utils";
import { PaymentService } from "~/server/payments/types";

const logger = rootLogger.child({ module: "membershipTierService" });

export function createMembershipTierService(
  prisma: PrismaClient,
  paymentService: PaymentService
): MembershipTierService {
  async function createMembershipTier(
    clubId: number,
    input: CreateMembershipTierInput
  ): Promise<MutationResult> {
    return prisma.$transaction(async (tx) => {
      return createMembershipTierInTransaction(clubId, input, tx);
    });
  }

  async function createMembershipTierInTransaction(
    clubId: number,
    input: CreateMembershipTierInput,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    try {
      const { id } = await tx.membershipTier.create({
        data: {
          clubId: clubId,
          // default
          status: "PUBLISHED",
          ...input
        },
        select: {
          id: true
        }
      });

      await createStripeProductAndPrices(id, input, tx);

      logger.info(
        `created membership tier from input ${stringify(input)} with id ${id}`
      );
      return { createdEntityId: id };
    } catch (e) {
      logger.error(
        e,
        `failed to create membership tier from input ${stringify(input)}`
      );
      throw e;
    }
  }

  async function createStripeProductAndPrices(
    membershipTierId: number,
    input: CreateMembershipTierInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    try {
      const { productId, priceId, initiationFeePriceId } =
        await paymentService.createProductAndPricesForMembershipTier(
          {
            name: input.name,
            description: input.benefitDescription,
            pricePerMonthInUSD: input.costPerMonthInUSD,
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
          `updated membership tier with id ${membershipTierId} with stripeProductId ${productId}, stripePriceId ${priceId}, and initiationFeeStripePriceId ${initiationFeePriceId}`
        );
      }
    } catch (e) {
      logger.error(
        e,
        `failed to create stripe product and prices for membership tier with id ${membershipTierId}`
      );
      throw e;
    }
  }

  // TODO: Implement in future commits
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function createMembershipTierV2(
    _clubId: number,
    _input: CreateMembershipTierInputV2
  ): Promise<MutationResult> {
    void _clubId;
    void _input;
    throw new Error("createMembershipTierV2 not yet implemented");
  }
  
  async function createDefaultFreeMembershipTier(
    clubId: number,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    return createMembershipTierInTransaction(
      clubId,
      DEFAULT_FREE_MEMBERSHIP_TIER,
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

  async function isDefaultFreeTierById(
    membershipTierId: number
  ): Promise<boolean> {
    try {
      const membershipTier = await prisma.membershipTier.findUniqueOrThrow({
        where: { id: membershipTierId },
        select: { costPerMonthInUSD: true }
      });
      logger.info(
        `checked if membership tier with id ${membershipTierId} is free tier with result ${isPrismaResultDefaultFreeTier(membershipTier)}`
      );
      return isPrismaResultDefaultFreeTier(membershipTier);
    } catch (e) {
      logger.error(
        e,
        `failed to check if membership tier with id ${membershipTierId} is free tier`
      );
      throw e;
    }
  }

  async function checkIsNotDefaultFreeMembershipTier(membershipTierId: number) {
    if (await isDefaultFreeTierById(membershipTierId)) {
      throw new Error("cannot delete default free membership tier");
    }
  }

  async function checkIsNotDefaultFreeMembershipTierAndUpdatingCost(
    membershipTierId: number,
    input: UpdateMembershipTierInput
  ) {
    if (
      (await isDefaultFreeTierById(membershipTierId)) &&
      input.costPerMonthInUSD !== 0
    ) {
      throw new Error(
        "cannot update cost of default free membership tier to non-zero value"
      );
    }
  }

  async function checkIsNotUpdatingMembershipTierToZeroCost(
    membershipTierId: number,
    input: UpdateMembershipTierInput
  ) {
    if (
      !(await isDefaultFreeTierById(membershipTierId)) &&
      input.costPerMonthInUSD === 0
    ) {
      throw new Error("cannot update cost of membership tier to zero value");
    }
  }

  async function isUpdateOnCostPerMonthInUSD(
    membershipTierId: number,
    input: UpdateMembershipTierInput
  ): Promise<boolean> {
    try {
      const membershipTier = await prisma.membershipTier.findUniqueOrThrow({
        where: { id: membershipTierId },
        select: { costPerMonthInUSD: true }
      });

      logger.info(
        `queried costPerMonthInUSD for membership tier with id ${membershipTierId} with result ${membershipTier.costPerMonthInUSD.toNumber()}`
      );
      return (
        membershipTier.costPerMonthInUSD.toNumber() !== input.costPerMonthInUSD
      );
    } catch (e) {
      logger.error(
        e,
        `failed to query costPerMonthInUSD for membership tier with id ${membershipTierId}`
      );
      throw e;
    }
  }

  async function checkNotUpdatingCostPerMonthInUSDWithActiveOrPendingApplicationsOnMembershipTier(
    membershipTierId: number,
    input: UpdateMembershipTierInput
  ): Promise<void> {
    const updatingCost = await isUpdateOnCostPerMonthInUSD(
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

  async function updateMembershipTier(
    id: number,
    input: UpdateMembershipTierInput
  ): Promise<MutationResult> {
    await checkNotUpdatingCostPerMonthInUSDWithActiveOrPendingApplicationsOnMembershipTier(
      id,
      input
    );
    await checkNotUpdatingInitiationFeeCostInUSDWithPendingApplicationsOnMembershipTier(
      id,
      input
    );
    await checkIsNotDefaultFreeMembershipTierAndUpdatingCost(id, input);
    await checkIsNotUpdatingMembershipTierToZeroCost(id, input);

    return prisma.$transaction(async (tx) => {
      return updateMembershipTierInTransaction(id, input, tx);
    });
  }

  async function updateMembershipTierInTransaction(
    id: number,
    input: UpdateMembershipTierInput,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    try {
      await tx.membershipTier.update({
        data: input,
        where: {
          id: id
        }
      });

      await updateStripeProductAndPrices(id, input, tx);

      logger.info(
        `updated membership tier with id ${id} from input ${stringify(input)}`
      );
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        e,
        `failed to update membership tier with id ${id} from input ${stringify(input)}`
      );
      throw e;
    }
  }

  async function updateStripeProductAndPrices(
    membershipTierId: number,
    input: UpdateMembershipTierInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    try {
      const { updatedPriceId, updatedInitiationFeePriceId } =
        await paymentService.updateProductAndPricesForMembershipTier(
          {
            name: input.name,
            description: input.benefitDescription,
            pricePerMonthInUSD: input.costPerMonthInUSD,
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
          `updated membership tier with id ${membershipTierId} with stripePriceId ${updatedPriceId}`
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
          `updated membership tier with id ${membershipTierId} with initiationFeeStripePriceId ${updatedInitiationFeePriceId.updatedPriceId}`
        );
      }
    } catch (e) {
      logger.error(
        e,
        `failed to update stripe product and prices for membership tier with id ${membershipTierId}`
      );
      throw e;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function updateMembershipTierV2(
    _id: number,
    _input: UpdateMembershipTierInputV2
  ): Promise<MutationResult> {
    void _id;
    void _input;
    throw new Error("updateMembershipTierV2 not yet implemented");
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

  return {
    isMembershipTierPublished,
    isDefaultFreeTierById,
    getClubIdFromMembershipTierId,
    createMembershipTier,
    createMembershipTierV2,
    updateMembershipTier,
    updateMembershipTierV2,
    deleteMembershipTier,
    publishMembershipTier,
    unpublishMembershipTier,
    createDefaultFreeMembershipTier
  };
}
