import { Prisma } from "@prisma/client";
import type { MembershipCampaign } from "./types";

export const MEMBERSHIP_CAMPAIGN_SELECT = {
  id: true,
  clubId: true,
  targetDate: true,
  createdAt: true,
  budgetItems: {
    select: {
      id: true,
      label: true,
      costPerMonthInUSD: true,
      createdAt: true,
      updatedAt: true
    }
  }
} satisfies Prisma.MembershipCampaignSelect;

export function asMembershipCampaign(
  campaign: Prisma.MembershipCampaignGetPayload<{
    select: typeof MEMBERSHIP_CAMPAIGN_SELECT;
  }>
): MembershipCampaign {
  return {
    id: campaign.id,
    targetPerMonthInUSD: campaign.budgetItems.reduce(
      (acc, item) => acc + item.costPerMonthInUSD.toNumber(),
      0
    ),
    budgetItems: campaign.budgetItems.map((item) => ({
      label: item.label,
      costPerMonthInUSD: item.costPerMonthInUSD.toNumber()
    })),
    targetDate: campaign.targetDate,
  };
}
