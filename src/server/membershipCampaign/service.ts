import { stringify } from "superjson";
import { rootLogger } from "~/logger";
import type { PrismaClient } from "@prisma/client";
import { MutationResult, NO_ID_MUTATION_RESULT } from "~/server/utils/types";
import type { MembershipService } from "~/server/membership/types";
import { Maybe } from "~/utils/types";
import type {
  CreateMembershipCampaignInput,
  MembershipCampaign,
  MembershipCampaignService,
  UpdateMembershipCampaignInput
} from "./types";
import { asMembershipCampaign, MEMBERSHIP_CAMPAIGN_SELECT } from "./utils";
import {
  asMembershipTier,
  getCostPerMonthInUSD,
  MEMBERSHIP_TIER_SELECT
} from "~/server/membershipTier/utils";
import { MembershipTierService } from "~/server/membershipTier/types";
import { Prisma } from "@prisma/client";

const logger = rootLogger.child({ module: "membershipCampaignService" });

export function createMembershipCampaignService(
  prisma: PrismaClient,
  membershipService: MembershipService,
  membershipTierService: MembershipTierService
): MembershipCampaignService {
  async function getActiveMembershipCampaign(
    clubId: number
  ): Promise<Maybe<MembershipCampaign>> {
    try {
      const now = new Date();
      const result = await prisma.membershipCampaign.findFirst({
        where: {
          membershipTier: {
            clubId
          },
          // active campaign is any whose end date is > now
          endDate: {
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

      const committedPerMonthInUSD = await getCommittedPerMonthInUSD(
        result.membershipTierId,
        result.createdAt,
        result.endDate
      );

      const isTargetMet =
        committedPerMonthInUSD >= result.targetPerMonthInUSD.toNumber();

      const membershipCampaign = asMembershipCampaign(
        result,
        committedPerMonthInUSD,
        isTargetMet
      );

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

  async function getCommittedPerMonthInUSD(
    membershipTierId: number,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    try {
      const result = await prisma.membershipTier.findUniqueOrThrow({
        where: { id: membershipTierId },
        select: MEMBERSHIP_TIER_SELECT
      });

      const membershipTier = asMembershipTier(result);
      const costPerMonthInUSD = getCostPerMonthInUSD(membershipTier);

      const commitmentCount =
        await getMembershipApplicationCountToMembershipTierBetweenDates(
          membershipTierId,
          startDate,
          endDate
        );

      return commitmentCount * costPerMonthInUSD;
    } catch (e) {
      logger.error(
        e,
        `failed to calculate committed per month for membership tier with id ${membershipTierId}`
      );
      throw e;
    }
  }

  async function getMembershipApplicationCountToMembershipTierBetweenDates(
    membershipTierId: number,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const clubId =
      await membershipTierService.getClubIdFromMembershipTierId(
        membershipTierId
      );

    // both applications and approved memberships are considered committed
    const allActiveMemberships =
      await membershipService.getActiveMembershipsForClub(clubId, false);
    const allMembershipApplications =
      await membershipService.getMembershipApplicationsForClub(clubId);

    const tierMemberships = allActiveMemberships
      .concat(allMembershipApplications)
      .filter(
        (membership) =>
          membership.membershipTier.id === membershipTierId &&
          membership.createdAt > startDate &&
          membership.createdAt < endDate
      );

    return tierMemberships.length;
  }

  async function isClubLaunched(clubId: number): Promise<boolean> {
    try {
      const now = new Date();
      const pastCampaigns = await prisma.membershipCampaign.findMany({
        where: {
          membershipTier: {
            clubId
          },
          endDate: {
            lt: now
          }
        },
        select: MEMBERSHIP_CAMPAIGN_SELECT,
        orderBy: {
          endDate: "desc"
        }
      });

      if (pastCampaigns.length === 0) {
        logger.info(
          `queried if club with id ${clubId} is launched with result no prior campaign found`
        );
        return false;
      }

      for (const campaign of pastCampaigns) {
        const committedPerMonthInUSD = await getCommittedPerMonthInUSD(
          campaign.membershipTierId,
          campaign.createdAt,
          campaign.endDate
        );
        if (committedPerMonthInUSD >= campaign.targetPerMonthInUSD.toNumber()) {
          logger.info(
            `queried if club with id ${clubId} is launched with result successful campaign found ${stringify(campaign)}`
          );
          return true;
        }
      }

      logger.info(
        `queried if club with id ${clubId} is launched with result no successful campaign found`
      );
      return false;
    } catch (e) {
      logger.error(
        e,
        `failed to query if club is launched for club with id ${clubId}`
      );
      throw e;
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

      const membershipTier = await tx.membershipTier.findFirst({
        where: {
          id: input.membershipTierId,
          clubId
        }
      });
      if (membershipTier === null) {
        throw new Error(
          `membership tier with id ${input.membershipTierId} was not found to belong to club with id ${clubId}`
        );
      }

      const campaign = await tx.membershipCampaign.create({
        data: {
          membershipTierId: input.membershipTierId,
          targetPerMonthInUSD: input.targetPerMonthInUSD,
          endDate: input.endDate
        },
        select: {
          id: true
        }
      });

      if (input.budgetItems.length > 0) {
        await tx.campaignBudgetItem.createMany({
          data: input.budgetItems.map((item) => ({
            membershipCampaignId: campaign.id,
            label: item.label,
            costPerMonthInUSD: item.costPerMonthInUSD
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

  async function getPastMembershipCampaigns(
    clubId: number
  ): Promise<MembershipCampaign[]> {
    try {
      const now = new Date();
      const results = await prisma.membershipCampaign.findMany({
        select: MEMBERSHIP_CAMPAIGN_SELECT,
        where: {
          membershipTier: {
            clubId
          },
          endDate: {
            lt: now
          }
        }
      });

      const campaigns: MembershipCampaign[] = [];
      for (const result of results) {
        const committedPerMonthInUSD = await getCommittedPerMonthInUSD(
          result.membershipTierId,
          result.createdAt,
          result.endDate
        );

        const isTargetMet =
          committedPerMonthInUSD >= result.targetPerMonthInUSD.toNumber();

        const campaign = asMembershipCampaign(
          result,
          committedPerMonthInUSD,
          isTargetMet
        );

        campaigns.push(campaign);
      }

      logger.info(
        `queried all past membership campaigns with result ${stringify(campaigns)}`
      );
      return campaigns;
    } catch (e) {
      logger.error(e, `failed to query all past membership campaigns`);
      throw e;
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
      await tx.membershipCampaign.update({
        where: { id },
        data: {
          targetPerMonthInUSD: input.targetPerMonthInUSD,
          endDate: input.endDate
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
    getPastMembershipCampaigns,
    isClubLaunched,
    createMembershipCampaign,
    updateMembershipCampaign,
    deleteMembershipCampaign
  };
}
