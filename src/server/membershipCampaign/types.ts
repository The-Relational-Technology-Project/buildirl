import { z } from "zod";
import {
  MonetaryValue,
  MonetaryValueSchema,
  MutationResult,
  RequiredStringSchema
} from "~/server/utils/types";
import { Maybe } from "~/utils/types";
import { User } from "~/server/user/types";

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
  targetNumberOfMemberships: number;
  targetDate: Date;
};

// this is global and current progress for active campaign
export type ActiveMembershipCampaignProgress = {
  // total amount committed across active and pending
  // applications
  committedNumberOfMemberships: number;
  committedMembers: Array<User>;
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

const NumberOfMembershipsSchema = z.number().min(2).max(999);

export const CreateMembershipCampaignInputSchema = z.object({
  budgetItems: CampaignBudgetItemsInput,
  targetNumberOfMemberships: NumberOfMembershipsSchema,
  targetDate: z.preprocess((val) => {
    if (val instanceof Date) return val;
    if (typeof val === "string") return new Date(val);
    return val;
  }, z.date())
});

export type CreateMembershipCampaignInput = z.infer<
  typeof CreateMembershipCampaignInputSchema
>;

export const UpdateMembershipCampaignInputSchema = z.object({
  budgetItems: CampaignBudgetItemsInput,
  targetNumberOfMemberships: NumberOfMembershipsSchema,
  targetDate: z.preprocess((val) => {
    if (val instanceof Date) return val;
    if (typeof val === "string") return new Date(val);
    return val;
  }, z.date())
});

export type UpdateMembershipCampaignInput = z.infer<
  typeof UpdateMembershipCampaignInputSchema
>;
