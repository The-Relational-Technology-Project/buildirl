import { Membership, MembershipTier } from "~/server/service/types";

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

export function isDefaultFreeTier(membershipTier: MembershipTier): boolean {
  // this is the definition of default free tier
  return membershipTier.costPerMonthInUSD === 0;
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
