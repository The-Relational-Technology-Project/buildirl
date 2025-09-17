import { z } from "zod";
import {
  MonetaryValue,
  MonetaryValueSchema,
  MutationResult,
  RequiredStringSchema
} from "~/server/utils/types";
import { Maybe } from "~/utils/types";

export type MembershipCampaignService = MembershipCampaignQueries &
  MembershipCampaignMutations;

type MembershipCampaignQueries = {
  getActiveMembershipCampaign(
    clubId: number
  ): Promise<Maybe<MembershipCampaign>>;
  getActiveMembershipCampaignProgress(
    clubId: number
  ): Promise<ActiveMembershipCampaignProgress>;
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
  budgetItems: CampaignBudgetItem[];
  targetDate: Date;
  // calculated fields
  targetPerMonthInUSD: MonetaryValue;
};

// this is global and current progress for active campaign
export type ActiveMembershipCampaignProgress = {
  // total amount committed across active and pending
  // applications
  committedPerMonthInUSD: MonetaryValue;
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
  budgetItems: CampaignBudgetItemsInput,
  targetDate: z.date()
});

export type CreateMembershipCampaignInput = z.infer<
  typeof CreateMembershipCampaignInputSchema
>;

export const UpdateMembershipCampaignInputSchema = z.object({
  budgetItems: CampaignBudgetItemsInput,
  targetDate: z.date()
});

export type UpdateMembershipCampaignInput = z.infer<
  typeof UpdateMembershipCampaignInputSchema
>;
