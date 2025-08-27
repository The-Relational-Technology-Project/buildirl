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
  getPastMembershipCampaigns(clubId: number): Promise<MembershipCampaign[]>;
  // does club have target met for previous
  // membership campaign
  isClubLaunched(clubId: number): Promise<boolean>;
};

type MembershipCampaignMutations = {
  createMembershipCampaign(
    membershipTierId: number,
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
  createdAt: Date;
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

const CampaignBudgetItemsInput = z.array(CampaignBudgetItemInput).min(1).max(5);

export const CreateMembershipCampaignInputSchema = z.object({
  targetPerMonthInUSD: MonetaryValueSchema,
  endDate: z.date(),
  budgetItems: CampaignBudgetItemsInput
});

export type CreateMembershipCampaignInput = z.infer<
  typeof CreateMembershipCampaignInputSchema
>;

export const UpdateMembershipCampaignInputSchema = z.object({
  targetPerMonthInUSD: MonetaryValueSchema,
  endDate: z.date(),
  budgetItems: CampaignBudgetItemsInput
});

export type UpdateMembershipCampaignInput = z.infer<
  typeof UpdateMembershipCampaignInputSchema
>;
