import { z } from "zod";
import { Maybe } from "~/utils/types";
import {
  LongTextSchema,
  MonetaryValueSchema,
  MutationResult
} from "~/server/utils/types";
import { Prisma } from "@prisma/client";

export type MembershipTierService = MembershipTierMutations;

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
  costPerMonthInUSD: number;
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
