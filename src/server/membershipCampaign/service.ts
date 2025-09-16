import { rootLogger } from "~/logger";
import type { PrismaClient } from "@prisma/client";
import { MutationResult, NO_ID_MUTATION_RESULT } from "~/server/utils/types";
import { Maybe } from "~/utils/types";
import type {
  ActiveMembershipCampaignProgress,
  CreateMembershipCampaignInput,
  MembershipCampaign,
  MembershipCampaignService,
  UpdateMembershipCampaignInput
} from "./types";
import { asMembershipCampaign, MEMBERSHIP_CAMPAIGN_SELECT } from "./utils";
import { $Enums, Prisma } from "@prisma/client";
import { stringify } from "~/utils";
import Decimal = Prisma.Decimal;

const logger = rootLogger.child({ module: "membershipCampaignService" });

export function createMembershipCampaignService(
  prisma: PrismaClient
): MembershipCampaignService {
  async function getActiveMembershipCampaign(
    clubId: number
  ): Promise<Maybe<MembershipCampaign>> {
    try {
      const now = new Date();
      const result = await prisma.membershipCampaign.findFirst({
        where: {
          clubId: clubId,
          // active campaign is any whose target date is > now
          targetDate: {
            gte: now
          }
        },
        select: MEMBERSHIP_CAMPAIGN_SELECT,
        orderBy: {
          createdAt: "desc"
        }
      });

      if (null === result) {
        logger.info(
          `querying active membership campaign for club with id ${clubId} and found no active campaign`
        );
        return null;
      }

      const membershipCampaign = asMembershipCampaign(result);

      logger.info(
        `querying active membership campaign for club with id ${clubId} with result ${stringify(result)}`
      );
      return membershipCampaign;
    } catch (e) {
      logger.error(
        e,
        `failed to query active membership campaign for club with id ${clubId}`
      );
      throw e;
    }
  }

  async function getActiveMembershipCampaignProgress(
    clubId: number
  ): Promise<ActiveMembershipCampaignProgress> {
    const committedPerMonthInUSD =
      await getCommittedPerMonthInUSDForAllPendingOrActiveMemberships(clubId);
    return { committedPerMonthInUSD: committedPerMonthInUSD };
  }

  async function getCommittedPerMonthInUSDForAllPendingOrActiveMemberships(
    clubId: number
  ): Promise<number> {
    try {
      const memberships = await prisma.membership.findMany({
        where: {
          membershipTier: {
            clubId: clubId
          },
          status: {
            in: ["ACTIVE", "PENDING"]
          }
        },
        select: {
          membershipTier: {
            select: {
              costPerBillingInterval: true,
              billingInterval: true
            }
          }
        }
      });

      let committedPerMonthInUSD = 0;
      for (const membership of memberships) {
        committedPerMonthInUSD += monthlyRate(membership.membershipTier);
      }

      logger.info(
        `calculate total committed per month for club with id ${clubId} with result ${committedPerMonthInUSD}`
      );
      // round to 2 decimal places
      return Number(committedPerMonthInUSD.toFixed(2));
    } catch (e) {
      logger.error(
        e,
        `failed to calculate total committed per month for club with id ${clubId}`
      );
      throw e;
    }
  }

  function monthlyRate(membershipTier: {
    costPerBillingInterval: Decimal;
    billingInterval: $Enums.BillingInterval;
  }): number {
    const { costPerBillingInterval, billingInterval } = membershipTier;
    const cost = costPerBillingInterval.toNumber();
    switch (billingInterval) {
      case "MONTHLY":
        return cost;
      case "QUARTERLY":
        return cost / 3;
      case "SEMI_ANNUAL":
        return cost / 6;
      default:
        throw Error("");
    }
  }

  async function createMembershipCampaign(
    clubId: number,
    input: CreateMembershipCampaignInput
  ) {
    return prisma.$transaction(async (tx) => {
      return createMembershipCampaignInTransaction(clubId, input, tx);
    });
  }

  async function createMembershipCampaignInTransaction(
    clubId: number,
    input: CreateMembershipCampaignInput,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    try {
      const activeMembershipCampaign =
        await getActiveMembershipCampaign(clubId);
      if (activeMembershipCampaign !== null) {
        throw new Error(
          `cannot create membership campaign if there already exists an existing campaign ${activeMembershipCampaign}`
        );
      }

      const campaign = await tx.membershipCampaign.create({
        data: {
          clubId: clubId,
          targetDate: input.targetDate
        },
        select: {
          id: true
        }
      });

      if (input.budgetItems.length > 0) {
        await tx.campaignBudgetItem.createMany({
          data: input.budgetItems.map((i) => ({
            membershipCampaignId: campaign.id,
            label: i.label,
            costPerMonthInUSD: i.costPerMonthInUSD
          }))
        });
      }

      logger.info(
        `created membership campaign with id ${campaign.id} for club with id ${clubId}`
      );

      return {
        createdEntityId: campaign.id
      };
    } catch (e) {
      logger.error(
        e,
        `failed to create membership campaign for club with id ${clubId} with input ${stringify(input)}`
      );
      throw e;
    }
  }

  async function checkIfCampaignIsNotActive(id: number): Promise<void> {
    const campaign = await prisma.membershipCampaign.findUniqueOrThrow({
      where: { id },
      select: {
        targetDate: true
      }
    });
    const now = new Date();
    if (campaign.targetDate < now) {
      throw new Error(
        `cannot update past membership campaign with id ${id}. Campaign ended on ${campaign.targetDate.toISOString()}`
      );
    }
  }

  async function updateMembershipCampaign(
    id: number,
    input: UpdateMembershipCampaignInput
  ) {
    return prisma.$transaction(async (tx) => {
      return updateMembershipCampaignInTransaction(id, input, tx);
    });
  }

  async function updateMembershipCampaignInTransaction(
    id: number,
    input: UpdateMembershipCampaignInput,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    try {
      await checkIfCampaignIsNotActive(id);

      await tx.membershipCampaign.update({
        where: { id },
        data: {
          targetDate: input.targetDate
        }
      });

      await tx.campaignBudgetItem.deleteMany({
        where: { membershipCampaignId: id }
      });

      if (input.budgetItems.length > 0) {
        await tx.campaignBudgetItem.createMany({
          data: input.budgetItems.map((item) => ({
            membershipCampaignId: id,
            label: item.label,
            costPerMonthInUSD: item.costPerMonthInUSD
          }))
        });
      }

      logger.info(
        `updated membership campaign with id ${id} with input ${stringify(input)}`
      );

      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        e,
        `failed to update membership campaign with id ${id} with input ${stringify(input)}`
      );
      throw e;
    }
  }

  async function deleteMembershipCampaign(id: number): Promise<MutationResult> {
    try {
      await checkIfCampaignIsNotActive(id);

      await prisma.membershipCampaign.delete({
        where: { id }
      });

      logger.info(`deleted membership campaign with id ${id}`);

      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(e, `failed to delete membership campaign with id ${id}`);
      throw e;
    }
  }

  return {
    getActiveMembershipCampaign,
    getActiveMembershipCampaignProgress,
    createMembershipCampaign,
    updateMembershipCampaign,
    deleteMembershipCampaign
  };
}
