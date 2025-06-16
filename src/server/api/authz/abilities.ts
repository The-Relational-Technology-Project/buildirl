import { PrismaClient } from "@prisma/client";
import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility
} from "@casl/ability";
import { AuthUser } from "~/server/api/trpc";
import { AppAction, AppSubject } from "~/server/api/authz/types";

/**
 * We define the RBAC/ABAC gated entities and operations here. We are by-default permissive
 * unless the entity requires higher user-based privileges in which case we define the abilities here
 * and the subjects and actions in authz/types.ts
 */
export async function defineAbilityFor(
  user: AuthUser,
  prisma: PrismaClient,
  subject: AppSubject
): Promise<MongoAbility<[AppAction, AppSubject]>> {
  const { can, build } = new AbilityBuilder((r, o) =>
    createMongoAbility<[AppAction, AppSubject]>(r, o)
  );

  // TODO are there fields on membership (e.g., applicationResponses) restricted to just club managers
  // TODO are there fields on User restricted to the user managers only?

  const userId = user.userId;
  if (null === userId) {
    // not onboarded, no additional permissions
    return build();
  }

  // We use this switch as an optimization, we selectively query only
  // for specific subjects
  switch (subject) {
    case "User":
      can("manage", "User", { id: userId });
      break;
    case "Club":
      const ledClubIds = await getUserLedClubIds(prisma, userId);
      can("manage", "Club", { id: { $in: ledClubIds } });
      break;
    case "Membership":
      const membershipIds = await getMembershipIdsForUser(prisma, userId);
      const membershipIdsForLedClubs = await getMembershipIdsToClubsLedByUser(
        prisma,
        userId
      );
      can("manage", "Membership", {
        id: { $in: [...membershipIds, ...membershipIdsForLedClubs] }
      });
      break;
    case "MembershipTier":
      const membershipTierIds = await getMembershipTierIdsForClubsLedByUser(
        prisma,
        userId
      );
      can("manage", "MembershipTier", { id: { $in: membershipTierIds } });
      break;
    default:
      throw new Error(`unrecognized subject type ${subject}`);
  }

  return build();
}

/**
 * Get all club IDs led by a user
 */
async function getUserLedClubIds(
  prisma: PrismaClient,
  userId: number
): Promise<number[]> {
  const clubs = await prisma.club.findMany({
    where: {
      membershipTiers: {
        some: {
          memberships: {
            some: {
              userId: userId,
              role: "LEAD"
            }
          }
        }
      }
    },
    select: { id: true }
  });

  return clubs.map((club) => club.id);
}

async function getMembershipTierIdsForClubsLedByUser(
  prisma: PrismaClient,
  userId: number
): Promise<number[]> {
  const tiers = await prisma.membershipTier.findMany({
    where: {
      memberships: {
        some: {
          userId: userId,
          role: "LEAD"
        }
      }
    },
    select: { id: true }
  });

  return tiers.map((t) => t.id);
}

async function getMembershipIdsToClubsLedByUser(
  prisma: PrismaClient,
  userId: number
): Promise<bigint[]> {
  const leadMemberships = await prisma.membership.findMany({
    where: {
      userId: userId,
      role: "LEAD"
    },
    select: {
      membershipTier: {
        select: {
          clubId: true
        }
      }
    }
  });

  const ledClubIds = leadMemberships.map((m) => m.membershipTier.clubId);
  const membershipsIdsToLedClubs = await prisma.membership.findMany({
    where: {
      membershipTier: {
        clubId: {
          in: ledClubIds
        }
      }
    },
    select: {
      id: true
    }
  });

  return membershipsIdsToLedClubs.map((m) => m.id);
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
