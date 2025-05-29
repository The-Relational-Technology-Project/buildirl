import { Prisma, type PrismaClient } from "@prisma/client";
import { rootLogger } from "~/logger";
import { asNullFilteredList, stringify } from "~/utils";
import { isDefaultFreeTier } from "~/utils/types";
import {
  StripeClient,
  UpsertNullablePriceInput
} from "~/server/payments/stripe/types";
import { DEFAULT_FREE_MEMBERSHIP_TIER } from "~/server/utils/defaults";
import { AccountIdResolver } from "~/server/payments/accountIdResolver";
import {
  CreateMembershipTierInput,
  MembershipTierService,
  UpdateMembershipTierInput
} from "~/server/membershipTier/types";
import { MutationResult, NO_ID_MUTATION_RESULT } from "~/server/utils/types";
import Decimal = Prisma.Decimal;
import { Maybe } from "~/utils/types";
import { isPrismaResultDefaultFreeTier } from "~/server/membershipTier/utils";

const logger = rootLogger.child({ module: "membershipTierService" });

export function createMembershipTierService(
  prisma: PrismaClient,
  stripeClient: StripeClient,
  accountIdResolver: AccountIdResolver
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
    if (isDefaultFreeTier(input)) {
      return;
    }

    const accountId = await accountIdResolver.fromMembershipTierInTransaction(
      membershipTierId,
      tx
    );

    const { productId, priceId, initiationFeePriceId } =
      await stripeClient.createProductAndPricesForMembershipTier(
        {
          name: input.name,
          description: input.benefitDescription,
          pricePerMonthInUSD: input.costPerMonthInUSD,
          initiationFeeInUSD: input.initiationFeeCostInUSD,
          membershipTierId: membershipTierId
        },
        accountId
      );

    try {
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
    } catch (e) {
      logger.error(
        e,
        `failed to update membership tier with id ${membershipTierId} with stripeProductId ${productId}, stripePriceId ${priceId}, and initiationFeeStripePriceId ${initiationFeePriceId}`
      );
      throw e;
    }
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

  async function isDefaultFreeTierById(membershipTierId: number) {
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

  function asUpdateInitiationFeePriceInput(
    initiationFeeStripePriceId: Maybe<string>,
    initiationFeeCostInUSD: Maybe<Decimal>
  ): UpsertNullablePriceInput {
    return {
      priceId: initiationFeeStripePriceId,
      priceInUSD:
        null === initiationFeeCostInUSD
          ? null
          : initiationFeeCostInUSD.toNumber()
    };
  }

  async function updateStripeProductAndPrices(
    membershipTierId: number,
    input: UpdateMembershipTierInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    if (isDefaultFreeTier(input)) {
      return;
    }

    const membershipTier = await tx.membershipTier.findUniqueOrThrow({
      where: { id: membershipTierId },
      select: {
        stripeProductId: true,
        stripePriceId: true,
        initiationFeeStripePriceId: true,
        initiationFeeCostInUSD: true
      }
    });

    if (!membershipTier.stripeProductId) {
      throw new Error(
        `membership tier with id ${membershipTierId} requires stripeProductId to be updated`
      );
    }
    if (!membershipTier.stripePriceId) {
      throw new Error(
        `membership tier with id ${membershipTierId} requires stripePriceId to be updated`
      );
    }

    const accountId = await accountIdResolver.fromMembershipTierInTransaction(
      membershipTierId,
      tx
    );

    const { updatedPriceId, updatedInitiationFeePriceId } =
      await stripeClient.updateProductAndPricesForMembershipTier(
        {
          productId: membershipTier.stripeProductId,
          name: input.name,
          description: input.benefitDescription,
          priceId: membershipTier.stripePriceId,
          pricePerMonthInUSD: input.costPerMonthInUSD,
          initiationFee: asUpdateInitiationFeePriceInput(
            membershipTier.initiationFeeStripePriceId,
            membershipTier.initiationFeeCostInUSD
          )
        },
        accountId
      );

    if (!!updatedPriceId) {
      try {
        await tx.membershipTier.update({
          where: { id: membershipTierId },
          data: { stripePriceId: updatedPriceId }
        });
        logger.info(
          `updated membership tier with id ${membershipTierId} with stripePriceId ${updatedPriceId}`
        );
      } catch (e) {
        logger.error(
          e,
          `failed to update membership tier with id ${membershipTierId} with stripePriceId ${updatedPriceId}`
        );
        throw e;
      }
    }
    if (!!updatedInitiationFeePriceId) {
      try {
        await tx.membershipTier.update({
          where: { id: membershipTierId },
          data: {
            initiationFeeStripePriceId:
              updatedInitiationFeePriceId.updatedPriceId
          }
        });
        logger.info(
          `updated membership tier with id ${membershipTierId} with initiationFeeStripePriceId ${updatedPriceId}`
        );
      } catch (e) {
        logger.error(
          e,
          `failed to update membership tier with id ${membershipTierId} with initiationFeeStripePriceId ${updatedPriceId}`
        );
        throw e;
      }
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
    const membershipTier = await tx.membershipTier.findUniqueOrThrow({
      select: {
        stripeProductId: true,
        stripePriceId: true,
        initiationFeeStripePriceId: true,
        costPerMonthInUSD: true
      },
      where: { id: membershipTierId }
    });

    if (isPrismaResultDefaultFreeTier(membershipTier)) {
      return;
    }

    if (!membershipTier.stripeProductId || !membershipTier.stripePriceId) {
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
  }

  async function isMembershipTierPublished(membershipTierId: number) {
    try {
      const r = await prisma.membershipTier.findUniqueOrThrow({
        select: {
          status: true
        },
        where: {
          id: membershipTierId
        }
      });
      logger.info(
        `queried status ${r.status} for membership tier with id ${membershipTierId}`
      );
      return r.status === "PUBLISHED";
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
    const membershipTier = await tx.membershipTier.findUniqueOrThrow({
      select: {
        stripeProductId: true,
        stripePriceId: true,
        initiationFeeStripePriceId: true,
        costPerMonthInUSD: true
      },
      where: { id: membershipTierId }
    });

    if (isPrismaResultDefaultFreeTier(membershipTier)) {
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

  return {
    createMembershipTier,
    updateMembershipTier,
    deleteMembershipTier,
    publishMembershipTier,
    unpublishMembershipTier,
    createDefaultFreeMembershipTier
  };
}
