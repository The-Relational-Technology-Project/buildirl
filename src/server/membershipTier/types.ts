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
  isDefaultFreeTierByIdV2(membershipTierId: number): Promise<boolean>;
  getClubIdFromMembershipTierId(membershipTierId: number): Promise<number>;
};

type MembershipTierMutations = {
  createMembershipTier(
    clubId: number,
    input: CreateMembershipTierInput
  ): Promise<MutationResult>;
  createMembershipTierV2(
    clubId: number,
    input: CreateMembershipTierInputV2
  ): Promise<MutationResult>;
  updateMembershipTier(
    id: number,
    input: UpdateMembershipTierInput
  ): Promise<MutationResult>;
  updateMembershipTierV2(
    id: number,
    input: UpdateMembershipTierInputV2
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
  costPerMonthInUSD: number;
  costPerBillingInterval: Maybe<number>;
  billingInterval: Maybe<BillingInterval>;
  initiationFeeCostInUSD: Maybe<number>;
};

export const MembershipTierNameSchema = z
  .string()
  .min(3, "Length must be >= 3 characters");

export const CreateMembershipTierInputSchema = z.object({
  name: MembershipTierNameSchema,
  benefitDescription: LongTextSchema,
  contributionDescription: LongTextSchema,
  costPerMonthInUSD: MonetaryValueSchema,
  initiationFeeCostInUSD: MonetaryValueSchema.nullable()
});
export type CreateMembershipTierInput = z.infer<
  typeof CreateMembershipTierInputSchema
>;

export const CreateMembershipTierInputSchemaV2 = z.object({
  name: MembershipTierNameSchema,
  benefitDescription: LongTextSchema,
  contributionDescription: LongTextSchema,
  costPerBillingInterval: MonetaryValueSchema,
  billingInterval: z.nativeEnum(BillingInterval),
  initiationFeeCostInUSD: MonetaryValueSchema.nullable()
});
export type CreateMembershipTierInputV2 = z.infer<
  typeof CreateMembershipTierInputSchemaV2
>;

export const UpdateMembershipTierInputSchema = z.object({
  name: MembershipTierNameSchema,
  benefitDescription: LongTextSchema,
  contributionDescription: LongTextSchema,
  // allow 0 no-op update only on the default free membership tier
  // there is no good way to express this as a check on zod though; it
  // will be checked in service layer
  costPerMonthInUSD: MonetaryValueSchema.or(z.literal(0)),
  initiationFeeCostInUSD: MonetaryValueSchema.nullable()
});
export type UpdateMembershipTierInput = z.infer<
  typeof UpdateMembershipTierInputSchema
>;

export const UpdateMembershipTierInputSchemaV2 = z.object({
  name: MembershipTierNameSchema,
  benefitDescription: LongTextSchema,
  contributionDescription: LongTextSchema,
  costPerBillingInterval: MonetaryValueSchema,
  billingInterval: z.nativeEnum(BillingInterval),
  initiationFeeCostInUSD: MonetaryValueSchema.nullable()
});
export type UpdateMembershipTierInputV2 = z.infer<
  typeof UpdateMembershipTierInputSchemaV2
>;
