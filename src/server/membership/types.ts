import { z } from "zod";
import { Maybe } from "~/utils/types";
import { FormResponses, FormResponsesSchema } from "~/server/club/types/form";
import { User } from "~/server/user/types";
import { Club } from "~/server/club/types";
import { MembershipTier } from "~/server/membershipTier/types";
import { Email, MutationResult } from "~/server/utils/types";
import { Prisma } from "@prisma/client";

export type MembershipService = MembershipQueries & MembershipMutations;

type MembershipQueries = {
  // all memberships, regardless of status
  getUserMemberships(userId: number): Promise<Membership[]>;
  getActiveMembershipsForClub(
    clubId: number,
    includeEmail: boolean
  ): Promise<Membership[]>;
  getMembershipApplicationsForClub(clubId: number): Promise<Membership[]>;
};

export type MembershipStatus =
  | "ACTIVE"
  | "PENDING"
  | "PENDING_INCOMPLETE"
  | "DECLINED"
  | "WITHDRAWN"
  | "INACTIVE";

export type Role = "LEAD" | "MEMBER";

export type Membership = {
  id: bigint;
  user: User;
  club: Club;
  membershipTier: MembershipTier;
  status: MembershipStatus;
  applicationResponses: FormResponses;
  // null unless includeEmail is set explicitly to true (gated by RLS to only club owners)
  // null if user has no set email
  email: Maybe<Email>;
  isWelcomed: boolean;
  role: Role;
  // this isn't exactly the join date as it is the date
  // the membership first was created (e.g., as `PENDING_INCOMPLETE`)
  // TODO refine
  createdAt: Date;
};

type MembershipMutations = {
  submitMembershipApplication(
    membershipTierId: number,
    input: SubmitMembershipApplicationInput,
    userId: number
  ): Promise<MutationResult>;
  approveMembershipApplication(membershipId: bigint): Promise<MutationResult>;
  declineMembershipApplication(membershipId: bigint): Promise<MutationResult>;
  withdrawMembershipApplication(membershipId: bigint): Promise<MutationResult>;
  deactivateMembership(
    membershipId: bigint,
    input: DeactivateMembershipInput
  ): Promise<MutationResult>;
  setMembershipAsWelcomed(membershipId: bigint): Promise<MutationResult>;
  // internal
  createLeadMembership(
    membershipTierId: number,
    userId: number,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult>;
};

export const SubmitMembershipApplicationInputSchema = z.object({
  applicationResponses: FormResponsesSchema,
  shareEmail: z.boolean()
});
export type SubmitMembershipApplicationInput = z.infer<
  typeof SubmitMembershipApplicationInputSchema
>;

export const DeactivateMembershipInputSchema = z.object({
  // is club owner deactivating or is user deactivating membership?
  byClubOwner: z.boolean()
});
export type DeactivateMembershipInput = z.infer<
  typeof DeactivateMembershipInputSchema
>;
