import { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  CreateMembershipTierInput,
  MembershipTier,
  UpdateMembershipTierInput
} from "~/server/membershipTier/types";
import { Membership } from "~/server/membership/types";
import { Club } from "~/server/club/types";

export type Maybe<T> = T | null;

export type Id = number | bigint;

// helper unwrap methods for converting id to proper types
export function idAsNumber(maybeId: Maybe<Id>): number {
  if (null === maybeId) {
    throw new Error("expected non-null id but was null");
  }
  if (typeof maybeId !== "number") {
    throw new Error(
      "expected id " + maybeId + " as number type but was " + typeof maybeId
    );
  }
  return maybeId;
}

export function idAsBigInt(maybeId: Maybe<Id>): bigint {
  if (null === maybeId) {
    throw new Error("expected non-null id but was null");
  }
  if (typeof maybeId !== "bigint") {
    throw new Error(
      "expected id " + maybeId + " as bigint type but was " + typeof maybeId
    );
  }
  return maybeId;
}

export function isDefaultFreeTier(
  membershipTier:
    | MembershipTier
    | CreateMembershipTierInput
    | UpdateMembershipTierInput
): boolean {
  // this is the definition of default free tier
  return membershipTier.costPerMonthInUSD === 0;
}

export function isPrismaResultDefaultFreeTier(membershipTier: {
  costPerMonthInUSD: Prisma.Decimal;
}): boolean {
  // this is the definition of default free tier
  return membershipTier.costPerMonthInUSD.toNumber() === 0;
}

export function membershipForClub(
  memberships: Membership[],
  clubId: number
): Maybe<Membership> {
  const clubMembership = memberships.find((m) => m.club.id === clubId);

  // no membership
  if (!clubMembership) {
    return null;
  }

  return clubMembership;
}

export function activeMembershipForClub(
  memberships: Membership[],
  clubId: number
) {
  const clubMembership = membershipForClub(memberships, clubId);
  if (clubMembership?.status === "ACTIVE") {
    return clubMembership;
  }
  return null;
}

// react-query doesn't handle bigint serialization well for its query cache
// we must do this hack to convert it to and from string in the trpc layer for queries
export const BigIntStringSchema = z.string().refine(
  (val) => {
    try {
      BigInt(val);
      return true;
    } catch {
      return false;
    }
  },
  {
    message: "value must be a valid BigInt string representation"
  }
);
export type BigIntString = z.infer<typeof BigIntStringSchema>;

export function bigint(val: BigIntString): bigint {
  return BigInt(val);
}

export function membershipTier(club: Club, membershipTierId: number) {
  const membershipTier = club.membershipTiers.find(
    (t) => t.id === membershipTierId
  );

  if (!membershipTier) {
    throw new Error(
      `expected to find membership tier with ${membershipTierId} in club with id ${club.id} but was missing`
    );
  }

  return membershipTier;
}
