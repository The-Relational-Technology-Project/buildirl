import { Prisma, PrismaClient } from "@prisma/client";
import { ClubFollower, FollowingService } from "~/server/following/types";
import { Club, ClubService } from "~/server/club/types";
import { asClub, CLUB_SELECT } from "~/server/club/utils";
import { stringify } from "~/utils";
import { rootLogger } from "~/logger";
import { USER_SELECT } from "~/server/user/service";
import UserGetPayload = Prisma.UserGetPayload;
import { MutationResult, NO_ID_MUTATION_RESULT } from "~/server/utils/types";
import { UserService } from "~/server/user/types";

const logger = rootLogger.child({ module: "followingService" });

export function createFollowingService(
  prisma: PrismaClient,
  userService: UserService,
  clubService: ClubService
): FollowingService {
  async function getUserFollowedClubs(userId: number): Promise<Club[]> {
    try {
      const results = await prisma.clubFollowing.findMany({
        where: {
          userId: userId
        },
        select: {
          club: {
            select: CLUB_SELECT
          }
        }
      });

      const clubs = results.map((r) => asClub(r.club));
      logger.info(
        `queried followed clubs for user with userId ${userId} with result ${stringify(clubs)}`
      );
      return clubs;
    } catch (e) {
      logger.error(
        e,
        `failed to query followed clubs for user with userId ${userId}`
      );
      throw e;
    }
  }

  async function asClubFollower(
    r: UserGetPayload<{ select: typeof USER_SELECT }>,
    createdAt: Date
  ): Promise<ClubFollower> {
    const email = await userService.getUserEmail(r.id);
    if (!email) {
      throw new Error(`expected to find email for user ${r.id} but found none`);
    }
    return {
      user: r,
      email: email,
      createdAt: createdAt
    };
  }

  async function getClubFollowers(clubId: number): Promise<ClubFollower[]> {
    try {
      const results = await prisma.clubFollowing.findMany({
        where: {
          clubId: clubId
        },
        select: {
          user: {
            select: USER_SELECT
          },
          createdAt: true
        }
      });

      const followers = await Promise.all(
        results.map((r) => asClubFollower(r.user, r.createdAt))
      );
      logger.info(
        `queried followers for club with clubId ${clubId} with result ${stringify(followers)}`
      );
      return followers;
    } catch (e) {
      logger.error(
        e,
        `failed to query followers for club with clubId ${clubId}`
      );
      throw e;
    }
  }

  async function checkUserDoesNotHaveActiveMembershipForClub(
    userId: number,
    clubId: number
  ) {
    const activeMembershipCount = await prisma.membership.count({
      where: {
        userId: userId,
        membershipTier: {
          clubId: clubId
        },
        status: "ACTIVE"
      }
    });

    if (activeMembershipCount > 0) {
      throw new Error("user already has active membership in club");
    }
  }

  async function checkUserIsNotClubOwner(userId: number, clubId: number) {
    const ownerUserId = await clubService.getClubOwnerUserId(clubId);
    if (ownerUserId === userId) {
      throw new Error(
        `cannot follow club for club owner with userId ${userId} of clubId ${clubId}`
      );
    }
  }

  async function followClub(
    userId: number,
    clubId: number
  ): Promise<MutationResult> {
    await checkUserIsNotClubOwner(userId, clubId);
    await checkUserDoesNotHaveActiveMembershipForClub(userId, clubId);

    if (await isUserFollowingClub(userId, clubId)) {
      logger.info(
        `user with userId ${userId} already follows club with clubId ${clubId}`
      );
      return NO_ID_MUTATION_RESULT;
    }

    try {
      await prisma.clubFollowing.create({
        data: {
          userId: userId,
          clubId: clubId
        }
      });

      logger.info(
        `created club following between user with userId ${userId} and club with clubId ${clubId}`
      );
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        e,
        `failed to create club following between user with userId ${userId} and club with clubId ${clubId}`
      );
      throw e;
    }
  }

  async function unfollowClub(userId: number, clubId: number) {
    return prisma.$transaction(async (tx) => {
      return unfollowClubInTransaction(userId, clubId, tx);
    });
  }

  async function unfollowClubInTransaction(
    userId: number,
    clubId: number,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    if (!(await isUserFollowingClubInTransaction(userId, clubId, tx))) {
      logger.info(
        `user with userId ${userId} does not follow club with clubId ${clubId}`
      );
      return NO_ID_MUTATION_RESULT;
    }

    try {
      await tx.clubFollowing.delete({
        where: {
          userId_clubId: {
            userId,
            clubId
          }
        }
      });

      logger.info(
        `deleted club following between user with userId ${userId} and club with clubId ${clubId}`
      );
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        e,
        `failed to delete club following between user with userId ${userId} and club with clubId ${clubId}`
      );
      throw e;
    }
  }

  async function isUserFollowingClub(
    userId: number,
    clubId: number
  ): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
      return isUserFollowingClubInTransaction(userId, clubId, tx);
    });
  }

  async function isUserFollowingClubInTransaction(
    userId: number,
    clubId: number,
    tx: Prisma.TransactionClient
  ) {
    try {
      const count = await tx.clubFollowing.count({
        where: {
          userId: userId,
          clubId: clubId
        }
      });

      return count > 0;
    } catch (e) {
      logger.error(
        e,
        `failed to query if user with userId ${userId} is following club with clubId ${clubId}`
      );
      throw e;
    }
  }

  async function unfollowClubForMembership(
    membershipId: bigint,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    const membership = await getClubIdAndUserIdForMembership(membershipId, tx);
    return await unfollowClubInTransaction(
      membership.userId,
      membership.clubId,
      tx
    );
  }

  async function getClubIdAndUserIdForMembership(
    membershipId: bigint,
    tx: Prisma.TransactionClient
  ): Promise<{ userId: number; clubId: number }> {
    try {
      const result = await tx.membership.findUniqueOrThrow({
        select: {
          userId: true,
          membershipTier: { select: { clubId: true } }
        },
        where: { id: membershipId }
      });

      logger.info(`queried userId and clubId for ${membershipId}`);
      return { userId: result.userId, clubId: result.membershipTier.clubId };
    } catch (e) {
      logger.error(e, `failed to query userId and clubId for ${membershipId}`);
      throw e;
    }
  }

  return {
    getUserFollowedClubs,
    getClubFollowers,
    followClub,
    unfollowClub,
    unfollowClubForMembership
  };
}
