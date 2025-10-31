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
import { Prisma } from "@prisma/client";
import { stringify } from "~/utils";
import { MembershipService } from "~/server/membership/types";

const logger = rootLogger.child({ module: "membershipCampaignService" });

export function createMembershipCampaignService(
  prisma: PrismaClient,
  membershipService: MembershipService
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
    clubId: number,
    launchDate: Date
  ): Promise<ActiveMembershipCampaignProgress> {
    const membershipApplications =
      await membershipService.getMembershipApplicationsForClub(clubId);
    const activeMemberships =
      await membershipService.getActiveMembershipsForClub(clubId, false);

    const committedMembers = membershipApplications
      .concat(activeMemberships)
      .filter((m) => m.updatedAt > launchDate)
      .map((m) => m.user);

    return {
      committedMembers: committedMembers,
      committedNumberOfMemberships: committedMembers.length
    };
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
          targetNumberOfMemberships: input.targetNumberOfMemberships,
          targetDate: input.targetDate
        },
        select: { id: true, createdAt: true }
      });

      await tx.membershipCampaign.update({
        where: { id: campaign.id },
        data: { launchDate: campaign.createdAt }
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
          targetDate: input.targetDate,
          targetNumberOfMemberships: input.targetNumberOfMemberships
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
