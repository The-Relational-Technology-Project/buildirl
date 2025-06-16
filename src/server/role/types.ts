import { MutationResult } from "~/server/utils/types";

export type RoleService = RoleQueries & RoleMutations;

type RoleQueries = {
  // internal
  isMembershipLastLeadForClub(membershipId: bigint): Promise<boolean>;
};

type RoleMutations = {
  setMembershipAsLead(membershipId: bigint): Promise<MutationResult>;
  // revert role back as MEMBER
  clearMembershipRole(membershipId: bigint): Promise<MutationResult>;
};
