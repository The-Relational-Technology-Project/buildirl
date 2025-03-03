import { PrismaClient } from "@prisma/client";
import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility
} from "@casl/ability";
import { AuthUser } from "~/server/api/trpc";
import { AppAction, AppSubject } from "~/server/api/authz/types";

// TODO can we optimize so these prisma queries are called only
//  when mutation requires it? Or should we persist it in JWT?

export async function defineAbilityFor(
  user: AuthUser,
  prisma: PrismaClient
): Promise<MongoAbility<[AppAction, AppSubject]>> {
  const { can, build } = new AbilityBuilder(() =>
    createMongoAbility<[AppAction, AppSubject]>()
  );

  // TODO restrict reads of applicationResponses to just club manager
  // TODO are there read-only fields on User restricted to user managers?

  const userId = user.userId;
  if (null === userId) {
    // no additional permissive
    return build();
  }

  // USER RULES

  can("manage", "User", { id: userId });
  const membershipIds = await getMembershipIdsForUser(prisma, userId);
  can("manage", "Membership", { id: membershipIds });

  // CLUB OWNER RULES

  const ownedClubIds = await getOwnedClubIds(prisma, userId);
  if (ownedClubIds.length > 0) {
    can("manage", "Club", { id: { $in: ownedClubIds } });

    const membershipTierIds = await getMembershipTierIdsForClubs(
      prisma,
      ownedClubIds
    );
    can("manage", "MembershipTier", { id: { $in: membershipTierIds } });

    const membershipIds = await getMembershipIdsForClubs(prisma, ownedClubIds);
    can("manage", "Membership", { id: { $in: membershipIds } });
  }

  return build();
}

/**
 * Get all club IDs owned by a user
 */
async function getOwnedClubIds(
  prisma: PrismaClient,
  userId: number
): Promise<number[]> {
  const clubs = await prisma.club.findMany({
    where: { ownerUserId: userId },
    select: { id: true }
  });

  return clubs.map((club) => club.id);
}

async function getMembershipTierIdsForClubs(
  prisma: PrismaClient,
  clubIds: number[]
): Promise<number[]> {
  const tiers = await prisma.membershipTier.findMany({
    where: {
      clubId: { in: clubIds }
    },
    select: { id: true }
  });

  return tiers.map((t) => t.id);
}

async function getMembershipIdsForClubs(
  prisma: PrismaClient,
  clubIds: number[]
): Promise<bigint[]> {
  const memberships = await prisma.membership.findMany({
    where: {
      membershipTier: {
        clubId: { in: clubIds }
      }
    },
    select: { id: true }
  });

  return memberships.map((m) => m.id);
}

async function getMembershipIdsForUser(
  prisma: PrismaClient,
  userId: number
): Promise<bigint[]> {
  const memberships = await prisma.membership.findMany({
    where: { userId: userId },
    select: { id: true }
  });

  return memberships.map((m) => m.id);
}
