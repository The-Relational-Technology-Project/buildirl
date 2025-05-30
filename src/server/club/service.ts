import { Prisma, type PrismaClient } from "@prisma/client";
import { rootLogger } from "~/logger";
import { stringify } from "~/utils";
import { DEFAULT_APPLICATION_QUESTIONS } from "~/server/utils/defaults";
import {
  Club,
  ClubService,
  ClubStatistics,
  CreateClubInput,
  UpdateClubApplicationQuestionsInput,
  UpdateClubDisplayImageUrlsInput,
  UpdateClubInput
} from "~/server/club/types";
import { MutationResult, NO_ID_MUTATION_RESULT } from "~/server/utils/types";
import { asClub, CLUB_SELECT } from "~/server/club/utils";
import { MembershipTierService } from "~/server/membershipTier/types";

const logger = rootLogger.child({ module: "clubService" });

export function createClubService(
  prisma: PrismaClient,
  membershipTierService: MembershipTierService
): ClubService {
  async function getUserOwnedClubs(userId: number): Promise<Club[]> {
    try {
      const results = await prisma.club.findMany({
        select: CLUB_SELECT,
        where: {
          ownerUserId: userId
        }
      });
      const clubs = results.map((r) => asClub(r));
      logger.info(
        `queried owned clubs for user with userId ${userId} with result ${stringify(clubs)}`
      );
      return clubs;
    } catch (e) {
      logger.error(
        e,
        `failed to query owned clubs for user with userId ${userId}`
      );
      throw e;
    }
  }

  async function getClubByPublicId(publicId: string): Promise<Club> {
    try {
      const result = await prisma.club.findUniqueOrThrow({
        select: CLUB_SELECT,
        where: {
          publicId: publicId
        }
      });
      const club = asClub(result);
      logger.info(
        `queried club with publicId ${publicId} with result ${stringify(club)}`
      );
      return club;
    } catch (e) {
      logger.error(e, `failed to query club with publicId ${publicId}`);
      throw e;
    }
  }

  async function getClub(id: number): Promise<Club> {
    try {
      const result = await prisma.club.findUniqueOrThrow({
        select: CLUB_SELECT,
        where: { id }
      });
      const club = asClub(result);
      logger.info(`queried club with id ${id} with result ${stringify(club)}`);
      return club;
    } catch (e) {
      logger.error(e, `failed to query club with id ${id}`);
      throw e;
    }
  }

  async function getClubStatistics(clubId: number): Promise<ClubStatistics> {
    try {
      const memberCount = await prisma.membership.count({
        where: {
          membershipTier: {
            clubId: clubId
          },
          status: "ACTIVE"
        }
      });
      const statistics = {
        // plus the owner
        memberCount: memberCount + 1
      };
      logger.info(
        `queried club statistics for club with clubId ${clubId} with result ${stringify(statistics)}`
      );
      return statistics;
    } catch (e) {
      logger.error(
        e,
        `failed to query club statistics for club with clubId ${clubId}`
      );
      throw e;
    }
  }

  async function createClub(
    input: CreateClubInput,
    userId: number
  ): Promise<MutationResult> {
    return prisma.$transaction(async (tx) => {
      return createClubInTransaction(input, userId, tx);
    });
  }

  async function createClubInTransaction(
    input: CreateClubInput,
    userId: number,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    try {
      const { id } = await tx.club.create({
        data: {
          ...input,
          ownerUserId: userId,
          // defaults
          tagLine: "",
          description: "",
          websiteUrl: null,
          instagramHandle: null,
          eventCalendarUrl: null,
          applicationQuestions: DEFAULT_APPLICATION_QUESTIONS,
          theme: Prisma.DbNull,
          faqs: { items: [] }
        },
        select: {
          id: true
        }
      });
      logger.info(
        `created club from input ${stringify(input)} with clubId ${id}`
      );

      // create the default free tier on each club
      await membershipTierService.createDefaultFreeMembershipTier(id, tx);

      return { createdEntityId: id };
    } catch (e) {
      logger.error(e, `failed to create club from input ${stringify(input)}`);
      throw e;
    }
  }

  async function updateClub(
    id: number,
    input: UpdateClubInput
  ): Promise<MutationResult> {
    try {
      await prisma.club.update({
        data: {
          ...input,
          theme: input.theme ?? Prisma.DbNull
        },
        where: {
          id: id
        }
      });
      logger.info(`updated club with id ${id} from input ${stringify(input)}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        e,
        `failed to update club with id ${id} from input ${stringify(input)}`
      );
      throw e;
    }
  }

  async function updateClubDisplayImageUrls(
    clubId: number,
    input: UpdateClubDisplayImageUrlsInput
  ): Promise<MutationResult> {
    try {
      await prisma.club.update({
        data: { displayImageUrls: input.displayImageUrls },
        where: { id: clubId }
      });
      logger.info(
        `updated club display image urls for club with clubId ${clubId} from input ${stringify(input)}`
      );
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        e,
        `failed to update club display image urls for club with clubId ${clubId} from input ${stringify(input)}`
      );
      throw e;
    }
  }

  async function hasAnyActiveMembershipsOrMembershipApplications(
    clubId: number
  ) {
    try {
      const memberCount = await prisma.membership.count({
        where: {
          membershipTier: {
            clubId: clubId
          },
          status: { in: ["ACTIVE", "PENDING"] }
        }
      });
      logger.info(
        `queried all active or pending membership count for club with clubId ${clubId} with result ${memberCount}`
      );
      return memberCount > 0;
    } catch (e) {
      logger.error(
        e,
        `failed to query all active or pending membership count for club with clubId ${clubId}`
      );
      throw e;
    }
  }

  async function deleteClub(id: number): Promise<MutationResult> {
    if (await hasAnyActiveMembershipsOrMembershipApplications(id)) {
      throw new Error(
        "cannot delete club if it has any active memberships or membership applications"
      );
    }

    try {
      // TODO do we want to delete connect account?

      await prisma.club.delete({
        where: { id }
      });
      logger.info(`deleted club with id ${id}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(e, `failed to delete club with id ${id}`);
      throw e;
    }
  }

  async function updateClubApplicationQuestions(
    clubId: number,
    input: UpdateClubApplicationQuestionsInput
  ): Promise<MutationResult> {
    try {
      await prisma.club.update({
        data: input,
        where: {
          id: clubId
        }
      });
      logger.info(
        `updated club application questions for club with clubId ${clubId} from input ${stringify(input)}`
      );
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        e,
        `failed to update club application questions for club with clubId ${clubId} from input ${stringify(input)}`
      );
      throw e;
    }
  }

  async function getClubOwnerUserId(clubId: number): Promise<number> {
    try {
      const club = await prisma.club.findUniqueOrThrow({
        select: { ownerUserId: true },
        where: { id: clubId }
      });
      logger.info(
        `queried owner userId for club with clubId ${clubId} with result ${club.ownerUserId}`
      );
      return club.ownerUserId;
    } catch (e) {
      logger.error(
        e,
        `failed to query owner userId for club with clubId ${clubId}`
      );
      throw e;
    }
  }

  return {
    getUserOwnedClubs,
    getClubByPublicId,
    getClubStatistics,
    getClub,
    getClubOwnerUserId,
    createClub,
    updateClub,
    deleteClub,
    updateClubApplicationQuestions,
    updateClubDisplayImageUrls
  };
}
