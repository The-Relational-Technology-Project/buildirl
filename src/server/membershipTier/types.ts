import { z } from "zod";
import {
  LongTextSchema,
  MonetaryValueSchema,
  MutationResult
} from "~/server/utils/types";
import { BillingInterval, Maybe } from "~/utils/types";
import { Prisma } from "@prisma/client";

export type MembershipTierService = MembershipTierQueries &
  MembershipTierMutations;

type MembershipTierQueries = {
  // internal
  isMembershipTierPublished(membershipTierId: number): Promise<boolean>;
  isDefaultFreeTierById(membershipTierId: number): Promise<boolean>;
  getClubIdFromMembershipTierId(membershipTierId: number): Promise<number>;
};

type MembershipTierMutations = {
  createMembershipTier(
    clubId: number,
    input: CreateMembershipTierInput
  ): Promise<MutationResult>;
  updateMembershipTier(
    id: number,
    input: UpdateMembershipTierInput
  ): Promise<MutationResult>;
  deleteMembershipTier(id: number): Promise<MutationResult>;
  publishMembershipTier(id: number): Promise<MutationResult>;
  unpublishMembershipTier(id: number): Promise<MutationResult>;
  // internal
  createDefaultFreeMembershipTier(
    clubId: number,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult>;
};

export type MembershipTierStatus = "PUBLISHED" | "UNPUBLISHED";

export type MembershipTier = {
  id: number;
  name: string;
  status: MembershipTierStatus;
  benefitDescription: string;
  contributionDescription: string;
  costPerBillingInterval: number;
  billingInterval: BillingInterval;
  initiationFeeCostInUSD: Maybe<number>;
};

export const MembershipTierNameSchema = z
  .string()
  .min(3, "Length must be >= 3 characters");

export const CreateMembershipTierInputSchema = z.object({
  name: MembershipTierNameSchema,
  benefitDescription: LongTextSchema,
  contributionDescription: LongTextSchema,
  costPerBillingInterval: MonetaryValueSchema,
  billingInterval: z.nativeEnum(BillingInterval),
  initiationFeeCostInUSD: MonetaryValueSchema.nullable()
});
export type CreateMembershipTierInput = z.infer<
  typeof CreateMembershipTierInputSchema
>;

export const UpdateMembershipTierInputSchema = z.object({
  name: MembershipTierNameSchema,
  benefitDescription: LongTextSchema,
  contributionDescription: LongTextSchema,
  costPerBillingInterval: MonetaryValueSchema,
  billingInterval: z.nativeEnum(BillingInterval),
  initiationFeeCostInUSD: MonetaryValueSchema.nullable()
});
export type UpdateMembershipTierInput = z.infer<
  typeof UpdateMembershipTierInputSchema
>;