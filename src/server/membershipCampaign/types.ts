import { z } from "zod";
import {
  MonetaryValue,
  MonetaryValueSchema,
  MutationResult,
  RequiredStringSchema
} from "~/server/utils/types";
import { Maybe } from "~/utils/types";
import { MembershipTier } from "~/server/membershipTier/types";

export type MembershipCampaignService = MembershipCampaignQueries &
  MembershipCampaignMutations;

type MembershipCampaignQueries = {
  getActiveMembershipCampaign(
    clubId: number
  ): Promise<Maybe<MembershipCampaign>>;
  // does club have target met for previous
  // membership campaign
  isClubLaunched(clubId: number): Promise<boolean>;
};

type MembershipCampaignMutations = {
  createMembershipCampaign(
    clubId: number,
    input: CreateMembershipCampaignInput
  ): Promise<MutationResult>;
  updateMembershipCampaign(
    id: number,
    input: UpdateMembershipCampaignInput
  ): Promise<MutationResult>;
  deleteMembershipCampaign(id: number): Promise<MutationResult>;
};

export type MembershipCampaign = {
  id: number;
  membershipTier: MembershipTier;
  targetPerMonthInUSD: MonetaryValue;
  budgetItems: CampaignBudgetItem[];
  endDate: Date;
  // calculated fields
  committedPerMonthInUSD: MonetaryValue;
  isTargetMet: boolean;
};

export type CampaignBudgetItem = {
  label: string;
  costPerMonthInUSD: MonetaryValue;
};

const CampaignBudgetItemInput = z.object({
  label: RequiredStringSchema,
  costPerMonthInUSD: MonetaryValueSchema
});

export const CreateMembershipCampaignInputSchema = z.object({
  membershipTierId: z.number(),
  targetPerMonthInUSD: MonetaryValueSchema,
  endDate: z.date(),
  budgetItems: z.array(CampaignBudgetItemInput)
});

export type CreateMembershipCampaignInput = z.infer<
  typeof CreateMembershipCampaignInputSchema
>;

export const UpdateMembershipCampaignInputSchema = z.object({
  membershipTierId: z.number(),
  targetPerMonthInUSD: MonetaryValueSchema,
  endDate: z.date(),
  budgetItems: z.array(CampaignBudgetItemInput)
});

export type UpdateMembershipCampaignInput = z.infer<
  typeof UpdateMembershipCampaignInputSchema
>;
